export default ({ strapi }: { strapi: any }) => ({
  getAuthorizationUrl() {
    const clientId = process.env.INSTAGRAM_CLIENT_ID;
    const redirectUri = `${process.env.STRAPI_ADMIN_URL || 'http://localhost:1337'}/social-widgets/connect/instagram/callback`;
    const scopes = 'instagram_basic,pages_show_list';
    const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=<span class="math-inline">\{clientId\}&redirect\_uri\=</span>{redirectUri}&scope=${scopes}&response_type=code`;
    return authUrl;
  },
});