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
});