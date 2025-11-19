
// src/controllers/authController.js
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import { defaultCategories } from '../config/seedData.js';


const prisma = new PrismaClient();

class AuthController {
    async register(req, res, next) {
        const { name, username, email, password } = req.body;
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            
            const user = await prisma.$transaction(async (tx) => {
                // 1. Cria o novo usuário
                const newUser = await tx.user.create({
                    data: {
                        name,
                        username,
                        email,
                        password: hashedPassword,
                        // Inicializa os campos de gamificação diretamente
                        level: 1,
                        xp: 0,
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
        const { identifier, password } = req.body;
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

            res.json({
                message: 'Login bem-sucedido!',
                token,
                user: { 
                    id: user.id, 
                    name: user.name, 
                    email: user.email, 
                    firstOpen: user.firstOpen // Retorna a flag de onboarding
                }
            });

        } catch (error) {
            next(error);
        }
    }
}

export default new AuthController();

    