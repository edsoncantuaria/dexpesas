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

        // Confirmação
        console.log('');
        console.log('⚠️  ATENÇÃO: Esta operação irá SOBRESCREVER todos os dados do banco!');
        console.log(`📦 Database: ${dbConfig.database}`);
        console.log(`📁 Backup: ${backupFileName}`);
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

    } catch (error) {
        console.error('❌ Erro ao restaurar backup:', error.message);
        process.exit(1);
    }
}

restoreDatabase();
