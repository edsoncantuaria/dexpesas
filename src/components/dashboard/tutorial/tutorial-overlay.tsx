"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useUser } from "@/contexts/UserContext";
import api from "@/lib/api";
import { X, ChevronRight, Check } from "lucide-react";

interface Step {
    targetId?: string;
    title: string;
    content: string;
    position?: "top" | "bottom" | "left" | "right" | "center";
}

const STEPS: Step[] = [
    {
        title: "Bem-vindo ao Dexpesas!",
        content: "Que tal um tour rápido para conhecer as principais funcionalidades? Leva menos de 1 minuto.",
        position: "center",
    },
    {
        title: "Resumo Inteligente",
        content: "No topo do dashboard você tem uma visão geral da sua saúde financeira, com saldo, receitas e despesas do mês.",
        position: "center",
    },
    {
        title: "Missões e Conquistas",
        content: "Complete missões semanais para ganhar XP e subir de nível. A gamificação torna suas finanças divertidas!",
        position: "center",
    },
    {
        title: "Adicionar Transação",
        content: "Use o botão '+' para registrar rapidamente uma nova receita ou despesa.",
        position: "center",
    },
    {
        title: "Menu Principal",
        content: "Acesse relatórios, perfil, configurações e outras áreas através do menu lateral. Aproveite o Dexpesas!",
        position: "center",
    },
];

export function TutorialOverlay() {
    const { user, fetchUser } = useUser();
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const isProcessingRef = useRef(false);

    // Check if tutorial should run based on database value
    useEffect(() => {
        if (!user) return;

        console.log('[Tutorial] User hasCompletedTutorial:', user.hasCompletedTutorial);

        if (!user.hasCompletedTutorial && !isVisible && !isProcessingRef.current) {
            console.log('[Tutorial] Showing tutorial');
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        } else if (user.hasCompletedTutorial && isVisible) {
            console.log('[Tutorial] Tutorial completed, hiding');
            setIsVisible(false);
        }
    }, [user?.hasCompletedTutorial, isVisible]);

    const currentStep = STEPS[currentStepIndex];

    const handleNext = () => {
        console.log('[Tutorial] Next clicked, current step:', currentStepIndex);
        if (currentStepIndex < STEPS.length - 1) {
            setCurrentStepIndex((prev) => prev + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = async () => {
        if (isProcessingRef.current) {
            console.log('[Tutorial] Already processing, skipping');
            return;
        }

        isProcessingRef.current = true;
        console.log('[Tutorial] Marking tutorial as complete...');

        try {
            const response = await api.put("/user/preferences", { hasCompletedTutorial: true });
            console.log('[Tutorial] API response:', response.data);

            // Wait for user context to update
            await fetchUser();
            console.log('[Tutorial] User data refreshed successfully');

            // Hide after data is refreshed
            setIsVisible(false);
        } catch (error) {
            console.error("[Tutorial] Failed to mark tutorial as complete", error);
            setIsVisible(false);
        } finally {
            isProcessingRef.current = false;
        }
    };

    const handleSkip = async () => {
        console.log('[Tutorial] Skip clicked');
        await handleComplete();
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[100] overflow-hidden">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                    />

                    {/* Content Card - Always Centered */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <motion.div
                            key={currentStepIndex}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{
                                opacity: 1,
                                y: 0,
                                scale: 1,
                            }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                            className="pointer-events-auto bg-card text-card-foreground p-6 rounded-xl shadow-2xl border border-border w-[90vw] max-w-md"
                            style={{
                                // Ensure it stays on screen
                                maxWidth: "calc(100vw - 32px)",
                            }}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="text-lg font-bold">{currentStep.title}</h3>
                                <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-2" onClick={handleSkip}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            <p className="text-muted-foreground mb-6">{currentStep.content}</p>

                            <div className="flex justify-between items-center">
                                <div className="flex gap-1">
                                    {STEPS.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`h-1.5 rounded-full transition-all ${idx === currentStepIndex ? "w-6 bg-primary" : "w-1.5 bg-muted"
                                                }`}
                                        />
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="ghost" onClick={handleSkip} className="text-xs">
                                        Pular
                                    </Button>
                                    <Button onClick={handleNext} className="gap-2">
                                        {currentStepIndex === STEPS.length - 1 ? "Concluir" : "Próximo"}
                                        {currentStepIndex === STEPS.length - 1 ? <Check className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}
        </AnimatePresence>
    );
}

function getTooltipPosition(rect: DOMRect | null, position: Step["position"] = "bottom") {
    if (!rect) return {};

    const gap = 16;
    const tooltipWidth = 320; // Approximate width
    // const tooltipHeight = 200; // Approximate height

    let top = 0;
    let left = 0;

    switch (position) {
        case "top":
            top = rect.top - gap - 200; // Estimate height
            left = rect.left + rect.width / 2 - tooltipWidth / 2;
            break;
        case "bottom":
            top = rect.bottom + gap;
            left = rect.left + rect.width / 2 - tooltipWidth / 2;
            break;
        case "left":
            top = rect.top;
            left = rect.left - gap - tooltipWidth;
            break;
        case "right":
            top = rect.top;
            left = rect.right + gap;
            break;
        case "center":
        default:
            return {}; // Handled by flex center
    }

    // Basic boundary checks (very simple)
    if (left < 16) left = 16;
    if (left + tooltipWidth > window.innerWidth - 16) left = window.innerWidth - tooltipWidth - 16;
    if (top < 16) top = 16;

    // Estimate tooltip height for better positioning
    const tooltipHeight = 200;
    if (top + tooltipHeight > window.innerHeight - 16) {
        // If tooltip would be off-screen at bottom, position it above the target instead
        if (position === 'bottom' && rect) {
            top = rect.top - gap - tooltipHeight;
            // Re-check if it's now off-screen at top
            if (top < 16) top = 16;
        } else {
            top = window.innerHeight - tooltipHeight - 16;
        }
    }

    return { top, left };
}
