-- Script pour donner les droits de Super Administrateur à votre compte

UPDATE public.profiles
SET 
  role = 'super_admin',
  company_id = NULL
WHERE email = 'mohamethlaminesouane@gmail.com';

-- Vous pouvez également mettre à jour la fonction de création automatique pour que vos futurs tests aient le bon rôle
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  assigned_role TEXT := 'company';
BEGIN
  -- Ajoutez votre email ici pour qu'il soit automatiquement Super Admin lors d'une prochaine inscription
  IF new.email = 'boudiallo20@gmail.com' OR new.email = 'mohamethlaminesouane@gmail.com' THEN
    assigned_role := 'super_admin';
  END IF;

  INSERT INTO public.profiles (id, email, role, company_id)
  VALUES (new.id, new.email, assigned_role, NULL);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
