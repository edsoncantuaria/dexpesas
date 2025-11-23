// src/lib/icon-mapper.ts

/**
 * Mapeia nomes de ícones Lucide React para seus respectivos emojis
 */
export const ICON_TO_EMOJI: Record<string, string> = {
    // Alimentação
    'Utensils': '🍽️',
    'Coffee': '☕',
    'Pizza': '🍕',
    'Sandwich': '🥪',
    'Apple': '🍎',
    'Carrot': '🥕',

    // Finanças e Compras
    'Wallet': '💰',
    'CreditCard': '💳',
    'Banknote': '💵',
    'Receipt': '🧾',
    'ShoppingCart': '🛒',
    'ShoppingBag': '🛍️',
    'Tag': '🏷️',

    // Moradia e Casa
    'Home': '🏠',
    'Building': '🏢',
    'House': '🏡',
    'Key': '🔑',

    // Transporte
    'Car': '🚗',
    'Bus': '🚌',
    'Train': '🚆',
    'Bike': '🚲',
    'Plane': '✈️',
    'Fuel': '⛽',

    // Saúde e Cuidados
    'Heart': '❤️',
    'Activity': '💪',
    'Stethoscope': '🩺',
    'Pill': '💊',
    'Syringe': '💉',
    'Droplet': '💧',
    'GlassWater': '🥤',

    // Entretenimento e Lazer
    'Film': '🎬',
    'Music': '🎵',
    'Gamepad2': '🎮',
    'Ticket': '🎫',
    'Camera': '📷',
    'Palmtree': '🌴',
    'Plane': '✈️',
    'MapPin': '📍',

    // Educação
    'GraduationCap': '🎓',
    'Book': '📚',
    'BookOpen': '📖',
    'Pencil': '✏️',

    // Utilidades
    'Zap': '⚡',
    'Droplets': '💧',
    'Wifi': '📶',
    'Phone': '📱',
    'Smartphone': '📱',

    // Pets
    'Dog': '🐕',
    'Cat': '🐈',
    'PawPrint': '🐾',

    // Vestuário
    'Shirt': '👕',
    'ShoppingBag': '👜',

    // Serviços
    'Scissors': '✂️',
    'Sparkles': '✨',
    'Wrench': '🔧',
    'Settings': '⚙️',

    // Investimentos
    'TrendingUp': '📈',
    'PiggyBank': '🐷',
    'DollarSign': '💵',
    'Coins': '🪙',
    'ChartBar': '📊',

    // Outros
    'Gift': '🎁',
    'Package': '📦',
    'Mail': '✉️',
    'FileText': '📄',
    'Calendar': '📅',
    'Clock': '🕐',
    'Star': '⭐',
    'Smile': '😊',
    'ThumbsUp': '👍',
};

/**
 * Converte nome de ícone para emoji, com fallback para emoji padrão
 */
export function iconToEmoji(iconName: string | undefined, fallback: string = '📁'): string {
    if (!iconName) return fallback;
    return ICON_TO_EMOJI[iconName] || fallback;
}
