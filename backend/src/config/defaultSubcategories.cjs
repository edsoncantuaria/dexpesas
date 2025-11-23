'use strict';

/**
 * Mapeamento de subcategorias padrão por ID da categoria pai.
 */
const defaultSubcategories = {
    'cat_alimentacao': [
        { nome: 'Supermercado', label: 'Supermercado', icon: 'ShoppingCart' },
        { nome: 'Restaurante', label: 'Restaurante', icon: 'Utensils' },
        { nome: 'Delivery', label: 'Delivery', icon: 'Bike' },
        { nome: 'CafeLanches', label: 'Café e Lanches', icon: 'Coffee' },
    ],
    'cat_transporte': [
        { nome: 'Combustivel', label: 'Combustível', icon: 'Fuel' },
        { nome: 'Aplicativo', label: 'Uber / 99', icon: 'Car' },
        { nome: 'Manutencao', label: 'Manutenção', icon: 'Wrench' },
        { nome: 'Estacionamento', label: 'Estacionamento', icon: 'ParkingSquare' },
        { nome: 'TransportePublico', label: 'Transporte Público', icon: 'Bus' },
        { nome: 'IPVA', label: 'IPVA / Licenciamento', icon: 'FileText' },
    ],
    'cat_casa': [
        { nome: 'AluguelCondominio', label: 'Aluguel / Condomínio', icon: 'Home' },
        { nome: 'Contas', label: 'Luz / Água / Gás', icon: 'Zap' },
        { nome: 'InternetTV', label: 'Internet / TV', icon: 'Wifi' },
        { nome: 'ManutencaoCasa', label: 'Manutenção / Reparos', icon: 'Hammer' },
        { nome: 'Limpeza', label: 'Produtos de Limpeza', icon: 'SprayCan' },
        { nome: 'Decoracao', label: 'Móveis e Decoração', icon: 'Sofa' },
    ],
    'cat_saude': [
        { nome: 'Farmacia', label: 'Farmácia', icon: 'Pill' },
        { nome: 'Consultas', label: 'Consultas / Exames', icon: 'Stethoscope' },
        { nome: 'PlanoSaude', label: 'Plano de Saúde', icon: 'HeartPulse' },
        { nome: 'Academia', label: 'Academia / Esportes', icon: 'Dumbbell' },
        { nome: 'Terapia', label: 'Terapia / Psicólogo', icon: 'Brain' },
    ],
    'cat_lazer_hobbies': [
        { nome: 'Streaming', label: 'Streaming / Assinaturas', icon: 'Tv' },
        { nome: 'CinemaTeatro', label: 'Cinema / Teatro', icon: 'Ticket' },
        { nome: 'Jogos', label: 'Jogos / Games', icon: 'Gamepad2' },
        { nome: 'Livros', label: 'Livros / Hobbies', icon: 'BookOpen' },
        { nome: 'Bares', label: 'Bares / Festas', icon: 'Beer' },
    ],
    'cat_compras': [
        { nome: 'Roupas', label: 'Roupas e Acessórios', icon: 'Shirt' },
        { nome: 'Eletronicos', label: 'Eletrônicos', icon: 'Smartphone' },
        { nome: 'Presentes', label: 'Presentes', icon: 'Gift' },
        { nome: 'Cosmeticos', label: 'Cosméticos / Beleza', icon: 'Sparkles' },
    ],
    'cat_educacao': [
        { nome: 'Cursos', label: 'Cursos / Workshops', icon: 'GraduationCap' },
        { nome: 'Mensalidade', label: 'Mensalidade Escolar', icon: 'School' },
        { nome: 'Material', label: 'Material Escolar', icon: 'Pencil' },
    ],
    'cat_pets': [
        { nome: 'Racao', label: 'Ração / Petiscos', icon: 'Bone' },
        { nome: 'Veterinario', label: 'Veterinário', icon: 'Stethoscope' },
        { nome: 'BanhoTosa', label: 'Banho e Tosa', icon: 'Scissors' },
        { nome: 'Brinquedos', label: 'Brinquedos / Acessórios', icon: 'Dog' },
    ],
    'cat_viagem': [
        { nome: 'Passagens', label: 'Passagens', icon: 'Plane' },
        { nome: 'Hospedagem', label: 'Hospedagem', icon: 'Hotel' },
        { nome: 'Passeios', label: 'Passeios / Turismo', icon: 'Camera' },
    ],
    'cat_assinaturas_servicos': [
        { nome: 'Software', label: 'Software / Apps', icon: 'AppWindow' },
        { nome: 'Servicos', label: 'Serviços Gerais', icon: 'Briefcase' },
    ],
    'cat_dividas_emprestimos': [
        { nome: 'CartaoCredito', label: 'Pagamento de Cartão', icon: 'CreditCard' },
        { nome: 'Emprestimo', label: 'Empréstimo', icon: 'Landmark' },
    ],
    'cat_investimentos': [
        { nome: 'RendaFixa', label: 'Renda Fixa / CDB', icon: 'TrendingUp' },
        { nome: 'Acoes', label: 'Ações / FIIs', icon: 'BarChart3' },
        { nome: 'Cripto', label: 'Criptomoedas', icon: 'Bitcoin' },
        { nome: 'Reserva', label: 'Reserva de Emergência', icon: 'ShieldCheck' },
    ],
    'cat_salario': [
        { nome: 'SalarioMensal', label: 'Salário Mensal', icon: 'Wallet' },
        { nome: 'DecimoTerceiro', label: '13º Salário', icon: 'Gift' },
        { nome: 'Ferias', label: 'Férias', icon: 'Palmtree' },
        { nome: 'Bonus', label: 'Bônus / PLR', icon: 'Trophy' },
    ],
    'cat_outras_receitas': [
        { nome: 'Reembolso', label: 'Reembolso', icon: 'RefreshCw' },
        { nome: 'Presente', label: 'Presente em Dinheiro', icon: 'Gift' },
    ]
};

module.exports = { defaultSubcategories };
