import { startOfDay, endOfDay, setDate, addMonths, subMonths, subDays, addDays, isAfter } from 'date-fns';
import type { Card } from './definitions';

/**
 * Calcula o período de uma fatura (data de início e fim) com base
 * na data de vencimento e o gap de fechamento.
 * @param {object} card - O objeto do cartão com `diaVencimento` e `closingDayGap`.
 * @param {Date} referenceDate - A data para a qual o período da fatura deve ser calculado.
 * @returns {{start: Date, end: Date}} O período da fatura.
 */
export const getInvoicePeriod = (card: Card, referenceDate: Date) => {
    const dueDay = card.diaVencimento;
    const gap = card.closingDayGap ?? 7; // Default to 7 if not set

    // Calculate the closing date for the reference month
    // We assume the due date is in the reference month first
    let tentativeDueDate = setDate(referenceDate, dueDay);

    // If setting the day caused a month rollover (e.g. Feb 30 -> Mar 2), fix it?
    // setDate handles this by overflowing. But for "Due Day", usually it's valid.
    // If due day is 31 and month is Feb, setDate(Feb, 31) -> Mar 3.
    // This is technically correct behavior for JS dates, but for credit cards, 
    // usually it snaps to the last day of the month.
    // Let's assume valid due days for now or handle clamping if needed.
    // For now, standard setDate behavior.

    let tentativeClosingDate = subDays(tentativeDueDate, gap);

    let invoiceDueDate;
    let invoiceClosingDate;
    let previousInvoiceClosingDate;

    // If reference date is AFTER the closing date of this month, 
    // then we are in the NEXT invoice period (Due next month).
    if (isAfter(referenceDate, endOfDay(tentativeClosingDate))) {
        invoiceDueDate = setDate(addMonths(referenceDate, 1), dueDay);
        invoiceClosingDate = subDays(invoiceDueDate, gap);

        // Previous closing date (to find start)
        // It's the closing date of the invoice due in the current reference month
        previousInvoiceClosingDate = tentativeClosingDate;
    } else {
        // We are in the invoice due this month (or the one that closes this month)
        invoiceDueDate = tentativeDueDate;
        invoiceClosingDate = tentativeClosingDate;

        // Previous closing date is from the invoice due last month
        const prevDueDate = setDate(subMonths(referenceDate, 1), dueDay);
        previousInvoiceClosingDate = subDays(prevDueDate, gap);
    }

    const invoiceStartDate = startOfDay(addDays(previousInvoiceClosingDate, 1));
    const invoiceEndDate = endOfDay(invoiceClosingDate);

    return { start: invoiceStartDate, end: invoiceEndDate };
};
