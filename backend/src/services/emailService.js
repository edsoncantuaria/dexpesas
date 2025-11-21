// src/services/emailService.js
import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';
import config from '../config/config.js';

const { sendgrid, smtp, email, app } = config;

// Initialize SendGrid if configured
if (sendgrid.apiKey) {
    sgMail.setApiKey(sendgrid.apiKey);
}

// Create SMTP transporter if configured
let smtpTransporter = null;
if (smtp.host && smtp.user && smtp.pass) {
    smtpTransporter = nodemailer.createTransport({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.secure,
        auth: {
            user: smtp.user,
            pass: smtp.pass,
        },
    });
}

function ensureConfig() {
    const provider = email.provider;

    if (provider === 'smtp') {
        if (!smtp.host || !smtp.user || !smtp.pass) {
            throw new Error('SMTP não configurado. Defina SMTP_HOST, SMTP_USER e SMTP_PASS.');
        }
        if (!smtp.fromEmail) {
            throw new Error('SMTP_FROM_EMAIL não configurado.');
        }
    } else {
        // Default to SendGrid
        if (!sendgrid.apiKey) {
            throw new Error('SENDGRID_API_KEY não configurada.');
        }
        if (!sendgrid.fromEmail) {
            throw new Error('SENDGRID_FROM_EMAIL não configurado.');
        }
    }
}

function buildFrom() {
    const provider = email.provider;

    if (provider === 'smtp') {
        return {
            email: smtp.fromEmail,
            name: smtp.fromName || 'Dexpesas'
        };
    } else {
        return {
            email: sendgrid.fromEmail,
            name: sendgrid.fromName || 'Dexpesas'
        };
    }
}

async function sendEmail(to, subject, text, html) {
    ensureConfig();
    const provider = email.provider;
    const from = buildFrom();

    if (provider === 'smtp') {
        // Use Nodemailer (SMTP)
        const mailOptions = {
            from: `"${from.name}" <${from.email}>`,
            to,
            subject,
            text,
            html,
        };

        await smtpTransporter.sendMail(mailOptions);
    } else {
        // Use SendGrid
        const msg = {
            to,
            from,
            subject,
            text,
            html,
        };

        await sgMail.send(msg);
    }
}

import { generateEmailHtml } from './emailTemplates.js';

// ... (imports and config setup remain the same)

// ... (sendEmail function remains the same)

const EmailService = {
    async sendPasswordResetEmail(to, token) {
        const url = `${app.url.replace(/\/$/, '')}/reset-password?token=${token}`;
        const subject = 'Recupere sua senha - Dexpesas';

        const html = generateEmailHtml({
            title: 'Recuperação de Senha',
            body: `
                <p>Recebemos uma solicitação para redefinir a senha da sua conta Dexpesas.</p>
                <p>Se foi você, clique no botão abaixo para criar uma nova senha:</p>
            `,
            buttonText: 'Redefinir Minha Senha',
            buttonUrl: url,
            footerText: 'Se você não solicitou esta alteração, sua conta está segura e nenhuma ação é necessária.'
        });

        const text = `Recuperação de Senha\n\nUse o link abaixo para redefinir sua senha:\n${url}\n\nSe você não solicitou, ignore este e-mail.`;

        await sendEmail(to, subject, text, html);
    },

    async sendEmailVerification(to, token) {
        const url = `${app.url.replace(/\/$/, '')}/verify-email?token=${token}`;
        const subject = 'Bem-vindo ao Dexpesas! Confirme seu e-mail';

        const html = generateEmailHtml({
            title: 'Confirme seu E-mail',
            body: `
                <p>Estamos muito felizes em ter você conosco! Para garantir a segurança da sua conta e acessar todos os recursos, por favor confirme seu endereço de e-mail.</p>
                <p>É rápido e fácil, basta clicar no botão abaixo:</p>
            `,
            buttonText: 'Confirmar E-mail',
            buttonUrl: url
        });

        const text = `Bem-vindo ao Dexpesas!\n\nConfirme seu e-mail clicando no link:\n${url}\n\nSe não foi você, ignore esta mensagem.`;

        await sendEmail(to, subject, text, html);
    }
};

export default EmailService;
