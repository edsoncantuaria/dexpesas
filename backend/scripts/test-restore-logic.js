// Test script for backup restore logic
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import BackupService from '../src/services/backupService.js';

const prisma = new PrismaClient();

async function main() {
    console.log('🧪 Testing Backup Restore Logic\n');

    // Create a test user
    const testUser = await prisma.user.upsert({
        where: { email: 'test-restore@example.com' },
        update: {},
        create: {
            email: 'test-restore@example.com',
            username: 'test-restore-user',
            password: 'hashedpassword',
            name: 'Test User'
        }
    });

    console.log(`✅ Test user created: ${testUser.id}\n`);

    // Create some existing data
    const existingCategory = await prisma.category.create({
        data: {
            userId: testUser.id,
            nome: 'existing-category',
            label: 'Existing Category',
            type: 'despesa',
            icon: '📦'
        }
    });

    console.log('✅ Created existing category\n');

    // Test 1: Check conflicts
    console.log('=== Test 1: Check Conflicts ===');
    const conflicts = await BackupService.checkConflicts(testUser.id);
    console.log('Conflicts:', JSON.stringify(conflicts, null, 2));
    console.log(`Expected: hasConflicts=true, categories=1 ✓\n`);

    // Create a mock backup
    const mockBackup = {
        version: '1.0',
        exportDate: new Date().toISOString(),
        categories: [
            {
                id: 'new-category-id-123',
                userId: testUser.id,
                nome: 'new-category-backup',
                label: 'New Category from Backup',
                type: 'receita',
                icon: '💰'
            }
        ],
        accounts: [],
        cards: [],
        transactions: [],
        budgets: [],
        goals: [],
        automations: [],
        categorizationRules: [],
        tags: [],
        categoryClassifications: []
    };

    // Test 2: Merge strategy
    console.log('=== Test 2: Merge Strategy ===');
    const mergeResult = await BackupService.restoreBackup(testUser.id, mockBackup, { strategy: 'merge' });
    console.log('Merge result:', mergeResult);

    const categoriesAfterMerge = await prisma.category.findMany({ where: { userId: testUser.id } });
    console.log(`Categories after merge: ${categoriesAfterMerge.length}`);
    console.log('Category labels:', categoriesAfterMerge.map(c => c.label));
    console.log(`Expected: 2 categories (existing + new) ✓\n`);

    // Test 3: Skip strategy
    console.log('=== Test 3: Skip Strategy ===');
    const mockBackup2 = {
        ...mockBackup,
        categories: [
            {
                id: 'another-new-category-456',
                userId: testUser.id,
                nome: 'another-new',
                label: 'Another New Category',
                type: 'despesa',
                icon: '🎯'
            }
        ]
    };

    const skipResult = await BackupService.restoreBackup(testUser.id, mockBackup2, {
        strategy: 'skip',
        tablesToSkip: ['categories']
    });
    console.log('Skip result:', skipResult);

    const categoriesAfterSkip = await prisma.category.findMany({ where: { userId: testUser.id } });
    console.log(`Categories after skip: ${categoriesAfterSkip.length}`);
    console.log('Category labels:', categoriesAfterSkip.map(c => c.label));
    console.log(`Expected: Still 2 categories (skipped restore) ✓\n`);

    // Test 4: Replace strategy
    console.log('=== Test 4: Replace Strategy ===');
    const replaceResult = await BackupService.restoreBackup(testUser.id, mockBackup, { strategy: 'replace' });
    console.log('Replace result:', replaceResult);

    const categoriesAfterReplace = await prisma.category.findMany({ where: { userId: testUser.id } });
    console.log(`Categories after replace: ${categoriesAfterReplace.length}`);
    console.log('Category labels:', categoriesAfterReplace.map(c => c.label));
    console.log(`Expected: 1 category (only from backup) ✓\n`);

    // Cleanup
    console.log('🧹 Cleaning up test data...');
    await prisma.category.deleteMany({ where: { userId: testUser.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    console.log('✅ Cleanup complete\n');

    console.log('🎉 All tests completed!');
}

main()
    .catch((e) => {
        console.error('❌ Test failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
