// backend/src/config/prismaClient.js
import { PrismaClient } from '@prisma/client';

/**
 * Cria e exporta uma instância singleton do PrismaClient.
 * Isso garante que toda a aplicação use o mesmo pool de conexões com o banco de dados,
 * evitando o esgotamento de conexões sob alta carga.
 */
const prisma = new PrismaClient();

export default prisma;
