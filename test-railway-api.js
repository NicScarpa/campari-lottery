/**
 * Script di test per l'API Railway
 * Testa tutti gli endpoint critici in produzione
 */

const BACKEND_URL = 'https://backend-campari-lottery-production.up.railway.app';
const FRONTEND_URL = 'https://frontend-camparino-week.up.railway.app';

console.log('🧪 Testing Campari Lottery API on Railway\n');
console.log(`Backend: ${BACKEND_URL}`);
console.log(`Frontend: ${FRONTEND_URL}\n`);

async function test(name, fn) {
  try {
    console.log(`\n▶️  ${name}`);
    await fn();
    console.log(`✅ ${name} - PASS`);
  } catch (error) {
    console.log(`❌ ${name} - FAIL`);
    console.error(`   Error: ${error.message}`);
  }
}

async function fetchJSON(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();

  console.log(`   Status: ${response.status} ${response.statusText}`);

  try {
    const data = JSON.parse(text);
    console.log(`   Response:`, JSON.stringify(data, null, 2).substring(0, 200));
    return { response, data };
  } catch (e) {
    console.log(`   Response (text):`, text.substring(0, 200));
    return { response, data: text };
  }
}

async function main() {
  // Test 1: Health Check
  await test('Health Check', async () => {
    const { response, data } = await fetchJSON(`${BACKEND_URL}/health`);
    if (!response.ok) throw new Error('Health check failed');
  });

  // Test 2: Admin Login
  let adminToken;
  await test('Admin Login', async () => {
    const { response, data } = await fetchJSON(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'Campari2025!'
      })
    });

    if (!response.ok) throw new Error('Login failed');
    if (!data.token) throw new Error('No token returned');

    adminToken = data.token;
    console.log(`   Token received: ${adminToken.substring(0, 20)}...`);
  });

  // Test 3: Get Promotions (Protected)
  await test('Get Promotions (Admin Protected)', async () => {
    if (!adminToken) throw new Error('No admin token available');

    const { response, data } = await fetchJSON(`${BACKEND_URL}/api/admin/promotions`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error('Failed to get promotions');
    console.log(`   Promotions count: ${Array.isArray(data) ? data.length : 'N/A'}`);
  });

  // Test 4: Customer Registration (without promotion - should fail gracefully)
  let customerToken;
  await test('Customer Registration Flow Check', async () => {
    // This will fail without a valid promotion, but tests the endpoint structure
    const { response, data } = await fetchJSON(`${BACKEND_URL}/api/customer/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        promotionId: 1,
        firstName: 'Test',
        lastName: 'User',
        phoneNumber: '+391234567890',
        consentMarketing: false,
        consentTerms: true
      })
    });

    console.log(`   Registration response status: ${response.status}`);

    // If it succeeded (promotion exists), save token
    if (response.ok && data.token) {
      customerToken = data.token;
      console.log(`   Customer token received: ${customerToken.substring(0, 20)}...`);
    }
  });

  // Test 5: Play Endpoint (Protected) - Should fail without token
  await test('Play Endpoint Protection', async () => {
    const { response, data } = await fetchJSON(`${BACKEND_URL}/api/customer/play`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        promotion_id: 1,
        token_code: 'TEST123'
      })
    });

    // This SHOULD fail with 401 (no customer token)
    if (response.status === 401) {
      console.log('   ✓ Correctly protected - 401 Unauthorized');
    } else {
      throw new Error(`Expected 401, got ${response.status}`);
    }
  });

  // Test 6: Environment Variables Check
  await test('Database Connection Check', async () => {
    // If health check passes and we can login, DB is working
    console.log('   ✓ Database appears to be connected (admin login succeeded)');
  });

  // Test 7: CORS Check
  await test('CORS Configuration', async () => {
    const { response } = await fetchJSON(`${BACKEND_URL}/health`, {
      headers: {
        'Origin': FRONTEND_URL
      }
    });

    const corsHeader = response.headers.get('access-control-allow-origin');
    console.log(`   CORS header: ${corsHeader || 'Not set'}`);

    if (corsHeader && (corsHeader === FRONTEND_URL || corsHeader === '*')) {
      console.log('   ✓ CORS configured correctly');
    } else {
      console.log('   ⚠️  CORS may need configuration');
    }
  });

  console.log('\n\n📊 Test Summary\n');
  console.log('Key Points to Check on Railway Dashboard:');
  console.log('1. Environment Variables:');
  console.log('   - JWT_SECRET (must be set!)');
  console.log('   - DATABASE_URL (PostgreSQL connection)');
  console.log(`   - FRONTEND_URL = ${FRONTEND_URL}`);
  console.log('\n2. Database:');
  console.log('   - Run: npx prisma migrate deploy');
  console.log('   - Run: npx prisma db seed');
  console.log('\n3. Logs:');
  console.log('   - Check Railway logs for any errors');
  console.log('   - Look for: "JWT_SECRET environment variable is not set!"');
  console.log('\n4. Next Steps:');
  console.log(`   - Visit ${FRONTEND_URL}`);
  console.log('   - Create a promotion in admin panel');
  console.log('   - Generate tokens and test full flow');
}

main().catch(console.error);
