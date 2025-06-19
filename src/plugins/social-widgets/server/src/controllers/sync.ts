export default ({ strapi }: { strapi: any }) => ({
    /**
     * Sincroniza todos los widgets manualmente
     */
    async syncAll(ctx) {
      try {
        strapi.log.info('🔄 [API] Sincronización manual de todos los widgets solicitada');
        
        const syncService = strapi.plugin('social-widgets').service('sync');
        const stats = await syncService.syncAllWidgets();
        
        ctx.body = {
          success: true,
          message: 'Sincronización completada',
          stats,
        };
        
        ctx.status = 200;
        
      } catch (error) {
        strapi.log.error(`❌ [API] Error en sincronización manual: ${error}`);
        
        ctx.body = {
          success: false,
          message: 'Error en la sincronización',
          error: error.message,
        };
        
        ctx.status = 500;
      }
    },
  
    /**
     * Sincroniza un widget específico
     */
    async syncWidget(ctx) {
      try {
        const { widgetId } = ctx.params;
        
        if (!widgetId || isNaN(Number(widgetId))) {
          ctx.body = {
            success: false,
            message: 'ID de widget inválido',
          };
          ctx.status = 400;
          return;
        }
  
        strapi.log.info(`🔄 [API] Sincronización manual del widget ${widgetId} solicitada`);
        
        const syncService = strapi.plugin('social-widgets').service('sync');
        const result = await syncService.forceSyncWidget(Number(widgetId));
        
        ctx.body = {
          success: result.success,
          message: result.success ? 'Widget sincronizado exitosamente' : 'Error sincronizando widget',
          result,
        };
        
        ctx.status = result.success ? 200 : 500;
        
      } catch (error) {
        strapi.log.error(`❌ [API] Error sincronizando widget ${ctx.params.widgetId}: ${error}`);
        
        ctx.body = {
          success: false,
          message: 'Error sincronizando widget',
          error: error.message,
        };
        
        ctx.status = 500;
      }
    },
  
    /**
     * Obtiene el estado de sincronización de todos los widgets
     */
    async getSyncStatus(ctx) {
      try {
        const syncService = strapi.plugin('social-widgets').service('sync');
        const status = await syncService.getSyncStatus();
        
        ctx.body = {
          success: true,
          widgets: status,
          totalWidgets: status.length,
          summary: {
            synced: status.filter(w => w.status === 'synced').length,
            needsSync: status.filter(w => w.status === 'needs_sync').length,
            pending: status.filter(w => w.status === 'pending').length,
          },
        };
        
        ctx.status = 200;
        
      } catch (error) {
        strapi.log.error(`❌ [API] Error obteniendo estado de sincronización: ${error}`);
        
        ctx.body = {
          success: false,
          message: 'Error obteniendo estado de sincronización',
          error: error.message,
        };
        
        ctx.status = 500;
      }
    },
  
    /**
     * Genera posts fake para testing (solo en desarrollo)
     */
    async generateFakePosts(ctx) {
      if (process.env.NODE_ENV !== 'development') {
        ctx.body = {
          success: false,
          message: 'Endpoint solo disponible en desarrollo',
        };
        ctx.status = 403;
        return;
      }
  
      try {
        const { platform = 'instagram', count = 6 } = ctx.query;
        
        if (!['instagram', 'tiktok'].includes(platform)) {
          ctx.body = {
            success: false,
            message: 'Plataforma debe ser instagram o tiktok',
          };
          ctx.status = 400;
          return;
        }
  
        const fakeDataService = strapi.plugin('social-widgets').service('fake-data');
        const posts = fakeDataService.generatePostsByPlatform(platform, Number(count));
        const stats = fakeDataService.getEngagementStats(posts, platform);
        
        ctx.body = {
          success: true,
          platform,
          posts,
          stats,
          generated_at: new Date().toISOString(),
        };
        
        ctx.status = 200;
        
      } catch (error) {
        strapi.log.error(`❌ [API] Error generando posts fake: ${error}`);
        
        ctx.body = {
          success: false,
          message: 'Error generando posts fake',
          error: error.message,
        };
        
        ctx.status = 500;
      }
    },
  });