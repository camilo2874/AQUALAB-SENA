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

  // Debounce para evitar múltiples llamadas a la API
  const debouncedFetch = useDebounce(async () => {
    if (!isOnline || !isAuthenticated || !token) {
      console.log('Sin conexión o sin autenticación - saltando actualización de notificaciones');
      return;
    }
    await fetchMuestrasEnCotizacionInternal();
  }, 1000);

  // Función para probar la respuesta de la API (debugging)
  const testApiResponse = async () => {
    try {
      const authToken = localStorage.getItem('token');
      if (!authToken) {
        console.log('❌ No hay token de autenticación');
        return;
      }

      console.log('🔍 Probando respuesta de la API...');
      const response = await axios.get(API_URLS.MUESTRAS, {
        timeout: 10000,
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Respuesta exitosa de la API:');
      console.log('- Status:', response.status);
      console.log('- Headers:', response.headers);
      console.log('- Data tipo:', typeof response.data);
      console.log('- Data estructura:', Object.keys(response.data || {}));
      console.log('- Data completa:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('❌ Error en prueba de API:', error);
      if (error.response) {
        console.log('- Status de error:', error.response.status);
        console.log('- Data de error:', error.response.data);
      }
    }
  };

  // Función para manejar errores de API de manera controlada
  const handleApiError = (error, retryCount) => {
    const maxRetries = 3;
    
    if (error.response?.status === 401) {
      console.log('❌ Token de autenticación inválido o expirado');
      setConnectionStatus('error');
      // Limpiar notificaciones si hay problema de autenticación
      setNotifications([]);
    } else if (error.response?.status === 403) {
      console.log('❌ Sin permisos para acceder a las muestras');
      setConnectionStatus('error');
    } else if (error.code === 'ECONNABORTED') {
      console.log('⏱️ Timeout: La solicitud tardó demasiado tiempo');
      setConnectionStatus('connecting');
      
      // Reintentar si no hemos superado el máximo de reintentos
      if (retryCount < maxRetries) {
        console.log(`🔄 Reintentando... (${retryCount + 1}/${maxRetries})`);
        setTimeout(() => fetchMuestrasEnCotizacionInternal(retryCount + 1), 2000);
        return;
      } else {
        setConnectionStatus('error');
      }
    } else if (!error.response) {
      console.log('🌐 Error de conexión: Verifica tu conexión a internet');
      setConnectionStatus('connecting');
      
      // Reintentar si no hemos superado el máximo de reintentos
      if (retryCount < maxRetries) {
        console.log(`🔄 Reintentando... (${retryCount + 1}/${maxRetries})`);
        setTimeout(() => fetchMuestrasEnCotizacionInternal(retryCount + 1), 3000);
        return;
      } else {
        setConnectionStatus('error');
      }
    } else {
      console.log('❌ Error desconocido:', error.message);
      setConnectionStatus('error');
    }
  };

  // Función interna para obtener muestras en cotización con reintentos
  const fetchMuestrasEnCotizacionInternal = async (retryCount = 0) => {
    try {
      setLoading(true);
      setConnectionStatus('connecting');
      
      // Obtener el token del localStorage
      const authToken = localStorage.getItem('token');
      
      if (!authToken) {
        console.log('❌ No hay token de autenticación disponible');
        setConnectionStatus('error');
        return;
      }

      const response = await axios.get(API_URLS.MUESTRAS, {
        timeout: 10000, // 10 segundos de timeout
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Validación robusta de la respuesta
      console.log('🔍 Respuesta completa de la API:', JSON.stringify(response, null, 2));
      console.log('🔍 Tipo de response:', typeof response);
      console.log('🔍 Tipo de response.data:', typeof response?.data);
      console.log('🔍 response.data es array?', Array.isArray(response?.data));
      
      // Verificar que la respuesta existe
      if (!response) {
        console.error('❌ Respuesta de API es null o undefined');
        return;
      }
      
      let muestrasArray = [];
      
      try {
        // Determinar la estructura correcta de la respuesta
        if (response.data) {
          if (Array.isArray(response.data)) {
            // Si response.data es directamente un array
            muestrasArray = response.data;
            console.log('✅ Datos encontrados en response.data (array directo)');
          } else if (response.data.data && response.data.data.data && Array.isArray(response.data.data.data)) {
            // Si response.data.data.data es un array (estructura específica de tu API)
            muestrasArray = response.data.data.data;
            console.log('✅ Datos encontrados en response.data.data.data');
          } else if (response.data.data && Array.isArray(response.data.data)) {
            // Si response.data.data es un array
            muestrasArray = response.data.data;
            console.log('✅ Datos encontrados en response.data.data');
          } else if (response.data.muestras && Array.isArray(response.data.muestras)) {
            // Si response.data.muestras es un array
            muestrasArray = response.data.muestras;
            console.log('✅ Datos encontrados en response.data.muestras');
          } else if (response.data.results && Array.isArray(response.data.results)) {
            // Si response.data.results es un array
            muestrasArray = response.data.results;
            console.log('✅ Datos encontrados en response.data.results');
          } else if (typeof response.data === 'object' && response.data !== null) {
            // Explorar las propiedades del objeto para encontrar un array
            console.log('🔍 Explorando propiedades de response.data:', Object.keys(response.data));
            
            for (const [key, value] of Object.entries(response.data)) {
              if (Array.isArray(value)) {
                muestrasArray = value;
                console.log(`✅ Datos encontrados en response.data.${key}`);
                break;
              }
            }
            
            if (muestrasArray.length === 0) {
              console.warn('⚠️ No se encontró ningún array en response.data');
              console.warn('⚠️ Propiedades disponibles:', Object.keys(response.data));
              return;
            }
          } else {
            console.error('❌ response.data no es un objeto válido:', response.data);
            return;
          }
        } else if (Array.isArray(response)) {
          // Si response es directamente un array
          muestrasArray = response;
          console.log('✅ Datos encontrados en response (array directo)');
        } else {
          console.error('❌ Estructura de respuesta no reconocida');
          console.error('❌ Tipo de response:', typeof response);
          console.error('❌ Contenido de response:', response);
          return;
        }
        
        // Verificar que efectivamente tenemos un array
        if (!Array.isArray(muestrasArray)) {
          console.error('❌ Los datos encontrados no son un array:', typeof muestrasArray);
          return;
        }
        
      } catch (parseError) {
        console.error('❌ Error al parsear la respuesta de la API:', parseError);
        console.error('❌ Contenido de response.data:', response.data);
        return;
      }
      
      console.log('📊 Muestras encontradas en la respuesta:', muestrasArray.length);
      
      if (muestrasArray.length > 0) {
        console.log('📋 Primer elemento de muestra:', muestrasArray[0]);
        
        // Filtrar solo las muestras en cotización con validación robusta
        const muestrasEnCotizacion = muestrasArray.filter(muestra => {
          if (!muestra || typeof muestra !== 'object') {
            console.warn('⚠️ Elemento de muestra inválido:', muestra);
            return false;
          }
          
          // Buscar el campo de estado en diferentes propiedades posibles
          const estado = muestra.estado || muestra.status || muestra.state || '';
          const estadoLower = estado.toString().toLowerCase();
          
          const esEnCotizacion = estadoLower === 'en cotización' || 
                                 estadoLower === 'en cotizacion' ||
                                 estadoLower.includes('cotización') ||
                                 estadoLower.includes('cotizacion');
          
          if (esEnCotizacion) {
            console.log('✅ Muestra en cotización encontrada:', {
              id: muestra.id_muestra || muestra.id_muestrea || muestra._id || muestra.id,
              estado: estado
            });
          }
          
          return esEnCotizacion;
        });

        console.log('📋 Total muestras en cotización:', muestrasEnCotizacion.length);

        // Obtener IDs de muestras actuales en cotización con validación
        const idsEnCotizacion = muestrasEnCotizacion.map(muestra => {
          const id = muestra.id_muestra || muestra.id_muestrea || muestra._id || muestra.id;
          if (!id) {
            console.warn('⚠️ Muestra sin ID válido:', muestra);
          }
          return id;
        }).filter(id => id !== undefined && id !== null);
        
        console.log('📋 IDs de muestras en cotización:', idsEnCotizacion);

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
        }).filter(notificacion => notificacion.id); // Solo notificaciones con ID válido
        
        console.log('🔔 Notificaciones nuevas creadas:', notificacionesNuevas.length);

        // Actualizar notificaciones respetando las eliminadas/leídas por el usuario
        setNotifications(prevNotifications => {
          console.log('🔄 Notificaciones previas:', prevNotifications.length);
          
          // Mantener notificaciones que el usuario ha marcado como leídas
          const notificacionesMantenidas = prevNotifications.filter(notification => {
            // Mantener si está leída (el usuario ya la vio)
            if (notification.leida) {
              console.log('📖 Manteniendo notificación leída:', notification.id);
              return true;
            }
            
            // Mantener si sigue estando en la lista de cotización
            const siguEnCotizacion = idsEnCotizacion.includes(notification.id);
            if (!siguEnCotizacion) {
              console.log('🗑️ Removiendo notificación que ya no está en cotización:', notification.id);
            }
            return siguEnCotizacion;
          });
          
          // Agregar solo notificaciones completamente nuevas (que no existen)
          const existingIds = prevNotifications.map(n => n.id);
          const notificacionesCompletamenteNuevas = notificacionesNuevas.filter(n => !existingIds.includes(n.id));
          
          console.log('📋 Notificaciones mantenidas:', notificacionesMantenidas.length);
          console.log('🆕 Notificaciones completamente nuevas:', notificacionesCompletamenteNuevas.length);
          
          // Actualizar datos de muestras para notificaciones existentes
          const notificacionesActualizadas = notificacionesMantenidas.map(existingNotification => {
            const muestraActualizada = muestrasEnCotizacion.find(m => {
              const id = m.id_muestra || m.id_muestrea || m._id || m.id;
              return id === existingNotification.id;
            });
            
            if (muestraActualizada) {
              return {
                ...existingNotification,
                muestra: muestraActualizada // Actualizar datos de la muestra
              };
            }
            return existingNotification;
          });
          
          const resultadoFinal = [...notificacionesActualizadas, ...notificacionesCompletamenteNuevas];
          console.log('✅ Total notificaciones finales:', resultadoFinal.length);
          
          return resultadoFinal;
        });
      } else {
        console.log('❌ No se encontraron muestras en la respuesta de la API');
      }
      
      setConnectionStatus('connected');
      
    } catch (error) {
      console.error('❌ Error al obtener muestras en cotización:', error);
      console.error('❌ Stack trace:', error.stack);
      
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
    // Solo ejecutar si el usuario está autenticado
    if (!isAuthenticated || !token) {
      return;
    }

    // Cargar inmediatamente
    fetchMuestrasEnCotizacion();
    
    // Actualizar cada 30 segundos solo si está autenticado y conectado
    const interval = setInterval(() => {
      if (isOnline && isAuthenticated && token) {
        fetchMuestrasEnCotizacion();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchMuestrasEnCotizacion, isOnline, isAuthenticated, token]);

  // Refrescar cuando se recupere la conexión y esté autenticado
  useEffect(() => {
    if (isOnline && isAuthenticated && token) {
      fetchMuestrasEnCotizacion();
    }
  }, [isOnline, isAuthenticated, token, fetchMuestrasEnCotizacion]);

  // Marcar notificación como leída
  const markAsRead = useCallback((notificationId) => {
    console.log('🔔 Marcando notificación como leída:', notificationId);
    setNotifications(prev => {
      const updated = prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, leida: true }
          : notification
      );
      console.log('🔔 Notificaciones después de marcar como leída:', updated.length);
      return updated;
    });
  }, [setNotifications]);

  // Eliminar una notificación específica
  const removeNotification = useCallback((notificationId) => {
    console.log('🗑️ Eliminando notificación:', notificationId);
    setNotifications(prev => {
      const filtered = prev.filter(notification => notification.id !== notificationId);
      console.log('🗑️ Notificaciones después de eliminar:', filtered.length);
      return filtered;
    });
  }, [setNotifications]);

  // Eliminar todas las notificaciones
  const clearAllNotifications = useCallback(() => {
    console.log('🗑️ Eliminando todas las notificaciones');
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
    refreshNotifications: fetchMuestrasEnCotizacion,
    testApiResponse // Función de debugging
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
