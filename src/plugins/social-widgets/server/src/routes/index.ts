export default [
  // === AUTENTICACIÓN ===
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

  // === SINCRONIZACIÓN ===
  {
    method: 'POST',
    path: '/sync/all',
    handler: 'sync.syncAll',
    config: {
      auth: false, // TODO: Cambiar a true cuando esté integrado con auth de Strapi
    },
  },
  {
    method: 'POST',
    path: '/sync/widget/:widgetId',
    handler: 'sync.syncWidget',
    config: {
      auth: false, // TODO: Cambiar a true cuando esté integrado con auth de Strapi
    },
  },
  {
    method: 'GET',
    path: '/sync/status',
    handler: 'sync.getSyncStatus',
    config: {
      auth: false, // TODO: Cambiar a true cuando esté integrado con auth de Strapi
    },
  },

  // === DESARROLLO ===
  {
    method: 'POST',
    path: '/developer/add-fake-account',
    handler: 'auth.addFakeAccount',
    config: {
      auth: false,
    },
  },
  {
    method: 'GET',
    path: '/developer/fake-posts',
    handler: 'sync.generateFakePosts',
    config: {
      auth: false,
    },
  },
];