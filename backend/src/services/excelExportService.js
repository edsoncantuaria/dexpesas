// backend/src/services/excelExportService.js
import ExcelJS from 'exceljs';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { format, parseISO } from 'date-fns';

const prisma = new PrismaClient();

class ExcelExportService {
    /**
     * Generate complete Excel report with multiple sheets
     */
    async generateReport(userId, filters = {}) {
        const workbook = new ExcelJS.Workbook();

        workbook.creator = 'Dexpesas';
        workbook.created = new Date();

        // Add sheets
        await this.addTransactionsSheet(workbook, userId, filters);
        await this.addAccountsSheet(workbook, userId);
        await this.addCardsSheet(workbook, userId);
        await this.addBudgetsSheet(workbook, userId);
        await this.addGoalsSheet(workbook, userId);

        return workbook;
    }

    /**
     * Add Transactions sheet
     */
    async addTransactionsSheet(workbook, userId, filters) {
        const sheet = workbook.addWorksheet('Transações');

        // Define columns
        sheet.columns = [
            { header: 'Data', key: 'data', width: 12 },
            { header: 'Descrição', key: 'descricao', width: 35 },
            { header: 'Valor', key: 'valor', width: 15 },
            { header: 'Tipo', key: 'tipo', width: 10 },
            { header: 'Categoria', key: 'categoria', width: 25 },
            { header: 'Método', key: 'metodo', width: 15 },
            { header: 'Conta/Cartão', key: 'fonte', width: 20 },
            { header: 'Status', key: 'status', width: 12 },
            { header: 'Tags', key: 'tags', width: 20 }
        ];

        // Style header
        this.styleHeader(sheet);

        // Build query
        const whereClause = { userId };
        if (filters.dateRange?.from) {
            whereClause.data = {
                gte: new Date(filters.dateRange.from),
                lte: filters.dateRange.to ? new Date(filters.dateRange.to) : new Date()
            };
        }
        if (filters.type) whereClause.tipo = filters.type;
        if (filters.categories?.length > 0) {
            whereClause.categoria = { in: filters.categories };
        }
        if (filters.includePending === false) whereClause.pago = true;

        // Fetch transactions
        const transactions = await prisma.transaction.findMany({
            where: whereClause,
            include: {
                category: { include: { parentCategory: true } },
                account: true,
                card: true,
                tags: true
            },
            orderBy: { data: 'desc' }
        });

        // Add data rows
        transactions.forEach(t => {
            const categoryName = t.category?.parentCategory
                ? `${t.category.parentCategory.label} > ${t.category.label} `
                : t.category?.label || t.categoria || 'N/A';

            const row = sheet.addRow({
                data: format(new Date(t.data), 'dd/MM/yyyy'),
                descricao: t.descricao,
                valor: Number(t.valor),
                tipo: t.tipo === 'receita' ? 'Receita' : 'Despesa',
                categoria: categoryName,
                metodo: this.translatePaymentMethod(t.metodoPagamento),
                fonte: t.account?.nome || t.card?.nome || 'N/A',
                status: t.pago ? 'Pago' : 'Pendente',
                tags: t.tags.map(tag => tag.name).join(', ')
            });

            // Color code by type
            if (t.tipo === 'receita') {
                row.getCell('valor').font = { color: { argb: 'FF008000' } };
            } else {
                row.getCell('valor').font = { color: { argb: 'FFFF0000' } };
            }
        });

        // Format currency column
        sheet.getColumn('valor').numFmt = 'R$ #,##0.00';

        // Add totals
        const lastRow = sheet.rowCount + 2;
        sheet.getCell(`B${lastRow} `).value = 'TOTAL:';
        sheet.getCell(`B${lastRow} `).font = { bold: true };
        sheet.getCell(`C${lastRow} `).value = {
            formula: `SUMIF(D2: D${sheet.rowCount}, "Receita", C2: C${sheet.rowCount}) - SUMIF(D2: D${sheet.rowCount}, "Despesa", C2: C${sheet.rowCount})`
        };
        sheet.getCell(`C${lastRow} `).numFmt = 'R$ #,##0.00';
        sheet.getCell(`C${lastRow} `).font = { bold: true };

        // Freeze header row
        sheet.views = [{ state: 'frozen', ySplit: 1 }];
    }

    /**
     * Add Accounts sheet
     */
    async addAccountsSheet(workbook, userId) {
        const sheet = workbook.addWorksheet('Contas');

        sheet.columns = [
            { header: 'Nome', key: 'nome', width: 25 },
            { header: 'Tipo', key: 'tipo', width: 15 },
            { header: 'Saldo Inicial', key: 'saldoInicial', width: 18 },
            { header: 'Saldo Atual', key: 'saldoAtual', width: 18 },
            { header: 'Banco', key: 'banco', width: 20 }
        ];

        this.styleHeader(sheet);

        const accounts = await prisma.account.findMany({
            where: { userId },
            include: {
                transactions: { where: { pago: true } }
            }
        });

        accounts.forEach(acc => {
            const receitas = acc.transactions
                .filter(t => t.tipo === 'receita')
                .reduce((sum, t) => sum + Number(t.valor), 0);
            const despesas = acc.transactions
                .filter(t => t.tipo === 'despesa')
                .reduce((sum, t) => sum + Number(t.valor), 0);

            const saldoAtual = Number(acc.saldoInicial) + receitas - despesas;

            sheet.addRow({
                nome: acc.nome,
                tipo: this.translateAccountType(acc.tipo),
                saldoInicial: Number(acc.saldoInicial),
                saldoAtual: saldoAtual,
                banco: acc.banco || 'N/A'
            });
        });

        sheet.getColumn('saldoInicial').numFmt = 'R$ #,##0.00';
        sheet.getColumn('saldoAtual').numFmt = 'R$ #,##0.00';
        sheet.views = [{ state: 'frozen', ySplit: 1 }];
    }

