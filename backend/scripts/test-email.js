import EmailService from '../src/services/emailService.js';
import config from '../src/config/config.js';

async function testEmail() {
    console.log('📧 Iniciando teste de envio de e-mail...');
    console.log(`🔧 Provedor configurado: ${config.email.provider}`);

    if (config.email.provider === 'smtp') {
        console.log(`📨 Host SMTP: ${config.smtp.host}:${config.smtp.port}`);
        console.log(`👤 Usuário SMTP: ${config.smtp.user}`);
    } else {
        console.log(`📨 SendGrid API Key: ${config.sendgrid.apiKey ? '********' : 'NÃO CONFIGURADA'}`);
    }

    const testEmail = process.argv[2] || config.smtp.user || config.sendgrid.fromEmail;

    if (!testEmail || testEmail.includes('noreply')) {
        console.warn('⚠️  Aviso: Tentando enviar para um e-mail "noreply" ou indefinido.');
        console.warn('   Para testar com um e-mail específico, execute: npm run test:mail seu@email.com');
    }

    console.log(`📤 Enviando e-mail de teste para: ${testEmail}`);

    try {
        // Usamos o método de verificação como teste
        await EmailService.sendEmailVerification(testEmail, 'TEST-TOKEN-12345');
        console.log('✅ E-mail enviado com sucesso!');
    } catch (error) {
        console.error('❌ Falha ao enviar e-mail:');
        console.error(error);
        process.exit(1);
    }
}

testEmail();
