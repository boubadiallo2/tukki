-- Ajout de la colonne is_daily à la table trips
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS is_daily BOOLEAN DEFAULT false;

-- Rendre la colonne trip_date optionnelle (car les trajets quotidiens n'ont pas de date précise)
ALTER TABLE public.trips ALTER COLUMN trip_date DROP NOT NULL;
