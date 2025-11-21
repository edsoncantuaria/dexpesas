// src/services/emailService.js
import sgMail from '@sendgrid/mail';
import config from '../config/config.js';

const { sendgrid, app } = config;

if (sendgrid.apiKey) {
    sgMail.setApiKey(sendgrid.apiKey);
}

function ensureConfig() {
    if (!sendgrid.apiKey) {
        throw new Error('SENDGRID_API_KEY não configurada.');
    }
    if (!sendgrid.fromEmail) {
        throw new Error('SENDGRID_FROM_EMAIL não configurado.');
    }
}

function buildFrom() {
    return {
        email: sendgrid.fromEmail,
        name: sendgrid.fromName || 'Dexpesas'
    };
}

const EmailService = {
    async sendPasswordResetEmail(to, token) {
        ensureConfig();
        const url = `${app.url.replace(/\/$/, '')}/reset-password?token=${token}`;
        const msg = {
            to,
            from: buildFrom(),
            subject: 'Recupere sua senha - Dexpesas',
            text: `Você solicitou a redefinição da sua senha. Use o link abaixo para criar uma nova senha:\n${url}\n\nSe você não solicitou, ignore este e-mail.`,
            html: `<p>Você solicitou a redefinição da sua senha.</p>
                   <p><a href="${url}" target="_blank" rel="noopener">Clique aqui para criar uma nova senha</a></p>
                   <p>Se você não solicitou, pode ignorar este e-mail.</p>`
        };
        await sgMail.send(msg);
    },

    async sendEmailVerification(to, token) {
        ensureConfig();
        const url = `${app.url.replace(/\/$/, '')}/verify-email?token=${token}`;
        const msg = {
            to,
            from: buildFrom(),
            subject: 'Confirme seu e-mail - Dexpesas',
            text: `Bem-vindo! Confirme seu e-mail clicando no link:\n${url}\n\nSe não foi você, ignore esta mensagem.`,
            html: `<p>Bem-vindo! Confirme seu e-mail para começar a usar o Dexpesas.</p>
                   <p><a href="${url}" target="_blank" rel="noopener">Confirmar e-mail</a></p>
                   <p>Se não foi você, ignore esta mensagem.</p>`
        };
        await sgMail.send(msg);
    }
};

export default EmailService;