    /**
     * Add Cards sheet
     */
    async addCardsSheet(workbook, userId) {
        const sheet = workbook.addWorksheet('Cartões');

        sheet.columns = [
            { header: 'Nome', key: 'nome', width: 25 },
            { header: 'Bandeira', key: 'bandeira', width: 15 },
            { header: 'Limite', key: 'limite', width: 15 },
            { header: 'Dia Fechamento', key: 'fechamento', width: 18 },
            { header: 'Dia Vencimento', key: 'vencimento', width: 18 },
            { header: 'Status', key: 'status', width: 12 }
        ];

        this.styleHeader(sheet);

        const cards = await prisma.card.findMany({ where: { userId } });

        cards.forEach(card => {
            sheet.addRow({
                nome: card.nome,
                bandeira: card.bandeira,
                limite: Number(card.limite),
                fechamento: card.diaFechamento,
                vencimento: card.diaVencimento,
                status: card.status || 'ACTIVE'
            });
        });

        sheet.getColumn('limite').numFmt = 'R$ #,##0.00';
        sheet.views = [{ state: 'frozen', ySplit: 1 }];
    }

    /**
     * Add Budgets sheet
     */
    async addBudgetsSheet(workbook, userId) {
        const sheet = workbook.addWorksheet('Orçamentos');

        sheet.columns = [
            { header: 'Mês', key: 'mes', width: 12 },
            { header: 'Categoria', key: 'categoria', width: 25 },
            { header: 'Limite', key: 'limite', width: 15 },
            { header: 'Gasto', key: 'gasto', width: 15 },
            { header: '%', key: 'percentual', width: 10 }
        ];

        this.styleHeader(sheet);

        const budgets = await prisma.budget.findMany({
            where: { userId },
            include: { category: { include: { parentCategory: true } } },
            orderBy: { month: 'desc' }
        });

        for (const budget of budgets) {
            const categoryName = budget.category.parentCategory
                ? `${budget.category.parentCategory.label} > ${budget.category.label} `
                : budget.category.label;

            // Calculate spent (simplified - you may want to add date range)
            const spent = await prisma.transaction.aggregate({
                _sum: { valor: true },
                where: {
                    userId,
                    categoryId: budget.categoryId,
                    tipo: 'despesa',
                    pago: true
                }
            });

            const spentAmount = Number(spent._sum.valor || 0);
            const percentage = (spentAmount / Number(budget.limit)) * 100;

            const row = sheet.addRow({
                mes: budget.month || 'N/A',
                categoria: categoryName,
                limite: Number(budget.limit),
                gasto: spentAmount,
                percentual: percentage
            });

            // Color code
            if (percentage >= 100) {
                row.getCell('percentual').font = { color: { argb: 'FFFF0000' } };
            } else if (percentage >= 80) {
                row.getCell('percentual').font = { color: { argb: 'FFFFA500' } };
            }
        }

        sheet.getColumn('limite').numFmt = 'R$ #,##0.00';
        sheet.getColumn('gasto').numFmt = 'R$ #,##0.00';
        sheet.getColumn('percentual').numFmt = '0.0"%"';
        sheet.views = [{ state: 'frozen', ySplit: 1 }];
    }

    /**
     * Add Goals sheet
     */
    async addGoalsSheet(workbook, userId) {
        const sheet = workbook.addWorksheet('Metas');

        sheet.columns = [
            { header: 'Nome', key: 'nome', width: 30 },
            { header: 'Valor Alvo', key: 'alvo', width: 15 },
            { header: 'Valor Atual', key: 'atual', width: 15 },
            { header: 'Progresso', key: 'progresso', width: 12 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Data Limite', key: 'deadline', width: 15 }
        ];

        this.styleHeader(sheet);

        const goals = await prisma.goal.findMany({ where: { userId } });

        goals.forEach(goal => {
            const progress = (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100;

            sheet.addRow({
                nome: goal.name,
                alvo: Number(goal.targetAmount),
                atual: Number(goal.currentAmount),
                progresso: progress,
                status: goal.status === 'IN_PROGRESS' ? 'Em Progresso' : 'Concluída',
                deadline: goal.deadline ? format(new Date(goal.deadline), 'dd/MM/yyyy') : 'N/A'
            });
        });

        sheet.getColumn('alvo').numFmt = 'R$ #,##0.00';
        sheet.getColumn('atual').numFmt = 'R$ #,##0.00';
        sheet.getColumn('progresso').numFmt = '0.0"%"';
        sheet.views = [{ state: 'frozen', ySplit: 1 }];
    }

    /**
     * Style header row
     */
    styleHeader(sheet) {
        const headerRow = sheet.getRow(1);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4F81BD' }
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
        headerRow.height = 20;
    }

    /**
     * Helper: translate payment method
     */
    translatePaymentMethod(method) {
        const map = {
            credito: 'Crédito',
            debito: 'Débito',
            pix: 'PIX',
            dinheiro: 'Dinheiro',
            transferencia: 'Transferência'
        };
        return map[method] || method;
    }

    /**
     * Helper: translate account type
     */
    translateAccountType(type) {
        const map = {
            corrente: 'Conta Corrente',
            poupanca: 'Poupança',
            investimento: 'Investimento'
        };
        return map[type] || type;
    }
}

export default new ExcelExportService();
