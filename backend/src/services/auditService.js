
// backend/src/services/auditService.js
import { auditQueue } from '../queues/auditQueue.js';

class AuditService {
    /**
     * Adiciona um evento à fila de log de auditoria para processamento assíncrono.
     * @param {object} logData - Os dados do log a serem registrados.
     * @param {string} logData.userId - ID do usuário que realizou a ação.
     * @param {string} logData.action - A ação realizada (ex: CREATE_TRANSACTION).
     * @param {string} logData.entity - A entidade afetada (ex: TRANSACTION).
     * @param {string} logData.entityId - O ID da entidade afetada.
     * @param {object} [logData.details] - Detalhes da mudança (ex: { before: {}, after: {} }).
     * @param {string} [logData.status='SUCCESS'] - O status da operação.
     * @param {string} [logData.origin='WEB_APP'] - A origem da requisição.
     * @param {string} [logData.ipAddress] - O endereço IP do requisitante.
     */
    static async log(logData) {
        try {
            await auditQueue.add(logData.action, logData);
        } catch (error) {
            console.error("❌ Erro ao adicionar job na fila de auditoria:", error);
            // Em um sistema de produção, aqui poderia haver um fallback para um logger de arquivo, por exemplo.
        }
    }
}

export default AuditService;
    
    