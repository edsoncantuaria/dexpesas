'use strict';
// backend/src/config/seedData.cjs

/**
 * @file Arquivo central para os dados de seed em formato CommonJS.
 * Necessário para ser importado pelo `seed.cjs` que roda com `require`.
 */

// Lista de categorias padrão do sistema
const defaultCategories = [
    // Despesas
    { nome: 'Alimentacao', label: 'Alimentação', icon: 'Utensils', type: 'despesa' },
    { nome: 'AssinaturasEServicos', label: 'Assinaturas e Serviços', icon: 'Wallet', type: 'despesa' },
    { nome: 'BaresERestaurantes', label: 'Bares e Restaurantes', icon: 'GlassWater', type: 'despesa' },
    { nome: 'Casa', label: 'Casa', icon: 'Home', type: 'despesa' },
    { nome: 'Compras', label: 'Compras', icon: 'ShoppingCart', type: 'despesa' },
    { nome: 'CuidadosPessoais', label: 'Cuidados Pessoais', icon: 'Droplets', type: 'despesa' },
    { nome: 'DividasEEmprestimos', label: 'Dívidas e Empréstimos', icon: 'Landmark', type: 'despesa' },
    { nome: 'Educacao', label: 'Educação', icon: 'GraduationCap', type: 'despesa' },
    { nome: 'FamiliaEFilhos', label: 'Família e Filhos', icon: 'Users', type: 'despesa' },
    { nome: 'ImpostosETaxas', label: 'Impostos e Taxas', icon: 'Landmark', type: 'despesa' },
    { nome: 'LazerEHobbies', label: 'Lazer e Hobbies', icon: 'Gamepad2', type: 'despesa' },
    { nome: 'Mercado', label: 'Mercado', icon: 'ShoppingCart', type: 'despesa' },
    { nome: 'Outros', label: 'Outros', icon: 'Tags', type: 'despesa' },
    { nome: 'Pets', label: 'Pets', icon: 'Dog', type: 'despesa' },
    { nome: 'PresentesEDoacoes', label: 'Presentes e Doações', icon: 'Gift', type: 'despesa' },
    { nome: 'Roupas', label: 'Roupas', icon: 'Shirt', type: 'despesa' },
    { nome: 'Saude', label: 'Saúde', icon: 'HeartPulse', type: 'despesa' },
    { nome: 'Trabalho', label: 'Trabalho', icon: 'Briefcase', type: 'despesa' },
    { nome: 'Transporte', label: 'Transporte', icon: 'Car', type: 'despesa' },
    { nome: 'Viagem', label: 'Viagem', icon: 'Plane', type: 'despesa' },
    { nome: 'Vicios', label: 'Vícios', icon: 'Flame', type: 'despesa' },
    // Receitas
    { nome: 'Investimentos', label: 'Investimentos', icon: 'BarChart', type: 'receita' },
    { nome: 'Emprestimos', label: 'Empréstimos', icon: 'Landmark', type: 'receita' },
    { nome: 'OutrasReceitas', label: 'Outras Receitas', icon: 'DollarSign', type: 'receita' },
    { nome: 'Salario', label: 'Salário', icon: 'Wallet', type: 'receita' },
    { nome: 'Venda', label: 'Venda', icon: 'Tag', type: 'receita' },
];

module.exports = {
    defaultCategories,
};
