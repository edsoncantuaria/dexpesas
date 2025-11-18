// backend/prisma/seed.cjs
const { PrismaClient } = require('@prisma/client');
const { defaultCategories } = require('../src/config/seedData.cjs'); // Altera para usar a fonte de dados central

const prisma = new PrismaClient();

async function main() {
  console.log(`Iniciando o seeding do banco de dados...`);

  // Remove categorias globais anteriores (userId null) para evitar duplicidades.
  await prisma.category.deleteMany({
    where: { userId: null },
  });

  // Cria as categorias padrão.
  // Usar createMany com skipDuplicates reforça a idempotência caso existam registros remanescentes.
  await prisma.category.createMany({
    data: defaultCategories,
    skipDuplicates: true,
  });

  console.log(`${defaultCategories.length} categorias padrão foram garantidas no banco.`);
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
