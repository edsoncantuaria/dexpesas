// backend/src/services/decisionService.js
import { PrismaClient } from '@prisma/client';
import { addHours } from 'date-fns';
import crypto from 'crypto';

const prisma = new PrismaClient();

class DecisionService {
  static buildDecisionPayload(input) {
    return {
      decisionId: input.decisionId || crypto.randomUUID(),
      title: input.title,
      description: input.description || '',
      options: input.options || ['YES', 'NO'],
      threshold: input.threshold || { type: 'MAJORITY' },
      expiresAt: input.expiresAt || addHours(new Date(), 24).toISOString(),
      status: 'OPEN',
      votes: [],
    };
  }

  static async createDecision(cellId, actorId, payload) {
    const decision = this.buildDecisionPayload(payload);
    const event = await prisma.cellEvent.create({
      data: {
        cellId,
        actorId,
        type: 'CELL_DECISION_CREATED',
        title: decision.title,
        description: decision.description,
        entityId: decision.decisionId,
        entityType: 'CELL_DECISION',
        payload: decision,
      },
    });
    return event;
  }

  static async vote(cellId, decisionId, actorId, voteValue) {
    const event = await prisma.cellEvent.findFirst({
      where: {
        cellId,
        entityType: 'CELL_DECISION',
        entityId: decisionId,
      },
    });
    if (!event) {
      throw new Error('Decisão não encontrada.');
    }
    const payload = event.payload || {};
    const updatedVotes = Array.isArray(payload.votes) ? [...payload.votes] : [];
    const existingIndex = updatedVotes.findIndex(
      (vote) => vote.actorId === actorId,
    );
    const voteEntry = {
      actorId,
      value: voteValue,
      votedAt: new Date().toISOString(),
    };
    if (existingIndex >= 0) {
      updatedVotes[existingIndex] = voteEntry;
    } else {
      updatedVotes.push(voteEntry);
    }
    payload.votes = updatedVotes;
    const updated = await prisma.cellEvent.update({
      where: { id: event.id },
      data: { payload },
    });
    return updated;
  }

  static async listDecisions(cellId) {
    return prisma.cellEvent.findMany({
      where: {
        cellId,
        entityType: 'CELL_DECISION',
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export default DecisionService;
