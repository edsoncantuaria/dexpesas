// backend/src/controllers/clanController.js
import prisma from '../config/prismaClient.js';
import AuditService from '../services/auditService.js';

// Função helper para serializar BigInts em um objeto ou array de objetos
const serializeBigInts = (data) => {
    if (Array.isArray(data)) {
        return data.map(item => serializeBigInts(item));
    }
    if (data !== null && typeof data === 'object') {
        const newData = {};
        for (const key in data) {
            if (typeof data[key] === 'bigint') {
                newData[key] = data[key].toString();
            } else if (data[key] !== null && typeof data[key] === 'object') {
                newData[key] = serializeBigInts(data[key]);
            } else {
                newData[key] = data[key];
            }
        }
        return newData;
    }
    return data;
};

// Helper para buscar e mapear categorias
async function getCategoryMap(tx) {
    const prismaInstance = tx || prisma;
    const categories = await prismaInstance.category.findMany();
    return new Map(categories.map(cat => [cat.nome, cat.id]));
}


class ClanController {
    
    // --- Rotas Públicas / de Listagem ---
    async listClans(req, res, next) {
        try {
            const clans = await prisma.clan.findMany({
                include: {
                    _count: {
                        select: { members: true },
                    },
                    leader: {
                        select: { name: true, level: true },
                    }
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });
            res.json(serializeBigInts(clans));
        } catch (error) {
            next(error);
        }
    }
    
    // --- Rotas de Gerenciamento do Clã ---
    async createClan(req, res, next) {
        const { name, description, iconUrl } = req.body;
        const userId = req.user.id;

        try {
            const user = await prisma.user.findUnique({ where: { id: userId }, include: { clanMemberships: true } });
            if (user.clanMemberships?.length) {
                return res.status(400).json({ message: 'Você já faz parte de um clã. Saia do clã atual para criar um novo.' });
            }

            const newClan = await prisma.$transaction(async (tx) => {
                const clan = await tx.clan.create({
                    data: { 
                        name, 
                        description, 
                        iconUrl,
                        leaderId: userId,
                    }
                });

                await tx.clanMember.create({
                    data: {
                        clanId: clan.id,
                        userId: userId,
                        role: 'LEADER',
                    }
                });
                return clan;
            });

            await AuditService.log({ userId, action: 'CREATE_CLAN', entity: 'CLAN', entityId: newClan.id, details: { after: newClan }, ipAddress: req.ip });
            res.status(201).json(serializeBigInts(newClan));
        } catch (error) {
            if (error.code === 'P2002') {
                return res.status(409).json({ message: `Um clã com o nome "${name}" já existe.` });
            }
            next(error);
        }
    }

    async getClanDetails(req, res, next) {
        const { clanId } = req.params;
        try {
            const clan = await prisma.clan.findUnique({
                where: { id: clanId },
                include: {
                    members: {
                        include: { user: { select: { id: true, name: true, avatarUrl: true, level: true } } },
                        orderBy: { role: 'asc' }
                    },
                    leader: { select: { id: true, name: true, level: true }},
                    _count: { select: { members: true }}
                }
            });
            if (!clan) {
                return res.status(404).json({ message: 'Clã não encontrado.' });
            }
            res.json(serializeBigInts(clan));
        } catch (error) {
            next(error);
        }
    }

    async updateClan(req, res, next) {
        const { clanId } = req.params;
        const { name, description, iconUrl } = req.body;
        const userId = req.user.id;
        try {
            const member = await prisma.clanMember.findFirst({ where: { userId, clanId } });
            if (!member || member.role !== 'LEADER') {
                return res.status(403).json({ message: 'Apenas o líder pode editar o clã.' });
            }
            const updatedClan = await prisma.clan.update({
                where: { id: clanId },
                data: { name, description, iconUrl }
            });
            res.json(serializeBigInts(updatedClan));
        } catch (error) {
            next(error);
        }
    }

    async deleteClan(req, res, next) {
        const { clanId } = req.params;
        const userId = req.user.id;
        try {
            const member = await prisma.clanMember.findFirst({ where: { userId, clanId } });
            if (!member || member.role !== 'LEADER') {
                return res.status(403).json({ message: 'Apenas o líder pode dissolver o clã.' });
            }
            await prisma.clan.delete({ where: { id: clanId } });
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
    
    // --- Rotas de Finanças Coletivas ---
    
    async contributeToClanBank(req, res, next) {
        const { clanId } = req.params;
        const { amount, fromAccountId } = req.body;
        const userId = req.user.id;

        try {
            await prisma.$transaction(async (tx) => {
                 // 1. Debita da conta pessoal do usuário
                await tx.transaction.create({
                    data: {
                        userId: userId,
                        accountId: fromAccountId,
                        descricao: `Contribuição para Clã`,
                        valor: amount,
                        data: new Date(),
                        tipo: 'despesa',
                        pago: true,
                        metodoPagamento: 'transferencia',
                        categoryId: (await getCategoryMap(tx)).get('Investimentos'),
                    }
                });

                // 2. Credita no caixa do clã
                await tx.clan.update({
                    where: { id: clanId },
                    data: { 
                        balance: { increment: amount },
                        xp: { increment: Math.floor(amount / 10) } // Ganha 1 XP a cada R$10
                    }
                });
                
                const user = await tx.user.findUnique({ where: { id: userId }, select: { name: true } });
                await AuditService.log({
                    userId, action: 'CLAN_CONTRIBUTION', entity: 'CLAN', entityId: clanId, ipAddress: req.ip,
                    details: { amount, memberName: user?.name }
                });
            });

            res.status(200).json({ message: 'Contribuição realizada com sucesso.' });
        } catch (error) {
            next(error);
        }
    }

    async createClanExpense(req, res, next) {
        const { clanId } = req.params;
        const { amount, description, categoryId } = req.body;
        const userId = req.user.id;
        
        try {
            const member = await prisma.clanMember.findFirst({ where: { userId, clanId }, include: { user: { select: { name: true } } }});
            if (!member || !['LEADER', 'ADMIN'].includes(member.role)) {
                 return res.status(403).json({ message: 'Apenas líderes ou admins podem registrar despesas.' });
            }

            await prisma.$transaction(async (tx) => {
                const clan = await tx.clan.findUnique({ where: { id: clanId } });
                if (Number(clan.balance) < amount) {
                    throw { statusCode: 400, message: 'Saldo do clã insuficiente.' };
                }
                
                await tx.clan.update({
                    where: { id: clanId },
                    data: { balance: { decrement: amount } }
                });
                
                await AuditService.log({
                    userId, action: 'CLAN_EXPENSE', entity: 'CLAN', entityId: clanId, ipAddress: req.ip,
                    details: { amount, expenseDescription: description, memberName: member.user.name }
                });
            });
            
            res.status(200).json({ message: 'Despesa registrada com sucesso.' });
        } catch (error) {
             if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
            next(error);
        }
    }
    
    async splitExpense(req, res, next) {
        const { clanId } = req.params;
        const { totalAmount, description, categoryId, splitMethod } = req.body;
        const userId = req.user.id; // Criador da despesa

        try {
            const member = await prisma.clanMember.findFirst({ where: { userId, clanId } });
            if (!member || !['LEADER', 'ADMIN'].includes(member.role)) {
                return res.status(403).json({ message: 'Apenas líderes ou admins podem registrar despesas rateadas.' });
            }

            await prisma.$transaction(async (tx) => {
                const clan = await tx.clan.findUnique({ where: { id: clanId }, include: { members: true } });
                if (Number(clan.balance) < totalAmount) {
                    throw { statusCode: 400, message: 'Saldo do clã insuficiente para esta despesa.' };
                }

                // 1. Debita o valor total do caixa do clã
                await tx.clan.update({ where: { id: clanId }, data: { balance: { decrement: totalAmount } } });

                // 2. Cria o registro da despesa compartilhada
                const sharedExpense = await tx.sharedExpense.create({
                    data: { clanId, creatorId: userId, description, totalAmount, splitMethod, categoryId }
                });

                // 3. Calcula e cria as transações individuais
                const membersCount = clan.members.length;
                if (membersCount === 0) throw { statusCode: 400, message: 'Não há membros no clã para ratear.' };
                
                const amountPerMember = totalAmount / membersCount;

                for (const member of clan.members) {
                    const personalTransaction = await tx.transaction.create({
                        data: {
                            userId: member.userId,
                            descricao: `Rateio: ${description}`,
                            valor: amountPerMember,
                            data: new Date(),
                            tipo: 'despesa',
                            pago: true,
                            metodoPagamento: 'dinheiro', // Simbólico, pois saiu do caixa comum
                            categoryId: categoryId,
                        }
                    });

                    await tx.sharedExpenseParticipant.create({
                        data: {
                            sharedExpenseId: sharedExpense.id,
                            userId: member.userId,
                            amountOwed: amountPerMember,
                            createdTransactionId: personalTransaction.id,
                        }
                    });
                }
            });

            res.status(201).json({ message: 'Despesa rateada e registrada com sucesso!' });

        } catch (error) {
            if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
            next(error);
        }
    }


    async getClanGoals(req, res, next) {
        const { clanId } = req.params;
         try {
            const goals = await prisma.goal.findMany({ where: { clanId }, orderBy: { deadline: 'asc' }});
            res.json(goals);
        } catch (error) {
            next(error);
        }
    }

    async createClanGoal(req, res, next) {
         const { clanId } = req.params;
         const { name, targetAmount, deadline } = req.body;
         try {
            const newGoal = await prisma.goal.create({
                data: {
                    clanId,
                    name,
                    targetAmount,
                    deadline: deadline ? new Date(deadline) : null,
                }
            });
            res.status(201).json(newGoal);
        } catch (error) {
            next(error);
        }
    }

    async contributeToClanGoal(req, res, next) {
        const { goalId } = req.params;
        const { amount, fromAccountId } = req.body;
        const userId = req.user.id;
        
         try {
            await prisma.$transaction(async (tx) => {
                await tx.transaction.create({
                    data: {
                        userId, accountId: fromAccountId, descricao: `Contribuição para meta do Clã`, valor: amount,
                        data: new Date(), tipo: 'despesa', pago: true, metodoPagamento: 'transferencia',
                        categoryId: (await getCategoryMap(tx)).get('Investimentos'),
                    }
                });
                
                const updatedGoal = await tx.goal.update({
                    where: { id: goalId },
                    data: { currentAmount: { increment: amount } }
                });
                
                await tx.clan.update({
                    where: { id: updatedGoal.clanId },
                    data: { xp: { increment: Math.floor(amount / 5) } } // XP bonus por meta
                });
                
                const user = await tx.user.findUnique({ where: { id: userId }, select: { name: true }});
                 await AuditService.log({
                    userId, action: 'CLAN_GOAL_CONTRIBUTION', entity: 'GOAL', entityId: goalId, ipAddress: req.ip,
                    details: { amount, memberName: user?.name, goalName: updatedGoal.name }
                });
            });

            res.status(200).json({ message: 'Contribuição para meta realizada com sucesso.' });
        } catch (error) {
            next(error);
        }
    }
    
    async getClanActivity(req, res, next) {
        const { clanId } = req.params;
        try {
            const logs = await prisma.auditLog.findMany({
                where: {
                    entity: { in: ['CLAN', 'GOAL'] },
                    OR: [
                        { entityId: clanId },
                        { details: { path: ['clanId'], equals: clanId } }
                    ],
                    action: { in: ['CLAN_CONTRIBUTION', 'CLAN_EXPENSE', 'CLAN_GOAL_CONTRIBUTION'] }
                },
                orderBy: { createdAt: 'desc' },
                take: 50,
            });
            res.json(logs);
        } catch (error) {
            next(error);
        }
    }
    
    async getClanSharedExpenses(req, res, next) {
        const { clanId } = req.params;
        try {
            const expenses = await prisma.sharedExpense.findMany({
                where: { clanId },
                include: { 
                    creator: { select: { name: true } },
                    participants: { include: { user: { select: { name: true } }}},
                    category: true
                },
                orderBy: { createdAt: 'desc' },
            });
            res.json(expenses);
        } catch (error) {
            next(error);
        }
    }


    async joinClan(req, res, next) {
        const { clanId } = req.params;
        const userId = req.user.id;
        try {
            const user = await prisma.user.findUnique({ where: { id: userId }, include: { clanMemberships: true }});
             if (user.clanMemberships?.length) {
                return res.status(400).json({ message: 'Você já está em um clã.' });
            }
            await prisma.clanMember.create({ data: { clanId, userId, role: 'MEMBER' } });
            res.status(200).json({ message: 'Você entrou no clã!' });
        } catch (error) {
            next(error);
        }
    }

    async leaveClan(req, res, next) {
        const { clanId } = req.params;
        const userId = req.user.id;
        try {
            const member = await prisma.clanMember.findFirst({ where: { clanId, userId }});
             if (!member) {
                return res.status(400).json({ message: 'Você não é membro deste clã.' });
            }
            if (member.role === 'LEADER') {
                return res.status(400).json({ message: 'O líder não pode sair do clã. Transfira a liderança primeiro.' });
            }
            await prisma.clanMember.delete({ where: { userId_clanId: { userId, clanId } } });
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
    
    async removeMember(req, res, next) {
        const { clanId, userId: memberId } = req.params;
        const leaderId = req.user.id;
        try {
            const leader = await prisma.clanMember.findFirst({ where: { clanId, userId: leaderId }});
            if (!leader || leader.role !== 'LEADER') {
                 return res.status(403).json({ message: 'Apenas o líder pode remover membros.' });
            }
            if (leaderId === memberId) {
                 return res.status(400).json({ message: 'O líder não pode remover a si mesmo.' });
            }
            await prisma.clanMember.delete({ where: { userId_clanId: { userId: memberId, clanId } } });
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
    
    async updateMemberRole(req, res, next) {
        const { clanId, userId: memberId } = req.params;
        const { role } = req.body;
        const leaderId = req.user.id;
         try {
            const leader = await prisma.clanMember.findFirst({ where: { clanId, userId: leaderId }});
            if (!leader || leader.role !== 'LEADER') {
                 return res.status(403).json({ message: 'Apenas o líder pode alterar papéis.' });
            }
            if (leaderId === memberId) {
                 return res.status(400).json({ message: 'O líder não pode alterar seu próprio papel.' });
            }
            const updatedMember = await prisma.clanMember.update({
                where: { userId_clanId: { userId: memberId, clanId } },
                data: { role }
            });
            res.json(updatedMember);
         } catch (error) {
             next(error);
         }
    }
    
    async inviteMember(req, res, next) { res.status(501).json({ message: "Funcionalidade ainda não implementada." }); }
    async acceptInvite(req, res, next) { res.status(501).json({ message: "Funcionalidade ainda não implementada." }); }
    async declineInvite(req, res, next) { res.status(501).json({ message: "Funcionalidade ainda não implementada." }); }
    async updatePolicies(req, res, next) { res.status(501).json({ message: "Funcionalidade ainda não implementada." }); }
}

export default new ClanController();
