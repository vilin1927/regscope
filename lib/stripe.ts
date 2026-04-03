import Stripe from 'stripe';

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-03-25.dahlia',
      typescript: true,
    })
  : (null as unknown as Stripe);

export const STRIPE_PRICES = {
  initial: process.env.STRIPE_PRICE_INITIAL || '',
  recurring: process.env.STRIPE_PRICE_RECURRING || '',
};
