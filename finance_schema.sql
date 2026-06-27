-- Schema update for the central collection and payout system

-- 1. Add commission and net amounts to the bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS commission_amount INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS net_amount INTEGER DEFAULT 0;

-- 2. Retroactively update existing bookings based on 100 FCFA commission per ticket
UPDATE public.bookings
SET 
  commission_amount = array_length(selected_seats, 1) * 100,
  net_amount = total_price - (array_length(selected_seats, 1) * 100)
WHERE commission_amount = 0;

-- 3. Create payouts table
CREATE TABLE IF NOT EXISTS public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  status TEXT DEFAULT 'PENDING', -- PENDING, PAID, REJECTED
  reference TEXT,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS for payouts
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- Policies for payouts
-- Companies can view and insert their own payouts
CREATE POLICY "Companies can view own payouts" ON public.payouts FOR SELECT TO authenticated USING (
  company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid() AND role IN ('company', 'company_agent'))
);

CREATE POLICY "Companies can insert own payouts" ON public.payouts FOR INSERT TO authenticated WITH CHECK (
  company_id = (SELECT company_id FROM public.profiles WHERE id = auth.uid() AND role IN ('company', 'company_agent'))
);

-- Super admin can view and update all payouts
CREATE POLICY "Admins can view all payouts" ON public.payouts FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
);

CREATE POLICY "Admins can update all payouts" ON public.payouts FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super_admin')
);
