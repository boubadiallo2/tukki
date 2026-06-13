-- Remettre mohamethlaminesouane@gmail.com en tant que Partenaire (SOU TRANSPORT)
UPDATE public.profiles
SET 
  role = 'company',
  company_id = (SELECT id FROM public.companies WHERE name = 'SOU TRANSPORT' LIMIT 1)
WHERE email = 'mohamethlaminesouane@gmail.com';
