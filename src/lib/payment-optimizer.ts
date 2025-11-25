import { SplitGroupMember, SplitExpense, SplitSettlement } from './definitions';

export interface PaymentPlan {
    fromId: string;
    toId: string;
    amount: number;
}

export function calculateNetBalances(
    members: SplitGroupMember[],
    expenses: SplitExpense[],
    settlements: SplitSettlement[]
): Record<string, number> {
    const balances: Record<string, number> = {};

    // Initialize balances
    members.forEach(m => balances[m.id] = 0);

    // Process expenses
    expenses.forEach(expense => {
        const paidBy = expense.paidById;
        const amount = Number(expense.amount);

        // Credit the payers
        if (expense.payers && expense.payers.length > 0) {
            expense.payers.forEach(payer => {
                balances[payer.memberId] = (balances[payer.memberId] || 0) + Number(payer.amount);
            });
        } else if (paidBy) {
            // Legacy support for single payer
            balances[paidBy] = (balances[paidBy] || 0) + amount;
        }

        // Debit the split members
        if (expense.splits) {
            expense.splits.forEach(split => {
                const memberId = split.memberId;
                const splitAmount = Number(split.amount);
                balances[memberId] = (balances[memberId] || 0) - splitAmount;
            });
        }
    });

    // Process settlements (payments already made)
    settlements.forEach(settlement => {
        const from = settlement.fromId;
        const to = settlement.toId;
        const amount = Number(settlement.amount);

        // Payer (from) gets credit (debt reduced)
        balances[from] = (balances[from] || 0) + amount;
        // Receiver (to) gets debit (credit reduced)
        balances[to] = (balances[to] || 0) - amount;
    });

    return balances;
}

export function optimizePayments(balances: Record<string, number>): PaymentPlan[] {
    const debtors: { id: string; amount: number }[] = [];
    const creditors: { id: string; amount: number }[] = [];

    // Separate into debtors and creditors
    Object.entries(balances).forEach(([id, amount]) => {
        // Use a small threshold to avoid floating point errors
        if (amount < -0.01) {
            debtors.push({ id, amount });
        } else if (amount > 0.01) {
            creditors.push({ id, amount });
        }
    });

    // Sort by absolute amount descending to minimize transactions (greedy approach)
    debtors.sort((a, b) => a.amount - b.amount); // Ascending (most negative first)
    creditors.sort((a, b) => b.amount - a.amount); // Descending (most positive first)

    const plan: PaymentPlan[] = [];
    let i = 0; // debtor index
    let j = 0; // creditor index

    while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];

        // The amount to transfer is the minimum of what the debtor owes and what the creditor is owed
        const amount = Math.min(Math.abs(debtor.amount), creditor.amount);

        // Record the transaction
        plan.push({
            fromId: debtor.id,
            toId: creditor.id,
            amount: Number(amount.toFixed(2))
        });

        // Update remaining amounts
        debtor.amount += amount;
        creditor.amount -= amount;

        // If debtor is settled (close to 0), move to next debtor
        if (Math.abs(debtor.amount) < 0.01) {
            i++;
        }

        // If creditor is settled (close to 0), move to next creditor
        if (creditor.amount < 0.01) {
            j++;
        }
    }

    return plan;
}
