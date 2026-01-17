import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

// Load existing .env
config();

const envPath = path.join(__dirname, '../../.env');
const envExamplePath = path.join(__dirname, '../../.env.example');

console.log('🔧 Database URL Setup Helper\n');

// Check if .env exists
if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found!');
  console.log('📝 Creating .env file from template...\n');
  
  // Create .env from example if it exists
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ Created .env file\n');
  } else {
    // Create basic .env
    const basicEnv = `# Database Connection
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/ju_activity_hub?schema=public"

# Clerk Authentication
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key_here
CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:8080
`;
    fs.writeFileSync(envPath, basicEnv);
    console.log('✅ Created basic .env file\n');
  }
}

// Read current .env
let envContent = fs.readFileSync(envPath, 'utf-8');

// Check current DATABASE_URL
const dbUrlMatch = envContent.match(/^DATABASE_URL=(.+)$/m);
const currentUrl = dbUrlMatch ? dbUrlMatch[1].replace(/^["']|["']$/g, '') : '';

console.log('📋 Current DATABASE_URL:');
if (currentUrl) {
  // Mask password in display
  const maskedUrl = currentUrl.replace(/:([^:@]+)@/, ':****@');
  console.log(`   ${maskedUrl}\n`);
  
  // Check if it has placeholder values
  if (currentUrl.includes('USER') || currentUrl.includes('PASSWORD') || 
      currentUrl.includes('YOUR_PASSWORD') || currentUrl.includes('DATABASE')) {
    console.log('⚠️  WARNING: DATABASE_URL contains placeholder values!\n');
    console.log('📝 You need to replace them with actual values:\n');
    console.log('   Format: postgresql://username:password@host:port/database?schema=public\n');
    console.log('   Example: postgresql://postgres:mypassword@localhost:5432/ju_activity_hub?schema=public\n');
    
    // Try to provide a template
    const template = `DATABASE_URL="postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/ju_activity_hub?schema=public"`;
    console.log('📝 Update your .env file with:');
    console.log(`   ${template}\n`);
    console.log('   Replace YOUR_POSTGRES_PASSWORD with your actual PostgreSQL password\n');
    
    process.exit(1);
  }
} else {
  console.log('   ❌ Not set!\n');
  console.log('📝 Add this to your .env file:\n');
  console.log('   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/ju_activity_hub?schema=public"\n');
  console.log('   Replace YOUR_PASSWORD with your actual PostgreSQL password\n');
  process.exit(1);
}

// Test connection
console.log('🔍 Testing database connection...\n');

const { Pool } = require('pg');
const pool = new Pool({ connectionString: currentUrl });

pool.query('SELECT version()')
  .then((result: any) => {
    console.log('✅ Database connection successful!');
    console.log(`   PostgreSQL version: ${result.rows[0].version.split(',')[0]}\n`);
    
    // Check if database exists
    return pool.query("SELECT current_database(), current_user");
  })
  .then((result: any) => {
    console.log(`   Database: ${result.rows[0].current_database}`);
    console.log(`   User: ${result.rows[0].current_user}\n`);
    
    console.log('✅ Your DATABASE_URL is correctly configured!\n');
    console.log('🚀 You can now run:');
    console.log('   npx prisma migrate dev\n');
    
    pool.end();
    process.exit(0);
  })
  .catch((error: any) => {
    console.error('❌ Database connection failed!\n');
    console.error(`Error: ${error.message}\n`);
    
    if (error.message.includes('password authentication failed')) {
      console.log('💡 The password in DATABASE_URL is incorrect.');
      console.log('   Please check your PostgreSQL password and update .env file.\n');
    } else if (error.message.includes('does not exist')) {
      console.log('💡 The database does not exist.');
      console.log('   Create it with:');
      console.log('   psql -U postgres');
      console.log('   CREATE DATABASE ju_activity_hub;\n');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Cannot connect to PostgreSQL server.');
      console.log('   Make sure PostgreSQL is running on localhost:5432\n');
    }
    
    pool.end();
    process.exit(1);
  });
