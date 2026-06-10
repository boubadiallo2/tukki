-- Ajout de la colonne travel_date à la table bookings
-- Cela permet de savoir pour quelle date exacte un trajet quotidien a été réservé
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS travel_date DATE;

-- Mettre à jour les réservations existantes pour les trajets non-quotidiens
UPDATE public.bookings b
SET travel_date = t.trip_date
FROM public.trips t
WHERE b.trip_id = t.id AND t.is_daily = false AND b.travel_date IS NULL;
