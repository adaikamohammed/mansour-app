const { createClient } = require('@supabase/supabase-js');

// We use the anon key. With email signup enabled, this will create the user and sign them in.
// Note: To set user_metadata during signup, we pass it in the options.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE URL or KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAccounts() {
  console.log("Creating Manager Account (Mansour)...");
  const { data: mData, error: mError } = await supabase.auth.signUp({
    email: 'mansour@mansour.com',
    password: 'password123',
    options: {
      data: {
        role: 'manager',
        name: 'منصور'
      }
    }
  });

  if (mError) {
    if (mError.message.includes("User already registered")) {
        console.log("Manager account already exists.");
    } else {
        console.error("Error creating Manager:", mError.message);
    }
  } else {
    console.log("Manager account created successfully!");
  }

  console.log("Creating Admin (Read-only) Account...");
  const { data: aData, error: aError } = await supabase.auth.signUp({
    email: 'admin_mansour@mansour.com',
    password: 'password123',
    options: {
      data: {
        role: 'admin',
        name: 'المراقب'
      }
    }
  });

  if (aError) {
      if (aError.message.includes("User already registered")) {
          console.log("Admin account already exists.");
      } else {
          console.error("Error creating Admin:", aError.message);
      }
  } else {
    console.log("Admin account created successfully!");
  }
}

createAccounts();
