'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Check, ChevronsUpDown, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BRAZILIAN_BANKS, filterBanks } from '@/lib/banks';
import { motion } from 'framer-motion';

interface AccountsStepProps {
    onComplete: (accounts: any[]) => void;
    onBack: () => void;
    initialData?: any[];
}

export function AccountsStep({ onComplete, onBack, initialData }: AccountsStepProps) {
    const [accountCount, setAccountCount] = useState(initialData?.length || 1);
    const [accounts, setAccounts] = useState(initialData || [{
        nome: '',
        instituicao: '',
        tipo: 'corrente' as 'corrente' | 'poupanca' | 'investimento',
        saldoInicial: 0,
        accountNumber: '',
        agencyNumber: '',
        notes: '',
    }]);
    const [openBankPicker, setOpenBankPicker] = useState<number | null>(null);
    const [bankSearch, setBankSearch] = useState('');

    const handleSubmit = () => {
        // Validate
        const validAccounts = accounts.filter(acc => acc.nome && acc.instituicao);

        // Check for negative balances in corrente accounts
        const negativeAccounts = validAccounts.filter(
            acc => acc.tipo === 'corrente' && acc.saldoInicial < 0
        );

        if (negativeAccounts.length > 0) {
            const confirm = window.confirm(
                `Algumas contas correntes têm saldo negativo. Tem certeza que deseja continuar?`
            );
            if (!confirm) return;
        }

        onComplete(validAccounts.length > 0 ? validAccounts : []);
    };

    const updateAccount = (index: number, field: string, value: any) => {
        const newAccounts = [...accounts];
        if (!newAccounts[index]) {
            newAccounts[index] = {
                nome: '',
                instituicao: '',
                tipo: 'corrente',
                saldoInicial: 0,
                accountNumber: '',
                agencyNumber: '',
                notes: '',
            };
        }
        newAccounts[index] = { ...newAccounts[index], [field]: value };
        setAccounts(newAccounts);
    };

    const hasNegativeBalance = (account: any) => {
        return account.tipo === 'corrente' && account.saldoInicial < 0;
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
        >
            <div>
                <h2 className="text-2xl font-bold">Contas Bancárias</h2>
                <p className="text-muted-foreground">Quantas contas você tem?</p>
            </div>

            <div className="space-y-4">
                <div>
                    <Label>Quantidade de Contas</Label>
                    <Select
                        value={String(accountCount)}
                        onValueChange={(v) => {
                            const count = Number(v);
                            setAccountCount(count);
                            setAccounts(Array.from({ length: count }, (_, i) =>
                                accounts[i] || {
                                    nome: '',
                                    instituicao: '',
                                    tipo: 'corrente' as const,
                                    saldoInicial: 0,
                                    accountNumber: '',
                                    agencyNumber: '',
                                    notes: '',
                                }
                            ));
                        }}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                                <SelectItem key={n} value={String(n)}>{n} conta{n > 1 ? 's' : ''}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {accounts.map((account, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={cn(
                            "p-4 border rounded-lg space-y-4",
                            hasNegativeBalance(account) && "border-orange-500 bg-orange-50 dark:bg-orange-950/20"
                        )}
                    >
                        <h4 className="font-medium">Conta #{index + 1}</h4>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Nome/Apelido *</Label>
                                <Input
                                    placeholder="Ex: Conta Principal"
                                    value={account.nome}
                                    onChange={(e) => updateAccount(index, 'nome', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>Banco/Instituição *</Label>
                                <Popover
                                    open={openBankPicker === index}
                                    onOpenChange={(open) => setOpenBankPicker(open ? index : null)}
                                >
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className="w-full justify-between"
                                        >
                                            {account.instituicao || "Selecione ou digite..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0">
                                        <Command>
                                            <CommandInput
                                                placeholder="Buscar banco..."
                                                value={bankSearch}
                                                onValueChange={setBankSearch}
                                            />
                                            <CommandEmpty>
                                                <div className="p-2">
                                                    <p className="text-sm text-muted-foreground mb-2">
                                                        Banco não encontrado
                                                    </p>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="w-full"
                                                        onClick={() => {
                                                            updateAccount(index, 'instituicao', bankSearch);
                                                            setOpenBankPicker(null);
                                                            setBankSearch('');
                                                        }}
                                                    >
                                                        Usar "{bankSearch}"
                                                    </Button>
                                                </div>
                                            </CommandEmpty>
                                            <CommandGroup className="max-h-[200px] overflow-y-auto">
                                                {filterBanks(bankSearch).map((bank) => (
                                                    <CommandItem
                                                        key={bank}
                                                        value={bank}
                                                        onSelect={() => {
                                                            updateAccount(index, 'instituicao', bank);
                                                            setOpenBankPicker(null);
                                                            setBankSearch('');
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                account.instituicao === bank ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        {bank}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Tipo de Conta *</Label>
                                <Select
                                    value={account.tipo}
                                    onValueChange={(v) => updateAccount(index, 'tipo', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="corrente">Conta Corrente</SelectItem>
                                        <SelectItem value="poupanca">Poupança</SelectItem>
                                        <SelectItem value="investimento">Investimento</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Saldo Atual (R$) *</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={account.saldoInicial || ''}
                                    onChange={(e) => updateAccount(index, 'saldoInicial', Number(e.target.value))}
                                />
                            </div>
                        </div>

                        {/* Optional fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-muted-foreground">Agência (opcional)</Label>
                                <Input
                                    placeholder="0001"
                                    value={account.agencyNumber}
                                    onChange={(e) => updateAccount(index, 'agencyNumber', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Conta (opcional)</Label>
                                <Input
                                    placeholder="12345-6"
                                    value={account.accountNumber}
                                    onChange={(e) => updateAccount(index, 'accountNumber', e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <Label className="text-muted-foreground">Observações (opcional)</Label>
                            <Textarea
                                placeholder="Adicione notas sobre esta conta..."
                                value={account.notes}
                                onChange={(e) => updateAccount(index, 'notes', e.target.value)}
                                className="resize-none"
                                rows={2}
                                maxLength={200}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                {account.notes?.length || 0}/200
                            </p>
                        </div>

                        {hasNegativeBalance(account) && (
                            <Alert className="border-orange-500">
                                <AlertTriangle className="h-4 w-4 text-orange-600" />
                                <AlertDescription>
                                    Saldo negativo detectado nesta conta corrente.
                                </AlertDescription>
                            </Alert>
                        )}
                    </motion.div>
                ))}
            </div>

            <div className="flex justify-between">
                <Button variant="outline" onClick={onBack}>Voltar</Button>
                <Button onClick={handleSubmit}>Próximo</Button>
            </div>
        </motion.div>
    );
}
