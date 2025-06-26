// Tipos para posts de Instagram
export interface InstagramPost {
    id: string;
    media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
    media_url: string;
    thumbnail_url?: string;
    permalink: string;
    caption: string;
    timestamp: string;
    like_count: number;
    comments_count: number;
  }
  
  // Tipos para posts de TikTok
  export interface TikTokPost {
    id: string;
    video_url: string;
    cover_image_url: string;
    title: string;
    duration: number;
    view_count: number;
    like_count: number;
    share_count: number;
    create_time: number;
  }
  
  // Tipos para sincronización
  export interface SyncResult {
    widgetId: number;
    success: boolean;
    postsCount: number;
    error?: string;
    lastUpdated: string;
  }
  
  export interface SyncStats {
    totalWidgets: number;
    successfulSyncs: number;
    failedSyncs: number;
    totalPostsSynced: number;
    executionTime: number;
  }
  
  // Tipos para estadísticas de engagement
  export interface EngagementStats {
    platform: string;
    total_posts: number;
    avg_likes: number;
    avg_comments?: number;
    avg_views?: number;
    avg_shares?: number;
    total_engagement: number;
  }
  
  // Tipo union para posts
  export type SocialPost = InstagramPost | TikTokPost;
  
  // Tipo para plataformas soportadas
  export type SupportedPlatform = 'instagram' | 'tiktok';