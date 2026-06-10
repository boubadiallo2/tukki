-- 1. Permettre aux compagnies d'ajouter des trajets pour leur propre entreprise
DROP POLICY IF EXISTS "Companies can insert their own trips" ON public.trips;
CREATE POLICY "Companies can insert their own trips"
ON public.trips FOR INSERT
TO authenticated
WITH CHECK (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

-- 2. Permettre aux compagnies de modifier leurs propres trajets
DROP POLICY IF EXISTS "Companies can update their own trips" ON public.trips;
CREATE POLICY "Companies can update their own trips"
ON public.trips FOR UPDATE
TO authenticated
USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);

-- 3. Permettre aux compagnies de supprimer leurs propres trajets
DROP POLICY IF EXISTS "Companies can delete their own trips" ON public.trips;
CREATE POLICY "Companies can delete their own trips"
ON public.trips FOR DELETE
TO authenticated
USING (
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid())
);
