// backend/src/services/pdfGenerator.js
import PDFDocument from 'pdfkit';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/index.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
                Author: 'Dexpesas',
                Subject: 'Fatura de Cartão de Crédito',
            }
        });

        // Cores Premium (Nubank-ish / Modern Fintech)
        const colors = {
            primary: '#820AD1', // Roxo Dexpesas/Nubank
            secondary: '#111827', // Gray 900
            text: '#374151', // Gray 700
            muted: '#9CA3AF', // Gray 400
            border: '#E5E7EB', // Gray 200
            success: '#10B981', // Emerald 500
            danger: '#EF4444', // Red 500
            bgLight: '#F9FAFB' // Gray 50
        };

        // --- HEADER ---

        // Logo
        const logoPath = path.join(__dirname, '../../../public/cloudive-logo.svg');
        if (fs.existsSync(logoPath)) {
            try {
                doc.image(logoPath, 50, 45, { width: 40 });
            } catch (error) {
                // Fallback se SVG falhar
            }
        }

        // Nome da Empresa
        doc.fontSize(20)
            .font('Helvetica-Bold')
            .fillColor(colors.primary)
            .text('Dexpesas', 100, 53);

        // Título do Documento
        doc.fontSize(10)
            .font('Helvetica')
            .fillColor(colors.muted)
            .text('FATURA DE CARTÃO DE CRÉDITO', 50, 90, { align: 'left', characterSpacing: 2 });

        // --- INFO BOX (Resumo do Cartão e Datas) ---
        const boxTop = 110;

        // Fundo cinza claro para o box
        doc.rect(50, boxTop, 495, 80)
            .fill(colors.bgLight);

        // Linha superior colorida
        doc.rect(50, boxTop, 495, 3)
            .fill(colors.primary);

        // Coluna 1: Cartão
        doc.fontSize(12).font('Helvetica-Bold').fillColor(colors.secondary)
            .text(card.nome, 70, boxTop + 20);

        doc.fontSize(9).font('Helvetica').fillColor(colors.text)
            .text(`Final ${card.lastFourDigits || '****'}`, 70, boxTop + 40)
            .text(card.bandeira.toUpperCase(), 70, boxTop + 55);

        // Coluna 2: Datas
        doc.fontSize(9).font('Helvetica-Bold').fillColor(colors.muted).text('VENCIMENTO', 250, boxTop + 20);
        doc.fontSize(12).font('Helvetica').fillColor(colors.secondary)
            .text(format(invoiceData.dueDate, 'dd/MM/yyyy', { locale: ptBR }), 250, boxTop + 35);

        doc.fontSize(9).font('Helvetica-Bold').fillColor(colors.muted).text('FECHAMENTO', 250, boxTop + 55);
        doc.fontSize(10).font('Helvetica').fillColor(colors.text)
            .text(format(invoiceData.closingDate, 'dd/MM/yyyy', { locale: ptBR }), 330, boxTop + 55);

        // Coluna 3: Total
        const totalExpenses = transactions
            .filter(t => t.tipo === 'despesa')
            .reduce((sum, t) => sum + Number(t.valor), 0);
        const totalPayments = transactions
            .filter(t => t.tipo === 'receita')
            .reduce((sum, t) => sum + Number(t.valor), 0);
        const balance = totalExpenses - totalPayments;

        doc.fontSize(9).font('Helvetica-Bold').fillColor(colors.muted).text('VALOR TOTAL', 400, boxTop + 20, { align: 'right' });
        doc.fontSize(16).font('Helvetica-Bold').fillColor(balance > 0 ? colors.danger : colors.success)
            .text(`R$ ${balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 400, boxTop + 35, { align: 'right' });

        // --- TRANSACTIONS TABLE ---
        const tableTop = 230;

        doc.fontSize(12).font('Helvetica-Bold').fillColor(colors.secondary)
            .text('Detalhamento da Fatura', 50, 200);

        // Table Header
        doc.rect(50, tableTop, 495, 25).fill(colors.bgLight);

        doc.fontSize(8).font('Helvetica-Bold').fillColor(colors.muted);
        doc.text('DATA', 60, tableTop + 8);
        doc.text('DESCRIÇÃO', 120, tableTop + 8);
        doc.text('CATEGORIA', 350, tableTop + 8);
        doc.text('VALOR (R$)', 450, tableTop + 8, { align: 'right', width: 80 });

        let yPosition = tableTop + 35;

        // Group by date
        const groupedTransactions = transactions.reduce((acc, t) => {
            const dateKey = format(new Date(t.data), 'yyyy-MM-dd');
            if (!acc[dateKey]) acc[dateKey] = [];
            acc[dateKey].push(t);
            return acc;
        }, {});

        const sortedDates = Object.keys(groupedTransactions).sort();

        for (const dateKey of sortedDates) {
            const dayTransactions = groupedTransactions[dateKey];
            const dateLabel = format(new Date(dateKey + 'T12:00:00'), 'dd MMM', { locale: ptBR }).toUpperCase();

            // Date Header (Optional, or just list)
            // Vamos listar direto para ficar clean

            for (const transaction of dayTransactions) {
                if (yPosition > 750) {
                    doc.addPage();
                    yPosition = 50;
                    // Re-draw header on new page? Maybe simple version
                }

                const valor = Number(transaction.valor);
                const isExpense = transaction.tipo === 'despesa';

                // Row Background (Zebra striping optional, keeping clean white)

                // Data
                doc.fontSize(9).font('Helvetica').fillColor(colors.text)
                    .text(format(new Date(transaction.data), 'dd/MM'), 60, yPosition);

                // Descrição
                doc.font('Helvetica-Bold').fillColor(colors.secondary)
                    .text(transaction.descricao, 120, yPosition, { width: 220, ellipsis: true });

                // Installment info
                if (transaction.installmentNumber && transaction.totalInstallments) {
                    doc.fontSize(8).font('Helvetica').fillColor(colors.muted)
                        .text(`Parcela ${transaction.installmentNumber}/${transaction.totalInstallments}`, 120, yPosition + 12);
                }

                // Categoria
                doc.fontSize(9).font('Helvetica').fillColor(colors.muted)
                    .text(transaction.category?.nome || '-', 350, yPosition, { width: 100, ellipsis: true });

                // Valor
                doc.font('Helvetica-Bold').fillColor(isExpense ? colors.text : colors.success)
                    .text(
                        `${isExpense ? '' : '- '}${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                        450,
                        yPosition,
                        { align: 'right', width: 80 }
                    );

                yPosition += (transaction.installmentNumber ? 35 : 25);

                // Divider line light
                doc.moveTo(50, yPosition - 5).lineTo(545, yPosition - 5).lineWidth(0.5).strokeColor(colors.border).stroke();
            }
        }

        // Footer
        const pageBottom = 800;
        doc.fontSize(8).fillColor(colors.muted)
            .text('Dexpesas - Controle Financeiro Inteligente', 50, pageBottom, { align: 'center' });

        return doc;
    }
}

export default new PDFGeneratorService();
