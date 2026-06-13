-- 1. Remettre Lamine Souane comme Partenaire et lui réattribuer SOU TRANSPORT
UPDATE public.profiles 
SET role = 'company', 
    company_id = (SELECT id FROM public.companies WHERE name ILIKE '%SOU TRANSPORT%' LIMIT 1) 
WHERE email = 'mohamethlaminesouane@gmail.com';

-- 2. Mettre à jour le déclencheur pour que SEUL Boubacar Diallo soit Super Admin à l'avenir
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  assigned_role TEXT := 'company';
BEGIN
  -- Seuls ces emails seront Super Admin
  IF new.email = 'boudiallo20@gmail.com' THEN
    assigned_role := 'super_admin';
  END IF;

  INSERT INTO public.profiles (id, email, role, company_id)
  VALUES (new.id, new.email, assigned_role, NULL);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
