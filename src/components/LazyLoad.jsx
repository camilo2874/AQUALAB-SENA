import React, { lazy, Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';

// Componente de carga simplificado
const LoadingFallback = () => (
  <Box 
    sx={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      width: '100%', 
      height: '50vh' 
    }}
  >
    <CircularProgress color="primary" />
  </Box>
);

/**
 * Función simplificada para crear un componente con carga perezosa
 * @param {() => Promise<any>} importFunc - Función que importa el componente
 * @param {Object} [options] - Opciones adicionales (opcional)
 * @returns {Function} - Componente React con carga perezosa
 */
export const createLazyComponent = (importFunc, options = {}) => {
  const LazyComponent = lazy(importFunc);
  
  return function LazyWrapper(props) {
    return (
      <Suspense fallback={options.fallback || <LoadingFallback />}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
};

export default createLazyComponent;
