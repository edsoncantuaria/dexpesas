// backend/src/services/cacheService.js
import { redisClient } from '../config/redis.js';

class CacheService {
  /**
   * Busca um valor do cache pela chave.
   * @param {string} key - A chave a ser buscada.
   * @returns {Promise<any | null>} O valor parseado ou null se não encontrado.
   */
  static async get(key) {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`❌ Erro ao buscar do cache (key: ${key}):`, error);
      return null;
    }
  }

  /**
   * Salva um valor no cache.
   * @param {string} key - A chave para salvar.
   * @param {any} value - O valor a ser salvo (será convertido para JSON).
   * @param {number} ttlInSeconds - O tempo de vida do cache em segundos.
   * @returns {Promise<void>}
   */
  static async set(key, value, ttlInSeconds) {
    try {
      const stringValue = JSON.stringify(value);
      await redisClient.set(key, stringValue, 'EX', ttlInSeconds);
    } catch (error) {
      console.error(`❌ Erro ao salvar no cache (key: ${key}):`, error);
    }
  }

  /**
   * Deleta uma chave do cache.
   * @param {string} key - A chave a ser deletada.
   * @returns {Promise<void>}
   */
  static async del(key) {
    try {
      await redisClient.del(key);
    } catch (error) {
      console.error(`❌ Erro ao deletar do cache (key: ${key}):`, error);
    }
  }
}

export default CacheService;
