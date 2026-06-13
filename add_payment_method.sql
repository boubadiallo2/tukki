-- Ajouter la colonne payment_method à la table bookings pour le système de vente au guichet
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_method text;
