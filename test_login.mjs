import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wlnhzbanrarvsvmygwhf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indsbmh6YmFucmFydnN2bXlnd2hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMTYxNTMsImV4cCI6MjA5NjU5MjE1M30.ZDragmrKU2KJJLBQCtkuyN3_h6kDbqO1PEtvkt8pfCg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
  console.log("Signing in...");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'boudiallo20@gmail.com',
    password: 'Passer@12345',
  });

  if (authError) {
    console.error("Login Error:", authError);
    return;
  }

  console.log("Logged in as:", authData.user.id);

  console.log("Fetching profile...");
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authData.user.id)
    .single();

  if (profileError) {
    console.error("Profile fetch error:", profileError);
    return;
  }

  console.log("Profile data:", profile);
}

testLogin();
