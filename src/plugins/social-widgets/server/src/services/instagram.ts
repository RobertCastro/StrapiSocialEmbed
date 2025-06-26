export default ({ strapi }: { strapi: any }) => ({
  getAuthorizationUrl() {
    const clientId = process.env.INSTAGRAM_CLIENT_ID;
    const redirectUri = `${process.env.STRAPI_ADMIN_URL || 'http://localhost:1337'}/social-widgets/connect/instagram/callback`;

    if (!clientId) {
      throw new Error('La variable INSTAGRAM_CLIENT_ID no está configurada en el archivo .env');
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'instagram_basic,pages_show_list',
      response_type: 'code',
    });

    return `https://www.facebook.com/v23.0/dialog/oauth?${params.toString()}`;
  },
});