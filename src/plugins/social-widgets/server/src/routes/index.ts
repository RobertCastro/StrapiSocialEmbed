export default [
  {
    method: 'GET',
    path: '/connect/instagram',
    handler: 'auth.connectInstagram',
    config: {
      auth: false,
    },
  },
  {
    method: 'GET',
    path: '/connect/instagram/callback',
    handler: 'auth.callbackInstagram',
    config: {
      auth: false,
    },
  },
  // --- FAKE ---
  {
    method: 'POST',
    path: '/developer/add-fake-account',
    handler: 'auth.addFakeAccount',
    config: {
      auth: false,
    },
  },
];