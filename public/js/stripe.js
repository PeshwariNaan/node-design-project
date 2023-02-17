/* eslint-disable */
import { showAlert } from './alerts';
import { loadStripe } from '@stripe/stripe-js';

//const Stripe = require('stripe');

export const bookTour = async (tourId) => {
  const stripe = await loadStripe(
    `pk_test_51L5OEPK5Vz0ZWlMoOsjCUEFVKVxX1q2GLsKPpe0otCAl7AwZiJh6AS1JQoFMRsU0v1DY5tSDNl0Gh9pmVeoRwL5Z00F1nqDUbq`
  );
  // 1) Get checkout session from API
  const session = await axios(
    `http://127.0.0.1:3000/api/v1/bookings/checkout-session/${tourId}`
  );
  console.log(session);
  // 2) Create checkout form plus charge credit card
};
