'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ICON_TO_EMOJI } from '@/lib/icon-mapper';
import * as LucideIcons from 'lucide-react';

// Extract icon names from our curated list
const ICON_NAMES = Object.keys(ICON_TO_EMOJI);

interface IconPickerProps {
    value: string;
    onChange: (value: string) => void;
}

export function IconPicker({ value, onChange }: IconPickerProps) {
    const [open, setOpen] = React.useState(false);

    const SelectedIcon = (LucideIcons as any)[value] || LucideIcons.HelpCircle;

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    <div className="flex items-center gap-2">
                        <SelectedIcon className="h-4 w-4" />
                        <span>{value || "Selecione um ícone..."}</span>
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Buscar ícone..." />
                    <CommandList>
                        <CommandEmpty>Ícone não encontrado.</CommandEmpty>
                        <CommandGroup className="max-h-[300px] overflow-y-auto">
                            <div className="grid grid-cols-5 gap-2 p-2">
                                {ICON_NAMES.map((iconName) => {
                                    const Icon = (LucideIcons as any)[iconName];
                                    if (!Icon) return null;

                                    return (
                                        <CommandItem
                                            key={iconName}
                                            value={iconName}
                                            onSelect={(currentValue) => {
                                                onChange(currentValue === value ? "" : currentValue);
                                                setOpen(false);
                                            }}
                                            className={cn(
                                                "flex flex-col items-center justify-center gap-1 p-2 h-16 rounded-md cursor-pointer transition-colors",
                                                value === iconName ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                                            )}
                                        >
                                            <Icon className="h-6 w-6" />
                                            {/* <span className="text-[10px] truncate w-full text-center">{iconName}</span> */}
                                        </CommandItem>
                                    );
                                })}
                            </div>
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
