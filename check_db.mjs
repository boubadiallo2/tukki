import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('bookings').select('*').limit(1);
  console.log('Bookings columns:', data && data.length > 0 ? Object.keys(data[0]) : 'No data');
  if (error) console.error('Error:', error);
}

test();
