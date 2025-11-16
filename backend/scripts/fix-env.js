#!/usr/bin/env node
/**
 * Script to fix .env file format and encode special characters in DATABASE_URL
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');

console.log('🔧 Fixing .env file...\n');

// Read current .env
let envContent = '';
try {
  envContent = fs.readFileSync(envPath, 'utf8');
  console.log('📄 Current .env content:');
  console.log(envContent);
  console.log('');
} catch (error) {
  console.error('❌ Error reading .env file:', error.message);
  process.exit(1);
}

// Fix DATABASE_URL format
// Remove duplicate "DATABASE_URL="
let fixedContent = envContent.replace(/DATABASE_URL="DATABASE_URL="/g, 'DATABASE_URL="');

// Extract password from DATABASE_URL to encode @
const dbUrlMatch = fixedContent.match(/DATABASE_URL="mysql:\/\/root:(.*?)@localhost:3306\/sipi_db"/);
if (dbUrlMatch) {
  const password = dbUrlMatch[1];
  console.log(`🔑 Found password in DATABASE_URL: ${password}`);
  
  // Encode @ as %40
  const encodedPassword = password.replace(/@/g, '%40');
  
  if (password !== encodedPassword) {
    console.log(`✅ Encoded password: ${encodedPassword}`);
    fixedContent = fixedContent.replace(
      /DATABASE_URL="mysql:\/\/root:(.*?)@localhost:3306\/sipi_db"/,
      `DATABASE_URL="mysql://root:${encodedPassword}@localhost:3306/sipi_db"`
    );
  }
}

// Check if PORT and FRONTEND_URL exist
if (!fixedContent.includes('PORT=')) {
  fixedContent += '\nPORT=3001\n';
  console.log('✅ Added PORT=3001');
}

if (!fixedContent.includes('FRONTEND_URL=')) {
  fixedContent += '\nFRONTEND_URL="http://localhost:5173"\n';
  console.log('✅ Added FRONTEND_URL');
}

// Write fixed content
try {
  fs.writeFileSync(envPath, fixedContent, 'utf8');
  console.log('\n✅ .env file fixed successfully!\n');
  console.log('📄 Updated .env content:');
  console.log(fixedContent);
} catch (error) {
  console.error('❌ Error writing .env file:', error.message);
  process.exit(1);
}

