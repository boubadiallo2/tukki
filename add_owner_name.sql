-- Script pour ajouter le champ 'owner_name' à la table companies
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS owner_name TEXT;
