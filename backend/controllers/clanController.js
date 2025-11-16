
// backend/src/controllers/clanController.js
import { addDays } from "date-fns";
import prisma from "../config/prismaClient.js";
import AuditService from "../services/auditService.js";
import { stringify as stringifyCsv } from "csv-stringify/sync";
import { format } from "date-fns";
import pkg from "date-fns/locale/pt-BR/index.js";
const { ptBR } = pkg;

// Função helper para serializar BigInts em um objeto ou array de objetos
const serializeBigInts = (data) => {
  if (Array.isArray(data)) {
    return data.map((item) => serializeBigInts(item));
  }
  if (data !== null && typeof data === "object") {
    const newData = {};
    for (const key in data) {
      if (typeof data[key] === "bigint") {
        newData[key] = data[key].toString();
      } else if (
        data[key] !== null &&
        typeof data[key] === "object" &&
        !Buffer.isBuffer(data[key])
      ) {
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
  return new Map(categories.map((cat) => [cat.nome, cat.id]));
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
          },
        },
        orderBy: {
          createdAt: "desc",
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
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { clanMemberships: true },
      });
      if (user.clanMemberships?.length) {
        return res
          .status(400)
          .json({
            message:
              "Você já faz parte de uma família. Saia da família atual para criar uma nova.",
          });
      }

      const newClan = await prisma.$transaction(async (tx) => {
        const clan = await tx.clan.create({
          data: {
            name,
            description,
            iconUrl,
            leaderId: userId,
          },
        });

        await tx.clanMember.create({
          data: {
            clanId: clan.id,
            userId: userId,
            role: "LEADER",
          },
        });
        return clan;
      });

      // Serializa o BigInt antes de enviar para o log
      await AuditService.log({
        userId,
        action: "CREATE_CLAN",
        entity: "CLAN",
        entityId: newClan.id,
        details: { after: serializeBigInts(newClan) },
        ipAddress: req.ip,
      });
      res.status(201).json(serializeBigInts(newClan));
    } catch (error) {
      if (error.code === "P2002") {
        return res
          .status(409)
          .json({ message: `Uma família com o nome "${name}" já existe.` });
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
            include: {
              user: {
                select: { id: true, name: true, avatarUrl: true, level: true },
              },
            },
            orderBy: { role: "asc" },
          },
          leader: { select: { id: true, name: true, level: true } },
          _count: { select: { members: true } },
        },
      });
      if (!clan) {
        return res.status(404).json({ message: "Família não encontrada." });
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
      const member = await prisma.clanMember.findFirst({
        where: { userId, clanId },
      });
      if (!member || member.role !== "LEADER") {
        return res
          .status(403)
          .json({ message: "Apenas o líder pode editar a família." });
      }
      const updatedClan = await prisma.clan.update({
        where: { id: clanId },
        data: { name, description, iconUrl },
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
      const member = await prisma.clanMember.findFirst({
        where: { userId, clanId },
      });
      if (!member || member.role !== "LEADER") {
        return res
          .status(403)
          .json({ message: "Apenas o líder pode dissolver a família." });
      }
      await prisma.clan.delete({ where: { id: clanId } });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async contributeToClanBank(req, res, next) {
    const { clanId } = req.params;
    const { amount, fromAccountId } = req.body;
    const userId = req.user.id;

    try {
      await prisma.$transaction(async (tx) => {
        const sourceAccount = await tx.account.findUnique({
            where: { id: fromAccountId },
            include: { transactions: { where: { pago: true } } }
        });

        if (!sourceAccount) {
            throw { statusCode: 404, message: 'Conta de origem não encontrada.' };
        }

        const balance = Number(sourceAccount.saldoInicial) + sourceAccount.transactions.reduce((acc, t) => acc + (t.tipo === 'receita' ? Number(t.valor) : -Number(t.valor)), 0);
        if (balance < amount) {
            throw { statusCode: 400, message: 'Saldo insuficiente na conta de origem.' };
        }

        await tx.transaction.create({
          data: {
            userId: userId,
            accountId: fromAccountId,
            descricao: `Contribuição para Família`,
            valor: amount,
            data: new Date(),
            tipo: "despesa",
            pago: true,
            metodoPagamento: "transferencia",
            categoryId: (await getCategoryMap(tx)).get("Investimentos"),
          },
        });

        await tx.clan.update({
          where: { id: clanId },
          data: {
            balance: { increment: amount },
            xp: { increment: Math.floor(amount / 10) },
          },
        });

        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { name: true },
        });
        await AuditService.log({
          userId,
          action: "CLAN_CONTRIBUTION",
          entity: "CLAN",
          entityId: clanId,
          ipAddress: req.ip,
          details: { amount, memberName: user?.name },
        });
      });

      res.status(200).json({ message: "Contribuição realizada com sucesso." });
    } catch (error) {
        if (error.statusCode) return res.status(error.statusCode).json({ message: error.message });
        next(error);
    }
  }

  async createClanExpense(req, res, next) {
    const { clanId } = req.params;
    const { amount, description, categoryId } = req.body;
    const userId = req.user.id;

    try {
      const member = await prisma.clanMember.findFirst({
        where: { userId, clanId },
        include: { user: { select: { name: true } } },
      });
      if (!member || !["LEADER", "ADMIN"].includes(member.role)) {
        return res
          .status(403)
          .json({
            message: "Apenas líderes ou admins podem registrar despesas.",
          });
      }

      const { auditLog } = await prisma.$transaction(async (tx) => {
        const clan = await tx.clan.findUnique({ where: { id: clanId } });
        if (Number(clan.balance) < amount) {
          throw { statusCode: 400, message: "Saldo da família insuficiente." };
        }

        await tx.clan.update({
          where: { id: clanId },
          data: { balance: { decrement: amount } },
        });

        const auditLog = await AuditService.log({
          userId,
          action: "CLAN_EXPENSE",
          entity: "CLAN",
          entityId: clanId,
          ipAddress: req.ip,
          details: {
            amount,
            expenseDescription: description,
            memberName: member.user.name,
            categoryId,
          },
        });
        return { auditLog };
      });

      res
        .status(200)
        .json({
          message: "Despesa registrada com sucesso.",
          auditLogId: auditLog.id,
        });
    } catch (error) {
      if (error.statusCode)
        return res.status(error.statusCode).json({ message: error.message });
      next(error);
    }
  }

  async reverseClanExpense(req, res, next) {
    const { clanId, auditLogId } = req.params;
    const userId = req.user.id;

    try {
      const member = await prisma.clanMember.findFirst({
        where: { userId, clanId },
      });
      if (!member || !["LEADER", "ADMIN"].includes(member.role)) {
        return res
          .status(403)
          .json({
            message: "Apenas líderes ou admins podem reverter despesas.",
          });
      }

      const logToReverse = await prisma.auditLog.findUnique({
        where: { id: auditLogId },
      });
      if (
        !logToReverse ||
        logToReverse.action !== "CLAN_EXPENSE" ||
        logToReverse.entityId !== clanId
      ) {
        return res
          .status(404)
          .json({ message: "Registro de despesa inválido ou não encontrado." });
      }
      if (logToReverse.details?.reversed) {
        return res
          .status(400)
          .json({ message: "Esta despesa já foi revertida." });
      }

      const { amount, expenseDescription } = logToReverse.details;

      await prisma.$transaction(async (tx) => {
        await tx.clan.update({
          where: { id: clanId },
          data: { balance: { increment: amount } },
        });

        await tx.auditLog.update({
          where: { id: auditLogId },
          data: {
            details: {
              ...logToReverse.details,
              reversed: true,
              reversedBy: userId,
            },
          },
        });
        await AuditService.log({
          userId,
          action: "REVERSE_CLAN_EXPENSE",
          entity: "CLAN",
          entityId: clanId,
          ipAddress: req.ip,
          details: {
            amount,
            reversedLogId: auditLogId,
            reversedDescription: expenseDescription,
          },
        });
      });

      res.status(200).json({ message: "Despesa revertida com sucesso." });
    } catch (error) {
      next(error);
    }
  }

  async splitExpense(req, res, next) {
    const { clanId } = req.params;
    const { totalAmount, description, categoryId, splitMethod } = req.body;
    const userId = req.user.id;

    try {
      const member = await prisma.clanMember.findFirst({
        where: { userId, clanId },
      });
      if (!member || !["LEADER", "ADMIN"].includes(member.role)) {
        return res
          .status(403)
          .json({
            message:
              "Apenas líderes ou admins podem registrar despesas rateadas.",
          });
      }

      await prisma.$transaction(async (tx) => {
        const clan = await tx.clan.findUnique({
          where: { id: clanId },
          include: { members: true },
        });
        if (Number(clan.balance) < totalAmount) {
          throw {
            statusCode: 400,
            message: "Saldo da família insuficiente para esta despesa.",
          };
        }

        await tx.clan.update({
          where: { id: clanId },
          data: { balance: { decrement: totalAmount } },
        });

        const sharedExpense = await tx.sharedExpense.create({
          data: {
            clanId,
            creatorId: userId,
            description,
            totalAmount,
            splitMethod,
            categoryId,
          },
        });

        const membersCount = clan.members.length;
        if (membersCount === 0)
          throw {
            statusCode: 400,
            message: "Não há membros na família para ratear.",
          };

        const amountPerMember = totalAmount / membersCount;

        for (const member of clan.members) {
          const personalTransaction = await tx.transaction.create({
            data: {
              userId: member.userId,
              descricao: `Rateio: ${description}`,
              valor: amountPerMember,
              data: new Date(),
              tipo: "despesa",
              pago: true,
              metodoPagamento: "dinheiro",
              categoryId: categoryId,
            },
          });

          await tx.sharedExpenseParticipant.create({
            data: {
              sharedExpenseId: sharedExpense.id,
              userId: member.userId,
              amountOwed: amountPerMember,
              createdTransactionId: personalTransaction.id,
            },
          });
        }
      });

      res
        .status(201)
        .json({ message: "Despesa rateada e registrada com sucesso!" });
    } catch (error) {
      if (error.statusCode)
        return res.status(error.statusCode).json({ message: error.message });
      next(error);
    }
  }

  async getClanGoals(req, res, next) {
    const { clanId } = req.params;
    try {
      const goals = await prisma.goal.findMany({
        where: { clanId },
        orderBy: { deadline: "asc" },
      });
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
        },
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
        const goal = await tx.goal.findUnique({ where: { id: goalId } });
        if (!goal) throw { statusCode: 404, message: "Meta não encontrada." };
        if (
          goal.status === "COMPLETED" ||
          Number(goal.currentAmount) >= Number(goal.targetAmount)
        ) {
          throw {
            statusCode: 400,
            message:
              "Esta meta já foi alcançada. Não é possível fazer novas contribuições.",
          };
        }

        await tx.transaction.create({
          data: {
            userId,
            accountId: fromAccountId,
            descricao: `Contribuição para meta da Família`,
            valor: amount,
            data: new Date(),
            tipo: "despesa",
            pago: true,
            metodoPagamento: "transferencia",
            categoryId: (await getCategoryMap(tx)).get("Investimentos"),
          },
        });

        const updatedGoal = await tx.goal.update({
          where: { id: goalId },
          data: { currentAmount: { increment: amount } },
        });

        await tx.clan.update({
          where: { id: updatedGoal.clanId },
          data: { xp: { increment: Math.floor(amount / 5) } },
        });

        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { name: true },
        });
        await AuditService.log({
          userId,
          action: "CLAN_GOAL_CONTRIBUTION",
          entity: "GOAL",
          entityId: goalId,
          ipAddress: req.ip,
          details: {
            amount,
            memberName: user?.name,
            goalName: updatedGoal.name,
          },
        });
      });

      res
        .status(200)
        .json({ message: "Contribuição para meta realizada com sucesso." });
    } catch (error) {
      if (error.statusCode)
        return res.status(error.statusCode).json({ message: error.message });
      next(error);
    }
  }

  async getClanActivity(req, res, next) {
    const { clanId } = req.params;
    try {
      const logs = await prisma.auditLog.findMany({
        where: {
          entity: "CLAN",
          entityId: clanId,
          action: {
            in: ["CLAN_CONTRIBUTION", "CLAN_EXPENSE", "REVERSE_CLAN_EXPENSE"],
          },
        },
        orderBy: { createdAt: "desc" },
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
          participants: { include: { user: { select: { name: true } } } },
          category: true,
        },
        orderBy: { createdAt: "desc" },
      });
      res.json(expenses);
    } catch (error) {
      next(error);
    }
  }

  async inviteMember(req, res, next) {
    const { clanId } = req.params;
    const { invitedUserId } = req.body;
    const inviterId = req.user.id;

    try {
      const inviter = await prisma.clanMember.findFirst({
        where: { userId: inviterId, clanId },
      });
      if (!inviter || !["LEADER", "ADMIN"].includes(inviter.role)) {
        return res
          .status(403)
          .json({
            message: "Você não tem permissão para convidar para esta família.",
          });
      }

      const invitedUser = await prisma.user.findUnique({
        where: { id: invitedUserId },
        include: { clanMemberships: true },
      });
      if (!invitedUser)
        return res
          .status(404)
          .json({ message: "O jogador convidado não foi encontrado." });
      if (invitedUser.clanMemberships?.length)
        return res
          .status(400)
          .json({ message: "Este jogador já faz parte de uma família." });

      const newInvite = await prisma.clanInvite.create({
        data: {
          clanId,
          invitedUserId,
          inviterId,
          expiresAt: addDays(new Date(), 7),
        },
      });
      res.status(201).json(newInvite);
    } catch (error) {
      if (error.code === "P2002")
        return res
          .status(409)
          .json({ message: "Um convite para este jogador já está pendente." });
      next(error);
    }
  }

  async getPendingInvites(req, res, next) {
    try {
      const invites = await prisma.clanInvite.findMany({
        where: {
          invitedUserId: req.user.id,
          status: "PENDING",
          expiresAt: { gte: new Date() },
        },
        include: { clan: true },
        orderBy: { createdAt: "desc" },
      });
      res.json(invites);
    } catch (error) {
      next(error);
    }
  }

  async acceptInvite(req, res, next) {
    const { inviteId } = req.params;
    const userId = req.user.id;
    try {
      await prisma.$transaction(async (tx) => {
        const invite = await tx.clanInvite.findFirst({
          where: { id: inviteId, invitedUserId: userId, status: "PENDING" },
          include: {
            clan: { include: { _count: { select: { members: true } } } },
          },
        });
        if (!invite) {
          throw { statusCode: 404, message: "Convite inválido ou expirado." };
        }

        if (invite.clan._count.members >= invite.clan.maxMembers) {
          throw { statusCode: 400, message: "A família está cheia." };
        }

        await tx.clanMember.create({
          data: { userId, clanId: invite.clanId, role: "MEMBER" },
        });
        await tx.clanInvite.update({
          where: { id: inviteId },
          data: { status: "ACCEPTED" },
        });
      });
      res.status(200).json({ message: "Você entrou na família!" });
    } catch (error) {
      if (error.statusCode)
        return res.status(error.statusCode).json({ message: error.message });
      next(error);
    }
  }

  async declineInvite(req, res, next) {
    const { inviteId } = req.params;
    const userId = req.user.id;
    try {
      const result = await prisma.clanInvite.updateMany({
        where: { id: inviteId, invitedUserId: userId, status: "PENDING" },
        data: { status: "DECLINED" },
      });
      if (result.count === 0) {
        return res
          .status(404)
          .json({ message: "Convite inválido ou expirado." });
      }
      res.status(200).json({ message: "Convite recusado." });
    } catch (error) {
      next(error);
    }
  }

  async leaveClan(req, res, next) {
    const { clanId } = req.params;
    const userId = req.user.id;
    try {
      const member = await prisma.clanMember.findUnique({
        where: { userId_clanId: { userId, clanId } },
      });
      if (!member)
        return res
          .status(404)
          .json({ message: "Você não é membro desta família." });
      if (member.role === "LEADER") {
        return res
          .status(400)
          .json({
            message:
              "O líder não pode sair da família. Transfira a liderança primeiro.",
          });
      }
      await prisma.clanMember.delete({
        where: { userId_clanId: { userId, clanId } },
      });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async removeMember(req, res, next) {
    const { clanId, userId: memberId } = req.params;
    const leaderId = req.user.id;
    try {
      const leader = await prisma.clanMember.findFirst({
        where: { clanId, userId: leaderId },
      });
      if (!leader || leader.role !== "LEADER") {
        return res
          .status(403)
          .json({ message: "Apenas o líder pode remover membros." });
      }
      if (leaderId === memberId) {
        return res
          .status(400)
          .json({ message: "O líder não pode remover a si mesmo." });
      }
      await prisma.clanMember.delete({
        where: { userId_clanId: { userId: memberId, clanId } },
      });
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
      const leader = await prisma.clanMember.findFirst({
        where: { clanId, userId: leaderId },
      });
      if (!leader || leader.role !== "LEADER") {
        return res
          .status(403)
          .json({ message: "Apenas o líder pode alterar papéis." });
      }
      if (leaderId === memberId) {
        return res
          .status(400)
          .json({ message: "O líder não pode alterar seu próprio papel." });
      }
      const updatedMember = await prisma.clanMember.update({
        where: { userId_clanId: { userId: memberId, clanId } },
        data: { role },
      });
      res.json(updatedMember);
    } catch (error) {
      next(error);
    }
  }

  async transferLeadership(req, res, next) {
    const { clanId } = req.params;
    const { newLeaderId } = req.body;
    const currentLeaderId = req.user.id;

    if (currentLeaderId === newLeaderId) {
      return res.status(400).json({ message: "Você já é o líder." });
    }

    try {
      await prisma.$transaction(async (tx) => {
        const currentLeader = await tx.clanMember.findUnique({
          where: { userId_clanId: { userId: currentLeaderId, clanId } },
        });
        if (!currentLeader || currentLeader.role !== "LEADER") {
          throw {
            statusCode: 403,
            message: "Apenas o líder pode transferir a liderança.",
          };
        }

        const newLeader = await tx.clanMember.findUnique({
          where: { userId_clanId: { userId: newLeaderId, clanId } },
        });
        if (!newLeader) {
          throw {
            statusCode: 404,
            message:
              "O membro selecionado para ser o novo líder não foi encontrado.",
          };
        }

        await tx.clanMember.update({
          where: { userId_clanId: { userId: currentLeaderId, clanId } },
          data: { role: "ADMIN" },
        });

        await tx.clanMember.update({
          where: { userId_clanId: { userId: newLeaderId, clanId } },
          data: { role: "LEADER" },
        });

        await tx.clan.update({
          where: { id: clanId },
          data: { leaderId: newLeaderId },
        });
      });

      res.status(200).json({ message: "Liderança transferida com sucesso!" });
    } catch (error) {
      if (error.statusCode)
        return res.status(error.statusCode).json({ message: error.message });
      next(error);
    }
  }

  async exportClanReport(req, res, next) {
    const { clanId } = req.params;
    const userId = req.user.id;
    try {
      const member = await prisma.clanMember.findFirst({
        where: { userId, clanId },
      });
      if (!member || !["LEADER", "ADMIN"].includes(member.role)) {
        return res
          .status(403)
          .json({
            message: "Apenas líderes ou admins podem exportar relatórios.",
          });
      }

      const logs = await prisma.auditLog.findMany({
        where: {
          entity: "CLAN",
          entityId: clanId,
          action: {
            in: ["CLAN_CONTRIBUTION", "CLAN_EXPENSE", "REVERSE_CLAN_EXPENSE"],
          },
        },
        orderBy: { createdAt: "asc" },
      });

      const dataToExport = logs.map((log) => {
        const details = log.details;
        let valor;
        let tipo;

        switch (log.action) {
          case "CLAN_CONTRIBUTION":
            valor = details.amount;
            tipo = "Contribuição";
            break;
          case "CLAN_EXPENSE":
            valor = -details.amount;
            tipo = "Despesa";
            break;
          case "REVERSE_CLAN_EXPENSE":
            valor = details.amount;
            tipo = "Reversão de Despesa";
            break;
          default:
            valor = 0;
            tipo = "Desconhecido";
        }

        return {
          Data: format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss", {
            locale: ptBR,
          }),
          Tipo: tipo,
          Valor: valor.toFixed(2),
          Membro: details.memberName || log.userId,
          Descricao:
            details.expenseDescription ||
            `Contribuição de ${details.memberName}`,
        };
      });

      const csv = stringifyCsv(dataToExport, { header: true });
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=extrato_familia_${clanId}.csv`
      );
      res.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  }

  async updatePolicies(req, res, next) {
    res.status(501).json({ message: "Funcionalidade ainda não implementada." });
  }
}

export default new ClanController();

    
