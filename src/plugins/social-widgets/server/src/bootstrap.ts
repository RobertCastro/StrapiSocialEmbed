export default ({ strapi }: { strapi: any }) => {
  // Cron Job para sincronización automática
  strapi.cron.add({
    // Ejecutar cada 5 minutos
    '*/5 * * * *': {
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
  });

  strapi.log.info('🚀 Social Widgets Plugin: Cron job configurado para ejecutar cada 5 minutos');
  
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