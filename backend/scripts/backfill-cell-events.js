// backend/scripts/backfill-cell-events.js
// Popula a tabela cell_events utilizando os registros existentes em audit_logs.
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CELL_RELEVANT_ENTITIES = new Set([
  'CLAN',
  'CLAN_MEMBER',
  'CLAN_GOAL',
  'CLAN_INVITE',
  'SHARED_EXPENSE',
]);

const ACTION_TYPE_MAP = {
  CLAN: {
    CREATE_CLAN: { type: 'CELL_CREATED', title: 'Família criada' },
    UPDATE_CLAN: { type: 'CELL_UPDATED', title: 'Configurações atualizadas' },
    DELETE_CLAN: { type: 'CELL_DELETED', title: 'Família removida' },
    default: { type: 'CELL_EVENT', title: 'Atualização da família' },
  },
  CLAN_MEMBER: {
    ADD_MEMBER: { type: 'MEMBER_JOINED', title: 'Novo membro adicionado' },
    REMOVE_MEMBER: { type: 'MEMBER_REMOVED', title: 'Membro removido' },
    default: { type: 'MEMBER_EVENT', title: 'Atualização de membro' },
  },
  CLAN_GOAL: {
    CREATE_GOAL: { type: 'GOAL_CREATED', title: 'Nova meta criada' },
    UPDATE_GOAL: { type: 'GOAL_UPDATED', title: 'Meta atualizada' },
    COMPLETE_GOAL: { type: 'GOAL_COMPLETED', title: 'Meta concluída' },
    default: { type: 'GOAL_EVENT', title: 'Evento de meta' },
  },
  CLAN_INVITE: {
    CREATE_INVITE: { type: 'INVITE_SENT', title: 'Convite enviado' },
    ACCEPT_INVITE: { type: 'INVITE_ACCEPTED', title: 'Convite aceito' },
    default: { type: 'INVITE_EVENT', title: 'Evento de convite' },
  },
  SHARED_EXPENSE: {
    CREATE_SHARED_EXPENSE: { type: 'EXPENSE_SHARED', title: 'Despesa compartilhada' },
    default: { type: 'EXPENSE_EVENT', title: 'Evento de despesa compartilhada' },
  },
};

const sharedExpenseCache = new Map();
const goalCache = new Map();
const inviteCache = new Map();

function extractClanIdFromDetails(details) {
  if (!details || typeof details !== 'object') return null;
  const candidates = [];
  const appendCandidate = value => {
    if (value && typeof value === 'string') {
      candidates.push(value);
    }
  };

  const maybeObjects = [details, details.after, details.before, details.target];
  maybeObjects.forEach(obj => {
    if (obj && typeof obj === 'object') {
      appendCandidate(obj.clanId);
      appendCandidate(obj.cellId);
    }
  });

  return candidates.find(Boolean) || null;
}

async function resolveClanIdFromSharedExpense(expenseId) {
  if (!expenseId) return null;
  if (sharedExpenseCache.has(expenseId)) {
    return sharedExpenseCache.get(expenseId);
  }
  const expense = await prisma.sharedExpense.findUnique({
    where: { id: expenseId },
    select: { clanId: true },
  });
  const clanId = expense?.clanId ?? null;
  sharedExpenseCache.set(expenseId, clanId);
  return clanId;
}

async function resolveClanIdFromGoal(goalId) {
  if (!goalId) return null;
  if (goalCache.has(goalId)) {
    return goalCache.get(goalId);
  }
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    select: { clanId: true },
  });
  const clanId = goal?.clanId ?? null;
  goalCache.set(goalId, clanId);
  return clanId;
}

async function resolveClanIdFromInvite(inviteId) {
  if (!inviteId) return null;
  if (inviteCache.has(inviteId)) {
    return inviteCache.get(inviteId);
  }
  const invite = await prisma.clanInvite.findUnique({
    where: { id: inviteId },
    select: { clanId: true },
  });
  const clanId = invite?.clanId ?? null;
  inviteCache.set(inviteId, clanId);
  return clanId;
}

async function resolveCellId(log) {
  if (log.entity === 'CLAN') {
    return log.entityId;
  }

  const detailClan = extractClanIdFromDetails(log.details);
  if (detailClan) {
    return detailClan;
  }

  switch (log.entity) {
    case 'SHARED_EXPENSE':
      return resolveClanIdFromSharedExpense(log.entityId);
    case 'CLAN_GOAL':
      return resolveClanIdFromGoal(log.entityId);
    case 'CLAN_INVITE':
      return resolveClanIdFromInvite(log.entityId);
    default:
      return null;
  }
}

function mapEventMetadata(log) {
  const entityMap = ACTION_TYPE_MAP[log.entity] || {};
  return (
    entityMap[log.action] || entityMap.default || {
      type: 'CELL_EVENT',
      title: 'Evento familiar',
    }
  );
}

function buildDescription(log) {
  if (log.details && typeof log.details === 'object' && typeof log.details.message === 'string') {
    return log.details.message;
  }
  return `${log.action} registrado para ${log.entity.toLowerCase()}`;
}

function buildPayload(log) {
  if (!log.details || typeof log.details !== 'object') {
    return { action: log.action, entity: log.entity };
  }
  return {
    action: log.action,
    entity: log.entity,
    ...log.details,
  };
}

async function flushEvents(buffer) {
  if (!buffer.length) return 0;
  const data = buffer.splice(0, buffer.length);
  const result = await prisma.cellEvent.createMany({ data, skipDuplicates: true });
  return result.count ?? data.length;
}

async function main() {
  const logs = await prisma.auditLog.findMany({
    where: { entity: { in: Array.from(CELL_RELEVANT_ENTITIES) } },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`➡️  Encontrados ${logs.length} audit logs candidatos.`);

  const buffer = [];
  let created = 0;
  for (const log of logs) {
    const cellId = await resolveCellId(log);
    if (!cellId) {
      continue;
    }

    const meta = mapEventMetadata(log);
    buffer.push({
      cellId,
      actorId: log.userId,
      type: meta.type,
      title: meta.title,
      description: meta.description || buildDescription(log),
      payload: buildPayload(log),
      entityId: log.entityId,
      entityType: log.entity,
      visibility: 'CELL',
      sourceAuditLogId: log.id,
      createdAt: log.createdAt,
    });

    if (buffer.length >= 250) {
      created += await flushEvents(buffer);
    }
  }

  created += await flushEvents(buffer);
  console.log(`✅ Eventos gerados/inseridos: ${created}`);
}

main()
  .catch(error => {
    console.error('❌ Erro ao popular cell_events:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
