import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

const achievements = [
    // === INICIANTES (XP 10-30) ===
    {
        name: 'Primeiros Passos',
        description: 'Crie sua conta e faça o primeiro login.',
        xp: 10,
        icon: 'Footprints',
        trigger: 'LOGIN',
        criteria: JSON.stringify({ count: 1 })
    },
    {
        name: 'Organizado',
        description: 'Crie sua primeira categoria de despesas.',
        xp: 15,
        icon: 'FolderPlus',
        trigger: 'CATEGORY_CREATED',
        criteria: JSON.stringify({ count: 1 })
    },
    {
        name: 'Poupador Iniciante',
        description: 'Registre sua primeira receita.',
        xp: 20,
        icon: 'PiggyBank',
        trigger: 'TRANSACTION_CREATED',
        criteria: JSON.stringify({ type: 'receita', count: 1 })
    },
    {
        name: 'Gastador Consciente',
        description: 'Registre sua primeira despesa.',
        xp: 20,
        icon: 'Receipt',
        trigger: 'TRANSACTION_CREATED',
        criteria: JSON.stringify({ type: 'despesa', count: 1 })
    },
    {
        name: 'Planejador',
        description: 'Defina um orçamento para uma categoria.',
        xp: 25,
        icon: 'Target',
        trigger: 'BUDGET_CREATED',
        criteria: JSON.stringify({ count: 1 })
    },
    {
        name: 'Explorador',
        description: 'Acesse todas as abas do dashboard.',
        xp: 30,
        icon: 'Compass',
        trigger: 'NAVIGATION',
        criteria: JSON.stringify({ tabs: 'all' })
    },

    // === INTERMEDIÁRIAS (XP 40-70) ===
    {
        name: 'Mestre das Categorias',
        description: 'Crie 5 categorias diferentes.',
        xp: 40,
        icon: 'Layers',
        trigger: 'CATEGORY_CREATED',
        criteria: JSON.stringify({ count: 5 })
    },
    {
        name: 'Fluxo Constante',
        description: 'Registre receitas por 3 meses seguidos.',
        xp: 50,
        icon: 'TrendingUp',
        trigger: 'STREAK',
        criteria: JSON.stringify({ type: 'income', months: 3 })
    },
    {
        name: 'Guardião do Orçamento',
        description: 'Não estoure nenhum orçamento por 1 mês.',
        xp: 60,
        icon: 'ShieldCheck',
        trigger: 'BUDGET_ADHERENCE',
        criteria: JSON.stringify({ duration: '1 month' })
    },
    {
        name: 'Investidor Aprendiz',
        description: 'Crie uma meta de investimento.',
        xp: 45,
        icon: 'Sprout',
        trigger: 'GOAL_CREATED',
        criteria: JSON.stringify({ type: 'investment' })
    },
    {
        name: 'Focado',
        description: 'Complete 5 missões semanais.',
        xp: 55,
        icon: 'Crosshair',
        trigger: 'MISSION_COMPLETED',
        criteria: JSON.stringify({ count: 5 })
    },
    {
        name: 'Socialite',
        description: 'Adicione um amigo ou membro da família.',
        xp: 40,
        icon: 'Users',
        trigger: 'FRIEND_ADDED',
        criteria: JSON.stringify({ count: 1 })
    },
    {
        name: 'Generoso',
        description: 'Faça uma doação registrada.',
        xp: 50,
        icon: 'Heart',
        trigger: 'TRANSACTION_CREATED',
        criteria: JSON.stringify({ category: 'Doacao' })
    },
    {
        name: 'Leitor Voraz',
        description: 'Gaste em Livros ou Educação 3 vezes.',
        xp: 45,
        icon: 'BookOpen',
        trigger: 'TRANSACTION_CREATED',
        criteria: JSON.stringify({ category: 'Educacao', count: 3 })
    },
    {
        name: 'Saúde de Ferro',
        description: 'Invista em Saúde ou Esporte 5 vezes.',
        xp: 50,
        icon: 'Dumbbell',
        trigger: 'TRANSACTION_CREATED',
        criteria: JSON.stringify({ category: 'Saude', count: 5 })
    },
    {
        name: 'Viajante',
        description: 'Crie uma meta de viagem.',
        xp: 60,
        icon: 'Plane',
        trigger: 'GOAL_CREATED',
        criteria: JSON.stringify({ category: 'Viagem' })
    },

    // === AVANÇADAS (XP 80-100) ===
    {
        name: 'Magnata',
        description: 'Acumule R$ 10.000 em patrimônio.',
        xp: 100,
        icon: 'Crown',
        trigger: 'NET_WORTH',
        criteria: JSON.stringify({ amount: 10000 })
    },
    {
        name: 'Oráculo Financeiro',
        description: 'Mantenha o orçamento verde por 6 meses.',
        xp: 90,
        icon: 'Eye',
        trigger: 'BUDGET_STREAK',
        criteria: JSON.stringify({ months: 6 })
    },
    {
        name: 'Lenda da Disciplina',
        description: 'Complete 50 missões diárias.',
        xp: 85,
        icon: 'Star',
        trigger: 'MISSION_COMPLETED',
        criteria: JSON.stringify({ count: 50, type: 'daily' })
    },
    {
        name: 'Mestre dos Investimentos',
        description: 'Complete 3 metas de investimento.',
        xp: 95,
        icon: 'Briefcase',
        trigger: 'GOAL_COMPLETED',
        criteria: JSON.stringify({ count: 3, type: 'investment' })
    },
    {
        name: 'Guru da Sabedoria',
        description: 'Atinja 80+ em Sabedoria.',
        xp: 100,
        icon: 'Scroll',
        trigger: 'ATTRIBUTE_LEVEL',
        criteria: JSON.stringify({ attribute: 'Sabedoria', level: 80 })
    },
    {
        name: 'Titã da Força',
        description: 'Atinja 80+ em Força.',
        xp: 100,
        icon: 'Swords',
        trigger: 'ATTRIBUTE_LEVEL',
        criteria: JSON.stringify({ attribute: 'Forca', level: 80 })
    },
    {
        name: 'Muralha da Resistência',
        description: 'Atinja 80+ em Resistência.',
        xp: 100,
        icon: 'Shield',
        trigger: 'ATTRIBUTE_LEVEL',
        criteria: JSON.stringify({ attribute: 'Resistencia', level: 80 })
    },
    {
        name: 'Filho da Sorte',
        description: 'Atinja 80+ em Sorte.',
        xp: 100,
        icon: 'Clover',
        trigger: 'ATTRIBUTE_LEVEL',
        criteria: JSON.stringify({ attribute: 'Sorte', level: 80 })
    },

    // === ESPECIAIS / DIVERTIDAS ===
    {
        name: 'Café Lover',
        description: 'Registre 10 gastos com "Café" ou "Padaria".',
        xp: 30,
        icon: 'Coffee',
        trigger: 'TRANSACTION_KEYWORD',
        criteria: JSON.stringify({ keywords: ['cafe', 'padaria'], count: 10 })
    },
    {
        name: 'Pizza Night',
        description: 'Gaste com Pizza numa sexta-feira.',
        xp: 25,
        icon: 'Pizza',
        trigger: 'TRANSACTION_TIME',
        criteria: JSON.stringify({ keyword: 'pizza', day: 'Friday' })
    },
    {
        name: 'Tech Enthusiast',
        description: 'Compre um item de tecnologia caro.',
        xp: 70,
        icon: 'Smartphone',
        trigger: 'TRANSACTION_VALUE',
        criteria: JSON.stringify({ category: 'Eletronicos', minAmount: 1000 })
    },
    {
        name: 'Gamer',
        description: 'Gaste com jogos ou consoles.',
        xp: 40,
        icon: 'Gamepad',
        trigger: 'TRANSACTION_CATEGORY',
        criteria: JSON.stringify({ category: 'Jogos' })
    },
    {
        name: 'Pet Lover',
        description: 'Gaste com seu animal de estimação.',
        xp: 35,
        icon: 'Dog',
        trigger: 'TRANSACTION_CATEGORY',
        criteria: JSON.stringify({ category: 'Pets' })
    },
    {
        name: 'Cinema',
        description: 'Registre um gasto com cinema.',
        xp: 20,
        icon: 'Film',
        trigger: 'TRANSACTION_KEYWORD',
        criteria: JSON.stringify({ keyword: 'cinema' })
    },
    {
        name: 'Músico',
        description: 'Gaste com instrumentos ou shows.',
        xp: 50,
        icon: 'Music',
        trigger: 'TRANSACTION_CATEGORY',
        criteria: JSON.stringify({ category: 'Musica' })
    },
    {
        name: 'Chef de Cozinha',
        description: 'Gaste mais de R$ 500 em mercado no mês.',
        xp: 45,
        icon: 'Utensils',
        trigger: 'MONTHLY_SPENDING',
        criteria: JSON.stringify({ category: 'Mercado', minAmount: 500 })
    },
    {
        name: 'Fitness',
        description: 'Pague a mensalidade da academia.',
        xp: 30,
        icon: 'Activity',
        trigger: 'TRANSACTION_KEYWORD',
        criteria: JSON.stringify({ keyword: 'academia' })
    },
    {
        name: 'Zen',
        description: 'Gaste com meditação, yoga ou terapia.',
        xp: 40,
        icon: 'Flower',
        trigger: 'TRANSACTION_KEYWORD',
        criteria: JSON.stringify({ keywords: ['yoga', 'terapia', 'meditacao'] })
    },
    {
        name: 'Rei do Camarote',
        description: 'Gaste mais de R$ 200 em uma saída noturna.',
        xp: 35,
        icon: 'PartyPopper',
        trigger: 'TRANSACTION_VALUE',
        criteria: JSON.stringify({ category: 'Lazer', minAmount: 200 })
    },
    {
        name: 'Mão de Vaca',
        description: 'Passe 3 dias sem registrar gastos.',
        xp: 50,
        icon: 'Lock',
        trigger: 'NO_SPEND_STREAK',
        criteria: JSON.stringify({ days: 3 })
    },
    {
        name: 'Colecionador',
        description: 'Tenha 10 itens no inventário (se existisse).',
        xp: 40,
        icon: 'Package',
        trigger: 'INVENTORY_COUNT',
        criteria: JSON.stringify({ count: 10 })
    },
    {
        name: 'Veterano',
        description: 'Use o app por 1 ano.',
        xp: 100,
        icon: 'Medal',
        trigger: 'ACCOUNT_AGE',
        criteria: JSON.stringify({ days: 365 })
    }
];

async function main() {
    console.log('🌱 Seeding achievements...');

    for (const achievement of achievements) {
        const existing = await prisma.achievement.findFirst({
            where: { name: achievement.name }
        });

        if (existing) {
            await prisma.achievement.update({
                where: { id: existing.id },
                data: achievement
            });
        } else {
            await prisma.achievement.create({
                data: achievement
            });
        }
    }

    console.log('✅ Achievements seeded successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
