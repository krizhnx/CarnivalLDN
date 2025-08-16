import Stripe from 'stripe';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('Stripe secret key not configured');
      return res.status(500).json({ error: 'Server not configured for payments' });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
    const { eventId, tickets, customerInfo, totalAmount } = req.body;

    // Validate input
    if (!eventId || !tickets || !customerInfo || !totalAmount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'gbp',
      metadata: {
        eventId,
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        ticketCount: tickets.reduce((sum: number, ticket: any) => sum + ticket.quantity, 0),
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
}
