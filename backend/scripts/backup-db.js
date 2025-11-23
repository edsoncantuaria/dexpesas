// scripts/backup-db.js
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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

async function backupDatabase() {
    try {
        // Carrega as variáveis de ambiente
        const dotenv = await import('dotenv');
        dotenv.config({ path: path.resolve(__dirname, '../.env') });

        const databaseUrl = process.env.DATABASE_URL;

        if (!databaseUrl) {
            throw new Error('DATABASE_URL não encontrada no arquivo .env');
        }

        const dbConfig = parseDatabaseUrl(databaseUrl);

        // Cria o diretório de backups se não existir
        const backupDir = path.resolve(__dirname, '../backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        // Gera nome do arquivo com timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const backupFileName = `backup-${dbConfig.database}-${timestamp}.sql`;
        const backupPath = path.join(backupDir, backupFileName);

        console.log('🔄 Iniciando backup do banco de dados...');
        console.log(`📦 Database: ${dbConfig.database}`);
        console.log(`💾 Arquivo: ${backupFileName}`);
        console.log(`⚠️  Nota: Tabela _prisma_migrations será excluída do backup`);

        // Comando mysqldump excluindo a tabela _prisma_migrations
        // Isso permite que migrations sejam aplicadas após restore
        const command = `mysqldump -h ${dbConfig.host} -P ${dbConfig.port} -u ${dbConfig.user} -p${dbConfig.password} --ignore-table=${dbConfig.database}._prisma_migrations ${dbConfig.database} > "${backupPath}"`;

        await execAsync(command);

        // Verifica o tamanho do arquivo gerado
        const stats = fs.statSync(backupPath);
        const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

        console.log('✅ Backup concluído com sucesso!');
        console.log(`📁 Local: ${backupPath}`);
        console.log(`📊 Tamanho: ${fileSizeInMB} MB`);
        console.log(`🔧 Migrations preservadas: Ao restaurar, execute 'npx prisma migrate deploy'`);

        return backupPath;
    } catch (error) {
        console.error('❌ Erro ao fazer backup:', error.message);
        process.exit(1);
    }
}

backupDatabase();

