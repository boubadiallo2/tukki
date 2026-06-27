-- SQL Function to securely delete (deactivate) a company agent
-- This function removes the 'company_agent' role and company association

CREATE OR REPLACE FUNCTION public.delete_company_agent(
  agent_id UUID,
  target_company_id UUID
)
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

  -- Update the profile of the agent to remove them from the company
  UPDATE public.profiles
  SET 
    role = 'user',
    company_id = NULL,
    allowed_modules = NULL
  WHERE id = agent_id AND company_id = target_company_id AND role = 'company_agent';

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
