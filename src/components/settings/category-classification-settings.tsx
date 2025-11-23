'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, RotateCcw, Star, Info } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { iconToEmoji } from '@/lib/icon-mapper';
import {
    useCategoryClassifications,
    useUpdateClassification,
    useResetClassifications,
    useInitializeClassifications,
    type CategoryClassificationType,
    type CategoryClassification,
} from '@/hooks/use-category-classifications';

const CLASSIFICATION_OPTIONS: Array<{ value: CategoryClassificationType; label: string; description: string }> = [
    { value: 'ESSENTIAL', label: 'Essencial', description: 'Gastos necessários (moradia, alimentação, saúde)' },
    { value: 'LEISURE', label: 'Lazer', description: 'Entretenimento, viagens, hobbies' },
    { value: 'INVESTMENT', label: 'Investimento', description: 'Aportes e investimentos' },
    { value: 'OTHER', label: 'Outro', description: 'Demais categorias' },
];

const DEFAULT_ESSENTIALS = [
    // Moradia
    'moradia', 'habitação', 'aluguel', 'condomínio', 'iptu', 'casa', 'apartamento',
    // Alimentação
    'mercado', 'supermercado', 'alimentação', 'feira', 'açougue', 'padaria', 'hortifruti',
    // Transporte
    'transporte', 'combustível', 'gasolina', 'ônibus', 'metrô', 'uber', 'táxi', '99', 'estacionamento',
    // Educação
    'educação', 'escola', 'faculdade', 'universidade', 'curso', 'livros', 'material escolar',
    // Saúde
    'saúde', 'médico', 'dentista', 'farmácia', 'remédio', 'plano de saúde', 'consulta', 'exame',
    'hospital', 'clínica', 'laboratório', 'medicamento',
    // Contas e Serviços Essenciais
    'luz', 'água', 'internet', 'telefone', 'celular', 'gás', 'energia', 'conta',
    'contas fixas', 'telefonia', 'banda larga',
    // Higiene e Cuidados Pessoais
    'higiene', 'cuidados', 'pessoal', 'farmácia', 'produtos de limpeza', 'limpeza',
    // Vestuário Básico  
    'roupa', 'calçado', 'vestuário',
    // Seguros
    'seguro', 'previdência',
    // Serviços Bancários
    'banco', 'tarifa', 'anuidade', 'manutenção',
];

const DEFAULT_LEISURE = [
    // Entretenimento
    'lazer', 'entretenimento', 'diversão', 'hobby', 'hobbies',
    // Alimentação Fora
    'restaurante', 'bar', 'lanchonete', 'cafeteria', 'delivery', 'ifood', 'uber eats',
    'fast food', 'pizza', 'hambúrguer',
    // Cultura
    'cinema', 'teatro', 'show', 'evento', 'ingresso', 'espetáculo',
    // Viagens
    'viagem', 'turismo', 'hotel', 'pousada', 'passagem', 'hospedagem',
    // Streaming e Assinaturas de Entretenimento
    'netflix', 'spotify', 'youtube', 'amazon prime', 'disney', 'hbo', 'streaming',
    'apple music', 'deezer', 'games', 'xbox', 'playstation', 'steam',
    // Compras não essenciais
    'shopping', 'compras', 'eletrônicos', 'gadget', 'acessórios',
    // Esportes e Fitness (não essencial)
    'academia', 'personal', 'esporte', 'fitness',
    // Beleza não essencial
    'salão', 'manicure', 'pedicure', 'spa', 'estética', 'beleza',
    // Pets (considerado lazer)
    'pet', 'veterinário', 'ração', 'animal',
];

const DEFAULT_INVESTMENTS = [
    'investimento', 'investimentos', 'poupança', 'aplicação', 'renda fixa',
    'tesouro', 'ações', 'fundos', 'cdb', 'lci', 'lca', 'previdência privada',
    'aporte', 'b3', 'xp', 'nubank investimentos', 'inter investimentos',
];

function isDefaultClassification(categoryName: string, classification: CategoryClassificationType): boolean {
    const lowerName = categoryName.toLowerCase();

    switch (classification) {
        case 'ESSENTIAL':
            return DEFAULT_ESSENTIALS.some(keyword => lowerName.includes(keyword));
        case 'LEISURE':
            return DEFAULT_LEISURE.some(keyword => lowerName.includes(keyword));
        case 'INVESTMENT':
            return DEFAULT_INVESTMENTS.some(keyword => lowerName.includes(keyword));
        default:
            return false;
    }
}

