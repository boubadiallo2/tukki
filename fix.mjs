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

  console.log("Fetching profiles and companies...");
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('*');
  const { data: companies, error: cErr } = await supabase.from('companies').select('*');
  
  if (pErr || cErr) {
    console.error(pErr || cErr);
    return;
  }
  
  console.log(`Found ${profiles.length} profiles and ${companies.length} companies.`);
  
  for (const profile of profiles) {
    if (profile.role === 'company' && !profile.company_id) {
      console.log(`Profile ${profile.email} is missing company_id.`);
      // Match by some logic, e.g. email matches company email, or if there's only one company, or we can just try to update
      // Since we don't know which company belongs to which profile easily if the email doesn't match...
    }
  }

  // Let's just output them for now
  console.log("Profiles missing company_id:");
  console.log(profiles.filter(p => !p.company_id && p.role === 'company'));
  
  console.log("Companies available:");
  console.log(companies.map(c => ({ id: c.id, name: c.name })));
}

fixData();
