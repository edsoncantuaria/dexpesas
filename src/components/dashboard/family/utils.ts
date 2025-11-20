export const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export const parseDecimalDigits = (payload: any): number => {
    const digitsSource = payload?.d || payload?.c;
    if (!Array.isArray(digitsSource) || digitsSource.length === 0) {
        return 0;
    }
    const digits = digitsSource.join('');
    const exponent = typeof payload?.e === 'number' ? payload.e : Number(payload?.e ?? 0);
    const sign = payload?.s === -1 ? '-' : '';
    const intLength = exponent + 1;
    if (intLength <= 0) {
        const zeros = '0'.repeat(Math.abs(intLength));
        return Number(`${sign}0.${zeros}${digits}`);
    }
    if (intLength >= digits.length) {
        const zeros = '0'.repeat(intLength - digits.length);
        return Number(`${sign}${digits}${zeros}`);
    }
    const intPart = digits.slice(0, intLength) || '0';
    const fracPart = digits.slice(intLength) || '0';
    return Number(`${sign}${intPart}.${fracPart}`);
};

export const parseAmount = (value: unknown): number => {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : 0;
    }
    if (value && typeof value === 'object') {
        if ('value' in (value as Record<string, unknown>)) {
            return parseAmount((value as Record<string, unknown>).value);
        }
        if ('amount' in (value as Record<string, unknown>)) {
            return parseAmount((value as Record<string, unknown>).amount);
        }
        if ('d' in (value as Record<string, unknown>) || 'c' in (value as Record<string, unknown>)) {
            const parsed = parseDecimalDigits(value);
            return Number.isFinite(parsed) ? parsed : 0;
        }
        const stringified = (value as Record<string, unknown>).toString?.();
        if (stringified && stringified !== '[object Object]') {
            return parseAmount(stringified);
        }
        return 0;
    }
    if (typeof value !== 'string') {
        return 0;
    }
    const trimmed = value.trim();
    if (!trimmed) {
        return 0;
    }
    const sanitized = trimmed.replace(/[^\d.,-]/g, '');
    if (!sanitized) {
        return 0;
    }
    const commaIndex = sanitized.lastIndexOf(',');
    const dotIndex = sanitized.lastIndexOf('.');
    const dotCount = (sanitized.match(/\./g) || []).length;

    if (commaIndex > dotIndex) {
        const normalized =
            dotIndex >= 0 ? sanitized.replace(/\./g, '').replace(',', '.') : sanitized.replace(',', '.');
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    if (dotIndex > commaIndex && dotIndex !== -1) {
        if (dotCount > 1 || sanitized.length - dotIndex - 1 === 3) {
            const normalized = sanitized.replace(/\./g, '');
            const parsed = Number(normalized);
            return Number.isFinite(parsed) ? parsed : 0;
        }
        const normalized = sanitized.replace(/,/g, '');
        const parsed = Number(normalized);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    const normalized = sanitized.replace(/,/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
};

export const toCurrency = (value: unknown) => currencyFormatter.format(parseAmount(value));
