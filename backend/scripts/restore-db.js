// scripts/restore-db.js
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import readline from 'readline';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Função para extrair dados da DATABASE_URL
function parseDatabaseUrl(url) {
    // Formato: mysql://USER:PASSWORD@HOST:PORT/DATABASE
    // A senha pode conter caracteres especiais, incluindo @
    // Então precisamos pegar tudo entre o primeiro : e o último @
    const regex = /mysql:\/\/([^:]+):(.+)@([^:@]+):(\d+)\/(.+)/;
    const match = url.match(regex);

    if (!match) {
        throw new Error('DATABASE_URL inválida. Formato esperado: mysql://USER:PASSWORD@HOST:PORT/DATABASE');
    }

    // Pega a parte de password@host e separa pelo último @
    const passwordAndHost = match[2] + '@' + match[3];
    const lastAtIndex = passwordAndHost.lastIndexOf('@');
    const password = passwordAndHost.substring(0, lastAtIndex);
    const host = passwordAndHost.substring(lastAtIndex + 1);

    return {
        user: match[1],
        password: password,
        host: host,
        port: match[4],
        database: match[5]
    };
}

// Função para perguntar ao usuário
function askQuestion(query) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise(resolve => rl.question(query, answer => {
        rl.close();
        resolve(answer);
    }));
}

