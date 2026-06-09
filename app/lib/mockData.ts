export interface Trip {
  id: string;
  companyName: string;
  companyCode: 'tukki' | 'volt' | 'horizon' | 'star';
  departureCity: string;
  arrivalCity: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  price: number;
  availableSeats: number;
  totalSeats: number;
  occupiedSeats: string[]; // e.g. ["1A", "2C", "5B"]
  rating: number;
  amenities: string[];
}

export interface Passenger {
  name: string;
  phone: string;
  email?: string;
}

export interface Booking {
  id: string;
  tripId: string;
  passenger: Passenger;
  selectedSeats: string[];
  totalPrice: number;
  bookingNumber: string;
  bookingDate: string;
}

export const CITIES = [
  "Dakar",
  "Touba",
  "Thiès",
  "Mbour",
  "Kaolack",
  "Saint-Louis",
  "Ziguinchor",
  "Diourbel",
  "Tambacounda",
  "Kolda",
  "Louga"
];

export const OPERATORS = [
  {
    name: "Tukki Express",
    code: "tukki" as const,
    color: "text-brand-green bg-brand-green/10 border-brand-green/20",
    rating: 4.8,
    amenities: ["Wi-Fi Gratuit", "Prises Électriques", "Sièges Inclinables", "Boissons Offertes"]
  },
  {
    name: "VoltTransit",
    code: "volt" as const,
    color: "text-amber-600 bg-amber-50 border-amber-200",
    rating: 4.7,
    amenities: ["100% Électrique", "Ports USB", "Trajet Silencieux", "Espace Jambes"]
  },
  {
    name: "Horizon Navette",
    code: "horizon" as const,
    color: "text-blue-600 bg-blue-50 border-blue-200",
    rating: 4.5,
    amenities: ["Wi-Fi Gratuit", "Ports USB", "Climatisation", "Bagages Inclus"]
  },
  {
    name: "StarLine Voyage",
    code: "star" as const,
    color: "text-purple-600 bg-purple-50 border-purple-200",
    rating: 4.2,
    amenities: ["Confort Standard", "Ports USB", "Toilettes à bord"]
  }
];

// Helper to hash string deterministically to generate consistent results for same inputs
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

export function generateTrips(from: string, to: string, dateStr: string): Trip[] {
  if (!from || !to || !dateStr) return [];
  
  // Format check
  const f = from.trim();
  const t = to.trim();
  
  // Hash combining inputs to get consistent outputs for a specific date and route
  const seed = hashCode(`${f}-${t}-${dateStr}`);
  
  // Create 4-5 trips
  const tripsCount = 4 + (seed % 2); // 4 or 5 trips
  const trips: Trip[] = [];
  
  // Adjusted ticket prices to FCFA format equivalent (in Euros/CFAF exchange or simplified CFAF values)
  // Let's use CFA Francs (FCFA) to make it super local! e.g., 5000 FCFA, 8000 FCFA
  const basePrices = [5000, 7500, 4000, 9000, 12000];
  const startHours = [7, 10, 14, 18, 22];
  const durations = [
    { text: "3h 45m", mins: 225 },
    { text: "4h 15m", mins: 255 },
    { text: "5h 00m", mins: 300 },
    { text: "4h 45m", mins: 285 },
    { text: "6h 10m", mins: 370 }
  ];
  
  for (let i = 0; i < tripsCount; i++) {
    const opIndex = (seed + i) % OPERATORS.length;
    const operator = OPERATORS[opIndex];
    
    const durationObj = durations[(seed + i) % durations.length];
    
    // Calculate times
    const startHour = startHours[i];
    const startMin = ((seed + i) * 15) % 60;
    const depTimeStr = `${startHour.toString().padStart(2, '0')}:${startMin.toString().padStart(2, '0')}`;
    
    const totalMins = startHour * 60 + startMin + durationObj.mins;
    const arrHour = Math.floor(totalMins / 60) % 24;
    const arrMin = totalMins % 60;
    const arrTimeStr = `${arrHour.toString().padStart(2, '0')}:${arrMin.toString().padStart(2, '0')}`;
    
    const price = basePrices[(seed + i) % basePrices.length] + (i * 500);
    const totalSeats = 36;
    
    // Generate occupied seats deterministically
    const occupiedSeats: string[] = [];
    const occupiedCount = 12 + ((seed + i) % 18); // 12 to 29 seats occupied
    
    for (let s = 0; s < occupiedCount; s++) {
      const colIndex = (seed + s) % 4;
      const rowIndex = (seed + s * 7) % 9;
      const seatId = (rowIndex * 4 + colIndex + 1).toString();
      if (!occupiedSeats.includes(seatId)) {
        occupiedSeats.push(seatId);
      }
    }
    
    const availableSeats = totalSeats - occupiedSeats.length;
    
    trips.push({
      id: `${f.substring(0, 3)}-${t.substring(0, 3)}-${dateStr.replace(/-/g, '')}-${i}`,
      companyName: operator.name,
      companyCode: operator.code,
      departureCity: f,
      arrivalCity: t,
      departureTime: depTimeStr,
      arrivalTime: arrTimeStr,
      duration: durationObj.text,
      price,
      availableSeats,
      totalSeats,
      occupiedSeats,
      rating: operator.rating,
      amenities: operator.amenities
    });
  }
  
  // Sort trips by departure time
  return trips.sort((a, b) => a.departureTime.localeCompare(b.departureTime));
}
