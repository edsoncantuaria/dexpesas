import cronService from '../src/services/cronService.js';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function testRecurring() {
    try {
        console.log('--- Starting Recurring Expense Test ---');

        // 1. Create a test group and user if needed (assuming they exist or using existing ones)
        // For simplicity, let's find an existing group
        const group = await prisma.splitGroup.findFirst({
            include: { members: true }
        });

        if (!group) {
            console.error('No split group found. Please create one first.');
            return;
        }

        const payer = group.members[0];
        console.log(`Using Group: ${group.name} (${group.id})`);
        console.log(`Using Payer: ${payer.name} (${payer.id})`);

        // 2. Create a Recurring Expense that is due NOW
        const recurring = await prisma.recurringSplitExpense.create({
            data: {
                groupId: group.id,
                description: 'Test Recurring Expense ' + Date.now(),
                amount: 100.00,
                frequency: 'MONTHLY',
                startDate: new Date(), // Now
                nextRun: new Date(), // Due immediately
                active: true,
                paidById: payer.id,
                splitType: 'EQUAL',
                splits: group.members.map(m => ({ memberId: m.id, percentage: 100 / group.members.length })),
                payers: [{ memberId: payer.id, amount: 100.00 }]
            }
        });

        console.log(`Created Recurring Expense: ${recurring.id}`);

        // 3. Trigger Cron Logic
        console.log('Triggering Cron Check...');
        await cronService.checkRecurringExpenses();

        // 4. Verify Result
        const generatedExpense = await prisma.splitExpense.findFirst({
            where: {
                description: recurring.description,
                groupId: group.id
            }
        });

        if (generatedExpense) {
            console.log('✅ SUCCESS: Expense generated successfully!');
            console.log(`Generated Expense ID: ${generatedExpense.id}`);
            console.log(`Amount: ${generatedExpense.amount}`);
        } else {
            console.error('❌ FAILURE: Expense was not generated.');
        }

        // 5. Verify Next Run Update
        const updatedRecurring = await prisma.recurringSplitExpense.findUnique({
            where: { id: recurring.id }
        });

        console.log(`Next Run Updated to: ${updatedRecurring.nextRun}`);
        if (updatedRecurring.nextRun > new Date()) {
            console.log('✅ SUCCESS: Next run date updated correctly.');
        } else {
            console.error('❌ FAILURE: Next run date was not updated.');
        }

        // Cleanup
        await prisma.splitExpense.deleteMany({ where: { description: recurring.description } });
        await prisma.recurringSplitExpense.delete({ where: { id: recurring.id } });
        console.log('Cleanup done.');

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testRecurring();
