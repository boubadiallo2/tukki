import { NextResponse } from 'next/server';
import twilio from 'twilio';

export async function POST(request: Request) {
  try {
    const { phone, message } = await request.json();

    if (!phone || !message) {
      return NextResponse.json({ success: false, error: 'Phone and message are required' }, { status: 400 });
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

    // Si les clés Twilio sont configurées dans le fichier .env, on envoie un vrai SMS
    if (accountSid && authToken && twilioPhone) {
      const client = twilio(accountSid, authToken);
      
      const twilioResponse = await client.messages.create({
        body: message,
        from: twilioPhone,
        to: phone // Le numéro doit inclure l'indicatif (ex: +221...)
      });

      console.log(`[Twilio] SMS envoyé avec succès, SID: ${twilioResponse.sid}`);
      return NextResponse.json({ success: true, message: 'SMS envoyé avec succès via Twilio' });
    } 
    // Sinon, on continue d'utiliser le Mock (simulation) dans la console
    else {
      console.log('\n================ SMS MOCK ================');
      console.log(`To: ${phone}`);
      console.log(`Message: ${message}`);
      console.log('==========================================\n');
      console.log('⚠️ Attention: Clés Twilio manquantes, SMS simulé.');

      return NextResponse.json({ success: true, message: 'SMS envoyé avec succès (Mock)' });
    }
  } catch (error) {
    console.error('Erreur lors de l\'envoi du SMS:', error);
    return NextResponse.json({ success: false, error: 'Erreur interne' }, { status: 500 });
  }
}