export function CategoryClassificationSettings() {
    const { data: classifications, isLoading: isLoadingClassifications, error: classificationsError } = useCategoryClassifications();
    const { data: categories, isLoading: isLoadingCategories, error: categoriesError } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const response = await api.get('/categories');
            return response.data;
        },
    });

    const updateClassification = useUpdateClassification();
    const resetClassifications = useResetClassifications();
    const initializeClassifications = useInitializeClassifications();

    const [filter, setFilter] = useState<CategoryClassificationType | 'ALL'>('ALL');

    // Mesclar categorias com suas classificações
    const allCategories = useMemo(() => {
        if (!categories) return [];

        const classificationMap = new Map(
            (classifications || []).map(c => [c.categoryId, c])
        );

        // Mapear todas as categorias com suas classificações (ou OTHER se não tiver)
        return categories.map((category: any) => {
            const existingClassification = classificationMap.get(category.id);

            if (existingClassification) {
                return existingClassification;
            }

            // Categoria sem classificação - retorna com OTHER
            return {
                id: `temp-${category.id}`,
                userId: '',
                categoryId: category.id,
                classification: 'OTHER' as CategoryClassificationType,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                category: category,
            };
        });
    }, [categories, classifications]);

    const filteredCategories = useMemo(() => {
        if (filter === 'ALL') return allCategories;
        return allCategories.filter((c: CategoryClassification) => c?.classification === filter);
    }, [allCategories, filter]);

    const handleClassificationChange = (categoryId: string, classification: CategoryClassificationType) => {
        updateClassification.mutate({ categoryId, classification });
    };

    const handleReset = () => {
        if (confirm('Tem certeza que deseja resetar todas as classificações para os padrões?')) {
            resetClassifications.mutate();
        }
    };

    const handleInitialize = () => {
        initializeClassifications.mutate();
    };

    const isLoading = isLoadingClassifications || isLoadingCategories;
    const error = classificationsError || categoriesError;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertDescription>
                    Erro ao carregar classificações. Tente novamente mais tarde.
                </AlertDescription>
            </Alert>
        );
    }

    const hasClassifications = allCategories.length > 0;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Classificação de Categorias</CardTitle>
                    <CardDescription>
                        Configure como suas categorias são classificadas para análises mais precisas de investimentos
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Essenciais</strong>: gastos necessários como moradia, alimentação, transporte.<br />
                            <strong>Lazer</strong>: entretenimento, viagens, restaurantes.<br />
                            <strong>Investimento</strong>: aportes e contribuições para investimentos.
                        </AlertDescription>
                    </Alert>

                    {!hasClassifications && (
                        <Alert>
                            <AlertDescription className="flex items-center justify-between">
                                <span>Você ainda não tem classificações configuradas.</span>
                                <Button onClick={handleInitialize} disabled={initializeClassifications.isPending}>
                                    {initializeClassifications.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Inicializar Padrões
                                </Button>
                            </AlertDescription>
                        </Alert>
                    )}

                    {hasClassifications && (
                        <>
                            <div className="flex items-center justify-between">
                                <Select value={filter} onValueChange={(v) => setFilter(v as CategoryClassificationType | 'ALL')}>
                                    <SelectTrigger className="w-[200px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALL">Todas</SelectItem>
                                        {CLASSIFICATION_OPTIONS.map(opt => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleReset}
                                    disabled={resetClassifications.isPending}
                                >
                                    {resetClassifications.isPending ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <RotateCcw className="mr-2 h-4 w-4" />
                                    )}
                                    Resetar para Padrão
                                </Button>
                            </div>

                            <div className="space-y-2 max-h-[500px] overflow-y-auto">
                                {filteredCategories.map((classification: CategoryClassification) => {
                                    if (!classification) return null;

                                    const isDefault = isDefaultClassification(
                                        classification.category.nome || classification.category.label,
                                        classification.classification
                                    );

                                    return (
                                        <div
                                            key={classification.id}
                                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="text-2xl">
                                                    {iconToEmoji(
                                                        (classification.category as any).icone || classification.category.icon,
                                                        '📁'
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">
                                                            {classification.category.label || classification.category.nome}
                                                        </span>
                                                        {isDefault && (
                                                            <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">
                                                        {classification.category.type === 'despesa' ? 'Despesa' : 'Receita'}
                                                    </span>
                                                </div>
                                            </div>

                                            <Select
                                                value={classification.classification}
                                                onValueChange={(value) =>
                                                    handleClassificationChange(
                                                        classification.categoryId,
                                                        value as CategoryClassificationType
                                                    )
                                                }
                                                disabled={updateClassification.isPending}
                                            >
                                                <SelectTrigger className="w-[160px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {CLASSIFICATION_OPTIONS.map(opt => (
                                                        <SelectItem key={opt.value} value={opt.value}>
                                                            {opt.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    );
                                })}

                                {filteredCategories.length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        Nenhuma categoria encontrada para este filtro
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-sm">Legenda</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                    {CLASSIFICATION_OPTIONS.map(opt => (
                        <div key={opt.value} className="space-y-1">
                            <Badge variant="outline">{opt.label}</Badge>
                            <p className="text-xs text-muted-foreground">{opt.description}</p>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
