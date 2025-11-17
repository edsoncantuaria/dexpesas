// backend/scripts/reset-categories.js
import { resetCategoriesData } from '../src/services/categoryMaintenanceService.js';

async function main() {
  console.log('🧹 Iniciando rotina de padronização de categorias...');
  try {
    const summary = await resetCategoriesData();
    console.log('✅ Categorias atualizadas com sucesso:');
    console.table(summary);
    process.exit(0);
  } catch (error) {
    console.error('❌ Falha ao padronizar categorias:', error);
    process.exit(1);
  }
}

main();
