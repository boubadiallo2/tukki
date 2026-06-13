import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wlnhzbanrarvsvmygwhf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indsbmh6YmFucmFydnN2bXlnd2hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMTYxNTMsImV4cCI6MjA5NjU5MjE1M30.ZDragmrKU2KJJLBQCtkuyN3_h6kDbqO1PEtvkt8pfCg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixData() {
  console.log("Signing in as Admin...");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'boudiallo20@gmail.com',
    password: 'Passer@12345',
  });

  if (authError) {
    console.error("Login Error:", authError);
    return;
  }

  console.log("Updating profile...");
  const { data: updateData, error: updateError } = await supabase
    .from('profiles')
    .update({ company_id: '57b8c742-5088-4205-abcd-89c51cd2fa6e' })
    .eq('id', '548ef954-2f14-4ad1-8851-e023457390f5')
    .select();
    
  console.log("Update Data:", updateData);
  console.log("Update Error:", updateError);
}

fixData();
