export default ({ strapi }: { strapi: any }) => {
  // Cron Job para sincronización automática
  strapi.cron.add({
    // Ejecutar cada 30 minutos
    '0 */30 * * * *': {
      task: async () => {
        try {
          strapi.log.info('🔄 [CRON] Ejecutando sincronización automática de widgets...');

          const syncService = strapi.plugin('social-widgets').service('sync');
          const stats = await syncService.syncAllWidgets();

          if (stats.totalWidgets > 0) {
            strapi.log.info(
              `✅ [CRON] Sincronización completada: ${stats.successfulSyncs}/${stats.totalWidgets} widgets exitosos, ` +
              `${stats.totalPostsSynced} posts sincronizados en ${stats.executionTime}ms`
            );
          }

          // Si hay fallos, logear como warning
          if (stats.failedSyncs > 0) {
            strapi.log.warn(`⚠️ [CRON] ${stats.failedSyncs} widgets fallaron en la sincronización`);
          }

        } catch (error) {
          strapi.log.error(`❌ [CRON] Error en sincronización automática: ${error}`);
        }
      },
      options: {
        rule: '*/5 * * * *',
        tz: 'America/Bogota',
      },
    },

    // ✅ NUEVO: Limpiar PKCEs expirados cada 30 minutos
    cleanupExpiredPKCE: {
      task: async () => {
        try {
          await strapi.plugin('social-widgets').service('tiktok').cleanupExpiredPKCE();
        } catch (error) {
          strapi.log.error('❌ [CRON] Error en limpieza de PKCE expirados:', error);
        }
      },
      options: {
        rule: '0 */30 * * * *', // Cada 30 minutos
        tz: 'America/Bogota',
      },
    },
  });

  strapi.log.info('🚀 Social Widgets Plugin: Cron jobs configurados (sync cada 5min, PKCE cleanup cada 30min)');

  setTimeout(async () => {
    try {
      strapi.log.info('🔄 [BOOTSTRAP] Ejecutando sincronización inicial...');

      const syncService = strapi.plugin('social-widgets').service('sync');
      const stats = await syncService.syncAllWidgets();

      if (stats.totalWidgets > 0) {
        strapi.log.info(
          `✅ [BOOTSTRAP] Sincronización inicial completada: ${stats.successfulSyncs}/${stats.totalWidgets} widgets`
        );
      } else {
        strapi.log.info('ℹ️ [BOOTSTRAP] No hay widgets configurados para sincronizar');
      }

    } catch (error) {
      strapi.log.error(`❌ [BOOTSTRAP] Error en sincronización inicial: ${error}`);
    }
  }, 30000);
};
