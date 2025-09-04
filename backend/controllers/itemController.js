// backend/src/controllers/itemController.js
import prisma from '../config/prismaClient.js';
import AuditService from '../services/auditService.js';

class ItemController {
    /**
     * Lista todos os itens cadastrados no sistema. Rota pública.
     */
    async getAllItems(req, res, next) {
        try {
            const items = await prisma.item.findMany({
                orderBy: { name: 'asc' }
            });
            res.json(items);
        } catch (error) {
            next(error);
        }
    }

    /**
     * [ADMIN] Cria um novo item.
     */
    async createItem(req, res, next) {
        const { key, name, type, bonusJson, rarity } = req.body;
        try {
            const newItem = await prisma.item.create({
                data: { key, name, type, bonusJson, rarity }
            });
            await AuditService.log({ userId: req.user.id, action: 'ADMIN_CREATE_ITEM', entity: 'ITEM', entityId: newItem.id, details: { after: newItem }, ipAddress: req.ip });
            res.status(201).json(newItem);
        } catch (error) {
            if (error.code === 'P2002') {
                return res.status(409).json({ message: 'Já existe um item com esta chave (key).' });
            }
            next(error);
        }
    }

    /**
     * [ADMIN] Atualiza um item existente.
     */
    async updateItem(req, res, next) {
        const { id } = req.params;
        const { key, name, type, bonusJson, rarity } = req.body;
        try {
            const originalItem = await prisma.item.findUnique({ where: { id } });
            if (!originalItem) {
                return res.status(404).json({ message: 'Item não encontrado.' });
            }
            const updatedItem = await prisma.item.update({
                where: { id },
                data: { key, name, type, bonusJson, rarity }
            });
            await AuditService.log({ userId: req.user.id, action: 'ADMIN_UPDATE_ITEM', entity: 'ITEM', entityId: id, details: { before: originalItem, after: updatedItem }, ipAddress: req.ip });
            res.json(updatedItem);
        } catch (error) {
             if (error.code === 'P2002') {
                return res.status(409).json({ message: 'Já existe um item com esta chave (key).' });
            }
            next(error);
        }
    }

    /**
     * [ADMIN] Deleta um item.
     */
    async deleteItem(req, res, next) {
        const { id } = req.params;
        try {
            const originalItem = await prisma.item.findUnique({ where: { id } });
            if (!originalItem) {
                return res.status(404).json({ message: 'Item não encontrado.' });
            }

            const userItemsCount = await prisma.userItem.count({ where: { itemId: id } });
            if (userItemsCount > 0) {
                return res.status(400).json({ message: `Não é possível deletar. ${userItemsCount} jogadores possuem este item.` });
            }

            await prisma.item.delete({ where: { id } });
            await AuditService.log({ userId: req.user.id, action: 'ADMIN_DELETE_ITEM', entity: 'ITEM', entityId: id, details: { before: originalItem }, ipAddress: req.ip });
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}

export default new ItemController();
