#!/usr/bin/env ts-node
/**
 * Script to purge all data from the database (except admin user)
 * Usage: npm run purge:database
 * Or: npx ts-node scripts/purge-database.ts
 * 
 * WARNING: This will delete ALL data except the admin user!
 */

import { createPrismaClient } from '../src/config/create-prisma-client';
import * as dotenv from 'dotenv';
import * as readline from 'readline';

dotenv.config();
const prisma = createPrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function purgeDatabase() {
  console.log('\n⚠️  WARNING: This will delete ALL data from the database!');
  console.log('   Only the admin user will be preserved.\n');

  const answer = await question('Are you sure you want to continue? (yes/no): ');

  if (answer.toLowerCase() !== 'yes') {
    console.log('❌ Operation cancelled.');
    rl.close();
    return;
  }

  try {
    console.log('\n🧹 Starting database purge...\n');

    // Delete in order to respect foreign key constraints
    console.log('📝 Deleting enrollment history...');
    await prisma.enrollment_history.deleteMany({});
    console.log('   ✅ Enrollment history deleted');

    console.log('📝 Deleting academic history...');
    await prisma.academic_history.deleteMany({});
    console.log('   ✅ Academic history deleted');

    console.log('📝 Deleting student documents...');
    await prisma.student_documents.deleteMany({});
    console.log('   ✅ Student documents deleted');

    console.log('📝 Deleting enrollments...');
    await prisma.enrollments.deleteMany({});
    console.log('   ✅ Enrollments deleted');

    console.log('📝 Deleting groups...');
    await prisma.groups.deleteMany({});
    console.log('   ✅ Groups deleted');

    console.log('📝 Deleting prerequisites...');
    await prisma.prerequisites.deleteMany({});
    console.log('   ✅ Prerequisites deleted');

    console.log('📝 Deleting subjects...');
    await prisma.subjects.deleteMany({});
    console.log('   ✅ Subjects deleted');

    console.log('📝 Deleting academic periods...');
    await prisma.academic_periods.deleteMany({});
    console.log('   ✅ Academic periods deleted');

    console.log('📝 Deleting students...');
    await prisma.students.deleteMany({});
    console.log('   ✅ Students deleted');

    console.log('📝 Deleting teachers...');
    await prisma.teachers.deleteMany({});
    console.log('   ✅ Teachers deleted');

    console.log('📝 Deleting careers...');
    await prisma.careers.deleteMany({});
    console.log('   ✅ Careers deleted');

    console.log('📝 Deleting users (except admin)...');
    const adminUser = await prisma.users.findUnique({
      where: { username: 'admin' },
    });

    if (adminUser) {
      await prisma.users.deleteMany({
        where: {
          username: {
            not: 'admin',
          },
        },
      });
      console.log('   ✅ Non-admin users deleted (admin preserved)');
    } else {
      await prisma.users.deleteMany({});
      console.log('   ✅ All users deleted (admin not found)');
    }

    console.log('\n✅ Database purge completed successfully!\n');
    console.log('💡 You can now run the data creation scripts:');
    console.log('   - npm run create:bulk-students');
    console.log('   - npm run create:bulk-teachers');
    console.log('   - npm run create:bulk-subjects');
    console.log('   - npm run create:bulk-groups');
    console.log('   - npm run create:all-data (if available)\n');
  } catch (error) {
    console.error('❌ Error purging database:', error);
    throw error;
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

purgeDatabase()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  });

