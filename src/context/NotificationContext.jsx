import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import AuthContext from './AuthContext';
import { useNotificationStorage, useDebounce, useNetworkStatus } from '../hooks/useNotificationHooks';

const NotificationContext = createContext();

// URLs para las peticiones
const BASE_URLS = {
  MUESTRAS: "https://backend-registro-muestras.onrender.com/api"
};

const API_URLS = {
  MUESTRAS: `${BASE_URLS.MUESTRAS}/muestras`
};

export const NotificationProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const { isAuthenticated, token } = useContext(AuthContext);
  const { 
    notifications, 
    setNotifications, 
    addNotifications, 
    updateNotifications, 
    cleanupObsoleteNotifications 
  } = useNotificationStorage();
  const isOnline = useNetworkStatus();

  // Debounce para evitar múltiples llamadas a la API - reducido a 5 segundos
  const debouncedFetch = useDebounce(async () => {
    if (!isOnline || !isAuthenticated || !token) {
      return; // Sin logs innecesarios
    }
    await fetchMuestrasEnCotizacionInternal();  }, 5000);

  // Función para manejar errores de API de manera controlada
  const handleApiError = (error, retryCount) => {
    const maxRetries = 3;
      if (error.response?.status === 401) {
      setConnectionStatus('error');
      setNotifications([]);
    } else if (error.response?.status === 403) {
      setConnectionStatus('error');
    } else if (error.code === 'ECONNABORTED') {
      setConnectionStatus('connecting');
      
      if (retryCount < maxRetries) {
        setTimeout(() => fetchMuestrasEnCotizacionInternal(retryCount + 1), 2000);
        return;
      } else {
        setConnectionStatus('error');
      }    } else if (!error.response) {
      setConnectionStatus('connecting');
      
      if (retryCount < maxRetries) {
        setTimeout(() => fetchMuestrasEnCotizacionInternal(retryCount + 1), 3000);
        return;
      } else {
        setConnectionStatus('error');
      }
    } else {
      setConnectionStatus('error');
    }
  };

  // Función interna para obtener muestras en cotización con reintentos
  const fetchMuestrasEnCotizacionInternal = async (retryCount = 0) => {
    try {
      setLoading(true);
      setConnectionStatus('connecting');
      
      const authToken = localStorage.getItem('token');
        if (!authToken) {
        setConnectionStatus('error');
        setLoading(false);
        return;
      }

      const response = await axios.get(API_URLS.MUESTRAS, {
        timeout: 10000,
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Validación robusta pero sin logs excesivos
      if (!response) {
        console.error('❌ Respuesta de API es null');
        setLoading(false);
        setConnectionStatus('error');
        return;
      }
      
      let muestrasArray = [];
      
      try {
        // Determinar la estructura correcta de la respuesta
        if (response.data?.data?.data && Array.isArray(response.data.data.data)) {
          muestrasArray = response.data.data.data;
        } else if (response.data?.data && Array.isArray(response.data.data)) {
          muestrasArray = response.data.data;
        } else if (Array.isArray(response.data)) {
          muestrasArray = response.data;
        } else if (response.data?.muestras && Array.isArray(response.data.muestras)) {
          muestrasArray = response.data.muestras;
        } else if (response.data?.results && Array.isArray(response.data.results)) {
          muestrasArray = response.data.results;
        } else if (typeof response.data === 'object' && response.data !== null) {
          // Buscar arrays en las propiedades
          for (const [key, value] of Object.entries(response.data)) {
            if (Array.isArray(value)) {
              muestrasArray = value;
              break;
            }
          }
        }
        
        if (!Array.isArray(muestrasArray)) {
          console.error('❌ No se encontró array de muestras válido');
          setLoading(false);
          setConnectionStatus('error');
          return;
        }
        
      } catch (parseError) {
        console.error('❌ Error al parsear respuesta:', parseError.message);
        setLoading(false);
        setConnectionStatus('error');
        return;
      }
        // Procesamiento silencioso
      if (muestrasArray.length > 0) {
        // Filtrar solo las muestras en cotización
        const muestrasEnCotizacion = muestrasArray.filter(muestra => {
          if (!muestra || typeof muestra !== 'object') {
            return false;
          }
          
          const estado = muestra.estado || muestra.status || muestra.state || '';
          const estadoLower = estado.toString().toLowerCase();
          
          return estadoLower === 'en cotización' || 
                 estadoLower === 'en cotizacion' ||
                 estadoLower.includes('cotización') ||
                 estadoLower.includes('cotizacion');
        });        // Solo mostrar si encontramos muestras en cotización
        if (muestrasEnCotizacion.length > 0) {
          // Silencioso - sin logs
        }

        // Obtener IDs de muestras actuales en cotización
        const idsEnCotizacion = muestrasEnCotizacion.map(muestra => {
          return muestra.id_muestra || muestra.id_muestrea || muestra._id || muestra.id;
        }).filter(id => id !== undefined && id !== null);
        
        // Convertir muestras a notificaciones
        const notificacionesNuevas = muestrasEnCotizacion.map(muestra => {
          const id = muestra.id_muestra || muestra.id_muestrea || muestra._id || muestra.id;
          const numeroMuestra = muestra.numero_muestra || muestra.numeroMuestra || muestra.numero || id;
          
          return {
            id,
            tipo: 'cotizacion',
            titulo: 'Nueva Muestra en Cotización',
            mensaje: `Muestra ${numeroMuestra} requiere cotización`,
            muestra: muestra,
            fecha: new Date().toISOString(),
            leida: false
          };
        }).filter(notificacion => notificacion.id);
        
        // Actualizar notificaciones respetando las eliminadas/leídas por el usuario
        setNotifications(prevNotifications => {
          // Mantener notificaciones que el usuario ha marcado como leídas
          const notificacionesMantenidas = prevNotifications.filter(notification => {
            if (notification.leida) {
              return true;
            }
            return idsEnCotizacion.includes(notification.id);
          });
          
          // Agregar solo notificaciones completamente nuevas
          const existingIds = prevNotifications.map(n => n.id);
          const notificacionesCompletamenteNuevas = notificacionesNuevas.filter(n => !existingIds.includes(n.id));
          
          // Actualizar datos de muestras para notificaciones existentes
          const notificacionesActualizadas = notificacionesMantenidas.map(existingNotification => {
            const muestraActualizada = muestrasEnCotizacion.find(m => {
              const id = m.id_muestra || m.id_muestrea || m._id || m.id;
              return id === existingNotification.id;
            });
            
            if (muestraActualizada) {
              return {
                ...existingNotification,
                muestra: muestraActualizada
              };
            }
            return existingNotification;
          });
            const resultadoFinal = [...notificacionesActualizadas, ...notificacionesCompletamenteNuevas];
          
          return resultadoFinal;
        });
      }
      
      setConnectionStatus('connected');
      
    } catch (error) {
      console.error('❌ Error al obtener muestras:', error.message);
      handleApiError(error, retryCount);
      
    } finally {
      setLoading(false);
    }
  };

  // Función pública para refrescar notificaciones
  const fetchMuestrasEnCotizacion = useCallback(() => {
    debouncedFetch();
  }, [debouncedFetch]);

  // Cargar notificaciones al inicializar y configurar intervalo
  useEffect(() => {
    if (!isAuthenticated || !token) {
      return;
    }    // Cargar inmediatamente
    fetchMuestrasEnCotizacion();
    
    // Actualizar cada 120 segundos (2 minutos) para máxima eficiencia
    const interval = setInterval(() => {
      if (isOnline && isAuthenticated && token) {
        fetchMuestrasEnCotizacion();
      }
    }, 120000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, token, isOnline]); // Dependencias simplificadas
  // Marcar notificación como leída
  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev => {
      return prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, leida: true }
          : notification
      );
    });
  }, [setNotifications]);
  // Eliminar una notificación específica
  const removeNotification = useCallback((notificationId) => {
    setNotifications(prev => {
      const filtered = prev.filter(notification => notification.id !== notificationId);
      return filtered;
    });
  }, [setNotifications]);
  // Eliminar todas las notificaciones
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, [setNotifications]);

  // Obtener el número de notificaciones no leídas
  const unreadCount = notifications.filter(n => !n.leida).length;
  const value = {
    notifications,
    unreadCount,
    loading,
    connectionStatus,
    markAsRead,
    removeNotification,
    clearAllNotifications,
    refreshNotifications: fetchMuestrasEnCotizacion
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications debe ser usado dentro de NotificationProvider');
  }
  return context;
};

export default NotificationContext;
