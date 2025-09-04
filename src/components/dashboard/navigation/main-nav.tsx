// src/components/dashboard/navigation/main-nav.tsx
'use client';

import { useIsMobile } from "@/hooks/use-mobile";
import { BottomNavBar } from "./bottom-nav-bar";
import { DesktopSidebar } from "./desktop-sidebar";

const navLinks = [
    { href: "/dashboard", label: "Início", iconName: "Home" },
    { href: "/dashboard/transacoes", label: "Transações", iconName: "ArrowLeftRight" },
    { href: "/dashboard/orcamentos", label: "Orçamentos", iconName: "Target" },
    { href: "/dashboard/progresso", label: "Progresso", iconName: "Rocket" },
    { href: "/dashboard/servicos", label: "Serviços", iconName: "Grid3x3" },
];

/**
 * Componente inteligente que renderiza a navegação correta
 * com base no tamanho da tela do dispositivo.
 */
export function MainNav() {
    const isMobile = useIsMobile();

    const mobileLinks = [
        { href: "/dashboard", label: "Início", iconName: "Home" },
        { href: "/dashboard/transacoes", label: "Transações", iconName: "ArrowLeftRight" },
        { href: "/dashboard/orcamentos", label: "Orçamentos", iconName: "Target" },
        { href: "/dashboard/servicos", label: "Serviços", iconName: "Grid3x3" },
    ];

    const NavComponent = isMobile 
        ? <BottomNavBar links={mobileLinks} /> 
        : <DesktopSidebar links={navLinks} />;

    return NavComponent;
}
