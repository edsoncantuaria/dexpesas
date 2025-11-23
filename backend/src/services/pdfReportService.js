// backend/src/services/pdfReportService.js
import PDFDocument from 'pdfkit';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { format, differenceInDays } from 'date-fns';

const prisma = new PrismaClient();

class PDFReportService {
    /**
     * Generate financial PDF report
     */
    async generateReport(userId, filters = {}) {
        const doc = new PDFDocument({
            size: 'A4',
            margin: 50,
            info: {
                Title: 'Relatório Financeiro',
                Author: 'Dexpesas'
            }
        });

        // Fetch user data
        const user = await prisma.user.findUnique({ where: { id: userId } });

        // Build query
        const whereClause = { userId };
        if (filters.dateRange?.from) {
            whereClause.data = {
                gte: new Date(filters.dateRange.from),
                lte: filters.dateRange.to ? new Date(filters.dateRange.to) : new Date()
            };
        }
        if (filters.type) whereClause.tipo = filters.type;
        if (filters.includePending === false) whereClause.pago = true;

        const transactions = await prisma.transaction.findMany({
            where: whereClause,
            include: {
                category: { include: { parentCategory: true } },
                account: true,
                card: true
            },
            orderBy: { data: 'desc' }
        });

        // Calculate summary
        const summary = this.calculateSummary(transactions);

        // Generate PDF
        this.addCoverPage(doc, user, filters);
        doc.addPage();
        this.addSummarySection(doc, summary);
        doc.addPage();
        this.addCategoryBreakdown(doc, transactions);
        doc.addPage();
        this.addTransactionList(doc, transactions);
        this.addFooter(doc);

        doc.end();
        return doc;
    }

