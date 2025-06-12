import React, { lazy, Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';

// Componente de carga personalizado
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
 * Componente de carga perezosa (lazy loading) con Suspense integrado
 * @param {Object} props - Propiedades del componente
 * @param {React.ComponentType} props.component - Componente a cargar de forma perezosa
 * @param {Object} [props.fallback] - Componente a mostrar mientras se carga (opcional)
 * @param {Object} [props.suspenseProps] - Propiedades adicionales para Suspense (opcional)
 * @returns {React.ReactElement} - Componente con carga perezosa
 */
const LazyLoad = ({ 
  component: Component, 
  fallback = <LoadingFallback />, 
  suspenseProps = {}, 
  ...rest 
}) => {
  return (
    <Suspense fallback={fallback} {...suspenseProps}>
      <Component {...rest} />
    </Suspense>
  );
};

/**
 * Función para crear un componente con carga perezosa
 * @param {() => Promise<any>} importFunc - Función que importa el componente
 * @param {Object} [options] - Opciones adicionales
 * @returns {React.ReactElement} - Componente con carga perezosa
 */
export const createLazyComponent = (importFunc, options = {}) => {
  const LazyComponent = lazy(importFunc);
  return (props) => (
    <LazyLoad
      component={LazyComponent}
      fallback={options.fallback || <LoadingFallback />}
      suspenseProps={options.suspenseProps || {}}
      {...props}
    />
  );
};

export default LazyLoad;
