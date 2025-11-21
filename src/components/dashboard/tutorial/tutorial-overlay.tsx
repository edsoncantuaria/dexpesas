"use client";

import { useState, useEffect, useCallback } from "react";
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
        targetId: "smart-summary",
        title: "Resumo Inteligente",
        content: "Aqui você tem uma visão geral da sua saúde financeira, com saldo, receitas e despesas do mês.",
        position: "bottom",
    },
    {
        targetId: "mission-board",
        title: "Missões e Conquistas",
        content: "Complete missões semanais para ganhar XP e subir de nível. A gamificação torna suas finanças divertidas!",
        position: "bottom",
    },
    {
        targetId: "add-transaction-btn",
        title: "Adicionar Transação",
        content: "Toque aqui para registrar rapidamente uma nova receita ou despesa.",
        position: "top",
    },
    {
        targetId: "sidebar-trigger", // Assuming there's a trigger or just point to left
        title: "Menu Principal",
        content: "Acesse relatórios, perfil, configurações e outras áreas através do menu lateral.",
        position: "right",
    },
];

export function TutorialOverlay() {
    const { user, fetchUser } = useUser();
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

    // Check if tutorial should run
    useEffect(() => {
        if (user && !user.hasCompletedTutorial) {
            // Small delay to ensure UI is mounted
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, [user]);

    const currentStep = STEPS[currentStepIndex];

    const updateTargetRect = useCallback(() => {
        if (currentStep.targetId) {
            const element = document.getElementById(currentStep.targetId);
            if (element) {
                const rect = element.getBoundingClientRect();
                setTargetRect(rect);
                // Scroll element into view if needed
                element.scrollIntoView({ behavior: "smooth", block: "center" });
            } else {
                // If element not found, fallback to center or skip
                setTargetRect(null);
            }
        } else {
            setTargetRect(null);
        }
    }, [currentStep]);

    useEffect(() => {
        if (isVisible) {
            updateTargetRect();
            window.addEventListener("resize", updateTargetRect);
            window.addEventListener("scroll", updateTargetRect);
            return () => {
                window.removeEventListener("resize", updateTargetRect);
                window.removeEventListener("scroll", updateTargetRect);
            };
        }
    }, [isVisible, currentStepIndex, updateTargetRect]);

    const handleNext = () => {
        if (currentStepIndex < STEPS.length - 1) {
            setCurrentStepIndex((prev) => prev + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = async () => {
        setIsVisible(false);
        try {
            await api.put("/user/preferences", { hasCompletedTutorial: true });
            await fetchUser();
        } catch (error) {
            console.error("Failed to mark tutorial as complete", error);
        }
    };

    const handleSkip = async () => {
        handleComplete();
    };

    if (!isVisible) return null;

    const isSpotlight = !!targetRect;

    return (
        <AnimatePresence>
            {isVisible && (
                <div className="fixed inset-0 z-[100] overflow-hidden">
                    {/* Backdrop / Spotlight */}
                    {isSpotlight ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0 pointer-events-none"
                        >
                            {/* This div creates the spotlight effect using a massive box-shadow */}
                            <div
                                className="absolute rounded-lg transition-all duration-500 ease-in-out"
                                style={{
                                    top: targetRect.top - 4, // Add some padding
                                    left: targetRect.left - 4,
                                    width: targetRect.width + 8,
                                    height: targetRect.height + 8,
                                    boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.75)",
                                }}
                            />
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                        />
                    )}

                    {/* Content Card */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        {/* We use absolute positioning for spotlight steps, and flex center for others */}
                        <motion.div
                            key={currentStepIndex}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{
                                opacity: 1,
                                y: 0,
                                scale: 1,
                                top: isSpotlight ? getTooltipPosition(targetRect, currentStep.position).top : undefined,
                                left: isSpotlight ? getTooltipPosition(targetRect, currentStep.position).left : undefined,
                                position: isSpotlight ? "absolute" : "relative",
                                transform: isSpotlight ? "none" : undefined
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
    // if (top + tooltipHeight > window.innerHeight - 16) top = window.innerHeight - tooltipHeight - 16;

    return { top, left };
}
