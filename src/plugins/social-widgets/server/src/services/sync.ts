import type { SyncResult, SyncStats, SupportedPlatform } from '../types';

export default ({ strapi }: { strapi: any }) => ({
  /**
   * Sincroniza un widget específico obteniendo posts fake y actualizando su cache
   */
  async syncWidget(widgetId: number): Promise<SyncResult> {
    const startTime = Date.now();
    
    try {
      // Obtener la configuración del widget con su cuenta relacionada
      const widget = await strapi.entityService.findOne(
        'plugin::social-widgets.widget-configuration',
        widgetId,
        {
          populate: ['account'],
        }
      );

      if (!widget) {
        throw new Error(`Widget con ID ${widgetId} no encontrado`);
      }

      if (!widget.account) {
        throw new Error(`Widget ${widget.name} no tiene una cuenta asociada`);
      }

      const { account, postsToShow } = widget;
      const platform = account.platform as SupportedPlatform;

      strapi.log.info(`Sincronizando widget "${widget.name}" (${platform}) - ${postsToShow} posts`);

      // Generar posts fake usando el servicio fake-data
      const fakeDataService = strapi.plugin('social-widgets').service('fake-data');
      const posts = fakeDataService.generatePostsByPlatform(platform, postsToShow || 9);

      // Validar que los posts generados tengan la estructura correcta
      const isValid = fakeDataService.validatePostStructure(posts, platform);
      if (!isValid) {
        throw new Error(`Posts generados para ${platform} no tienen la estructura correcta`);
      }

      // Obtener estadísticas de engagement
      const engagementStats = fakeDataService.getEngagementStats(posts, platform);

      // Preparar datos para guardar en cache
      const cachedData = {
        posts,
        platform,
        account: {
          username: account.username,
          accountId: account.accountId,
        },
        metadata: {
          totalPosts: posts.length,
          syncedAt: new Date().toISOString(),
          engagementStats,
          syncDuration: Date.now() - startTime,
        },
      };

      // Actualizar el widget con los nuevos datos
      const updatedWidget = await strapi.entityService.update(
        'plugin::social-widgets.widget-configuration',
        widgetId,
        {
          data: {
            cachedData,
            lastUpdated: new Date().toISOString(),
          },
        }
      );

      const result: SyncResult = {
        widgetId,
        success: true,
        postsCount: posts.length,
        lastUpdated: updatedWidget.lastUpdated,
      };

      strapi.log.info(`✅ Widget "${widget.name}" sincronizado exitosamente - ${posts.length} posts`);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      strapi.log.error(`❌ Error sincronizando widget ${widgetId}: ${errorMessage}`);
      
      return {
        widgetId,
        success: false,
        postsCount: 0,
        error: errorMessage,
        lastUpdated: new Date().toISOString(),
      };
    }
  },

  /**
   * Sincroniza todos los widgets que necesitan actualización
   */
  async syncAllWidgets(): Promise<SyncStats> {
    const startTime = Date.now();
    
    try {
      strapi.log.info('🔄 Iniciando sincronización de todos los widgets...');

      // Obtener todos los widgets que necesitan sincronización
      const widgetsToSync = await this.getWidgetsToSync();
      
      if (widgetsToSync.length === 0) {
        strapi.log.info('ℹ️ No hay widgets que necesiten sincronización en este momento');
        return {
          totalWidgets: 0,
          successfulSyncs: 0,
          failedSyncs: 0,
          totalPostsSynced: 0,
          executionTime: Date.now() - startTime,
        };
      }

      strapi.log.info(`📊 Sincronizando ${widgetsToSync.length} widgets...`);

      // Sincronizar cada widget
      const syncResults: SyncResult[] = [];
      for (const widget of widgetsToSync) {
        const result = await this.syncWidget(widget.id);
        syncResults.push(result);
        
        // Pequeña pausa entre sincronizaciones para no sobrecargar
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Calcular estadísticas
      const successfulSyncs = syncResults.filter(r => r.success).length;
      const failedSyncs = syncResults.filter(r => !r.success).length;
      const totalPostsSynced = syncResults.reduce((sum, r) => sum + r.postsCount, 0);

      const stats: SyncStats = {
        totalWidgets: widgetsToSync.length,
        successfulSyncs,
        failedSyncs,
        totalPostsSynced,
        executionTime: Date.now() - startTime,
      };

      strapi.log.info(`✅ Sincronización completa: ${successfulSyncs}/${widgetsToSync.length} widgets exitosos, ${totalPostsSynced} posts sincronizados en ${stats.executionTime}ms`);

      return stats;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      strapi.log.error(`❌ Error en sincronización masiva: ${errorMessage}`);
      
      return {
        totalWidgets: 0,
        successfulSyncs: 0,
        failedSyncs: 1,
        totalPostsSynced: 0,
        executionTime: Date.now() - startTime,
      };
    }
  },

  /**
   * Obtiene los widgets que necesitan sincronización basado en updateFrequency
   */
  async getWidgetsToSync(): Promise<any[]> {
    try {
      // Obtener todos los widgets con sus cuentas
      const allWidgets = await strapi.entityService.findMany(
        'plugin::social-widgets.widget-configuration',
        {
          populate: ['account'],
        }
      );

      if (!allWidgets || allWidgets.length === 0) {
        return [];
      }

      const now = new Date();
      const widgetsToSync = [];

      for (const widget of allWidgets) {
        // Verificar que el widget tenga cuenta asociada
        if (!widget.account) {
          strapi.log.warn(`Widget "${widget.name}" no tiene cuenta asociada, saltando sincronización`);
          continue;
        }

        // Si nunca se ha sincronizado, necesita sincronización
        if (!widget.lastUpdated) {
          widgetsToSync.push(widget);
          continue;
        }

        // Calcular si necesita sincronización basado en updateFrequency
        const lastUpdated = new Date(widget.lastUpdated);
        const updateFrequencyMs = (widget.updateFrequency || 60) * 60 * 1000; // Convertir minutos a ms
        const timeSinceLastUpdate = now.getTime() - lastUpdated.getTime();

        if (timeSinceLastUpdate >= updateFrequencyMs) {
          widgetsToSync.push(widget);
        }
      }

      return widgetsToSync;

    } catch (error) {
      strapi.log.error(`Error obteniendo widgets para sincronizar: ${error}`);
      return [];
    }
  },

  /**
   * Fuerza la sincronización de un widget específico (ignorando updateFrequency)
   */
  async forceSyncWidget(widgetId: number): Promise<SyncResult> {
    strapi.log.info(`🔄 Forzando sincronización del widget ${widgetId}...`);
    return await this.syncWidget(widgetId);
  },

  /**
   * Obtiene el estado de sincronización de todos los widgets
   */
  async getSyncStatus(): Promise<any[]> {
    try {
      const widgets = await strapi.entityService.findMany(
        'plugin::social-widgets.widget-configuration',
        {
          populate: ['account'],
        }
      );

      return widgets.map(widget => {
        const now = new Date();
        const lastUpdated = widget.lastUpdated ? new Date(widget.lastUpdated) : null;
        const updateFrequencyMs = (widget.updateFrequency || 60) * 60 * 1000;
        
        let status = 'pending';
        let nextSync = null;
        
        if (lastUpdated) {
          const timeSinceLastUpdate = now.getTime() - lastUpdated.getTime();
          const timeToNextSync = updateFrequencyMs - timeSinceLastUpdate;
          
          if (timeToNextSync <= 0) {
            status = 'needs_sync';
          } else {
            status = 'synced';
            nextSync = new Date(now.getTime() + timeToNextSync).toISOString();
          }
        }

        return {
          id: widget.id,
          name: widget.name,
          platform: widget.account?.platform || 'unknown',
          lastUpdated: widget.lastUpdated,
          updateFrequency: widget.updateFrequency,
          status,
          nextSync,
          hasCache: !!widget.cachedData,
          postsInCache: widget.cachedData?.posts?.length || 0,
        };
      });

    } catch (error) {
      strapi.log.error(`Error obteniendo estado de sincronización: ${error}`);
      return [];
    }
  },
});