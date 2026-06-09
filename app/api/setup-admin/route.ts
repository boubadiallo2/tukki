import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';

export async function GET() {
  try {
    // 1. Create the Super Admin user in Supabase Auth
    const email = 'boudiallo20@gmail.com';
    const password = 'Passer@12345';

    console.log(`Tentative de création de l'utilisateur : ${email}`);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error("Erreur lors de la création de l'utilisateur:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Si tout se passe bien, l'utilisateur est créé dans auth.users.
    // Le trigger SQL (si exécuté) aura créé son profil super_admin automatiquement !
    
    return NextResponse.json({ 
      success: true, 
      message: 'Compte Super Admin créé avec succès !',
      user: {
        id: data.user?.id,
        email: data.user?.email,
      }
    });

  } catch (error: any) {
    console.error("Erreur inattendue:", error);
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}
