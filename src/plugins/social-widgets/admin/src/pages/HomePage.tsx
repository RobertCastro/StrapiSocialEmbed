import React, { useState } from 'react';
import { Box, Button, Typography } from '@strapi/design-system';
import { authenticatedFetch, ApiError } from '../utils/api';

const HomePage = () => {
  const [isLoading, setIsLoading] = useState(false);

  const showNotification = (type: 'success' | 'warning', message: string) => {
    // TODO: Implementar notificaciones de Strapi
    alert(`${type.toUpperCase()}: ${message}`);
  };

  const handleAddFakeAccount = async () => {
    setIsLoading(true);
    try {
      console.log('Making request to:', '/social-widgets/developer/add-fake-account');
      
      const response = await authenticatedFetch('/social-widgets/developer/add-fake-account', {
        method: 'POST',
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new ApiError(response.status, response.statusText, errorText);
      }

      const data = await response.json();
      console.log('Success response:', data);

      showNotification('success', `Cuenta de prueba "${data.username}" creada con éxito.`);

      // TODO: recargar la lista de cuentas
    } catch (error) {
      console.error('Error al crear la cuenta de prueba:', error);
      if (error instanceof ApiError) {
        showNotification('warning', `Error ${error.status}: ${error.message}`);
      } else {
        showNotification('warning', 'No se pudo crear la cuenta de prueba.');
      }
    } finally {
      setIsLoading(false);
    }
  };
 
  return (
    <Box padding={8}>
      <Box paddingBottom={4}>
        <Typography variant="alpha">Gestión de Social Widgets</Typography>
      </Box>
      <Box>
        {process.env.NODE_ENV === 'development' && (
          <Box paddingTop={4}>
            <Typography variant="beta">Opciones de Desarrollo</Typography>
            <Box paddingTop={2}>
              <Button onClick={handleAddFakeAccount} loading={isLoading}>
                Agregar Cuenta de Prueba (Dev)
              </Button>
            </Box>
          </Box>
        )}

        {/* TODO:  Lista de cuentas conectadas */}
      </Box>
    </Box>
  );
};

export default HomePage;