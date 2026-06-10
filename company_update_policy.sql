-- Politique pour permettre aux compagnies de mettre à jour leurs propres informations
DROP POLICY IF EXISTS "Companies can update their own info" ON public.companies;
CREATE POLICY "Companies can update their own info"
ON public.companies FOR UPDATE
TO authenticated
USING (
    id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);
