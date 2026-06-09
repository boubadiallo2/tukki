import { NextResponse } from 'next/server';
import { supabase } from '@/app/lib/supabaseClient';
import { OPERATORS, CITIES } from '@/app/lib/mockData';

export async function GET() {
  try {
    // 1. Seed Companies
    console.log('Seeding companies...');
    const { data: existingCompanies, error: companiesErr } = await supabase.from('companies').select('code');
    
    if (companiesErr) throw companiesErr;
    
    if (!existingCompanies || existingCompanies.length === 0) {
      for (const operator of OPERATORS) {
        const { error } = await supabase.from('companies').insert({
          name: operator.name,
          code: operator.code,
          rating: operator.rating,
          amenities: operator.amenities,
          color: operator.color
        });
        if (error) throw error;
      }
      console.log('Companies seeded successfully.');
    } else {
      console.log('Companies already exist, skipping.');
    }

    // 2. Seed some Trips for today and tomorrow for a popular route (Dakar -> Touba)
    console.log('Seeding trips...');
    const { data: companies, error: fetchCompErr } = await supabase.from('companies').select('id, code');
    if (fetchCompErr) throw fetchCompErr;

    const companyMap = new Map(companies.map(c => [c.code, c.id]));

    // Let's create trips for Dakar -> Touba and Dakar -> Thiès for today and tomorrow
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dates = [
      today.toISOString().split('T')[0],
      tomorrow.toISOString().split('T')[0]
    ];
    
    const routes = [
      { from: 'Dakar', to: 'Touba' },
      { from: 'Dakar', to: 'Thiès' },
      { from: 'Touba', to: 'Dakar' },
      { from: 'Saint-Louis', to: 'Dakar' }
    ];

    let newTripsCount = 0;

    for (const dateStr of dates) {
      for (const route of routes) {
        // Check if trips already exist for this route and date
        const { data: existingTrips } = await supabase
          .from('trips')
          .select('id')
          .eq('departure_city', route.from)
          .eq('arrival_city', route.to)
          .eq('trip_date', dateStr);

        if (!existingTrips || existingTrips.length === 0) {
          // Generate 3 random trips for each route/date
          for (let i = 0; i < 3; i++) {
            const operator = OPERATORS[i % OPERATORS.length];
            const companyId = companyMap.get(operator.code);
            
            if (companyId) {
              const startHour = 8 + (i * 4); // 8:00, 12:00, 16:00
              const depTime = `${startHour.toString().padStart(2, '0')}:00`;
              const arrTime = `${(startHour + 3).toString().padStart(2, '0')}:30`;
              
              const { error: tripError } = await supabase.from('trips').insert({
                company_id: companyId,
                departure_city: route.from,
                arrival_city: route.to,
                departure_time: depTime,
                arrival_time: arrTime,
                duration: "3h 30m",
                price: 5000 + (i * 1000),
                available_seats: 30 - i,
                total_seats: 36,
                occupied_seats: [],
                trip_date: dateStr
              });
              
              if (tripError) throw tripError;
              newTripsCount++;
            }
          }
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Database seeded successfully. Inserted ${newTripsCount} new trips.` 
    });
    
  } catch (error: any) {
    console.error('Seeding error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
