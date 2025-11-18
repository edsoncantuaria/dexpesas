// backend/src/services/categoryMaintenanceService.js
import prisma from '../config/prismaClient.js';
import { defaultCategories } from '../config/seedData.js';

const allowedCategoryNames = new Set(defaultCategories.map((cat) => cat.nome));
const canonicalCategoryIds = new Set(defaultCategories.map((cat) => cat.id));

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
      where: { userId: null },
      select: { id: true, nome: true, type: true },
    });

    const categoriesByNome = existingCategories.reduce((acc, category) => {
      if (!acc[category.nome]) {
        acc[category.nome] = [];
      }
      acc[category.nome].push(category);
      return acc;
    }, {});

    const ensureCanonicalCategory = async (defaultCategory) => {
      const entries = categoriesByNome[defaultCategory.nome] || [];
      const existingCanonical = entries.find((entry) => entry.id === defaultCategory.id);

      if (existingCanonical) {
        await tx.category.update({
          where: { id: existingCanonical.id },
          data: {
            label: defaultCategory.label,
            icon: defaultCategory.icon,
            type: defaultCategory.type,
          },
        });
        operations.updated += 1;

        const duplicates = entries.filter((entry) => entry.id !== defaultCategory.id);
        for (const duplicate of duplicates) {
          operations.reassigned += await reassignCategoryReferences(
            tx,
            duplicate.id,
            existingCanonical.id
          );
          await tx.category.delete({ where: { id: duplicate.id } });
          operations.duplicatesRemoved += 1;
        }

        categoriesByNome[defaultCategory.nome] = [existingCanonical];
        return existingCanonical;
      }

      if (entries.length > 0) {
        const [firstDuplicate, ...rest] = entries;
        const created = await tx.category.create({
          data: {
            id: defaultCategory.id,
            nome: defaultCategory.nome,
            label: defaultCategory.label,
            icon: defaultCategory.icon,
            type: defaultCategory.type,
          },
        });
        operations.created += 1;
        operations.reassigned += await reassignCategoryReferences(
          tx,
          firstDuplicate.id,
          created.id
        );
        await tx.category.delete({ where: { id: firstDuplicate.id } });
        operations.duplicatesRemoved += 1;

        for (const duplicate of rest) {
          operations.reassigned += await reassignCategoryReferences(
            tx,
            duplicate.id,
            created.id
          );
          await tx.category.delete({ where: { id: duplicate.id } });
          operations.duplicatesRemoved += 1;
        }

        categoriesByNome[defaultCategory.nome] = [created];
        return created;
      }

      const created = await tx.category.create({
        data: {
          id: defaultCategory.id,
          nome: defaultCategory.nome,
          label: defaultCategory.label,
          icon: defaultCategory.icon,
          type: defaultCategory.type,
        },
      });
      operations.created += 1;
      categoriesByNome[defaultCategory.nome] = [created];
      return created;
    };

    const canonicalRecords = {};
    for (const defaultCategory of defaultCategories) {
      canonicalRecords[defaultCategory.nome] = await ensureCanonicalCategory(defaultCategory);
    }

    const fallbackDespesa = canonicalRecords['Outros'];
    const fallbackReceita = canonicalRecords['OutrasReceitas'];

    if (!fallbackDespesa || !fallbackReceita) {
      throw new Error('Categorias de fallback (Outros/OutrasReceitas) não encontradas.');
    }

    const extraCategories = await tx.category.findMany({
      where: {
        userId: null,
        id: { notIn: Array.from(canonicalCategoryIds) },
      },
      select: { id: true, type: true, nome: true },
    });

    for (const extra of extraCategories) {
      if (canonicalCategoryIds.has(extra.id)) continue;
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
