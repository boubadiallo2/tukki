-- Suppression des réservations de retour
DELETE FROM bookings WHERE booking_number LIKE '%-R';

-- Mise à jour des réservations d'aller pour enlever le suffixe -A
UPDATE bookings SET booking_number = REPLACE(booking_number, '-A', '') WHERE booking_number LIKE '%-A';
