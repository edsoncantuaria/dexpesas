// backend/src/services/timelineService.js
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

class TimelineService {
  static async appendEvent({
    cellId,
    actorId = null,
    type,
    title,
    description,
    payload = null,
    entityId = null,
    entityType = null,
    visibility = 'CELL',
  }) {
    return prisma.cellEvent.create({
      data: {
        cellId,
        actorId,
        type,
        title,
        description,
        payload,
        entityId,
        entityType,
        visibility,
      },
    });
  }

  static async listEvents(cellId, { limit = 50, cursor = null, types = [] } = {}) {
    return prisma.cellEvent.findMany({
      where: {
        cellId,
        ...(types.length ? { type: { in: types } } : {}),
        ...(cursor
          ? { createdAt: { lt: cursor } }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  static async attachActionReference(eventId, reference) {
    return prisma.cellEvent.update({
      where: { id: eventId },
      data: {
        payload: {
          ...(reference || {}),
        },
      },
    });
  }
}

export default TimelineService;
