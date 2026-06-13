-- 1. Ajouter la colonne logo_url à la table companies
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 2. Créer un bucket de stockage public pour les logos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('company-logos', 'company-logos', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Politique pour permettre à tout le monde de voir les logos
CREATE POLICY "Public can view logos"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'company-logos' );

-- 4. Politique pour permettre aux utilisateurs connectés d'ajouter/modifier des logos
CREATE POLICY "Authenticated users can upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'company-logos' );

CREATE POLICY "Authenticated users can update logos"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'company-logos' );
