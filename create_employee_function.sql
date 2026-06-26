-- SQL Function to securely create a company agent
-- This function allows a 'company' admin to set the role of a newly created user to 'company_agent'
-- and assign them to the same company.

CREATE OR REPLACE FUNCTION public.assign_company_agent_role(new_user_id UUID, target_company_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  caller_role TEXT;
  caller_company_id UUID;
BEGIN
  -- Get the role and company_id of the user calling the function (must be authenticated)
  SELECT role, company_id INTO caller_role, caller_company_id
  FROM public.profiles
  WHERE id = auth.uid();

  -- Security Check:
  -- 1. Caller must have the 'company' role (admin of a company)
  -- 2. Caller's company_id must match the target_company_id
  IF caller_role != 'company' OR caller_company_id != target_company_id THEN
    RAISE EXCEPTION 'Non autorisé. Vous devez être un administrateur de cette compagnie.';
  END IF;

  -- Update the profile of the newly created user
  UPDATE public.profiles
  SET 
    role = 'company_agent',
    company_id = target_company_id
  WHERE id = new_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
