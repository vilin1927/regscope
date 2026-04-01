import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-03-25.dahlia',
  typescript: true,
});

export const STRIPE_PRICES = {
  initial: process.env.STRIPE_PRICE_INITIAL || '',
  recurring: process.env.STRIPE_PRICE_RECURRING || '',
};