    /**
     * Calculate financial summary
     */
    calculateSummary(transactions) {
        const income = transactions
            .filter(t => t.tipo === 'receita')
            .reduce((sum, t) => sum + Number(t.valor), 0);

        const expenses = transactions
            .filter(t => t.tipo === 'despesa')
            .reduce((sum, t) => sum + Number(t.valor), 0);

        const balance = income - expenses;
        const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

        // Category breakdown
        const categoryMap = new Map();
        transactions
            .filter(t => t.tipo === 'despesa')
            .forEach(t => {
                const categoryName = t.category?.parentCategory
                    ? `${t.category.parentCategory.label} > ${t.category.label}`
                    : t.category?.label || t.categoria || 'Outros';

                categoryMap.set(
                    categoryName,
                    (categoryMap.get(categoryName) || 0) + Number(t.valor)
                );
            });

        const categoriesArray = Array.from(categoryMap.entries())
            .map(([name, value]) => ({ name, value, percentage: (value / expenses) * 100 }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10); // Top 10

        return {
            income,
            expenses,
            balance,
            savingsRate,
            transactionCount: transactions.length,
            categoriesBreakdown: categoriesArray
        };
    }

    /**
     * Add cover page
     */
    addCoverPage(doc, user, filters) {
        // Title
        doc.fontSize(28)
            .font('Helvetica-Bold')
            .fillColor('#4F81BD')
            .text('Relatório Financeiro', { align: 'center' });

        doc.moveDown(2);

        // User info
        doc.fontSize(14)
            .fillColor('#333333')
            .font('Helvetica')
            .text(`Usuário: ${user.name}`, { align: 'center' });

        doc.moveDown();

        // Period
        if (filters.dateRange?.from) {
            const fromDate = format(new Date(filters.dateRange.from), "dd 'de' MMMM 'de' yyyy");
            const toDate = filters.dateRange.to
                ? format(new Date(filters.dateRange.to), "dd 'de' MMMM 'de' yyyy")
                : format(new Date(), "dd 'de' MMMM 'de' yyyy");

            doc.fontSize(12)
                .text(`Período: ${fromDate} - ${toDate}`, { align: 'center' });
        }

        doc.moveDown(3);

        // Generation date
        doc.fontSize(10)
            .fillColor('#666666')
            .text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`, { align: 'center' });
    }

    /**
     * Add summary section
     */
    addSummarySection(doc, summary) {
        doc.fontSize(18)
            .font('Helvetica-Bold')
            .fillColor('#4F81BD')
            .text('Resumo Financeiro');

        doc.moveDown();

        // Summary boxes
        const startY = doc.y;
        const boxWidth = 150;
        const boxHeight = 80;
        const spacing = 20;

        // Income box
        this.drawSummaryBox(doc, 50, startY, boxWidth, boxHeight, 'Receitas', summary.income, '#10b981');

        // Expenses box
        this.drawSummaryBox(doc, 50 + boxWidth + spacing, startY, boxWidth, boxHeight, 'Despesas', summary.expenses, '#ef4444');

        // Balance box
        this.drawSummaryBox(doc, 50 + (boxWidth + spacing) * 2, startY, boxWidth, boxHeight, 'Saldo', summary.balance, summary.balance >= 0 ? '#10b981' : '#ef4444');

        doc.y = startY + boxHeight + 30;

        // Additional metrics
        doc.fontSize(12)
            .font('Helvetica')
            .fillColor('#333333')
            .text(`Taxa de Poupança: ${summary.savingsRate.toFixed(1)}%`);

        doc.moveDown(0.5);
        doc.text(`Total de Transações: ${summary.transactionCount}`);
    }

    /**
     * Draw summary box
     */
    drawSummaryBox(doc, x, y, width, height, label, value, color) {
        // Box border
        doc.rect(x, y, width, height)
            .strokeColor('#cccccc')
            .lineWidth(1)
            .stroke();

        // Label
        doc.fontSize(10)
            .fillColor('#666666')
            .font('Helvetica')
            .text(label, x + 10, y + 15, { width: width - 20, align: 'left' });

        // Value
        doc.fontSize(16)
            .fillColor(color)
            .font('Helvetica-Bold')
            .text(this.formatCurrency(value), x + 10, y + 40, { width: width - 20, align: 'left' });
    }

    /**
     * Add category breakdown
     */
    addCategoryBreakdown(doc, transactions) {
        doc.fontSize(18)
            .font('Helvetica-Bold')
            .fillColor('#4F81BD')
            .text('Despesas por Categoria');

        doc.moveDown();

        const categoryMap = new Map();
        let totalExpenses = 0;

        transactions
            .filter(t => t.tipo === 'despesa')
            .forEach(t => {
                const categoryName = t.category?.parentCategory
                    ? `${t.category.parentCategory.label} > ${t.category.label}`
                    : t.category?.label || t.categoria || 'Outros';

                const value = Number(t.valor);
                categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + value);
                totalExpenses += value;
            });

        const categories = Array.from(categoryMap.entries())
            .map(([name, value]) => ({ name, value, percentage: (value / totalExpenses) * 100 }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);

        // Draw horizontal bars
        const barStartY = doc.y;
        const barWidth = 400;
        const barHeight = 20;
        const barSpacing = 10;

        categories.forEach((cat, index) => {
            const y = barStartY + (index * (barHeight + barSpacing));

            // Category name
            doc.fontSize(10)
                .fillColor('#333333')
                .font('Helvetica')
                .text(cat.name, 50, y + 5, { width: 150 });

            // Bar background
            doc.rect(210, y, barWidth, barHeight)
                .fillColor('#f0f0f0')
                .fill();

            // Bar fill
            const fillWidth = (cat.value / totalExpenses) * barWidth;
            doc.rect(210, y, fillWidth, barHeight)
                .fillColor('#4F81BD')
                .fill();

            // Value text
            doc.fontSize(9)
                .fillColor('#ffffff')
                .font('Helvetica-Bold')
                .text(`${this.formatCurrency(cat.value)} (${cat.percentage.toFixed(1)}%)`,
                    215, y + 6, { width: barWidth - 10 });
        });
    }

    /**
     * Add transaction list
     */
    addTransactionList(doc, transactions) {
        doc.fontSize(18)
            .font('Helvetica-Bold')
            .fillColor('#4F81BD')
            .text('Transações Recentes');

        doc.moveDown();

        // Table header
        const tableTop = doc.y;
        const col1X = 50;
        const col2X = 110;
        const col3X = 300;
        const col4X = 450;

        doc.fontSize(9)
            .font('Helvetica-Bold')
            .fillColor('#666666');

        doc.text('Data', col1X, tableTop);
        doc.text('Descrição', col2X, tableTop);
        doc.text('Categoria', col3X, tableTop);
        doc.text('Valor', col4X, tableTop);

        // Draw line under header
        doc.moveTo(col1X, tableTop + 15)
            .lineTo(540, tableTop + 15)
            .strokeColor('#cccccc')
            .stroke();

        // Table rows
        let rowY = tableTop + 25;
        const rowHeight = 20;
        const maxRows = 25; // Limit to fit on page

        transactions.slice(0, maxRows).forEach((t, index) => {
            if (rowY > 700) return; // Prevent overflow

            const categoryName = t.category?.label || t.categoria || 'N/A';
            const valueColor = t.tipo === 'receita' ? '#10b981' : '#ef4444';

            doc.fontSize(8)
                .font('Helvetica')
                .fillColor('#333333')
                .text(format(new Date(t.data), 'dd/MM/yy'), col1X, rowY)
                .text(t.descricao.substring(0, 25), col2X, rowY)
                .text(categoryName.substring(0, 20), col3X, rowY);

            doc.fillColor(valueColor)
                .text(this.formatCurrency(Number(t.valor)), col4X, rowY);

            rowY += rowHeight;
        });

        if (transactions.length > maxRows) {
            doc.fontSize(8)
                .fillColor('#666666')
                .text(`... e mais ${transactions.length - maxRows} transações`, col1X, rowY + 10);
        }
    }

    /**
     * Add footer to all pages
     */
    addFooter(doc) {
        const pages = doc.bufferedPageRange();

        for (let i = 0; i < pages.count; i++) {
            doc.switchToPage(i);

            doc.fontSize(8)
                .fillColor('#999999')
                .text(
                    `Página ${i + 1} de ${pages.count} | Gerado por Dexpesas`,
                    50,
                    doc.page.height - 50,
                    { align: 'center', width: doc.page.width - 100 }
                );
        }
    }

    /**
     * Format currency
     */
    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }
}

export default new PDFReportService();
