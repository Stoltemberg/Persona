import {
    BadgeCent,
    Briefcase,
    Car,
    Film,
    Gift,
    HeartPulse,
    House,
    Landmark,
    ShoppingBasket,
    Tag,
    UtensilsCrossed,
} from 'lucide-react';

const ICONS = {
    tag: Tag,
    shopping: ShoppingBasket,
    home: House,
    food: UtensilsCrossed,
    work: Briefcase,
    transport: Car,
    health: HeartPulse,
    fun: Film,
    money: BadgeCent,
    savings: Landmark,
    gift: Gift,
};

export const CATEGORY_ICON_OPTIONS = [
    { key: 'tag', label: 'Geral', Icon: Tag },
    { key: 'shopping', label: 'Compras', Icon: ShoppingBasket },
    { key: 'home', label: 'Casa', Icon: House },
    { key: 'food', label: 'Alimentacao', Icon: UtensilsCrossed },
    { key: 'work', label: 'Trabalho', Icon: Briefcase },
    { key: 'transport', label: 'Transporte', Icon: Car },
    { key: 'health', label: 'Saude', Icon: HeartPulse },
    { key: 'fun', label: 'Lazer', Icon: Film },
    { key: 'money', label: 'Receita', Icon: BadgeCent },
    { key: 'savings', label: 'Reserva', Icon: Landmark },
    { key: 'gift', label: 'Presente', Icon: Gift },
];

const LEGACY_ICON_MAP = {
    '\uD83C\uDFF7\uFE0F': 'tag',
    '\uD83D\uDED2': 'shopping',
    '\uD83C\uDFE0': 'home',
    '\uD83C\uDF54': 'food',
    '\uD83D\uDCBC': 'work',
    '\uD83D\uDE97': 'transport',
    '\u2764\uFE0F': 'health',
    '\uD83C\uDFAC': 'fun',
    '\uD83D\uDCB0': 'money',
    '\uD83C\uDF81': 'gift',
};

export function normalizeCategoryIcon(icon) {
    if (!icon) return 'tag';
    if (ICONS[icon]) return icon;
    if (LEGACY_ICON_MAP[icon]) return LEGACY_ICON_MAP[icon];
    return 'tag';
}

export function getCategoryIconComponent(icon) {
    return ICONS[normalizeCategoryIcon(icon)] || Tag;
}

export function CategoryIcon({ icon, size = 18, ...props }) {
    const Icon = getCategoryIconComponent(icon);
    return <Icon size={size} {...props} />;
}
