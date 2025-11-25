import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import AuditService from '../services/auditService.js';
import PDFDocument from 'pdfkit';
import { stringify } from 'csv-stringify/sync';

const prisma = new PrismaClient();

class SplitBillController {
    async createGroup(req, res, next) {
        try {
            const { name, description, category } = req.body;
            const userId = req.user.id;

            // Fetch user's actual name from database
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { name: true }
            });

            const group = await prisma.splitGroup.create({
                data: {
                    name,
                    description,
                    category,
                    createdBy: userId,
                    members: {
                        create: {
                            userId: userId,
                            name: user?.name || 'Usuário',
                            inviteStatus: 'ACCEPTED'
                        }
                    }
                },
                include: {
                    members: true
                }
            });

            await AuditService.log({
                userId,
                action: 'CREATE_SPLIT_GROUP',
                entity: 'SPLIT_GROUP',
                entityId: group.id,
                details: { group },
                ipAddress: req.ip
            });

            res.status(201).json(group);
        } catch (error) {
            next(error);
        }
    }

    async getGroups(req, res, next) {
        try {
            const userId = req.user.id;
            const groups = await prisma.splitGroup.findMany({
                where: {
                    members: {
                        some: {
                            userId: userId
                        }
                    }
                },
                include: {
                    members: true,
                    _count: {
                        select: { expenses: true }
                    }
                },
                orderBy: { updatedAt: 'desc' }
            });
            res.json(groups);
        } catch (error) {
            next(error);
        }
    }

    async getGroupDetails(req, res, next) {
        try {
            const { groupId } = req.params;
            const userId = req.user.id;

            // Verify membership
            const membership = await prisma.splitGroupMember.findFirst({
                where: { groupId, userId }
            });

            if (!membership) {
                return res.status(403).json({ message: 'Acesso negado ao grupo.' });
            }

            const group = await prisma.splitGroup.findUnique({
                where: { id: groupId },
                include: {
                    members: {
                        include: {
                            user: {
                                select: { id: true, name: true, avatarUrl: true }
                            }
                        }
                    },
                    expenses: {
                        include: {
                            paidBy: true,
                            splits: {
                                include: { member: true }
                            }
                        },
                        orderBy: { date: 'desc' }
                    },
                    settlements: {
                        include: {
                            from: true,
                            to: true
                        },
                        orderBy: { date: 'desc' }
                    }
                }
            });

            if (!group) {
                return res.status(404).json({ message: 'Grupo não encontrado.' });
            }

            res.json(group);
        } catch (error) {
            next(error);
        }
    }

    async addMember(req, res, next) {
        try {
            const { groupId } = req.params;
            const { name, userId: invitedUserId } = req.body; // userId is optional (for registered users)
            const currentUserId = req.user.id;

            // Verify permission (must be member of group)
            const membership = await prisma.splitGroupMember.findFirst({
                where: { groupId, userId: currentUserId }
            });

            if (!membership) {
                return res.status(403).json({ message: 'Acesso negado.' });
            }

            const newMember = await prisma.splitGroupMember.create({
                data: {
                    groupId,
                    name,
                    userId: invitedUserId || null,
                    inviteStatus: invitedUserId ? 'PENDING' : 'ACCEPTED' // Virtual members are auto-accepted
                }
            });

            await AuditService.log({
                userId: currentUserId,
                action: 'ADD_SPLIT_MEMBER',
                entity: 'SPLIT_GROUP_MEMBER',
                entityId: newMember.id,
                details: { groupId, name, invitedUserId },
                ipAddress: req.ip
            });

            // Log activity
            await prisma.splitGroupActivity.create({
                data: {
                    groupId,
                    userId: currentUserId,
                    action: 'ADD_MEMBER',
                    details: { memberName: name }
                }
            });

            res.status(201).json(newMember);
        } catch (error) {
            next(error);
        }
    }

    async createExpense(req, res, next) {
        try {
            const { groupId } = req.params;
            const { description, amount, date, paidById, payers, splits, splitType, attachmentUrl } = req.body;
            // payers: [{ memberId, amount }] - Optional, if not provided use paidById
            // splits: [{ memberId, amount, percentage }]
            const userId = req.user.id;

            // Validate split type
            const validSplitTypes = ['EQUAL', 'PERCENTAGE', 'EXACT'];
            const finalSplitType = splitType || 'EQUAL';

            if (!validSplitTypes.includes(finalSplitType)) {
                return res.status(400).json({ message: 'Tipo de divisão inválido' });
            }

            // Validation based on split type
            if (finalSplitType === 'PERCENTAGE') {
                const totalPercentage = splits.reduce((sum, s) => sum + Number(s.percentage || 0), 0);
                if (Math.abs(totalPercentage - 100) > 0.01) {
                    return res.status(400).json({
                        message: 'As porcentagens devem somar 100%',
                        totalPercentage
                    });
                }
            } else if (finalSplitType === 'EXACT') {
                const totalAmount = splits.reduce((sum, s) => sum + Number(s.amount || 0), 0);
                if (Math.abs(totalAmount - Number(amount)) > 0.01) {
                    return res.status(400).json({
                        message: 'A soma dos valores deve ser igual ao total da despesa',
                        expected: amount,
                        received: totalAmount
                    });
                }
            }

            // Determine payers
            let finalPayers = [];
            if (payers && payers.length > 0) {
                finalPayers = payers;
                // Validate total paid amount
                const totalPaid = payers.reduce((sum, p) => sum + Number(p.amount), 0);
                if (Math.abs(totalPaid - Number(amount)) > 0.01) {
                    return res.status(400).json({
                        message: 'A soma dos pagamentos deve ser igual ao total da despesa',
                        expected: amount,
                        received: totalPaid
                    });
                }
            } else if (paidById) {
                finalPayers = [{ memberId: paidById, amount: amount }];
            } else {
                return res.status(400).json({ message: 'Pagador não informado' });
            }

            const expense = await prisma.splitExpense.create({
                data: {
                    groupId,
                    description,
                    amount,
                    date: date ? new Date(date) : new Date(),
                    paidById: finalPayers.length === 1 ? finalPayers[0].memberId : null, // Legacy support
                    splitType: finalSplitType,
                    attachmentUrl: attachmentUrl || null,
                    splits: {
                        create: splits.map(split => ({
                            memberId: split.memberId,
                            amount: split.amount,
                            percentage: split.percentage
                        }))
                    },
                    payers: {
                        create: finalPayers.map(payer => ({
                            memberId: payer.memberId,
                            amount: payer.amount
                        }))
                    }
                },
                include: {
                    splits: true,
                    paidBy: true,
                    payers: {
                        include: { member: true }
                    }
                }
            });

            await AuditService.log({
                userId,
                action: 'CREATE_SPLIT_EXPENSE',
                entity: 'SPLIT_EXPENSE',
                entityId: expense.id,
                details: { groupId, amount, description, splitType: finalSplitType },
                ipAddress: req.ip
            });

            // Log activity
            await prisma.splitGroupActivity.create({
                data: {
                    groupId,
                    userId,
                    action: 'CREATE_EXPENSE',
                    details: { description, amount, splitType: finalSplitType }
                }
            });

            res.status(201).json(expense);
        } catch (error) {
            next(error);
        }
    }

    async updateExpense(req, res, next) {
        try {
            const { groupId, expenseId } = req.params;
            const { description, amount, date, paidById, payers, splits, splitType, attachmentUrl } = req.body;
            const userId = req.user.id;

            // Verify permission
            const membership = await prisma.splitGroupMember.findFirst({
                where: { groupId, userId }
            });

            if (!membership) {
                return res.status(403).json({ message: 'Acesso negado.' });
            }

            // Validate split type
            if (splitType) {
                const validSplitTypes = ['EQUAL', 'PERCENTAGE', 'EXACT'];
                if (!validSplitTypes.includes(splitType)) {
                    return res.status(400).json({ message: 'Tipo de divisão inválido' });
                }

                // Validation based on split type
                if (splitType === 'PERCENTAGE') {
                    const totalPercentage = splits.reduce((sum, s) => sum + Number(s.percentage || 0), 0);
                    if (Math.abs(totalPercentage - 100) > 0.01) {
                        return res.status(400).json({
                            message: 'As porcentagens devem somar 100%',
                            totalPercentage
                        });
                    }
                } else if (splitType === 'EXACT') {
                    const totalAmount = splits.reduce((sum, s) => sum + Number(s.amount || 0), 0);
                    if (Math.abs(totalAmount - Number(amount)) > 0.01) {
                        return res.status(400).json({
                            message: 'A soma dos valores deve ser igual ao total da despesa',
                            expected: amount,
                            received: totalAmount
                        });
                    }
                }
            }

            // Determine payers
            let finalPayers = [];
            if (payers && payers.length > 0) {
                finalPayers = payers;
                const totalPaid = payers.reduce((sum, p) => sum + Number(p.amount), 0);
                if (Math.abs(totalPaid - Number(amount)) > 0.01) {
                    return res.status(400).json({
                        message: 'A soma dos pagamentos deve ser igual ao total da despesa',
                        expected: amount,
                        received: totalPaid
                    });
                }
            } else if (paidById) {
                finalPayers = [{ memberId: paidById, amount: amount }];
            }

            // Transaction to update expense and splits
            const updatedExpense = await prisma.$transaction(async (prisma) => {
                // Delete existing splits and payers
                await prisma.splitExpenseSplit.deleteMany({ where: { expenseId } });
                await prisma.splitExpensePayer.deleteMany({ where: { expenseId } });

                // Update expense and create new splits/payers
                return prisma.splitExpense.update({
                    where: { id: expenseId },
                    data: {
                        description,
                        amount,
                        date: date ? new Date(date) : undefined,
                        paidById: finalPayers.length === 1 ? finalPayers[0].memberId : null,
                        ...(splitType && { splitType }),
                        ...(attachmentUrl !== undefined && { attachmentUrl }),
                        splits: {
                            create: splits.map(split => ({
                                memberId: split.memberId,
                                amount: split.amount,
                                percentage: split.percentage
                            }))
                        },
                        payers: {
                            create: finalPayers.map(payer => ({
                                memberId: payer.memberId,
                                amount: payer.amount
                            }))
                        }
                    },
                    include: {
                        splits: true,
                        paidBy: true,
                        payers: {
                            include: { member: true }
                        }
                    }
                });
            });

            await AuditService.log({
                userId,
                action: 'UPDATE_SPLIT_EXPENSE',
                entity: 'SPLIT_EXPENSE',
                entityId: expenseId,
                details: { groupId, amount, description, splitType },
                ipAddress: req.ip
            });

            // Log activity
            await prisma.splitGroupActivity.create({
                data: {
                    groupId,
                    userId,
                    action: 'UPDATE_EXPENSE',
                    details: { description, amount }
                }
            });

            res.json(updatedExpense);
        } catch (error) {
            next(error);
        }
    }

    async settleDebt(req, res, next) {
        try {
            const { groupId } = req.params;
            const { fromId, toId, amount, date, accountId } = req.body;
            const userId = req.user.id;

            const result = await prisma.$transaction(async (prisma) => {
                // Create settlement record
                const settlement = await prisma.splitSettlement.create({
                    data: {
                        groupId,
                        fromId,
                        toId,
                        amount,
                        date: date ? new Date(date) : new Date()
                    }
                });

                // If accountId is provided, create a transaction for the user
                if (accountId) {
                    // Fetch group name for description
                    const group = await prisma.splitGroup.findUnique({
                        where: { id: groupId },
                        select: { name: true }
                    });

                    // Determine if user is payer or receiver
                    // We need to map member IDs to user IDs to check if the current user is involved
                    const fromMember = await prisma.splitGroupMember.findUnique({ where: { id: fromId } });
                    const toMember = await prisma.splitGroupMember.findUnique({ where: { id: toId } });

                    if (fromMember && fromMember.userId === userId) {
                        // User is paying (Expense)
                        await prisma.transaction.create({
                            data: {
                                userId,
                                accountId,
                                valor: amount,
                                descricao: `Pagamento de dívida: ${group?.name || 'Grupo'}`,
                                tipo: 'despesa',
                                data: date ? new Date(date) : new Date(),
                                metodoPagamento: 'transferencia',
                                status: 'POSTED',
                                pago: true
                            }
                        });
                    } else if (toMember && toMember.userId === userId) {
                        // User is receiving (Income)
                        await prisma.transaction.create({
                            data: {
                                userId,
                                accountId,
                                valor: amount,
                                descricao: `Recebimento de dívida: ${group?.name || 'Grupo'}`,
                                tipo: 'receita',
                                data: date ? new Date(date) : new Date(),
                                metodoPagamento: 'transferencia',
                                status: 'POSTED',
                                pago: true
                            }
                        });
                    }
                }

                return settlement;
            });

            await AuditService.log({
                userId,
                action: 'CREATE_SPLIT_SETTLEMENT',
                entity: 'SPLIT_SETTLEMENT',
                entityId: result.id,
                details: { groupId, fromId, toId, amount, accountId },
                ipAddress: req.ip
            });

            // Log activity
            await prisma.splitGroupActivity.create({
                data: {
                    groupId,
                    userId,
                    action: 'SETTLE_DEBT',
                    details: { amount }
                }
            });

            res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }
    async deleteExpense(req, res, next) {
        try {
            const { groupId, expenseId } = req.params;
            const userId = req.user.id;

            // Verify permission (must be member of group)
            const membership = await prisma.splitGroupMember.findFirst({
                where: { groupId, userId }
            });

            if (!membership) {
                return res.status(403).json({ message: 'Acesso negado.' });
            }

            // Delete splits first (cascade usually handles this but good to be explicit or if cascade not set)
            await prisma.splitExpenseSplit.deleteMany({
                where: { expenseId }
            });

            const expense = await prisma.splitExpense.delete({
                where: { id: expenseId }
            });

            await AuditService.log({
                userId,
                action: 'DELETE_SPLIT_EXPENSE',
                entity: 'SPLIT_EXPENSE',
                entityId: expenseId,
                details: { groupId },
                ipAddress: req.ip
            });

            res.status(200).json({ message: 'Despesa removida com sucesso.' });
        } catch (error) {
            next(error);
        }
    }

    async deleteSettlement(req, res, next) {
        try {
            const { groupId, settlementId } = req.params;
            const userId = req.user.id;

            // Verify permission
            const membership = await prisma.splitGroupMember.findFirst({
                where: { groupId, userId }
            });

            if (!membership) {
                return res.status(403).json({ message: 'Acesso negado.' });
            }

            const settlement = await prisma.splitSettlement.delete({
                where: { id: settlementId }
            });

            await AuditService.log({
                userId,
                action: 'DELETE_SPLIT_SETTLEMENT',
                entity: 'SPLIT_SETTLEMENT',
                entityId: settlementId,
                details: { groupId },
                ipAddress: req.ip
            });

            // Log activity
            await prisma.splitGroupActivity.create({
                data: {
                    groupId,
                    userId,
                    action: 'DELETE_SETTLEMENT',
                    details: { settlementId }
                }
            });

            res.status(200).json({ message: 'Pagamento removido com sucesso.' });
        } catch (error) {
            next(error);
        }
    }

    async getGroupActivity(req, res, next) {
        try {
            const { groupId } = req.params;
            const activities = await prisma.splitGroupActivity.findMany({
                where: { groupId },
                include: {
                    user: { select: { name: true, avatarUrl: true } }
                },
                orderBy: { createdAt: 'desc' },
                take: 50
            });
            res.json(activities);
        } catch (error) {
            next(error);
        }
    }

    async exportGroupData(req, res, next) {
        try {
            const { groupId } = req.params;
            const { format } = req.query; // 'pdf' or 'csv'

            const group = await prisma.splitGroup.findUnique({
                where: { id: groupId },
                include: {
                    members: true,
                    expenses: {
                        include: {
                            paidBy: true,
                            payers: { include: { member: true } },
                            splits: { include: { member: true } }
                        },
                        orderBy: { date: 'desc' }
                    }
                }
            });

            if (!group) return res.status(404).json({ message: 'Grupo não encontrado' });

            if (format === 'csv') {
                const data = group.expenses.map(e => ({
                    Data: e.date.toISOString().split('T')[0],
                    Descrição: e.description,
                    Valor: Number(e.amount).toFixed(2),
                    'Pago Por': e.payers.map(p => p.member.name).join(', '),
                    'Tipo': e.splitType
                }));

                const csv = stringify(data, { header: true });
                res.header('Content-Type', 'text/csv');
                res.attachment(`grupo-${group.name}.csv`);
                return res.send(csv);
            } else if (format === 'pdf') {
                const doc = new PDFDocument();
                res.header('Content-Type', 'application/pdf');
                res.attachment(`grupo-${group.name}.pdf`);
                doc.pipe(res);

                doc.fontSize(20).text(`Relatório: ${group.name}`, { align: 'center' });
                doc.moveDown();

                group.expenses.forEach(e => {
                    doc.fontSize(12).text(`${e.date.toISOString().split('T')[0]} - ${e.description}`);
                    doc.fontSize(10).text(`Valor: R$ ${Number(e.amount).toFixed(2)}`);
                    doc.text(`Pago por: ${e.payers.map(p => p.member.name).join(', ')}`);
                    doc.moveDown();
                });

                doc.end();
            } else {
                res.status(400).json({ message: 'Formato inválido' });
            }
        } catch (error) {
            next(error);
        }
    }
}

export default new SplitBillController();
