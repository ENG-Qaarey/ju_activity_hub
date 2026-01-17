import { config } from 'dotenv';

config();

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3001/api';
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

async function testBackendConnection() {
  console.log('🔍 Testing Backend Connection...\n');
  console.log(`📍 Backend URL: ${BACKEND_URL}`);
  console.log(`📍 API Base URL: ${API_BASE_URL}\n`);

  try {
    // Test 1: Health check (if exists) or root endpoint
    console.log('1️⃣ Testing backend server...');
    const healthResponse = await fetch(`${BACKEND_URL}/api`);
    if (healthResponse.ok) {
      console.log('   ✅ Backend server is running\n');
    } else {
      console.log(`   ⚠️  Backend responded with status: ${healthResponse.status}\n`);
    }

    // Test 2: CORS check
    console.log('2️⃣ Testing CORS configuration...');
    const corsResponse = await fetch(`${API_BASE_URL}/users`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:8080',
      },
    });
    if (corsResponse.ok || corsResponse.status === 204) {
      console.log('   ✅ CORS is properly configured\n');
    } else {
      console.log(`   ⚠️  CORS check returned: ${corsResponse.status}\n`);
    }

    // Test 3: API endpoint test
    console.log('3️⃣ Testing API endpoint...');
    try {
      const apiResponse = await fetch(`${API_BASE_URL}/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (apiResponse.status === 401 || apiResponse.status === 403) {
        console.log('   ✅ API endpoint is accessible (authentication required)\n');
      } else if (apiResponse.ok) {
        console.log('   ✅ API endpoint is accessible\n');
      } else {
        console.log(`   ⚠️  API returned status: ${apiResponse.status}\n`);
      }
    } catch (error: any) {
      if (error.message.includes('CORS')) {
        console.log('   ❌ CORS error - backend may not be allowing frontend origin\n');
      } else {
        console.log(`   ❌ Connection failed: ${error.message}\n`);
      }
    }

    console.log('✅ Connection tests complete!\n');
    console.log('📋 Summary:');
    console.log(`   Backend URL: ${BACKEND_URL}`);
    console.log(`   API Base: ${API_BASE_URL}`);
    console.log(`   Frontend should use: ${API_BASE_URL}\n`);

  } catch (error: any) {
    console.error('❌ Connection test failed!\n');
    console.error(`Error: ${error.message}\n`);
    
    if (error.message.includes('ECONNREFUSED') || error.message.includes('Failed to fetch')) {
      console.log('💡 Backend server is not running!\n');
      console.log('   Start it with:');
      console.log('   cd backend');
      console.log('   npm run start:dev\n');
    }
    
    process.exit(1);
  }
}

testBackendConnection();
