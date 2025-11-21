'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dumbbell, BookOpen, Shield, Sparkles, TrendingUp, ArrowUp, ArrowDown, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const attributeInfo = [
    {
        name: "Força",
        icon: Dumbbell,
        color: "text-red-500 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800",
        iconColor: "text-red-500",
        description: "Representa sua saúde financeira e capacidade de gerar renda",
        increases: [
            { label: "Receitas", detail: "Salário, renda extra (+2.0)" },
            { label: "Saúde & Esporte", detail: "Academia, médicos (+1.5~1.8)" },
        ],
        decreases: [
            { label: "Lazer Excessivo", detail: "Compromete sua produtividade (-0.5)" },
        ],
        tip: "Foque em aumentar renda e cuidar da saúde. Lazer com moderação!"
    },
    {
        name: "Sabedoria",
        icon: BookOpen,
        color: "text-blue-500 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
        iconColor: "text-blue-500",
        description: "Mede seu investimento em conhecimento e educação",
        increases: [
            { label: "Educação", detail: "Cursos, faculdade (+2.0)" },
            { label: "Livros & Conteúdo", detail: "Livros, assinaturas (+1.5)" },
        ],
        decreases: [
            { label: "Gastos Impulsivos", detail: "Lazer sem planejamento (-0.3)" },
            { label: "Receitas Altas", detail: "Sem educação contínua (-0.2)" },
        ],
        tip: "Invista constantemente em conhecimento para decisões melhores."
    },
    {
        name: "Resistência",
        icon: Shield,
        color: "text-green-500 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800",
        iconColor: "text-green-500",
        description: "Reflete sua capacidade de poupar e proteger patrimônio",
        increases: [
            { label: "Investimentos", detail: "Ações, fundos, renda fixa (+2.0)" },
            { label: "Poupança & Seguros", detail: "Reservas e proteção (+1.3~1.5)" },
        ],
        decreases: [
            { label: "Lazer Sem Controle", detail: "Diminui suas reservas (-0.5)" },
            { label: "Educação Cara", detail: "Pode atrasar investimentos (-0.2)" },
        ],
        tip: "Poupe regularmente antes de gastar. Seu futuro agradece!"
    },
    {
        name: "Sorte",
        icon: Sparkles,
        color: "text-amber-500 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
        iconColor: "text-amber-500",
        description: "Representa sua generosidade e equilíbrio social",
        increases: [
            { label: "Caridade", detail: "Doações e ajuda (+2.0)" },
            { label: "Presentes & Lazer", detail: "Relações e diversão (+1.0~1.5)" },
        ],
        decreases: [
            { label: "Dívidas", detail: "Empréstimos não pagos (-1.5)" },
            { label: "Assinaturas", detail: "Gastos recorrentes sem valor (-0.1)" },
        ],
        tip: "Seja generoso, divirta-se, mas evite dívidas a todo custo!"
    }
];

export function AttributeExplainer() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5 text-primary" />
                    Como Funcionam os Atributos
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <Alert>
                    <TrendingUp className="h-4 w-4" />
                    <AlertDescription>
                        <strong>Sistema de Equilíbrio:</strong> Cada gasto aumenta alguns atributos e diminui outros.
                        Não existe build perfeita - você precisa balancear seus gastos! Os retornos diminuem conforme o atributo aumenta, mantendo o jogo desafiador.
                    </AlertDescription>
                </Alert>

                <div className="grid gap-4 md:grid-cols-2">
                    {attributeInfo.map((attr) => (
                        <Card key={attr.name} className={`border-2 ${attr.color}`}>
                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-2">
                                    <div className={`p-2 rounded-lg bg-background`}>
                                        <attr.icon className={`h-5 w-5 ${attr.iconColor}`} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{attr.name}</h3>
                                        <p className="text-xs text-muted-foreground">{attr.description}</p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {/* Increases */}
                                <div>
                                    <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-2 flex items-center gap-1">
                                        <ArrowUp className="h-3 w-3" />
                                        AUMENTA COM:
                                    </p>
                                    <div className="space-y-1.5">
                                        {attr.increases.map((inc) => (
                                            <div key={inc.label} className="flex items-start gap-2">
                                                <Badge variant="outline" className="shrink-0 text-[10px] h-5 border-green-300 text-green-700 dark:text-green-400">
                                                    {inc.label}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">{inc.detail}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Decreases */}
                                <div>
                                    <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-1">
                                        <ArrowDown className="h-3 w-3" />
                                        DIMINUI COM:
                                    </p>
                                    <div className="space-y-1.5">
                                        {attr.decreases.map((dec) => (
                                            <div key={dec.label} className="flex items-start gap-2">
                                                <Badge variant="outline" className="shrink-0 text-[10px] h-5 border-red-300 text-red-700 dark:text-red-400">
                                                    {dec.label}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">{dec.detail}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-2 border-t">
                                    <p className="text-xs italic text-muted-foreground">
                                        💡 {attr.tip}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
