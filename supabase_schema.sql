-- SQL Schema for Tukki Booking App

-- 1. Create Companies Table
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  rating NUMERIC(3, 1) DEFAULT 0,
  amenities TEXT[] DEFAULT '{}',
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Trips Table
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  departure_city TEXT NOT NULL,
  arrival_city TEXT NOT NULL,
  departure_time TIME NOT NULL,
  arrival_time TIME NOT NULL,
  duration TEXT NOT NULL,
  price INTEGER NOT NULL,
  available_seats INTEGER NOT NULL,
  total_seats INTEGER NOT NULL DEFAULT 36,
  occupied_seats TEXT[] DEFAULT '{}',
  trip_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Bookings Table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  passenger_name TEXT NOT NULL,
  passenger_phone TEXT NOT NULL,
  passenger_email TEXT,
  selected_seats TEXT[] NOT NULL,
  total_price INTEGER NOT NULL,
  booking_number TEXT NOT NULL UNIQUE,
  booking_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'CONFIRMED', -- PENDING, CONFIRMED, CANCELLED
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note: We can add RLS (Row Level Security) policies here later if needed.
-- For now, to allow the Next.js app to insert/select without auth, we might need to enable RLS but add anon policies.

-- Enable Row Level Security
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous access (adjust these based on your security needs)
-- For a real app, you would want more restrictive policies.

-- Companies are publicly readable
CREATE POLICY "Allow public read access for companies" ON public.companies FOR SELECT TO anon, authenticated USING (true);

-- Trips are publicly readable
CREATE POLICY "Allow public read access for trips" ON public.trips FOR SELECT TO anon, authenticated USING (true);

-- Bookings can be inserted by anyone (for now) and read by anyone (or restrict by user)
CREATE POLICY "Allow public insert for bookings" ON public.bookings FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public read access for bookings" ON public.bookings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public update for bookings" ON public.bookings FOR UPDATE TO anon, authenticated USING (true);
