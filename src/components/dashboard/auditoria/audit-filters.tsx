"use client"

import * as React from "react"
import { CalendarIcon, Search, X } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface AuditFiltersProps {
    onSearchChange: (value: string) => void
    onDateRangeChange: (range: DateRange | undefined) => void
    onEntityChange: (value: string) => void
    className?: string
}

export function AuditFilters({
    onSearchChange,
    onDateRangeChange,
    onEntityChange,
    className,
}: AuditFiltersProps) {
    const [date, setDate] = React.useState<DateRange | undefined>()
    const [search, setSearch] = React.useState("")
    const [entity, setEntity] = React.useState("all")

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setSearch(value)
        onSearchChange(value)
    }

    const handleDateSelect = (range: DateRange | undefined) => {
        setDate(range)
        onDateRangeChange(range)
    }

    const handleEntitySelect = (value: string) => {
        setEntity(value)
        onEntityChange(value === "all" ? "" : value)
    }

    const clearFilters = () => {
        setSearch("")
        setDate(undefined)
        setEntity("all")
        onSearchChange("")
        onDateRangeChange(undefined)
        onEntityChange("")
    }

    const hasActiveFilters = search || date || entity !== "all"

    return (
        <div className={cn("flex flex-col gap-4 md:flex-row md:items-center", className)}>
            <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Buscar por ID, ação..."
                    value={search}
                    onChange={handleSearch}
                    className="pl-9 bg-card"
                />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                                "justify-start text-left font-normal min-w-[240px]",
                                !date && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date?.from ? (
                                date.to ? (
                                    <>
                                        {format(date.from, "dd/MM/y", { locale: ptBR })} -{" "}
                                        {format(date.to, "dd/MM/y", { locale: ptBR })}
                                    </>
                                ) : (
                                    format(date.from, "dd/MM/y", { locale: ptBR })
                                )
                            ) : (
                                <span>Selecione um período</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={date?.from}
                            selected={date}
                            onSelect={handleDateSelect}
                            numberOfMonths={2}
                            locale={ptBR}
                        />
                    </PopoverContent>
                </Popover>

                <Select value={entity} onValueChange={handleEntitySelect}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filtrar por tipo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os tipos</SelectItem>
                        <SelectItem value="TRANSACTION">Transações</SelectItem>
                        <SelectItem value="ACCOUNT">Contas</SelectItem>
                        <SelectItem value="CATEGORY">Categorias</SelectItem>
                        <SelectItem value="USER">Usuário</SelectItem>
                        <SelectItem value="GOAL">Metas</SelectItem>
                    </SelectContent>
                </Select>

                {hasActiveFilters && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={clearFilters}
                        className="shrink-0 text-muted-foreground hover:text-foreground"
                        title="Limpar filtros"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    )
}
