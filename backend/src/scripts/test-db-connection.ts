import { config } from 'dotenv';
import { Pool } from 'pg';

// Load environment variables
config();

async function testConnection() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL is not set in .env file');
    console.log('\n📝 Please add DATABASE_URL to your .env file:');
    console.log('   DATABASE_URL="postgresql://username:password@localhost:5432/database_name?schema=public"');
    process.exit(1);
  }

  console.log('🔍 Testing database connection...');
  console.log(`📍 Connection string: ${connectionString.replace(/:[^:@]+@/, ':****@')}\n`);

  const pool = new Pool({ connectionString });

  try {
    // Test connection
    const client = await pool.connect();
    console.log('✅ Successfully connected to database!');
    
    // Get database info
    const dbResult = await client.query('SELECT current_database(), current_user, version()');
    console.log(`\n📊 Database Info:`);
    console.log(`   Database: ${dbResult.rows[0].current_database}`);
    console.log(`   User: ${dbResult.rows[0].current_user}`);
    console.log(`   Version: ${dbResult.rows[0].version.split(',')[0]}`);
    
    // Check if schema exists
    const schemaResult = await client.query(
      "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'public'"
    );
    
    if (schemaResult.rows.length > 0) {
      console.log(`\n✅ Schema 'public' exists`);
      
      // Check for Prisma tables
      const tablesResult = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);
      
      if (tablesResult.rows.length > 0) {
        console.log(`\n📋 Found ${tablesResult.rows.length} table(s):`);
        tablesResult.rows.forEach((row: any) => {
          console.log(`   - ${row.table_name}`);
        });
      } else {
        console.log(`\n⚠️  No tables found in 'public' schema`);
        console.log(`   Run: npx prisma migrate dev`);
      }
    } else {
      console.log(`\n⚠️  Schema 'public' does not exist`);
    }
    
    client.release();
    console.log(`\n✅ Database connection test passed!`);
    
  } catch (error: any) {
    console.error('\n❌ Database connection failed!');
    console.error(`\nError: ${error.message}`);
    
    if (error.message.includes('password authentication failed')) {
      console.log('\n💡 Possible issues:');
      console.log('   1. Wrong password in DATABASE_URL');
      console.log('   2. Username is incorrect');
      console.log('   3. Database user does not have permission');
      console.log('\n📝 Check your .env file:');
      console.log('   DATABASE_URL="postgresql://username:password@host:port/database?schema=public"');
    } else if (error.message.includes('does not exist')) {
      console.log('\n💡 Database does not exist. Create it with:');
      console.log('   psql -U postgres');
      console.log('   CREATE DATABASE your_database_name;');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Cannot connect to database server:');
      console.log('   1. Make sure PostgreSQL is running');
      console.log('   2. Check host and port in DATABASE_URL');
      console.log('   3. Check firewall settings');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testConnection()
  .catch((e) => {
    console.error('❌ Test failed:', e);
    process.exit(1);
  });

