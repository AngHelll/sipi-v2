#!/usr/bin/env node
/**
 * Script to verify .env file configuration
 * Run with: node scripts/verify-env.js
 */

require('dotenv').config();

const requiredEnvVars = {
  DATABASE_URL: {
    required: true,
    pattern: /^mysql:\/\/(?:.+:.+@|.+@).+:\d+\/.+$/,
    description: 'MySQL connection string in format: mysql://user:password@host:port/database or mysql://user@host:port/database (sin contraseña)',
  },
  JWT_SECRET: {
    required: true,
    minLength: 32,
    description: 'JWT secret key (should be at least 32 characters for security)',
  },
  PORT: {
    required: true,
    pattern: /^\d+$/,
    description: 'Server port number',
  },
  FRONTEND_URL: {
    required: true,
    pattern: /^https?:\/\/.+/,
    description: 'Frontend URL for CORS configuration',
  },
};

console.log('🔍 Verifying .env configuration...\n');

let hasErrors = false;
let hasWarnings = false;

for (const [key, config] of Object.entries(requiredEnvVars)) {
  const value = process.env[key];

  if (!value) {
    if (config.required) {
      console.error(`❌ ${key}: Missing (required)`);
      console.error(`   ${config.description}\n`);
      hasErrors = true;
    } else {
      console.warn(`⚠️  ${key}: Missing (optional)`);
      hasWarnings = true;
    }
    continue;
  }

  // Check pattern if provided
  if (config.pattern && !config.pattern.test(value)) {
    console.error(`❌ ${key}: Invalid format`);
    console.error(`   Current: ${value}`);
    console.error(`   Expected: ${config.description}\n`);
    hasErrors = true;
    continue;
  }

  // Check minimum length if provided
  if (config.minLength && value.length < config.minLength) {
    console.warn(`⚠️  ${key}: Too short (minimum ${config.minLength} characters)`);
    console.warn(`   Current length: ${value.length}\n`);
    hasWarnings = true;
    continue;
  }

  // Mask sensitive values for display
  let displayValue = value;
  if (key === 'DATABASE_URL') {
    // Mask password in DATABASE_URL
    displayValue = value.replace(/:([^:@]+)@/, ':****@');
  } else if (key === 'JWT_SECRET') {
    displayValue = value.substring(0, 10) + '...';
  }

  console.log(`✅ ${key}: ${displayValue}`);
}

console.log('');

if (hasErrors) {
  console.error('❌ Configuration has errors. Please fix them before running the application.\n');
  process.exit(1);
} else if (hasWarnings) {
  console.warn('⚠️  Configuration has warnings. Review them for best practices.\n');
  process.exit(0);
} else {
  console.log('✅ All required environment variables are properly configured!\n');
  process.exit(0);
}

