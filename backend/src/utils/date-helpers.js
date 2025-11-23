// backend/src/utils/date-helpers.js
import { startOfDay, endOfDay, setDate, addMonths, subMonths, lastDayOfMonth, getDate, addDays } from 'date-fns';

/**
 * Helper para setar o dia do mês, limitando ao último dia disponível se o dia não existir.
 * Ex: setDateSafe(15-fev-2026, 30) retorna 28-fev-2026 (em vez de overflow para março)
 */
const setDateSafe = (date, day) => {
    const lastDay = getDate(lastDayOfMonth(date));
    const targetDay = Math.min(day, lastDay);
    return setDate(date, targetDay);
};

/**
 * Helper para calcular o dia seguinte ao fechamento, considerando mudança de mês.
 * Ex: Se fecha dia 30 em fevereiro (28 dias), o próximo dia é 01/03
 */
const getNextDayAfterClosing = (date, closeDay) => {
    const lastDay = getDate(lastDayOfMonth(date));

    // Se o dia de fechamento existe neste mês, retorna closeDay + 1
    if (closeDay <= lastDay) {
        return setDate(date, closeDay + 1);
    }

    // Se o dia de fechamento não existe (ex: dia 30 em fev), 
    // o fechamento ocorre no último dia disponível, então o próximo dia é o dia 1 do mês seguinte
    return setDate(addMonths(date, 1), 1);
};

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
        const nextMonth = addMonths(referenceDate, 1);
        invoiceEndDate = endOfDay(setDateSafe(nextMonth, closeDay));
        invoiceStartDate = startOfDay(getNextDayAfterClosing(referenceDate, closeDay));
    } else {
        // Se hoje for antes (ou no dia) do fechamento, a fatura atual é a que fecha neste mês.
        invoiceEndDate = endOfDay(setDateSafe(referenceDate, closeDay));
        const prevMonth = subMonths(referenceDate, 1);
        invoiceStartDate = startOfDay(getNextDayAfterClosing(prevMonth, closeDay));
    }

    return { start: invoiceStartDate, end: invoiceEndDate };
};
