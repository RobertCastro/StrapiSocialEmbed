const generateFakeToken = () =>
  [...Array(30)].map(() => Math.random().toString(36)[2]).join('');

export default ({ strapi }: { strapi: any }) => ({
  // ========== INSTAGRAM ==========
  async connectInstagram(ctx) {
    try {
      const authUrl = await strapi.plugin('social-widgets').service('instagram').getAuthorizationUrl();
      ctx.redirect(authUrl);
    } catch (err) {
      strapi.log.error('Instagram connect error:', err);
      ctx.body = { error: 'Error connecting to Instagram' };
      ctx.status = 500;
    }
  },

  async callbackInstagram(ctx) {
    const { code, error } = ctx.query;

    if (error) {
      strapi.log.error('Instagram OAuth error:', error);
      ctx.body = { error: 'Instagram authorization failed' };
      ctx.status = 400;
      return;
    }

    try {
      // TODO: Implementar intercambio de código por token
      strapi.log.info('Instagram callback received with code:', code);
      ctx.body = {
        success: true,
        message: 'Instagram callback recibido - implementación pendiente',
        code: code
      };
    } catch (err) {
      strapi.log.error('Instagram callback error:', err);
      ctx.body = { error: 'Error processing Instagram callback' };
      ctx.status = 500;
    }
  },

  // ========== TIKTOK ==========
  async connectTikTok(ctx) {
    try {
      const authData = await strapi.plugin('social-widgets').service('tiktok').getAuthorizationUrl();
      
      strapi.log.info('TikTok OAuth URL with PKCE generated:', {
        state: authData.state,
        hasCodeVerifier: !!authData.codeVerifier
      });
      
      ctx.redirect(authData.authUrl);
    } catch (err) {
      strapi.log.error('TikTok connect error:', err);
      ctx.body = { error: 'Error connecting to TikTok', details: err.message };
      ctx.status = 500;
    }
  },

  async callbackTikTok(ctx) {
    const { code, state, error } = ctx.query;

    if (error) {
      strapi.log.error('TikTok OAuth error:', error);
      ctx.body = { error: 'TikTok authorization failed', details: error };
      ctx.status = 400;
      return;
    }

    if (!code) {
      strapi.log.error('TikTok callback: No authorization code received');
      ctx.body = { error: 'No authorization code received' };
      ctx.status = 400;
      return;
    }

    if (!state) {
      strapi.log.error('TikTok callback: No state parameter received');
      ctx.body = { error: 'No state parameter received' };
      ctx.status = 400;
      return;
    }

    try {
      // 1. Intercambiar código por token (ahora incluye state para PKCE)
      const tokenData = await strapi.plugin('social-widgets')
        .service('tiktok').exchangeCodeForToken(code, state);

      strapi.log.info('TikTok token obtained successfully');

      // 2. Obtener información del usuario
      const userInfo = await strapi.plugin('social-widgets')
        .service('tiktok').getUserInfo(tokenData.access_token);

      strapi.log.info('TikTok user info obtained:', { 
        username: userInfo.username, 
        display_name: userInfo.display_name 
      });

      // 3. Calcular fecha de expiración
      const tokenExpires = new Date(Date.now() + (tokenData.expires_in * 1000));

      // 4. Crear o actualizar SocialAccount
      const existingAccount = await strapi.entityService.findMany('plugin::social-widgets.social-account', {
        filters: { 
          platform: 'tiktok', 
          accountId: userInfo.open_id 
        }
      });

      let account;
      if (existingAccount && existingAccount.length > 0) {
        // Actualizar token existente
        account = await strapi.entityService.update('plugin::social-widgets.social-account', existingAccount[0].id, {
          data: {
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            tokenExpires: tokenExpires.toISOString(),
            username: userInfo.username || userInfo.display_name
          }
        });
        
        strapi.log.info('TikTok account updated:', account.id);
      } else {
        // Crear nueva cuenta
        account = await strapi.entityService.create('plugin::social-widgets.social-account', {
          data: {
            platform: 'tiktok',
            username: userInfo.username || userInfo.display_name,
            accountId: userInfo.open_id,
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            tokenExpires: tokenExpires.toISOString()
          }
        });
        
        strapi.log.info('TikTok account created:', account.id);
      }

      // 5. Respuesta exitosa
      ctx.body = {
        success: true,
        message: 'TikTok account connected successfully',
        account: {
          id: account.id,
          platform: 'tiktok',
          username: account.username,
          connectedAt: new Date().toISOString()
        },
        userInfo: {
          displayName: userInfo.display_name,
          followerCount: userInfo.follower_count,
          videoCount: userInfo.video_count
        }
      };

    } catch (err) {
      strapi.log.error('TikTok callback processing error:', err);
      ctx.body = { 
        error: 'Error processing TikTok callback', 
        details: err.message 
      };
      ctx.status = 500;
    }
  },

  // ========== DESARROLLO ==========
  async addFakeAccount(ctx) {
    try {
      const { platform = 'instagram' } = ctx.request.body || {};

      console.log(`Creando cuenta ${platform} de prueba...`);

      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 60);

      const fakeAccountData = {
        platform: platform,
        username: `fake_${platform}_${Date.now()}`,
        accountId: Date.now().toString(),
        accessToken: generateFakeToken(),
        tokenExpires: expirationDate.toISOString(),
      };

      const newAccount = await strapi.entityService.create('plugin::social-widgets.social-account', {
        data: fakeAccountData
      });

      console.log(`Cuenta ${platform} de prueba creada:`, newAccount);
      
      ctx.body = {
        success: true,
        message: `Fake ${platform} account created successfully`,
        account: newAccount
      };

    } catch (error) {
      strapi.log.error('Error creating fake account:', error);
      ctx.body = { error: 'Error creating fake account', details: error.message };
      ctx.status = 500;
    }
  },

  // ========== UTILIDADES ==========
  async getConnectedAccounts(ctx) {
    try {
      const accounts = await strapi.entityService.findMany('plugin::social-widgets.social-account', {
        fields: ['id', 'platform', 'username', 'createdAt'],
        populate: {
          configurations: {
            fields: ['id', 'name']
          }
        }
      });

      ctx.body = {
        success: true,
        accounts: accounts.map(account => ({
          id: account.id,
          platform: account.platform,
          username: account.username,
          connectedAt: account.createdAt,
          widgetCount: account.configurations?.length || 0
        }))
      };

    } catch (err) {
      strapi.log.error('Error fetching connected accounts:', err);
      ctx.body = { error: 'Error fetching accounts' };
      ctx.status = 500;
    }
  },

  // ========== TESTING ==========
  async testTikTok(ctx) {
    try {
      const tiktokService = strapi.plugin('social-widgets').service('tiktok');
      const authData = tiktokService.getAuthorizationUrl();
      
      // Extraer redirect_uri de la URL para debugging
      const url = new URL(authData.authUrl);
      const redirectUri = url.searchParams.get('redirect_uri');
      
      ctx.body = { 
        success: true, 
        message: 'TikTok service loaded correctly with PKCE',
        hasAuthUrl: !!authData.authUrl,
        authUrl: authData.authUrl,
        state: authData.state,
        hasPKCE: !!authData.codeVerifier,
        redirectUri: redirectUri,
        debugInfo: {
          STRAPI_ADMIN_URL: process.env.STRAPI_ADMIN_URL,
          computedRedirectUri: `${process.env.STRAPI_ADMIN_URL || 'http://localhost:1337'}/social-widgets/connect/tiktok/callback`
        }
      };
    } catch (err) {
      ctx.body = { 
        error: 'TikTok service error', 
        details: err.message 
      };
      ctx.status = 500;
    }
  }
});