// src/lib/banks.ts
export const BRAZILIAN_BANKS = [
    'Nubank',
    'Inter',
    'C6 Bank',
    'Itaú',
    'Bradesco',
    'Banco do Brasil',
    'Caixa Econômica',
    'Santander',
    'Sicoob',
    'Sicredi',
    'BTG Pactual',
    'PicPay',
    'Neon',
    'Next',
    'Original',
    'BMG',
    'Safra',
    'Banrisul',
    'BRB',
    'Pan',
    'Daycoval',
    'Mercado Pago',
    'PagBank',
    'Will Bank',
    'Iti Itaú',
    'Banco Master',
    'XP Investimentos',
    'Rico',
    'Clear',
    'Modalmais',
];

export function filterBanks(query: string): string[] {
    if (!query) return BRAZILIAN_BANKS;

    const lowerQuery = query.toLowerCase();
    return BRAZILIAN_BANKS.filter(bank =>
        bank.toLowerCase().includes(lowerQuery)
    );
}
