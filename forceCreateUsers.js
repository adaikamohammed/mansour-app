const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error("Missing env vars!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

const USERS = [
  { email: 'mansour@gmail.com',  password: '123456', meta: { role: 'manager', name: 'منصور' }    },
  { email: 'admin@gmail.com',    password: '123456', meta: { role: 'admin',   name: 'المراقب' }  },
];

async function run() {
  // جلب كل المستخدمين الحاليين
  const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const existing = list ? list.users : [];

  for (const u of USERS) {
    const found = existing.find(x => x.email === u.email);

    if (found) {
      // تحديث كلمة المرور والـ metadata وتأكيد الإيميل
      const { error } = await supabase.auth.admin.updateUserById(found.id, {
        password: u.password,
        email_confirm: true,
        user_metadata: u.meta,
      });
      if (error) {
        console.error(`❌ Error updating ${u.email}:`, error.message);
      } else {
        console.log(`✅ Updated: ${u.email}`);
      }
    } else {
      // إنشاء حساب جديد مع تأكيد الإيميل
      const { error } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: u.meta,
      });
      if (error) {
        console.error(`❌ Error creating ${u.email}:`, error.message);
      } else {
        console.log(`✅ Created: ${u.email}`);
      }
    }
  }
}

run();
