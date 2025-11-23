'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Trash2, Edit2, ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory, type Category } from '@/hooks/use-categories';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { iconToEmoji } from '@/lib/icon-mapper';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { IconPicker } from '@/components/ui/icon-picker';

interface CategoryFormProps {
    initialData?: Partial<Category>;
    parentId?: string | null;
    onClose: () => void;
}

function CategoryForm({ initialData, parentId, onClose }: CategoryFormProps) {
    const createCategory = useCreateCategory();
    const updateCategory = useUpdateCategory();
    const [formData, setFormData] = useState<Partial<Category>>({
        nome: initialData?.nome || '',
        label: initialData?.label || '',
        icon: initialData?.icon || 'Tag',
        type: initialData?.type || 'despesa',
        parentCategoryId: parentId || initialData?.parentCategoryId || null,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (initialData?.id) {
            await updateCategory.mutateAsync({ id: initialData.id, ...formData });
        } else {
            await createCategory.mutateAsync(formData);
        }
        onClose();
    };

    const isSubmitting = createCategory.isPending || updateCategory.isPending;

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
                <Label htmlFor="label">Nome da Categoria</Label>
                <Input
                    id="label"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value, nome: e.target.value })}
                    required
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="type">Tipo</Label>
                <Select
                    value={formData.type}
                    onValueChange={(v: 'receita' | 'despesa') => setFormData({ ...formData, type: v })}
                    disabled={!!initialData?.id} // Prevent changing type on edit for simplicity
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="despesa">Despesa</SelectItem>
                        <SelectItem value="receita">Receita</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2">
                <Label>Ícone</Label>
                <IconPicker value={formData.icon || 'Tag'} onChange={(icon) => setFormData({ ...formData, icon })} />
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar
                </Button>
            </DialogFooter>
        </form>
    );
}

interface CategoryItemProps {
    category: Category;
    level?: number;
    onEdit: (category: Category) => void;
    onDelete: (id: string) => void;
    onAddSub: (parentId: string) => void;
    subcategories?: Category[];
}

function CategoryItem({ category, level = 0, onEdit, onDelete, onAddSub, subcategories }: CategoryItemProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasSubs = subcategories && subcategories.length > 0;

    return (
        <div className="select-none">
            <div
                className={cn(
                    "flex items-center justify-between p-2 rounded-lg hover:bg-accent/50 transition-colors group",
                    level > 0 && "ml-6 border-l-2 border-muted pl-4"
                )}
            >
                <div className="flex items-center gap-2 cursor-pointer flex-1" onClick={() => setIsExpanded(!isExpanded)}>
                    {hasSubs ? (
                        isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <div className="w-4" />
                    )}
                    <div className="text-xl w-8 text-center">
                        {iconToEmoji(category.icon, category.type === 'receita' ? '💰' : '💸')}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-medium text-sm">{category.label || category.nome}</span>
                        {category.userId === null && <span className="text-[10px] text-muted-foreground">Padrão do Sistema</span>}
                    </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onAddSub(category.id)}>
                        <Plus className="h-4 w-4" />
                    </Button>
                    {category.userId !== null && (
                        <>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(category)}>
                                <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(category.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </>
                    )}
                </div>
            </div>
            {isExpanded && hasSubs && (
                <div className="mt-1 space-y-1">
                    {subcategories.map(sub => (
                        <CategoryItem
                            key={sub.id}
                            category={sub}
                            level={level + 1}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onAddSub={onAddSub}
                            subcategories={sub.subcategories} // Recursive if we had deeper nesting structure prepared
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export function CategoryManagement() {
    const { data: categories, isLoading } = useCategories();
    const deleteCategory = useDeleteCategory();
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [parentIdToAdd, setParentIdToAdd] = useState<string | null>(null);

    const categoryTree = useMemo(() => {
        if (!categories) return { despesa: [], receita: [] };

        const roots: Record<string, Category[]> = { despesa: [], receita: [] };
        const map = new Map<string, Category>();

        // First pass: create map and init subcategories array
        categories.forEach(c => {
            map.set(c.id, { ...c, subcategories: [] });
        });

        // Second pass: build tree
        categories.forEach(c => {
            const node = map.get(c.id)!;
            if (c.parentCategoryId && map.has(c.parentCategoryId)) {
                map.get(c.parentCategoryId)!.subcategories!.push(node);
            } else {
                if (roots[c.type]) {
                    roots[c.type].push(node);
                }
            }
        });

        return roots;
    }, [categories]);

    const handleAddRoot = () => {
        setEditingCategory(null);
        setParentIdToAdd(null);
        setIsDialogOpen(true);
    };

    const handleAddSub = (parentId: string) => {
        setEditingCategory(null);
        setParentIdToAdd(parentId);
        setIsDialogOpen(true);
    };

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setParentIdToAdd(null);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir esta categoria?')) {
            await deleteCategory.mutateAsync(id);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Gerenciar Categorias</CardTitle>
                    <CardDescription>Crie, edite e organize suas categorias de receitas e despesas.</CardDescription>
                </div>
                <Button onClick={handleAddRoot} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Categoria
                </Button>
            </CardHeader>
            <CardContent>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingCategory ? 'Editar Categoria' : 'Nova Categoria'}</DialogTitle>
                            <DialogDescription>
                                {parentIdToAdd ? 'Adicionando uma subcategoria.' : 'Adicionando uma categoria principal.'}
                            </DialogDescription>
                        </DialogHeader>
                        <CategoryForm
                            initialData={editingCategory || {}}
                            parentId={parentIdToAdd}
                            onClose={() => setIsDialogOpen(false)}
                        />
                    </DialogContent>
                </Dialog>

                <div className="grid md:grid-cols-2 gap-8">
                    <div>
                        <h3 className="font-semibold mb-4 flex items-center gap-2 text-red-500">
                            <span className="p-1 bg-red-100 rounded">💸</span> Despesas
                        </h3>
                        <ScrollArea className="h-[500px] pr-4">
                            <div className="space-y-1">
                                {categoryTree.despesa.map(cat => (
                                    <CategoryItem
                                        key={cat.id}
                                        category={cat}
                                        subcategories={cat.subcategories}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onAddSub={handleAddSub}
                                    />
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-4 flex items-center gap-2 text-green-500">
                            <span className="p-1 bg-green-100 rounded">💰</span> Receitas
                        </h3>
                        <ScrollArea className="h-[500px] pr-4">
                            <div className="space-y-1">
                                {categoryTree.receita.map(cat => (
                                    <CategoryItem
                                        key={cat.id}
                                        category={cat}
                                        subcategories={cat.subcategories}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onAddSub={handleAddSub}
                                    />
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
