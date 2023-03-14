/* eslint-disable */
import { showAlert } from './alerts';
import { loadStripe } from '@stripe/stripe-js';

//const Stripe = require('stripe');

export const bookTour = async (tourId) => {
  try {
    const stripe = await loadStripe(
      `pk_test_51L5OEPK5Vz0ZWlMoOsjCUEFVKVxX1q2GLsKPpe0otCAl7AwZiJh6AS1JQoFMRsU0v1DY5tSDNl0Gh9pmVeoRwL5Z00F1nqDUbq`
    );
    // 1) Get checkout session from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    // 2) Create checkout form plus charge credit card
    //await stripe.redirectToCheckout({
    //  sessionId: session.data.session.id,
    //});

    //works as expected
    window.location.replace(session.data.session.url);
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
