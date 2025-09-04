// backend/src/utils/date-helpers.js
import { startOfDay, endOfDay, setDate, addMonths, subMonths } from 'date-fns';

/**
 * Calcula o período de uma fatura (data de início e fim) com base
 * na data de fechamento do cartão e uma data de referência.
 * @param {object} card - O objeto do cartão com `diaFechamento`.
 * @param {Date} referenceDate - A data para a qual o período da fatura deve ser calculado.
 * @returns {{start: Date, end: Date}} O período da fatura.
 */
export const getInvoicePeriod = (card, referenceDate = new Date()) => {
    const closeDay = card.diaFechamento;
    const currentRefDay = referenceDate.getDate();

    let invoiceEndDate;
    let invoiceStartDate;
    
    // Se hoje for depois do dia do fechamento, a fatura atual é a que fecha no próximo mês.
    if (currentRefDay > closeDay) {
        invoiceEndDate = endOfDay(setDate(addMonths(referenceDate, 1), closeDay));
        invoiceStartDate = startOfDay(setDate(referenceDate, closeDay + 1));
    } else {
        // Se hoje for antes (ou no dia) do fechamento, a fatura atual é a que fecha neste mês.
        invoiceEndDate = endOfDay(setDate(referenceDate, closeDay));
        invoiceStartDate = startOfDay(setDate(subMonths(referenceDate, 1), closeDay + 1));
    }

    return { start: invoiceStartDate, end: invoiceEndDate };
};
