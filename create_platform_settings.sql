-- Création de la table pour les paramètres de la plateforme
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  support_email TEXT NOT NULL DEFAULT 'support@tukki.sn',
  support_phone TEXT NOT NULL DEFAULT '+221 33 824 00 00',
  support_address TEXT NOT NULL DEFAULT 'Avenue Cheikh Anta Diop, Dakar',
  commission_rate NUMERIC NOT NULL DEFAULT 5.0,
  fixed_fee INTEGER NOT NULL DEFAULT 200,
  maintenance_mode BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Insertion de la ligne par défaut si elle n'existe pas
INSERT INTO public.platform_settings (id) 
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Activer RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Politique pour que tout le monde puisse lire les paramètres (nécessaire pour le Footer)
CREATE POLICY "Public can view platform settings"
ON public.platform_settings FOR SELECT
TO public
USING (true);

-- Politique pour que seuls les super admins puissent modifier
CREATE POLICY "Super admins can update platform settings"
ON public.platform_settings FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin'
  )
);
