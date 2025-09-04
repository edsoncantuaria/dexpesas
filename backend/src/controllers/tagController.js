
// backend/src/controllers/tagController.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

class TagController {
    /**
     * Busca todas as tags do usuário logado, incluindo a contagem de
     * quantas vezes cada tag foi usada em transações.
     */
    async getTags(req, res, next) {
        try {
            const tags = await prisma.tag.findMany({
                where: { userId: req.user.id },
                include: {
                    _count: {
                        select: { transactions: true },
                    },
                },
                orderBy: {
                    name: 'asc',
                },
            });
            res.json(tags);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cria uma nova tag para o usuário logado.
     * Impede a criação de tags duplicadas (com o mesmo nome) para o mesmo usuário.
     */
    async createTag(req, res, next) {
        const { name } = req.body;
        const userId = req.user.id;

        const trimmedName = name ? name.trim() : '';

        if (!trimmedName) {
            return res.status(400).json({ message: 'O nome da tag não pode ser vazio.' });
        }
        
        if (trimmedName.length < 3) {
            return res.status(400).json({ message: 'A tag deve ter pelo menos 3 caracteres.' });
        }


        try {
            // Correção: `mode: 'insensitive'` não é suportado pelo driver do MySQL no Prisma.
            // A verificação de duplicidade case-insensitive será feita no código.
            const userTags = await prisma.tag.findMany({
                where: { userId },
                select: { name: true }
            });

            const existingTag = userTags.find(
                (tag) => tag.name.toLowerCase() === trimmedName.toLowerCase()
            );

            if (existingTag) {
                return res.status(409).json({ message: 'Esta tag já existe.', tag: existingTag });
            }

            const newTag = await prisma.tag.create({
                data: {
                    name: trimmedName,
                    userId,
                },
            });
            res.status(201).json(newTag);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Deleta uma tag específica do usuário logado.
     */
    async deleteTag(req, res, next) {
        const { id } = req.params;
        const userId = req.user.id;

        try {
            // A cláusula `where` garante que o usuário só pode deletar suas próprias tags.
            await prisma.tag.delete({
                where: {
                    id: id,
                    userId: userId,
                },
            });
            res.status(204).send();
        } catch (error) {
            // Se o Prisma não encontrar o registro para deletar (P2025),
            // ele joga um erro. Isso é bom, pois significa que a tag não existe ou não pertence ao usuário.
            // O errorHandler geral captura isso e pode retornar um 404, por exemplo.
            next(error);
        }
    }
}

export default new TagController();
