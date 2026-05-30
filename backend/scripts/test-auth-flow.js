// backend/scripts/test-auth-flow.js
// Run with:  node scripts/test-auth-flow.js

require('dotenv').config();
const ws = require('ws');
const { createClient } = require('@supabase/supabase-js');

const admin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false }, realtime: { transport: ws } }
);

const API_BASE    = 'http://localhost:3000/api';
const TEST_EMAIL  = `auth_test_${Date.now()}@test.com`;
const TEST_PASS   = 'AuthTest2026!';
const TEST_NAME   = `tester_${Date.now()}`;

let createdUserId = null;
let passed = 0;
let failed = 0;

function ok(label, detail = '')  { console.log(`  ✅  ${label}${detail ? '  |  ' + detail : ''}`); passed++; }
function fail(label, reason = '') { console.log(`  ❌  ${label}${reason ? '  |  ' + reason : ''}`); failed++; }

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  return res.json();
}

// ── 1. Register via API ────────────────────────────────────────────────────────
async function testRegister() {
  console.log('\n[1] REGISTER via API');
  const d = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASS, username: TEST_NAME }),
  });

  if (d.success) {
    createdUserId = d.data.user.id;
    ok('Register returned success', `id: ${createdUserId}`);
  } else if (d.error === 'email rate limit exceeded') {
    console.log('  ⚠️   Supabase email rate limit hit — using admin API instead');
    await adminCreateUser();
  } else {
    fail('Register', d.error);
  }
}

// ── Fallback: admin create bypasses email rate limit ──────────────────────────
async function adminCreateUser() {
  const { data, error } = await admin.auth.admin.createUser({
    email: TEST_EMAIL, password: TEST_PASS, email_confirm: true,
  });
  if (error) { fail('Admin create user', error.message); return; }
  createdUserId = data.user.id;
  ok('Admin create user (rate-limit fallback)', `id: ${createdUserId}`);

  const { error: pe } = await admin.from('profiles').insert({
    id: createdUserId, name: TEST_NAME, gender: 'prefer_not_to_say', sustainable_goal: true,
  });
  if (pe) fail('Profile insert (fallback)', pe.message);
  else ok('Profile insert (fallback)');
}

// ── 2. Verify user exists in Supabase auth.users ──────────────────────────────
async function testUserExistsInAuth() {
  console.log('\n[2] VERIFY user in Supabase auth.users');
  if (!createdUserId) { fail('Skipped — no user ID'); return; }

  const { data, error } = await admin.auth.admin.getUserById(createdUserId);
  if (error || !data?.user) {
    fail('User in auth.users', error?.message || 'not found');
  } else {
    const confirmed = data.user.email_confirmed_at ? 'yes' : 'no';
    ok('User exists in auth.users', `email: ${data.user.email}  confirmed: ${confirmed}`);
  }
}

// ── 3. Verify profile row in profiles table ───────────────────────────────────
async function testProfileRow() {
  console.log('\n[3] VERIFY profile row in profiles table');
  if (!createdUserId) { fail('Skipped — no user ID'); return; }

  const { data, error } = await admin.from('profiles').select('*').eq('id', createdUserId).single();
  if (error || !data) {
    fail('Profile row', error?.message || 'not found');
  } else {
    ok('Profile row exists', `name: ${data.name}  sustainable_goal: ${data.sustainable_goal}`);
  }
}

// ── 4. Login via API and get JWT ──────────────────────────────────────────────
async function testLogin() {
  console.log('\n[4] LOGIN via API');
  const d = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASS }),
  });

  if (!d.success) { fail('Login', d.error); return null; }
  ok('Login returned JWT', `user: ${d.data.user.email}`);
  return d.data.session.access_token;
}

// ── 5. Access protected /users/me with JWT ────────────────────────────────────
async function testProtectedRoute(token) {
  console.log('\n[5] PROTECTED ROUTE  /users/me');
  if (!token) { fail('Skipped — no token'); return; }

  const d = await apiFetch('/users/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (d.success) ok('/users/me returned profile', `name: ${d.data.name}`);
  else fail('/users/me', d.error);
}

// ── Run ───────────────────────────────────────────────────────────────────────
(async () => {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   WearAware — Auth Flow Test Suite       ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`  Email:    ${TEST_EMAIL}`);
  console.log(`  Username: ${TEST_NAME}`);

  await testRegister();
  await testUserExistsInAuth();
  await testProfileRow();
  const token = await testLogin();
  await testProtectedRoute(token);

  console.log('\n══════════════════════════════════════════');
  console.log(`  Result: ${passed} passed  /  ${failed} failed`);
  console.log('══════════════════════════════════════════');
  if (createdUserId) {
    console.log('\n  🗂️   User kept in Supabase for inspection:');
    console.log(`       Email:    ${TEST_EMAIL}`);
    console.log(`       Password: ${TEST_PASS}`);
    console.log(`       ID:       ${createdUserId}`);
    console.log(`       Dashboard: https://supabase.com/dashboard/project/fwkycpwgpbqrivxafkoe/auth/users`);
  }
  console.log('');
  process.exit(failed > 0 ? 1 : 0);
})();
