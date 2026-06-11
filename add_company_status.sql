-- 1. Ajouter la colonne status à la table companies (PENDING, APPROVED, SUSPENDED)
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PENDING';

-- 2. Mettre à jour les compagnies existantes en 'APPROVED' pour éviter qu'elles ne soient bloquées
UPDATE public.companies SET status = 'APPROVED' WHERE status IS NULL;
