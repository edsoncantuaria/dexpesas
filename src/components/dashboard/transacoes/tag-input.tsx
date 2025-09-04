// src/components/dashboard/transacoes/tag-input.tsx
'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, PlusCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Tag } from '@/lib/definitions';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface TagInputProps {
  allTags: Tag[];
  selectedTags: string[];
  onChange: (selectedTagIds: string[]) => void;
  onTagsUpdate: (allTags: Tag[]) => void;
}

export function TagInput({ allTags, selectedTags, onChange, onTagsUpdate }: TagInputProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const { toast } = useToast();

  const selectedTagObjects = React.useMemo(() => {
    return allTags.filter(tag => selectedTags.includes(tag.id));
  }, [selectedTags, allTags]);

  const handleUnselect = (tagId: string) => {
    onChange(selectedTags.filter(id => id !== tagId));
  };

  const handleSelect = (tagId: string) => {
    if (!selectedTags.includes(tagId)) {
      onChange([...selectedTags, tagId]);
    } else {
        handleUnselect(tagId);
    }
  };

  const handleCreateTag = async () => {
    const newTagName = inputValue.trim();
    if (newTagName === '') return;
    
    // Otimista: verifica se a tag já existe localmente
    const existingTag = allTags.find(tag => tag.name.toLowerCase() === newTagName.toLowerCase());
    if (existingTag) {
        handleSelect(existingTag.id);
        setInputValue('');
        return;
    }

    try {
      const response = await api.post('/tags', { name: newTagName });
      const newTag = response.data;
      onTagsUpdate([...allTags, newTag]); // Atualiza a lista geral
      handleSelect(newTag.id); // Seleciona a nova tag
      setInputValue('');
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar tag',
        description: error.response?.data?.message || 'Não foi possível criar a tag.',
      });
    }
  };

  return (
    <div className="space-y-2">
       <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full h-auto justify-start"
          >
             <div className="flex gap-1 flex-wrap">
              {selectedTagObjects.length > 0 ? selectedTagObjects.map(tag => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="mr-1 group/badge"
                >
                  {tag.name}
                   <span
                        role="button"
                        tabIndex={0}
                        aria-label={`Remover ${tag.name}`}
                        onKeyDown={(e) => {
                           if (e.key === 'Enter' || e.key === ' ') {
                               e.preventDefault();
                               e.stopPropagation();
                               handleUnselect(tag.id);
                           }
                        }}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation(); // Impede que o popover abra/feche
                            handleUnselect(tag.id);
                        }}
                        className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    >
                        <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </span>
                </Badge>
              )) : (
                <span className="text-muted-foreground">Selecione ou crie tags...</span>
              )}
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput 
                placeholder="Buscar ou criar tag..."
                value={inputValue}
                onValueChange={setInputValue}
            />
            <CommandList>
                <CommandEmpty>
                    <button
                        type="button"
                        className="w-full text-left p-2 text-sm hover:bg-muted rounded-md flex items-center"
                        onClick={handleCreateTag}
                    >
                       <PlusCircle className="mr-2 h-4 w-4" /> Criar nova tag: "{inputValue}"
                    </button>
                </CommandEmpty>
                <CommandGroup>
                {allTags.map((tag) => (
                    <CommandItem
                    key={tag.id}
                    onSelect={() => {
                        handleSelect(tag.id);
                    }}
                    >
                    <Check
                        className={cn(
                        'mr-2 h-4 w-4',
                        selectedTags.includes(tag.id) ? 'opacity-100' : 'opacity-0'
                        )}
                    />
                    {tag.name}
                    </CommandItem>
                ))}
                </CommandGroup>
                {inputValue && !allTags.some(t => t.name.toLowerCase() === inputValue.toLowerCase()) && (
                    <>
                    <CommandSeparator />
                    <CommandGroup>
                         <CommandItem onSelect={handleCreateTag}>
                           <PlusCircle className="mr-2 h-4 w-4" />
                            Criar e selecionar "{inputValue}"
                        </CommandItem>
                    </CommandGroup>
                    </>
                )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
