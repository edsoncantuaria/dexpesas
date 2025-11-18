'use strict';
// backend/src/config/seedData.cjs

/**
 * @file Arquivo central para os dados de seed em formato CommonJS.
 * Necessário para ser importado pelo `seed.cjs` que roda com `require`.
 */

// Lista de categorias padrão do sistema
const defaultCategories = [
    // Despesas
    { id: 'cat_alimentacao', nome: 'Alimentacao', label: 'Alimentação', icon: 'Utensils', type: 'despesa' },
    { id: 'cat_assinaturas_servicos', nome: 'AssinaturasEServicos', label: 'Assinaturas e Serviços', icon: 'Wallet', type: 'despesa' },
    { id: 'cat_bares_restaurantes', nome: 'BaresERestaurantes', label: 'Bares e Restaurantes', icon: 'GlassWater', type: 'despesa' },
    { id: 'cat_casa', nome: 'Casa', label: 'Casa', icon: 'Home', type: 'despesa' },
    { id: 'cat_compras', nome: 'Compras', label: 'Compras', icon: 'ShoppingCart', type: 'despesa' },
    { id: 'cat_cuidados_pessoais', nome: 'CuidadosPessoais', label: 'Cuidados Pessoais', icon: 'Droplets', type: 'despesa' },
    { id: 'cat_dividas_emprestimos', nome: 'DividasEEmprestimos', label: 'Dívidas e Empréstimos', icon: 'Landmark', type: 'despesa' },
    { id: 'cat_educacao', nome: 'Educacao', label: 'Educação', icon: 'GraduationCap', type: 'despesa' },
    { id: 'cat_familia_filhos', nome: 'FamiliaEFilhos', label: 'Família e Filhos', icon: 'Users', type: 'despesa' },
    { id: 'cat_impostos_taxas', nome: 'ImpostosETaxas', label: 'Impostos e Taxas', icon: 'Landmark', type: 'despesa' },
    { id: 'cat_lazer_hobbies', nome: 'LazerEHobbies', label: 'Lazer e Hobbies', icon: 'Gamepad2', type: 'despesa' },
    { id: 'cat_mercado', nome: 'Mercado', label: 'Mercado', icon: 'ShoppingCart', type: 'despesa' },
    { id: 'cat_outros', nome: 'Outros', label: 'Outros', icon: 'Tags', type: 'despesa' },
    { id: 'cat_pets', nome: 'Pets', label: 'Pets', icon: 'Dog', type: 'despesa' },
    { id: 'cat_presentes_doacoes', nome: 'PresentesEDoacoes', label: 'Presentes e Doações', icon: 'Gift', type: 'despesa' },
    { id: 'cat_roupas', nome: 'Roupas', label: 'Roupas', icon: 'Shirt', type: 'despesa' },
    { id: 'cat_saude', nome: 'Saude', label: 'Saúde', icon: 'HeartPulse', type: 'despesa' },
    { id: 'cat_trabalho', nome: 'Trabalho', label: 'Trabalho', icon: 'Briefcase', type: 'despesa' },
    { id: 'cat_transporte', nome: 'Transporte', label: 'Transporte', icon: 'Car', type: 'despesa' },
    { id: 'cat_viagem', nome: 'Viagem', label: 'Viagem', icon: 'Plane', type: 'despesa' },
    { id: 'cat_vicios', nome: 'Vicios', label: 'Vícios', icon: 'Flame', type: 'despesa' },
    // Receitas
    { id: 'cat_investimentos', nome: 'Investimentos', label: 'Investimentos', icon: 'BarChart', type: 'receita' },
    { id: 'cat_emprestimos_receita', nome: 'Emprestimos', label: 'Empréstimos', icon: 'Landmark', type: 'receita' },
    { id: 'cat_outras_receitas', nome: 'OutrasReceitas', label: 'Outras Receitas', icon: 'DollarSign', type: 'receita' },
    { id: 'cat_salario', nome: 'Salario', label: 'Salário', icon: 'Wallet', type: 'receita' },
    { id: 'cat_venda', nome: 'Venda', label: 'Venda', icon: 'Tag', type: 'receita' },
];

module.exports = {
    defaultCategories,
};
