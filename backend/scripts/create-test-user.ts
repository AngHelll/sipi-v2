#!/usr/bin/env ts-node
/**
 * Script to create a test admin user
 * Usage: npm run create:user
 * Or: npx ts-node scripts/create-test-user.ts
 */

import bcrypt from 'bcryptjs';
import prisma from '../src/config/database';

// Default credentials for initial setup
// ⚠️ SECURITY WARNING: Change these credentials immediately after first login in production!
// Use environment variables DEFAULT_ADMIN_USERNAME and DEFAULT_ADMIN_PASSWORD for custom values
const DEFAULT_USERNAME = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
const DEFAULT_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
const DEFAULT_ROLE = 'ADMIN';

async function createTestUser() {
  try {
    console.log('🔧 Creating test user...\n');

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { username: DEFAULT_USERNAME },
    });

    if (existingUser) {
      console.log(`⚠️  User "${DEFAULT_USERNAME}" already exists!`);
      console.log('   If you want to reset the password, delete the user first.\n');
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        username: DEFAULT_USERNAME,
        passwordHash,
        role: DEFAULT_ROLE,
      },
    });

    console.log('✅ Test user created successfully!\n');
    console.log('📋 Credentials:');
    console.log(`   Username: ${DEFAULT_USERNAME}`);
    console.log(`   Password: ${DEFAULT_PASSWORD}`);
    console.log(`   Role: ${DEFAULT_ROLE}`);
    console.log(`   User ID: ${user.id}\n`);
    console.log('💡 You can now use these credentials to login.\n');
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createTestUser();

