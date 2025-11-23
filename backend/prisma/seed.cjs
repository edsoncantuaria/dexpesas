// backend/prisma/seed.cjs
const { PrismaClient } = require('@prisma/client');
const { defaultCategories } = require('../src/config/seedData.cjs');
const { defaultSubcategories } = require('../src/config/defaultSubcategories.cjs');

const prisma = new PrismaClient();

async function main() {
  console.log(`Iniciando o seeding do banco de dados...`);

  // Remove categorias globais anteriores (userId null) para evitar duplicidades.
  // CUIDADO: Isso deleta subcategorias por cascade se configurado, ou falha se não.
  // Vamos assumir que queremos limpar tudo global para recriar.
  try {
    await prisma.category.deleteMany({
      where: { userId: null },
    });
  } catch (e) {
    console.log('Nota: Erro ao limpar categorias antigas (pode ser constraints), continuando...', e.message);
  }

  // 1. Cria as categorias pai
  console.log('Criando categorias pai...');
  for (const category of defaultCategories) {
    await prisma.category.upsert({
      where: { id: category.id },
      update: category,
      create: category,
    });
  }

  // 2. Cria as subcategorias
  console.log('Criando subcategorias...');
  for (const [parentId, subcats] of Object.entries(defaultSubcategories)) {
    for (const sub of subcats) {
      // Gera um ID determinístico para a subcategoria para permitir upsert/idempotência
      const subId = `${parentId}_${sub.nome.toLowerCase()}`;

      await prisma.category.upsert({
        where: { id: subId },
        update: {
          ...sub,
          parentCategoryId: parentId,
          type: defaultCategories.find(c => c.id === parentId)?.type || 'despesa',
          userId: null // Global
        },
        create: {
          id: subId,
          ...sub,
          parentCategoryId: parentId,
          type: defaultCategories.find(c => c.id === parentId)?.type || 'despesa',
          userId: null // Global
        }
      });
    }
  }

  console.log(`${defaultCategories.length} categorias pai processadas.`);
  console.log(`Subcategorias padrão foram garantidas no banco.`);
  console.log(`✅ Seeding concluído.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
