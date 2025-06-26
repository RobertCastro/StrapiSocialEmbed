// server/src/services/tiktok.ts

interface TikTokTokenResponse {
    access_token: string;
    expires_in: number;
    refresh_token: string;
    refresh_expires_in: number;
    scope: string;
    token_type: string;
    open_id: string;
  }
  
  interface TikTokErrorResponse {
    error: string;
    error_description: string;
    log_id?: string;
  }
  
  interface TikTokAPIResponse<T = any> {
    data?: T;
    error?: {
      code: string;
      message: string;
      log_id: string;
    };
  }
  
  interface TikTokUserInfo {
    open_id: string;
    union_id?: string;
    avatar_url: string;
    display_name: string;
    username?: string;
    follower_count?: number;
    following_count?: number;
    likes_count?: number;
    video_count?: number;
  }
  
  interface TikTokVideo {
    id: string;
    title: string;
    video_description: string;
    duration: number;
    cover_image_url: string;
    embed_link: string;
    embed_html: string;
    view_count: number;
    like_count: number;
    comment_count: number;
    share_count: number;
    create_time: number;
  }
  
  interface TikTokVideosResponse {
    videos: TikTokVideo[];
    cursor?: string;
    has_more: boolean;
  }
  
  export default ({ strapi }: { strapi: any }) => ({
    /**
     * Genera code verifier y code challenge para PKCE
     */
    generatePKCE(): { codeVerifier: string; codeChallenge: string } {
      // Generar code verifier (43-128 caracteres, base64url)
      const codeVerifier = this.generateRandomString(128);
      
      // Generar code challenge (SHA256 hash del verifier en base64url)
      const codeChallenge = this.sha256Base64url(codeVerifier);
      
      return { codeVerifier, codeChallenge };
    },
  
    /**
     * Genera string aleatorio para PKCE
     */
    generateRandomString(length: number): string {
      const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
      let result = '';
      for (let i = 0; i < length; i++) {
        result += charset.charAt(Math.floor(Math.random() * charset.length));
      }
      return result;
    },
  
    /**
     * Genera SHA256 hash en formato base64url
     */
    sha256Base64url(str: string): string {
      // En Node.js usar crypto
      const crypto = require('crypto');
      const hash = crypto.createHash('sha256').update(str).digest('base64');
      // Convertir base64 a base64url
      return hash.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    },
  
    /**
     * Almacena code verifier temporalmente (en memoria para desarrollo)
     */
    _pkceStorage: new Map<string, string>(),
  
    /**
     * Guarda code verifier asociado al state
     */
    storePKCE(state: string, codeVerifier: string): void {
      this._pkceStorage.set(state, codeVerifier);
      // Limpiar después de 10 minutos
      setTimeout(() => {
        this._pkceStorage.delete(state);
      }, 10 * 60 * 1000);
    },
  
    /**
     * Recupera code verifier por state
     */
    getPKCE(state: string): string | undefined {
      return this._pkceStorage.get(state);
    },
  
    /**
     * Type guard para verificar si es una respuesta de error
     */
    isErrorResponse(data: unknown): data is TikTokErrorResponse {
      return typeof data === 'object' && data !== null && 'error' in data;
    },
  
    /**
     * Type guard para verificar si es una respuesta de token válida
     */
    isTokenResponse(data: unknown): data is TikTokTokenResponse {
      return typeof data === 'object' && 
             data !== null && 
             'access_token' in data && 
             'expires_in' in data;
    },
  
    /**
     * Genera URL de autorización para TikTok (actualizado 2025 con PKCE)
     */
    getAuthorizationUrl(): { authUrl: string; state: string; codeVerifier: string } {
      const clientKey = process.env.TIKTOK_CLIENT_KEY;
      const redirectUri = `${process.env.STRAPI_ADMIN_URL || 'http://localhost:1337'}/social-widgets/connect/tiktok/callback`;
      const state = this.generateState(); // Para seguridad CSRF
      
      // Generar PKCE
      const { codeVerifier, codeChallenge } = this.generatePKCE();
      
      // Almacenar code verifier temporalmente
      this.storePKCE(state, codeVerifier);
      
      const params = new URLSearchParams({
        client_key: clientKey,
        scope: 'user.info.basic,user.info.profile', // Scopes actualizados
        response_type: 'code',
        redirect_uri: redirectUri,
        state: state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256'
      });
  
      // URL actualizada según documentación 2025
      const authUrl = 'https://www.tiktok.com/v2/auth/authorize/';
      const fullUrl = `${authUrl}?${params.toString()}`;
  
      strapi.log.info('TikTok OAuth URL (2025 with PKCE):', {
        url: fullUrl,
        state: state,
        hasCodeChallenge: !!codeChallenge
      });
      
      return {
        authUrl: fullUrl,
        state: state,
        codeVerifier: codeVerifier
      };
    },
  
    /**
     * Intercambia código por access token (actualizado 2025 con PKCE)
     */
    async exchangeCodeForToken(code: string, state: string): Promise<TikTokTokenResponse> {
      const clientKey = process.env.TIKTOK_CLIENT_KEY;
      const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
      const redirectUri = `${process.env.STRAPI_ADMIN_URL}/social-widgets/connect/tiktok/callback`;
  
      // Recuperar code verifier
      const codeVerifier = this.getPKCE(state);
      if (!codeVerifier) {
        throw new Error('PKCE code verifier not found or expired');
      }
  
      // URL actualizada según documentación 2025
      const tokenUrl = 'https://open.tiktokapis.com/v2/oauth/token/';
  
      strapi.log.info('TikTok token exchange with PKCE:', { 
        url: tokenUrl, 
        clientKey: clientKey?.substring(0, 8) + '...',
        redirectUri,
        hasCodeVerifier: !!codeVerifier
      });
  
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cache-Control': 'no-cache'
        },
        body: new URLSearchParams({
          client_key: clientKey,
          client_secret: clientSecret,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
          code_verifier: codeVerifier
        })
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        strapi.log.error('TikTok token exchange HTTP error:', { 
          status: response.status, 
          statusText: response.statusText, 
          body: errorText 
        });
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
  
      const data = await response.json() as unknown;
      strapi.log.info('TikTok token response received');
      
      // Usar type guards para verificación segura
      if (this.isErrorResponse(data)) {
        const errorMsg = data.error_description || data.error;
        strapi.log.error('TikTok token exchange API error:', data);
        throw new Error(`TikTok token exchange failed: ${errorMsg}`);
      }
  
      if (!this.isTokenResponse(data)) {
        strapi.log.error('TikTok token exchange: Invalid response format', data);
        throw new Error('TikTok token exchange: Invalid response format');
      }
  
      strapi.log.info('TikTok token exchange successful:', { 
        hasAccessToken: !!data.access_token,
        scope: data.scope,
        expiresIn: data.expires_in
      });
  
      // Limpiar code verifier después del uso
      this._pkceStorage.delete(state);
  
      return data;
    },
  
    /**
     * Refresca access token usando refresh token (actualizado 2025)
     */
    async refreshAccessToken(refreshToken: string): Promise<TikTokTokenResponse> {
      const clientKey = process.env.TIKTOK_CLIENT_KEY;
      const clientSecret = process.env.TIKTOK_CLIENT_SECRET;
  
      // URL actualizada según documentación 2025
      const refreshUrl = 'https://open.tiktokapis.com/v2/oauth/token/';
  
      const response = await fetch(refreshUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          client_key: clientKey,
          client_secret: clientSecret,
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        })
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json() as unknown;
      
      if (this.isErrorResponse(data)) {
        const errorMsg = data.error_description || data.error;
        throw new Error(`TikTok token refresh failed: ${errorMsg}`);
      }
  
      if (!this.isTokenResponse(data)) {
        throw new Error('TikTok token refresh: Invalid response format');
      }
  
      return data;
    },
  
    /**
     * Obtiene información del usuario (actualizado 2025)
     */
    async getUserInfo(accessToken: string): Promise<TikTokUserInfo> {
      // URL actualizada según documentación 2025
      const apiUrl = 'https://open.tiktokapis.com/v2/user/info/';
  
      const response = await fetch(`${apiUrl}?fields=open_id,union_id,avatar_url,display_name,username,follower_count,following_count,likes_count,video_count`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json() as TikTokAPIResponse<{ user: TikTokUserInfo }>;
      
      if (data.error) {
        throw new Error(`TikTok user info failed: ${data.error.message}`);
      }
  
      if (!data.data?.user) {
        throw new Error('TikTok user info: No user data received');
      }
  
      return data.data.user;
    },
  
    /**
     * Obtiene lista de videos del usuario (actualizado 2025)
     */
    async getUserVideos(accessToken: string, limit: number = 20): Promise<TikTokVideo[]> {
      // URL actualizada según documentación 2025
      const apiUrl = 'https://open.tiktokapis.com/v2/video/list/';
  
      const response = await fetch(`${apiUrl}?fields=id,title,video_description,duration,cover_image_url,embed_link,embed_html,view_count,like_count,comment_count,share_count,create_time&max_count=${limit}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json() as TikTokAPIResponse<TikTokVideosResponse>;
      
      if (data.error) {
        throw new Error(`TikTok videos fetch failed: ${data.error.message}`);
      }
  
      if (!data.data?.videos) {
        throw new Error('TikTok videos: No video data received');
      }
  
      return data.data.videos;
    },
  
    /**
     * Genera state para prevenir CSRF
     */
    generateState(): string {
      return Math.random().toString(36).substring(2, 15) + 
             Math.random().toString(36).substring(2, 15);
    },
  
    /**
     * Valida que el token no haya expirado
     */
    isTokenValid(tokenExpires: Date): boolean {
      return new Date() < tokenExpires;
    },
  
    /**
     * Convierte timestamp de TikTok a fecha ISO
     */
    convertTikTokTimestamp(timestamp: number): string {
      return new Date(timestamp * 1000).toISOString();
    },
  
    /**
     * Formatea datos de TikTok para estructura unificada del plugin
     */
    formatTikTokPostsForCache(videos: TikTokVideo[]): any[] {
      return videos.map(video => ({
        id: video.id,
        platform: 'tiktok',
        type: 'VIDEO',
        url: video.embed_link,
        thumbnail: video.cover_image_url,
        title: video.title,
        description: video.video_description,
        duration: video.duration,
        timestamp: this.convertTikTokTimestamp(video.create_time),
        metrics: {
          views: video.view_count,
          likes: video.like_count,
          comments: video.comment_count,
          shares: video.share_count
        },
        embed_html: video.embed_html
      }));
    },
  
    /**
     * Debug: Valida configuración
     */
    validateConfig(): { valid: boolean; errors: string[] } {
      const errors: string[] = [];
      
      if (!process.env.TIKTOK_CLIENT_KEY) {
        errors.push('TIKTOK_CLIENT_KEY not set');
      }
      
      if (!process.env.TIKTOK_CLIENT_SECRET) {
        errors.push('TIKTOK_CLIENT_SECRET not set');
      }
      
      if (!process.env.STRAPI_ADMIN_URL) {
        errors.push('STRAPI_ADMIN_URL not set');
      }
      
      return {
        valid: errors.length === 0,
        errors
      };
    }
  });