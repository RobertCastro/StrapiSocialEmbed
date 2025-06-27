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
      // ✅ CAMBIO: Ahora getAuthorizationUrl es async
      const authData = await strapi.plugin('social-widgets').service('tiktok').getAuthorizationUrl();

      strapi.log.info('TikTok OAuth URL with PKCE generated:', {
        state: authData.state,
        hasCodeVerifier: !!authData.codeVerifier,
        storedInDB: true
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
      strapi.log.info('TikTok callback started:', {
        hasCode: !!code,
        hasState: !!state,
        state: state.substring(0, 8) + '...'
      });

      // 1. ✅ Intercambiar código por token (ahora busca PKCE en base de datos)
      const tokenData = await strapi.plugin('social-widgets')
        .service('tiktok').exchangeCodeForToken(code, state);

      strapi.log.info('TikTok token obtained successfully:', {
        hasAccessToken: !!tokenData.access_token,
        scope: tokenData.scope,
        tokenType: tokenData.token_type
      });

      // 2. Intentar obtener información del usuario (con manejo de errores para sandbox)
      let userInfo;
      try {
        userInfo = await strapi.plugin('social-widgets')
          .service('tiktok').getUserInfo(tokenData.access_token);

        strapi.log.info('TikTok user info obtained:', {
          username: userInfo.username,
          display_name: userInfo.display_name
        });
      } catch (userInfoError) {
        strapi.log.warn('TikTok getUserInfo failed (probably sandbox limitations):', userInfoError.message);

        // Crear userInfo ficticio para sandbox
        userInfo = {
          open_id: tokenData.open_id || `sandbox_${Date.now()}`,
          display_name: 'Sandbox User',
          username: 'sandbox_user',
          avatar_url: '',
          follower_count: 0,
          video_count: 0
        };

        strapi.log.info('Using sandbox user info fallback');
      }

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
        sandbox: !userInfo.username, // Indica si usamos fallback de sandbox
        account: {
          id: account.id,
          platform: 'tiktok',
          username: account.username,
          connectedAt: new Date().toISOString()
        },
        userInfo: {
          displayName: userInfo.display_name,
          followerCount: userInfo.follower_count || 0,
          videoCount: userInfo.video_count || 0
        },
        tokenInfo: {
          scope: tokenData.scope,
          expiresIn: tokenData.expires_in
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

      // ✅ CAMBIO: Ahora getAuthorizationUrl es async
      const authData = await tiktokService.getAuthorizationUrl();

      // Extraer redirect_uri de la URL para debugging
      const url = new URL(authData.authUrl);
      const redirectUri = url.searchParams.get('redirect_uri');

      ctx.body = {
        success: true,
        message: 'TikTok service loaded correctly with PKCE (DB storage)',
        hasAuthUrl: !!authData.authUrl,
        authUrl: authData.authUrl,
        state: authData.state,
        hasPKCE: !!authData.codeVerifier,
        redirectUri: redirectUri,
        debugInfo: {
          STRAPI_ADMIN_URL: process.env.STRAPI_ADMIN_URL,
          computedRedirectUri: `${process.env.STRAPI_ADMIN_URL || 'http://localhost:1337'}/social-widgets/connect/tiktok/callback`,
          storageType: 'PostgreSQL Database'
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
