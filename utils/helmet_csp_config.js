const csp = require('express-csp');
const helmet = require('helmet');

const scriptSrcUrls = [
  'https://unpkg.com/',
  'https://tile.openstreetmap.org',
  'https://*.tiles.mapbox.com',
  'https://events.mapbox.com',
  'https://m.stripe.network',
  'https://api.mapbox.com',
  'https://*.mapbox.com',
  'https://js.stripe.com',
  'https://*.cloudflare.com',
];
const styleSrcUrls = [
  'https://unpkg.com/',
  'https://events.mapbox.com',
  'https://*.tiles.mapbox.com',
  'https://tile.openstreetmap.org',
  'https://fonts.googleapis.com/',
];
const connectSrcUrls = [
  'https://unpkg.com',
  'https://*.tiles.mapbox.com',
  'https://*.mapbox.com',
  'https://api.mapbox.com',
  'https://events.mapbox.com',
  'https://tile.openstreetmap.org',
  'https://*.stripe.com',
  'https://bundle.js:*',
  'ws://127.0.0.1:*/',
];
const fontSrcUrls = ['fonts.googleapis.com', 'fonts.gstatic.com'];

exports.helmetConfig = helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'", 'data:', 'blob:', 'https:', 'ws:'],
    baseUri: ["'self'"],
    fontSrc: ["'self'", ...fontSrcUrls],
    scriptSrc: ["'self'", 'https:', 'http:', 'blob:', ...scriptSrcUrls],
    frameSrc: ["'self'", 'https://js.stripe.com'],
    objectSrc: ["'none'"],
    styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
    workerSrc: ["'self'", 'blob:', 'https://m.stripe.network'],
    childSrc: ["'self'", 'blob:'],
    imgSrc: ["'self'", 'blob:', 'data:', 'https:'],
    formAction: ["'self'"],
    connectSrc: [
      "'self'",
      "'unsafe-inline'",
      'data:',
      'blob:',
      ...connectSrcUrls,
    ],
    upgradeInsecureRequests: [],
  },
});

exports.csp = (app) =>
  csp.extend(app, {
    policy: {
      directives: {
        'default-src': ['self'],
        'style-src': ['self', 'unsafe-inline', 'https:'],
        'font-src': ['self', 'https://fonts.gstatic.com'],
        'script-src': [
          'self',
          'unsafe-inline',
          'data',
          'blob',
          'https://js.stripe.com',
          'https://*.mapbox.com',
          'https://*.cloudflare.com/',
          'https://bundle.js:8828',
          'ws://127.0.0.1:56558/',
        ],
        'worker-src': [
          'self',
          'unsafe-inline',
          'data:',
          'blob:',
          'https://*.stripe.com',
          'https://*.mapbox.com',
          'https://*.cloudflare.com/',
          'https://bundle.js:*',
          'ws://127.0.0.1:*/',
        ],
        'frame-src': [
          'self',
          'unsafe-inline',
          'data:',
          'blob:',
          'https://*.stripe.com',
          'https://*.mapbox.com',
          'https://*.cloudflare.com/',
          'https://bundle.js:*',
          'ws://127.0.0.1:*/',
        ],
        'img-src': [
          'self',
          'unsafe-inline',
          'data:',
          'blob:',
          'https://*.stripe.com',
          'https://*.mapbox.com',
          'https://*.cloudflare.com/',
          'https://bundle.js:*',
          'ws://127.0.0.1:*/',
        ],
        'connect-src': [
          'self',
          'unsafe-inline',
          'data:',
          'blob:',
          // 'wss://<HEROKU-SUBDOMAIN>.herokuapp.com:<PORT>/',
          'https://*.stripe.com',
          'https://*.mapbox.com',
          'https://*.cloudflare.com/',
          'https://bundle.js:*',
          'ws://127.0.0.1:*/',
        ],
      },
    },
  });
