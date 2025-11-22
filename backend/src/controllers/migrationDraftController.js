// backend/src/controllers/migrationDraftController.js
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

class MigrationDraftController {
    /**
     * GET /api/migration/draft
     * Busca o draft salvo da migração
     */
    async getDraft(req, res, next) {
        try {
            const userId = req.user.id;

            const draft = await prisma.migrationDraft.findUnique({
                where: { userId },
            });

            if (!draft) {
                return res.json({ draft: null });
            }

            res.json({
                draft: {
                    currentStep: draft.currentStep,
                    accounts: draft.accounts || [],
                    cards: draft.cards || [],
                    cardHistory: draft.cardHistory || {},
                },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/migration/draft
     * Salva ou atualiza o draft da migração
     */
    async saveDraft(req, res, next) {
        try {
            const userId = req.user.id;
            const { currentStep, accounts, cards, cardHistory } = req.body;

            const draft = await prisma.migrationDraft.upsert({
                where: { userId },
                update: {
                    currentStep,
                    accounts: accounts || [],
                    cards: cards || [],
                    cardHistory: cardHistory || {},
                },
                create: {
                    userId,
                    currentStep,
                    accounts: accounts || [],
                    cards: cards || [],
                    cardHistory: cardHistory || {},
                },
            });

            res.json({
                message: 'Draft salvo com sucesso.',
                draft,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/migration/draft
     * Remove o draft da migração (ao completar ou cancelar)
     */
    async deleteDraft(req, res, next) {
        try {
            const userId = req.user.id;

            await prisma.migrationDraft.deleteMany({
                where: { userId },
            });

            res.json({
                message: 'Draft removido com sucesso.',
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new MigrationDraftController();
