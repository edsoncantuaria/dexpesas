'use client';

import { useState } from 'react';
import { useCategories } from '@/hooks/use-categories';
import { useSubcategories } from '@/hooks/use-subcategories';
import { Category } from '@/lib/definitions';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IconPicker } from '@/components/ui/icon-picker';
import { Plus, Trash2, Edit2, Layers, ArrowRight, Search } from 'lucide-react';
import { iconToEmoji } from '@/lib/icon-mapper';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function PremiumSubcategoryManager() {
    const { data: categories } = useCategories();
    const [selectedParent, setSelectedParent] = useState<Category | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Filter only parent categories
    const parentCategories = categories?.filter(c => !c.parentCategoryId) || [];

    const filteredCategories = parentCategories.filter(c =>
        c.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Gerenciador de Subcategorias</h2>
                    <p className="text-muted-foreground">Selecione uma categoria para gerenciar suas subdivisões.</p>
                </div>
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar categoria..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredCategories.map(cat => (
                    <Card
                        key={cat.id}
                        className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
                        onClick={() => setSelectedParent(cat)}
                    >
                        <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                            <div className={cn(
                                "w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transition-transform group-hover:scale-110",
                                "bg-muted group-hover:bg-primary/10 text-primary"
                            )}>
                                {iconToEmoji(cat.icon || undefined)}
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-semibold truncate w-full">{cat.label}</h3>
                                <p className="text-xs text-muted-foreground capitalize">{cat.type}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Manage Subcategories Dialog */}
            <ResponsiveDialog
                isOpen={!!selectedParent}
                setIsOpen={(open) => !open && setSelectedParent(null)}
                title={selectedParent?.label || ''}
                description="Gerenciando subcategorias"
            >
                {selectedParent && (
                    <div className="h-[60vh] md:h-[500px]">
                        <SubcategoryList parent={selectedParent} />
                    </div>
                )}
            </ResponsiveDialog>
        </div>
    );
}

function SubcategoryList({ parent }: { parent: Category }) {
    const { subcategories, createSubcategory, updateSubcategory, deleteSubcategory } = useSubcategories(parent.id);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingSub, setEditingSub] = useState<Category | null>(null);
    const [formData, setFormData] = useState({ label: '', icon: '' });

    const handleCreate = () => {
        createSubcategory.mutate({
            nome: formData.label.toLowerCase().replace(/\s+/g, '-'),
            label: formData.label,
            icon: formData.icon,
            parentId: parent.id
        }, {
            onSuccess: () => {
                setIsCreateOpen(false);
                setFormData({ label: '', icon: '' });
            }
        });
    };

    const handleUpdate = () => {
        if (!editingSub) return;
        updateSubcategory.mutate({
            id: editingSub.id,
            label: formData.label,
            icon: formData.icon
        }, {
            onSuccess: () => {
                setEditingSub(null);
                setFormData({ label: '', icon: '' });
            }
        });
    };

    return (
        <div className="h-full flex flex-col">
            <div className="pb-4 flex justify-end">
                <Button onClick={() => {
                    setFormData({ label: '', icon: 'Tag' });
                    setIsCreateOpen(true);
                }}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Subcategoria
                </Button>
            </div>

            <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4">
                    {subcategories?.map((sub: Category) => (
                        <div key={sub.id} className="group relative flex items-center gap-4 p-4 rounded-xl border bg-card hover:shadow-md transition-all hover:border-primary/50">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-lg">
                                {iconToEmoji(sub.icon || undefined)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">{sub.label}</div>
                                <div className="text-xs text-muted-foreground">Subcategoria</div>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => {
                                    setEditingSub(sub);
                                    setFormData({ label: sub.label, icon: sub.icon || 'Tag' });
                                }}>
                                    <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => {
                                    if (confirm('Tem certeza que deseja excluir esta subcategoria?')) {
                                        deleteSubcategory.mutate(sub.id);
                                    }
                                }}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    {subcategories?.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed rounded-xl bg-muted/10">
                            <p>Nenhuma subcategoria encontrada.</p>
                            <Button variant="link" onClick={() => {
                                setFormData({ label: '', icon: 'Tag' });
                                setIsCreateOpen(true);
                            }}>Criar a primeira</Button>
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Create Dialog - Nested */}
            <ResponsiveDialog
                isOpen={isCreateOpen}
                setIsOpen={setIsCreateOpen}
                title="Nova Subcategoria"
                description={`Adicione uma subcategoria para ${parent.label}`}
            >
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Nome</Label>
                        <Input
                            placeholder="Ex: Uber, Restaurante..."
                            value={formData.label}
                            onChange={e => setFormData({ ...formData, label: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Ícone</Label>
                        <IconPicker
                            value={formData.icon}
                            onChange={icon => setFormData({ ...formData, icon })}
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                        <Button onClick={handleCreate}>Criar</Button>
                    </div>
                </div>
            </ResponsiveDialog>

            {/* Edit Dialog - Nested */}
            <ResponsiveDialog
                isOpen={!!editingSub}
                setIsOpen={(open) => !open && setEditingSub(null)}
                title="Editar Subcategoria"
            >
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Nome</Label>
                        <Input
                            value={formData.label}
                            onChange={e => setFormData({ ...formData, label: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Ícone</Label>
                        <IconPicker
                            value={formData.icon}
                            onChange={icon => setFormData({ ...formData, icon })}
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setEditingSub(null)}>Cancelar</Button>
                        <Button onClick={handleUpdate}>Salvar</Button>
                    </div>
                </div>
            </ResponsiveDialog>
        </div>
    );
}
