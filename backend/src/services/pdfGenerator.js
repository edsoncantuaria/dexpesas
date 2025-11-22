// backend/src/services/pdfGenerator.js
import PDFDocument from 'pdfkit';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

class PDFGeneratorService {
    /**
     * Gera PDF da fatura do cartão
     * @param {Object} invoiceData - Dados da fatura
     * @param {Object} card - Dados do cartão
     * @param {Array} transactions - Transações da fatura
     * @returns {PDFDocument} - Stream do PDF
     */
    generateInvoicePDF(invoiceData, card, transactions) {
        const doc = new PDFDocument({
            size: 'A4',
            margin: 50,
            info: {
                Title: `Fatura ${card.nome} - ${invoiceData.monthLabel}`,
                Author: 'Jornada Financeira',
                Subject: 'Fatura de Cartão de Crédito',
            }
        });

        // Define cores
        const primaryColor = '#2563eb';
        const grayColor = '#6b7280';
        const darkGray = '#374151';

        // Header
        doc.fontSize(24)
            .fillColor(primaryColor)
            .text('Jornada Financeira', { align: 'center' })
            .moveDown(0.3);

        doc.fontSize(12)
            .fillColor(grayColor)
            .text('Fatura de Cartão de Crédito', { align: 'center' })
            .moveDown(2);

        // Card Info Box
        const boxTop = doc.y;
        doc.roundedRect(50, boxTop, 495, 100, 5)
            .lineWidth(1)
            .strokeColor('#e5e7eb')
            .stroke();

        doc.fontSize(10)
            .fillColor(darkGray)
            .text(`Cartão: ${card.nome}`, 70, boxTop + 20)
            .text(`Bandeira: ${card.bandeira.toUpperCase()}`, 70, boxTop + 35)
            .text(`Final: ${card.lastFourDigits || '****'}`, 70, boxTop + 50)
            .text(`Limite: R$ ${Number(card.limite).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 70, boxTop + 65);

        doc.text(`Período: ${invoiceData.monthLabel}`, 320, boxTop + 20)
            .text(`Fechamento: ${format(invoiceData.closingDate, 'dd/MM/yyyy', { locale: ptBR })}`, 320, boxTop + 35)
            .text(`Vencimento: ${format(invoiceData.dueDate, 'dd/MM/yyyy', { locale: ptBR })}`, 320, boxTop + 50);

        doc.moveDown(4);

        // Summary
        const summaryY = doc.y;
        doc.fontSize(16)
            .fillColor(primaryColor)
            .text('Resumo da Fatura', 50, summaryY)
            .moveDown(1);

        const totalExpenses = transactions
            .filter(t => t.tipo === 'despesa')
            .reduce((sum, t) => sum + Number(t.valor), 0);

        const totalPayments = transactions
            .filter(t => t.tipo === 'receita')
            .reduce((sum, t) => sum + Number(t.valor), 0);

        const balance = totalExpenses - totalPayments;

        doc.fontSize(12)
            .fillColor(darkGray)
            .text(`Total de Despesas:`, 70, doc.y)
            .fillColor('#dc2626')
            .text(`R$ ${totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 350, doc.y, { align: 'right' })
            .moveDown(0.5);

        if (totalPayments > 0) {
            doc.fillColor(darkGray)
                .text(`Pagamentos/Créditos:`, 70, doc.y)
                .fillColor('#16a34a')
                .text(`- R$ ${totalPayments.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 350, doc.y, { align: 'right' })
                .moveDown(0.5);
        }

        doc.fontSize(14)
            .fillColor(darkGray)
            .text(`Valor Total a Pagar:`, 70, doc.y)
            .fillColor(balance > 0 ? '#dc2626' : '#16a34a')
            .text(`R$ ${balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 350, doc.y, { align: 'right', width: 195 })
            .moveDown(2);

        // Divider
        doc.moveTo(50, doc.y)
            .lineTo(545, doc.y)
            .strokeColor('#e5e7eb')
            .stroke()
            .moveDown(1);

        // Transactions Table
        doc.fontSize(16)
            .fillColor(primaryColor)
            .text('Lançamentos', 50, doc.y)
            .moveDown(1);

        // Table Header
        const tableTop = doc.y;
        doc.fontSize(9)
            .fillColor('#6b7280')
            .text('Data', 50, tableTop, { width: 60 })
            .text('Descrição', 115, tableTop, { width: 230 })
            .text('Categoria', 350, tableTop, { width: 100 })
            .text('Valor', 455, tableTop, { width: 90, align: 'right' });

        doc.moveTo(50, tableTop + 15)
            .lineTo(545, tableTop + 15)
            .strokeColor('#e5e7eb')
            .stroke();

        let yPosition = tableTop + 25;

        // Group by date
        const groupedTransactions = transactions.reduce((acc, t) => {
            const dateKey = format(new Date(t.data), 'yyyy-MM-dd');
            if (!acc[dateKey]) acc[dateKey] = [];
            acc[dateKey].push(t);
            return acc;
        }, {});

        // Sort dates
        const sortedDates = Object.keys(groupedTransactions).sort();

        for (const dateKey of sortedDates) {
            const dayTransactions = groupedTransactions[dateKey];

            for (const transaction of dayTransactions) {
                // Check if we need a new page
                if (yPosition > 700) {
                    doc.addPage();
                    yPosition = 50;
                }

                const transactionDate = format(new Date(transaction.data), 'dd/MM');
                const valor = Number(transaction.valor);
                const isExpense = transaction.tipo === 'despesa';

                doc.fontSize(9)
                    .fillColor(darkGray)
                    .text(transactionDate, 50, yPosition, { width: 60 })
                    .text(transaction.descricao, 115, yPosition, { width: 230, height: 20, ellipsis: true })
                    .text(transaction.categoria?.nome || '-', 350, yPosition, { width: 100, ellipsis: true })
                    .fillColor(isExpense ? '#dc2626' : '#16a34a')
                    .text(
                        `${isExpense ? '' : '- '}R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                        455,
                        yPosition,
                        { width: 90, align: 'right' }
                    );

                yPosition += 25;

                // Show installment info if applicable
                if (transaction.installmentNumber && transaction.totalInstallments) {
                    doc.fontSize(7)
                        .fillColor('#9ca3af')
                        .text(
                            `${transaction.installmentNumber}/${transaction.totalInstallments}`,
                            115,
                            yPosition - 18
                        );
                }
            }
        }

        // Footer
        doc.fontSize(8)
            .fillColor('#9ca3af')
            .text(
                `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
                50,
                750,
                { align: 'center', width: 495 }
            );

        return doc;
    }
}

export default new PDFGeneratorService();
