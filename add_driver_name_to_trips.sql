-- Add driver_name (nom du convoyeur) to trips table
ALTER TABLE public.trips 
ADD COLUMN IF NOT EXISTS driver_name TEXT;
