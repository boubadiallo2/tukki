import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';

export async function GET() {
  try {
    const { data: trips, error } = await supabase.from('trips').select('*, companies(*)');
    return NextResponse.json({ trips, error });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
