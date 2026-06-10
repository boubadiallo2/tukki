import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wlnhzbanrarvsvmygwhf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indsbmh6YmFucmFydnN2bXlnd2hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwMTYxNTMsImV4cCI6MjA5NjU5MjE1M30.ZDragmrKU2KJJLBQCtkuyN3_h6kDbqO1PEtvkt8pfCg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('profiles').select('*');
  console.log('Profiles:', data);
  console.log('Error:', error);
}

check();
