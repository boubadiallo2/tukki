import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create a supabase client that doesn't persist the session
const supabaseAdmin = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 });
    }

    // Create the user in Supabase Auth using the anon key (assuming public signups are enabled)
    // The trigger 'on_auth_user_created' will automatically create a 'company' profile for this user initially,
    // which we will update immediately after from the frontend using the SQL function.
    const { data, error } = await supabaseAdmin.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error("Erreur signUp employee:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Return the newly created user ID so the client can update its role to 'company_agent'
    return NextResponse.json({ 
      success: true, 
      userId: data.user?.id 
    });

  } catch (error: any) {
    console.error("Erreur inattendue API create-employee-auth:", error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}
