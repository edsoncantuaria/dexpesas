
// src/controllers/authController.js
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../config/config.js';
import { defaultCategories } from '../config/seedData.js';
import { encryptValue } from '../utils/fieldEncryption.js';
import SecurityService from '../services/securityService.js';
import EmailService from '../services/emailService.js';


const prisma = new PrismaClient();
const STRONG_PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

const generateTokenPayload = (hoursValid = 1) => {
    const token = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + hoursValid * 60 * 60 * 1000);
    return { token, hash, expiresAt };
};

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

class AuthController {
    async register(req, res, next) {
        const { name, username, email, password, phoneNumber, gamificationMode } = req.body;
        try {
            if (!STRONG_PASSWORD_REGEX.test(password)) {
                return res.status(400).json({ message: 'A senha deve ter pelo menos 8 caracteres e incluir letras e números.' });
            }

            const verification = generateTokenPayload(24); // 24h para confirmar e-mail
            const hashedPassword = await bcrypt.hash(password, 10);
            
            const user = await prisma.$transaction(async (tx) => {
                // 1. Cria o novo usuário
                const normalizedMode = gamificationMode && typeof gamificationMode === 'string'
                    ? gamificationMode.toUpperCase()
                    : undefined;
                const allowedModes = ['FULL', 'LITE', 'OFF'];

                const newUser = await tx.user.create({
                    data: {
                        name,
                        username,
                        email,
                        password: hashedPassword,
                        gamificationMode: allowedModes.includes(normalizedMode) ? normalizedMode : 'FULL',
                        // Inicializa os campos de gamificação diretamente
                        level: 1,
                        xp: 0,
                        phoneNumber: phoneNumber ? encryptValue(phoneNumber) : null,
                        phoneVerified: false,
                        emailVerified: false,
                        emailVerificationToken: verification.hash,
                        emailVerificationExpires: verification.expiresAt,
                        resetPasswordToken: null,
                        resetPasswordExpires: null,
                    },
                });

                // 2. Garante que as categorias base existam no banco.
                await tx.category.createMany({
                    data: defaultCategories,
                    skipDuplicates: true, // Não falha se a categoria já existir
                });
                
                console.log(`✨ Usuário ${newUser.id} criado com sucesso. Categorias padrão verificadas.`);

                return newUser;
            }, {
              timeout: 20000, // Timeout da transação
            });

            // Dispara o e-mail de confirmação sem bloquear a resposta.
            EmailService.sendEmailVerification(email, verification.token).catch((error) => {
                console.error('Falha ao enviar e-mail de verificação:', error.message);
            });

            res.status(201).json({ message: 'Usuário registrado com sucesso!', userId: user.id });
        } catch (error) {
            if (error.code === 'P2002') {
                 return res.status(409).json({ message: `O ${error.meta.target.includes('email') ? 'email' : 'usuário'} já está em uso.` });
            }
            console.error("Erro no registro:", error);
            next(error);
        }
    }

    async login(req, res, next) {
        const { identifier, password, deviceInfo } = req.body;
        try {
            const user = await prisma.user.findFirst({
                where: {
                    OR: [
                        { email: identifier },
                        { username: identifier }
                    ]
                }
            });

            if (!user) {
                return res.status(401).json({ message: 'Credenciais inválidas.' });
            }

            const isPasswordCorrect = await bcrypt.compare(password, user.password);
            if (!isPasswordCorrect) {
                return res.status(401).json({ message: 'Credenciais inválidas.' });
            }

            const token = jwt.sign(
                { id: user.id, email: user.email },
                config.jwtSecret,
                { expiresIn: '1d' }
            );

            const requestDeviceInfo = deviceInfo || { userAgent: req.get('user-agent') || 'web' };
            SecurityService.recordDeviceLogin(user, requestDeviceInfo, req.ip).catch((error) => {
                console.error('Falha ao registrar dispositivo:', error.message);
            });

            res.json({
                message: 'Login bem-sucedido!',
                token,
                user: { 
                    id: user.id, 
                    name: user.name, 
                    email: user.email, 
                    emailVerified: user.emailVerified,
                    firstOpen: user.firstOpen // Retorna a flag de onboarding
                }
            });

        } catch (error) {
            next(error);
        }
    }

    async forgotPassword(req, res, next) {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Informe o e-mail cadastrado.' });
        }

        try {
            const user = await prisma.user.findUnique({ where: { email } });
            if (user) {
                const reset = generateTokenPayload(1); // 1 hora
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        resetPasswordToken: reset.hash,
                        resetPasswordExpires: reset.expiresAt,
                    }
                });
                await EmailService.sendPasswordResetEmail(user.email, reset.token);
                await prisma.securityEvent.create({
                    data: {
                        userId: user.id,
                        type: 'PASSWORD_RESET',
                        message: 'Solicitação de redefinição de senha enviada por e-mail.',
                        metadata: { ip: req.ip },
                    },
                });
            }

            return res.json({ message: 'Se o e-mail estiver cadastrado, enviaremos o link para redefinição.' });
        } catch (error) {
            next(error);
        }
    }

    async resetPassword(req, res, next) {
        const { token, password } = req.body;
        if (!token || !password) {
            return res.status(400).json({ message: 'Token e nova senha são obrigatórios.' });
        }
        if (!STRONG_PASSWORD_REGEX.test(password)) {
            return res.status(400).json({ message: 'A senha deve ter pelo menos 8 caracteres e incluir letras e números.' });
        }

        try {
            const hashed = hashToken(token);
            const user = await prisma.user.findFirst({
                where: {
                    resetPasswordToken: hashed,
                    resetPasswordExpires: { gt: new Date() },
                }
            });

            if (!user) {
                return res.status(400).json({ message: 'Token inválido ou expirado.' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    password: hashedPassword,
                    resetPasswordToken: null,
                    resetPasswordExpires: null,
                }
            });

            await prisma.securityEvent.create({
                data: {
                    userId: user.id,
                    type: 'PASSWORD_RESET',
                    message: 'Senha redefinida com sucesso.',
                    metadata: { ip: req.ip },
                },
            });

            res.json({ message: 'Senha redefinida com sucesso.' });
        } catch (error) {
            next(error);
        }
    }

    async verifyEmail(req, res, next) {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ message: 'Token de verificação é obrigatório.' });
        }

        try {
            const hashed = hashToken(token);
            const user = await prisma.user.findFirst({
                where: {
                    emailVerificationToken: hashed,
                    emailVerificationExpires: { gt: new Date() },
                }
            });

            if (!user) {
                return res.status(400).json({ message: 'Token inválido ou expirado.' });
            }

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    emailVerified: true,
                    emailVerificationToken: null,
                    emailVerificationExpires: null,
                }
            });

            res.json({ message: 'E-mail verificado com sucesso.' });
        } catch (error) {
            next(error);
        }
    }

    async resendVerification(req, res, next) {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ message: 'Informe o e-mail para reenviar a verificação.' });
        }

        try {
            const user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
                return res.json({ message: 'Se o e-mail estiver cadastrado, enviaremos um novo link.' });
            }
            if (user.emailVerified) {
                return res.status(400).json({ message: 'E-mail já verificado.' });
            }

            const verification = generateTokenPayload(24);
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    emailVerificationToken: verification.hash,
                    emailVerificationExpires: verification.expiresAt,
                }
            });

            await EmailService.sendEmailVerification(user.email, verification.token);
            res.json({ message: 'Novo e-mail de verificação enviado.' });
        } catch (error) {
            next(error);
        }
    }
}

export default new AuthController();

    
