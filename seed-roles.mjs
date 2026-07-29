import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = readFileSync('.env.local', 'utf8');
const getEnv = (k) => env.split('\n').find(l => l.startsWith(k + '='))?.split('=').slice(1).join('=').trim();

const url = getEnv('VITE_SUPABASE_URL');
const key = getEnv('SUPABASE_SERVICE_KEY');
const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

async function createAuthUser(email, password) {
  const { data, error } = await supabase.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { role: 'faculty' },
  });
  if (error) { console.error(`Create ${email} failed:`, error.message); return null; }
  console.log(`Created: ${email} → ${data.user.id}`);
  return data.user.id;
}

async function main() {
  // 1. Promote existing faculty to Admin
  const { error: upErr } = await supabase
    .from('faculty')
    .update({ designation: 'Admin' })
    .eq('faculty_id', '711508ec-abbe-4dc8-9c9e-b9f7d5d80629');
  if (upErr) console.error('Update Admin failed:', upErr.message);
  else console.log('Existing faculty → Admin');

  // 2. Create Warden
  const wardenId = await createAuthUser('warden@mgmcet.com', 'warden123');
  if (wardenId) {
    await supabase.from('faculty').insert({
      faculty_id: wardenId, employee_id: 'HKC24WDF01',
      department: 'CSE', designation: 'Warden',
    });
    console.log('Warden faculty row inserted');
  }

  // 3. Create Accountant
  const accId = await createAuthUser('accounts@mgmcet.com', 'accounts123');
  if (accId) {
    await supabase.from('faculty').insert({
      faculty_id: accId, employee_id: 'HKC24ACF01',
      department: 'CSE', designation: 'Accountant',
    });
    console.log('Accountant faculty row inserted');
  }

  console.log('\nDone. Demo logins:');
  console.log('  Admin:      apparentlyalarming@gmail.com / Albin@123');
  console.log('  Warden:     warden@mgmcet.com / warden123');
  console.log('  Accountant: accounts@mgmcet.com / accounts123');
}

main().catch(console.error);
