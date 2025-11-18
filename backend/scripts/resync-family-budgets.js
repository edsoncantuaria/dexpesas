// backend/scripts/resync-family-budgets.js
import process from 'node:process';
import prisma from '../src/config/prismaClient.js';
import CellBudgetSyncService from '../src/services/cellBudgetSyncService.js';

async function main() {
  const cellId = process.argv[2];
  if (!cellId) {
    console.error('❌ Informe o ID da família. Uso: node scripts/resync-family-budgets.js <cellId>');
    process.exit(1);
  }

  const cell = await prisma.clan.findUnique({
    where: { id: cellId },
    select: { id: true, name: true },
  });

  if (!cell) {
    console.error(`❌ Família ${cellId} não encontrada.`);
    process.exit(1);
  }

  console.log(`🔁 Iniciando resync dos budgets da família ${cell.name} (${cell.id})...`);
  await CellBudgetSyncService.resyncCellBudgets(cellId);
  console.log('✅ Resync concluído com sucesso.');
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error('❌ Falha ao ressincronizar:', error);
  await prisma.$disconnect();
  process.exit(1);
});