async function restoreDatabase() {
    try {
        // Carrega as variáveis de ambiente
        const dotenv = await import('dotenv');
        dotenv.config({ path: path.resolve(__dirname, '../.env') });

        const databaseUrl = process.env.DATABASE_URL;

        if (!databaseUrl) {
            throw new Error('DATABASE_URL não encontrada no arquivo .env');
        }

        const dbConfig = parseDatabaseUrl(databaseUrl);

        // Diretório de backups
        const backupDir = path.resolve(__dirname, '../backups');

        if (!fs.existsSync(backupDir)) {
            console.error('❌ Diretório de backups não encontrado:', backupDir);
            process.exit(1);
        }

        // Lista os backups disponíveis
        const backupFiles = fs.readdirSync(backupDir)
            .filter(file => file.endsWith('.sql'))
            .sort()
            .reverse(); // Mais recente primeiro

        if (backupFiles.length === 0) {
            console.error('❌ Nenhum arquivo de backup encontrado em:', backupDir);
            process.exit(1);
        }

        console.log('📦 Backups disponíveis:');
        backupFiles.forEach((file, index) => {
            const filePath = path.join(backupDir, file);
            const stats = fs.statSync(filePath);
            const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
            const modifiedDate = stats.mtime.toLocaleString('pt-BR');
            console.log(`  ${index + 1}. ${file} (${fileSizeInMB} MB) - ${modifiedDate}`);
        });
        console.log('');

        // Pega o arquivo da linha de comando ou pergunta ao usuário
        let backupFileName;
        const arg = process.argv[2];

        if (arg) {
            // Se um número foi passado, usa o índice
            if (!isNaN(arg)) {
                const index = parseInt(arg) - 1;
                if (index >= 0 && index < backupFiles.length) {
                    backupFileName = backupFiles[index];
                } else {
                    console.error('❌ Índice inválido');
                    process.exit(1);
                }
            } else {
                // Se um nome de arquivo foi passado
                backupFileName = arg;
            }
        } else {
            // Pergunta ao usuário
            const answer = await askQuestion('Digite o número ou nome do backup para restaurar: ');

            if (!isNaN(answer)) {
                const index = parseInt(answer) - 1;
                if (index >= 0 && index < backupFiles.length) {
                    backupFileName = backupFiles[index];
                } else {
                    console.error('❌ Índice inválido');
                    process.exit(1);
                }
            } else {
                backupFileName = answer;
            }
        }

        const backupPath = path.join(backupDir, backupFileName);

        if (!fs.existsSync(backupPath)) {
            console.error('❌ Arquivo de backup não encontrado:', backupPath);
            process.exit(1);
        }

        // Detecta se é backup data-only
        const isDataOnly = backupFileName.includes('-data-only');

        // Confirmação
        console.log('');
        console.log('⚠️  ATENÇÃO: Esta operação irá SOBRESCREVER todos os dados do banco!');
        console.log(`📦 Database: ${dbConfig.database}`);
        console.log(`📁 Backup: ${backupFileName}`);
        console.log(`📋 Tipo: ${isDataOnly ? 'Somente Dados' : 'Completo (estrutura + dados)'}`);

        if (isDataOnly) {
            console.log('');
            console.log('ℹ️  Este é um backup data-only. Certifique-se de que:');
            console.log('   1. Você já executou: npx prisma migrate reset');
            console.log('   2. O schema está atualizado com as migrations');
        }
        console.log('');

        const confirm = await askQuestion('Tem certeza que deseja continuar? (digite "SIM" para confirmar): ');

        if (confirm.toUpperCase() !== 'SIM') {
            console.log('❌ Operação cancelada pelo usuário.');
            process.exit(0);
        }

        console.log('🔄 Restaurando banco de dados...');

        // Comando mysql para restaurar
        const command = `mysql -h ${dbConfig.host} -P ${dbConfig.port} -u ${dbConfig.user} -p${dbConfig.password} ${dbConfig.database} < "${backupPath}"`;

        await execAsync(command);

        console.log('✅ Banco de dados restaurado com sucesso!');
        console.log(`📁 Backup usado: ${backupFileName}`);

        // Para backups data-only, não aplicamos migrations (usuário já fez reset+migrate)
        if (isDataOnly) {
            console.log('');
            console.log('✅ Dados restaurados com sucesso!');
            console.log('🎉 Restore completo! Seu banco está pronto para uso.');
            console.log('');
            console.log('💡 Dica: Se houver problemas, execute:');
            console.log('   npx prisma db push --accept-data-loss');
            return;
        }

        // Aplicar migrations automaticamente (apenas para backups completos)
        console.log('');
        console.log('🔧 Aplicando migrations do Prisma...');

        try {
            // Primeiro, tenta aplicar diretamente
            const { stdout, stderr } = await execAsync('npx prisma migrate deploy', {
                cwd: path.resolve(__dirname, '..')
            });

            if (stdout) console.log(stdout);
            if (stderr && !stderr.includes('warn')) console.log(stderr);

            console.log('✅ Migrations aplicadas com sucesso!');
            console.log('');
            console.log('🎉 Restore completo! Seu banco está pronto para uso.');
        } catch (migrateError) {
            // Se falhar, pode ser migration falhada. Vamos tentar resolver
            if (migrateError.message.includes('P3009') || migrateError.message.includes('failed migration')) {
                console.log('⚠️  Detectada migration falhada. Tentando resolver...');

                try {
                    // Extrai o nome da migration falhada da mensagem de erro
                    const migrationMatch = migrateError.message.match(/`(\d+_[^`]+)` migration/);

                    if (migrationMatch) {
                        const failedMigration = migrationMatch[1];
                        console.log(`🔧 Resolvendo migration: ${failedMigration}`);

                        // Marca como aplicada
                        await execAsync(`npx prisma migrate resolve --applied ${failedMigration}`, {
                            cwd: path.resolve(__dirname, '..')
                        });

                        console.log('✅ Migration resolvida!');
                        console.log('🔧 Aplicando migrations pendentes...');

                        // Tenta aplicar novamente
                        const { stdout: stdout2 } = await execAsync('npx prisma migrate deploy', {
                            cwd: path.resolve(__dirname, '..')
                        });

                        if (stdout2) console.log(stdout2);

                        console.log('✅ Migrations aplicadas com sucesso!');
                        console.log('');
                        console.log('🎉 Restore completo! Seu banco está pronto para uso.');
                    } else {
                        throw new Error('Não foi possível identificar a migration falhada');
                    }
                } catch (resolveError) {
                    // Verifica se é erro P3018 (duplicate column - estrutura já existe)
                    if (resolveError.message.includes('P3018') || resolveError.message.includes('Duplicate column')) {
                        console.log('ℹ️  Estrutura do banco já está atualizada.');

                        try {
                            // Extrai o nome da migration do erro P3018
                            const migrationMatch = resolveError.message.match(/Migration name: (\d+_[^\n]+)/);

                            if (migrationMatch) {
                                const failedMigration = migrationMatch[1].trim();
                                console.log(`🔧 Marcando migration como aplicada: ${failedMigration}`);

                                // Marca como aplicada (rolled back)
                                await execAsync(`npx prisma migrate resolve --applied ${failedMigration}`, {
                                    cwd: path.resolve(__dirname, '..')
                                });

                                console.log('✅ Migration marcada como aplicada!');
                                console.log('');
                                console.log('🎉 Restore completo! Seu banco está pronto para uso.');
                            } else {
                                console.warn('⚠️  Estrutura já existe mas não foi possível identificar a migration.');
                                console.warn('   Execute manualmente:');
                                console.warn('   npx prisma migrate resolve --applied <migration-name>');
                            }
                        } catch (markError) {
                            console.warn('⚠️  Não foi possível marcar automaticamente.');
                            console.warn('   Execute manualmente:');
                            console.warn('   npx prisma migrate resolve --applied <migration-name>');
                        }
                    } else {
                        console.warn('⚠️  Não foi possível resolver automaticamente.');
                        console.warn('   Execute manualmente:');
                        console.warn('   npx prisma migrate resolve --applied <migration-name>');
                        console.warn('   npx prisma migrate deploy');
                        console.warn('');
                        console.warn('Erro:', resolveError.message);
                    }
                }
            } else {
                console.warn('⚠️  Aviso: Houve um problema ao aplicar migrations automaticamente.');
                console.warn('   Você pode precisar executar manualmente:');
                console.warn('   npx prisma migrate deploy');
                console.warn('');
                console.warn('Detalhes do erro:', migrateError.message);
            }
        }

    } catch (error) {
        console.error('❌ Erro ao restaurar backup:', error.message);
        process.exit(1);
    }
}

restoreDatabase();
