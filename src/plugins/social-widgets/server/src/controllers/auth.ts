const generateFakeToken = () =>
  [...Array(30)].map(() => Math.random().toString(36)[2]).join('');

export default ({ strapi }: { strapi: any }) => ({
  async connectInstagram(ctx) {
    try {
      const authUrl = await strapi.plugin('social-widgets').service('instagram').getAuthorizationUrl();
      ctx.redirect(authUrl);
    } catch (err) {
      ctx.body = err;
      ctx.status = 500;
    }
  },

  async callbackInstagram(ctx) {
    ctx.body = 'Callback de Instagram recibido.';
  },

  async addFakeAccount(ctx) {
    try {
      console.log('Creando cuenta de prueba...');

      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 60);

      const newAccount = await strapi.entityService.create('plugin::social-widgets.social-account', {
        data: {
          platform: 'instagram',
          username: `fake_user_${Date.now()}`,
          accountId: Date.now().toString(),
          accessToken: generateFakeToken(),
          tokenExpires: expirationDate.toISOString(),
        },
      });

      console.log('Cuenta de prueba creada:', newAccount);
      ctx.body = newAccount;
    } catch (error) {
      ctx.throw(500, 'No se pudo crear la cuenta de prueba', { error });
    }
  },
});