export default [
  {
    method: 'GET',
    path: '/',
    handler: 'controller.index',
    config: {
      policies: [],
    },
  },
  {
    method: 'POST',
    path: '/developer/add-fake-account',
    handler: 'auth.addFakeAccount',
    config: {
      auth: false,
    },
  },
];
