interface InstagramPost {
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
  
  interface TikTokPost {
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
  
  export default ({ strapi }: { strapi: any }) => ({
    /**
     * Genera posts fake de Instagram
     */
    generateInstagramPosts(count: number = 9): InstagramPost[] {
      const posts: InstagramPost[] = [];
      const mediaTypes: ('IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM')[] = ['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM'];
      const captions = [
        '¡Increíble momento capturado! 📸 #fotografía #momentos #vida',
        'Disfrutando de un hermoso día soleado ☀️ #felicidad #naturaleza',
        'Nuevo proyecto en marcha 🚀 #trabajo #creatividad #innovación',
        'Compartiendo buenos momentos con amigos 👥 #amistad #diversión',
        'Inspiración diaria para seguir adelante 💪 #motivación #crecimiento',
        'Explorando nuevos lugares increíbles 🗺️ #viajes #aventura #descubrimiento',
        'Momento de reflexión y gratitud 🙏 #bienestar #mindfulness',
        'Creando recuerdos inolvidables ✨ #memorias #experiencias',
        'Aprendiendo algo nuevo cada día 📚 #educación #desarrollo',
        'Celebrando los pequeños logros 🎉 #éxito #progreso',
      ];
  
      for (let i = 0; i < count; i++) {
        const mediaType = mediaTypes[Math.floor(Math.random() * mediaTypes.length)];
        const randomId = Math.floor(Math.random() * 100000);
        const imageSize = Math.random() > 0.7 ? '600x600' : '400x400'; // Variación en tamaños
        
        // Generar engagement realista (posts más recientes tienden a tener más engagement)
        const recencyFactor = (count - i) / count; // Posts más recientes = factor mayor
        const baseLikes = Math.floor(Math.random() * 200 + 50);
        const likeCount = Math.floor(baseLikes * (0.5 + recencyFactor * 0.8));
        const commentsCount = Math.floor(likeCount * (0.02 + Math.random() * 0.08)); // 2-10% de los likes
        
        // Timestamp realista (últimos 30 días)
        const daysAgo = Math.floor(Math.random() * 30);
        const hoursAgo = Math.floor(Math.random() * 24);
        const timestamp = new Date();
        timestamp.setDate(timestamp.getDate() - daysAgo);
        timestamp.setHours(timestamp.getHours() - hoursAgo);
  
        const post: InstagramPost = {
          id: `fake_ig_${randomId}_${i}`,
          media_type: mediaType,
          media_url: `https://picsum.photos/${imageSize}?random=${randomId}`,
          permalink: `https://instagram.com/p/fake_${randomId}_${i}`,
          caption: captions[Math.floor(Math.random() * captions.length)],
          timestamp: timestamp.toISOString(),
          like_count: likeCount,
          comments_count: commentsCount,
        };
  
        // Para videos, agregar thumbnail
        if (mediaType === 'VIDEO') {
          post.thumbnail_url = `https://picsum.photos/400x400?random=${randomId + 1000}`;
        }
  
        // Para carruseles, mantener la URL de la primera imagen
        if (mediaType === 'CAROUSEL_ALBUM') {
          post.media_url = `https://picsum.photos/500x500?random=${randomId}`;
        }
  
        posts.push(post);
      }
  
      // Ordenar por timestamp descendente (más recientes primero)
      return posts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    },
  
    /**
     * Genera posts fake de TikTok
     */
    generateTikTokPosts(count: number = 9): TikTokPost[] {
      const posts: TikTokPost[] = [];
      const titles = [
        'Tutorial increíble que tienes que ver 🔥',
        'Reacción épica que no esperabas 😱',
        'Truco de vida que va a cambiar tu día',
        'Momento divertido con amigos 😂',
        'Transformación sorprendente paso a paso',
        'Baile viral que todos están haciendo 💃',
        'Dato curioso que te va a sorprender 🤯',
        'Receta rápida y deliciosa 🍳',
        'Experimento casero súper fácil 🧪',
        'Historia que tienes que escuchar 📖',
      ];
  
      for (let i = 0; i < count; i++) {
        const randomId = Math.floor(Math.random() * 100000);
        const duration = Math.floor(Math.random() * 45 + 15); // 15-60 segundos
        
        // Engagement realista para TikTok (números más altos que Instagram)
        const recencyFactor = (count - i) / count;
        const baseViews = Math.floor(Math.random() * 5000 + 1000);
        const viewCount = Math.floor(baseViews * (0.3 + recencyFactor * 1.2));
        const likeCount = Math.floor(viewCount * (0.05 + Math.random() * 0.15)); // 5-20% de las vistas
        const shareCount = Math.floor(likeCount * (0.1 + Math.random() * 0.3)); // 10-40% de los likes
        
        // Timestamp de creación (últimos 15 días, TikTok es más dinámico)
        const daysAgo = Math.floor(Math.random() * 15);
        const hoursAgo = Math.floor(Math.random() * 24);
        const createTime = new Date();
        createTime.setDate(createTime.getDate() - daysAgo);
        createTime.setHours(createTime.getHours() - hoursAgo);
  
        const post: TikTokPost = {
          id: `fake_tt_${randomId}_${i}`,
          video_url: `https://sample-videos.com/zip/10/mp4/SampleVideo_360x240_1mb.mp4?id=${randomId}`,
          cover_image_url: `https://picsum.photos/240x320?random=${randomId}`,
          title: titles[Math.floor(Math.random() * titles.length)],
          duration,
          view_count: viewCount,
          like_count: likeCount,
          share_count: shareCount,
          create_time: Math.floor(createTime.getTime() / 1000), // Unix timestamp
        };
  
        posts.push(post);
      }
  
      // Ordenar por create_time descendente (más recientes primero)
      return posts.sort((a, b) => b.create_time - a.create_time);
    },
  
    /**
     * Genera posts fake según la plataforma
     */
    generatePostsByPlatform(platform: 'instagram' | 'tiktok', count: number): InstagramPost[] | TikTokPost[] {
      switch (platform) {
        case 'instagram':
          return this.generateInstagramPosts(count);
        case 'tiktok':
          return this.generateTikTokPosts(count);
        default:
          throw new Error(`Plataforma no soportada: ${platform}`);
      }
    },
  
    /**
     * Valida que la estructura de posts sea correcta
     */
    validatePostStructure(posts: InstagramPost[] | TikTokPost[], platform: 'instagram' | 'tiktok'): boolean {
      if (!Array.isArray(posts) || posts.length === 0) {
        return false;
      }
  
      const firstPost = posts[0];
      
      if (platform === 'instagram') {
        const requiredFields = ['id', 'media_type', 'media_url', 'permalink', 'caption', 'timestamp', 'like_count', 'comments_count'];
        return requiredFields.every(field => field in firstPost);
      } else if (platform === 'tiktok') {
        const requiredFields = ['id', 'video_url', 'cover_image_url', 'title', 'duration', 'view_count', 'like_count', 'share_count', 'create_time'];
        return requiredFields.every(field => field in firstPost);
      }
  
      return false;
    },
  
    /**
     * Obtiene estadísticas de engagement de los posts generados
     */
    getEngagementStats(posts: InstagramPost[] | TikTokPost[], platform: 'instagram' | 'tiktok'): any {
      if (posts.length === 0) return null;
  
      if (platform === 'instagram') {
        const instagramPosts = posts as InstagramPost[];
        const totalLikes = instagramPosts.reduce((sum, post) => sum + post.like_count, 0);
        const totalComments = instagramPosts.reduce((sum, post) => sum + post.comments_count, 0);
        
        return {
          platform,
          total_posts: posts.length,
          avg_likes: Math.round(totalLikes / posts.length),
          avg_comments: Math.round(totalComments / posts.length),
          total_engagement: totalLikes + totalComments,
        };
      } else if (platform === 'tiktok') {
        const tiktokPosts = posts as TikTokPost[];
        const totalViews = tiktokPosts.reduce((sum, post) => sum + post.view_count, 0);
        const totalLikes = tiktokPosts.reduce((sum, post) => sum + post.like_count, 0);
        const totalShares = tiktokPosts.reduce((sum, post) => sum + post.share_count, 0);
        
        return {
          platform,
          total_posts: posts.length,
          avg_views: Math.round(totalViews / posts.length),
          avg_likes: Math.round(totalLikes / posts.length),
          avg_shares: Math.round(totalShares / posts.length),
          total_engagement: totalLikes + totalShares,
        };
      }
  
      return null;
    },
  });