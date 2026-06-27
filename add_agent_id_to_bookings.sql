-- Ajoute la colonne agent_id à la table bookings pour suivre quel agent a vendu le billet
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Optionnel: Index pour accélérer les requêtes du tableau de bord par agent
CREATE INDEX IF NOT EXISTS idx_bookings_agent_id ON public.bookings(agent_id);
