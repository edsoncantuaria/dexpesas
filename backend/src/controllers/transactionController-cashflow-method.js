// Add this method to transactionController.js

/**
 * Get cashflow analysis for Sankey diagram
 * Returns nodes and links representing cash flow
 */
async getCashflowAnalysis(req, res, next) {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    try {
        const where = { userId };

        if (startDate || endDate) {
            where.data = {};
            if (startDate) where.data.gte = new Date(startDate);
            if (endDate) where.data.lte = new Date(endDate);
        }

        const transactions = await prisma.transaction.findMany({
            where,
            include: {
                account: true,
                card: true,
                category: {
                    include: {
                        parentCategory: true
                    }
                }
            }
        });

        // Aggregate data for Sankey
        const nodes = new Set();
        const linkMap = new Map();

        const addLink = (source, target, value) => {
            const key = `${source}|${target}`;
            linkMap.set(key, (linkMap.get(key) || 0) + value);
            nodes.add(source);
            nodes.add(target);
        };

        transactions.forEach(transaction => {
            const value = Math.abs(Number(transaction.valor));

            if (transaction.tipo === 'receita') {
                // Income flow
                const categoryName = transaction.category?.label || transaction.categoria || 'Outras Receitas';
                const fullCategoryName = transaction.category?.parentCategory
                    ? `${transaction.category.parentCategory.label} > ${transaction.category.label}`
                    : categoryName;

                const accountName = transaction.account?.nome || 'Conta Principal';

                // Source (Income Category) → Account
                addLink(fullCategoryName, accountName, value);

            } else if (transaction.tipo === 'despesa') {
                // Expense flow
                const accountOrCard = transaction.card?.nome || transaction.account?.nome || 'Conta Principal';

                const categoryName = transaction.category?.label || transaction.categoria || 'Outras Despesas';
                const fullCategoryName = transaction.category?.parentCategory
                    ? `${transaction.category.parentCategory.label} > ${transaction.category.label}`
                    : categoryName;

                // Account/Card → Destination (Expense Category)
                addLink(accountOrCard, fullCategoryName, value);
            }
        });

        // Convert to array format for Sankey
        const nodesList = Array.from(nodes).map((name, index) => ({ id: index, name }));
        const nodeIndexMap = new Map(nodesList.map(n => [n.name, n.id]));

        const links = Array.from(linkMap.entries()).map(([key, value]) => {
            const [source, target] = key.split('|');
            return {
                source: nodeIndexMap.get(source),
                target: nodeIndexMap.get(target),
                value: Number(value.toFixed(2))
            };
        });

        res.json({
            nodes: nodesList,
            links: links.sort((a, b) => b.value - a.value)
        });
    } catch (error) {
        next(error);
    }
}
