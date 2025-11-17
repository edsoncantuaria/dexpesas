// backend/src/services/categoryMaintenanceService.js
import prisma from '../config/prismaClient.js';
import { defaultCategories } from '../config/seedData.js';

const allowedCategoryNames = new Set(defaultCategories.map((cat) => cat.nome));

async function reassignCategoryReferences(tx, fromCategoryId, toCategoryId) {
  const [transactionResult, budgetResult, ruleResult] = await Promise.all([
    tx.transaction.updateMany({
      where: { categoryId: fromCategoryId },
      data: { categoryId: toCategoryId },
    }),
    tx.budget.updateMany({
      where: { categoryId: fromCategoryId },
      data: { categoryId: toCategoryId },
    }),
    tx.categorizationRule.updateMany({
      where: { categoryId: fromCategoryId },
      data: { categoryId: toCategoryId },
    }),
  ]);

  return (
    transactionResult.count + budgetResult.count + ruleResult.count
  );
}

export async function resetCategoriesData(prismaClient = prisma) {
  const summary = await prismaClient.$transaction(async (tx) => {
    const operations = {
      updated: 0,
      created: 0,
      deleted: 0,
      reassigned: 0,
      duplicatesRemoved: 0,
    };

    const existingCategories = await tx.category.findMany({
      select: { id: true, nome: true, type: true },
    });

    const categoriesByNome = existingCategories.reduce((acc, category) => {
      if (!acc[category.nome]) {
        acc[category.nome] = [];
      }
      acc[category.nome].push(category);
      return acc;
    }, {});

    for (const nome of Object.keys(categoriesByNome)) {
      const entries = categoriesByNome[nome];
      if (entries.length <= 1) continue;

      const canonical = entries[0];
      for (const duplicate of entries.slice(1)) {
        operations.reassigned += await reassignCategoryReferences(
          tx,
          duplicate.id,
          canonical.id
        );
        await tx.category.delete({ where: { id: duplicate.id } });
        operations.duplicatesRemoved += 1;
      }
      categoriesByNome[nome] = [canonical];
    }

    for (const defaultCategory of defaultCategories) {
      const existingEntry = categoriesByNome[defaultCategory.nome]?.[0];
      if (existingEntry) {
        await tx.category.update({
          where: { id: existingEntry.id },
          data: {
            label: defaultCategory.label,
            icon: defaultCategory.icon,
            type: defaultCategory.type,
          },
        });
        operations.updated += 1;
      } else {
        const created = await tx.category.create({
          data: {
            nome: defaultCategory.nome,
            label: defaultCategory.label,
            icon: defaultCategory.icon,
            type: defaultCategory.type,
          },
        });
        categoriesByNome[defaultCategory.nome] = [created];
        operations.created += 1;
      }
    }

    const fallbackDespesa = categoriesByNome['Outros']?.[0];
    const fallbackReceita = categoriesByNome['OutrasReceitas']?.[0];

    if (!fallbackDespesa || !fallbackReceita) {
      throw new Error('Categorias de fallback (Outros/OutrasReceitas) não encontradas.');
    }

    const extraCategories = await tx.category.findMany({
      where: {
        NOT: {
          nome: { in: Array.from(allowedCategoryNames) },
        },
      },
      select: { id: true, type: true },
    });

    for (const extra of extraCategories) {
      const fallbackId =
        extra.type === 'receita' ? fallbackReceita.id : fallbackDespesa.id;
      operations.reassigned += await reassignCategoryReferences(
        tx,
        extra.id,
        fallbackId
      );
      await tx.category.delete({ where: { id: extra.id } });
      operations.deleted += 1;
    }

    return operations;
  });

  return summary;
}
