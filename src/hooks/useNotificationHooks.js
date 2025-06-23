import { useState, useEffect, useRef } from 'react';
import { API_CONFIG, STORAGE_KEYS } from '../config/constants';

/**
 * Hook personalizado para gestionar notificaciones con persistencia local
 * y limpieza automática de notificaciones obsoletas
 */
export const useNotificationStorage = () => {
  const [notifications, setNotifications] = useState([]);
  const storageKey = STORAGE_KEYS.NOTIFICATIONS;
  const lastUpdateRef = useRef(Date.now());

  // Cargar notificaciones del localStorage al inicializar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsedNotifications = JSON.parse(stored);
        // Filtrar notificaciones que no sean muy antiguas
        const now = Date.now();
        const maxAge = API_CONFIG.NOTIFICATIONS.MAX_AGE_HOURS * 60 * 60 * 1000;
        const validNotifications = parsedNotifications.filter(notification => {
          const notificationTime = new Date(notification.fecha).getTime();
          return (now - notificationTime) < maxAge;
        });
        setNotifications(validNotifications);
      }
    } catch (error) {
      console.error('Error al cargar notificaciones del localStorage:', error);
    }
  }, [storageKey]);

  // Guardar notificaciones en localStorage cuando cambien
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(notifications));
      lastUpdateRef.current = Date.now();
    } catch (error) {
      console.error('Error al guardar notificaciones en localStorage:', error);
    }
  }, [notifications]);

  // Función para agregar notificaciones evitando duplicados
  const addNotifications = (newNotifications) => {
    setNotifications(prev => {
      const existingIds = prev.map(n => n.id);
      const uniqueNotifications = newNotifications.filter(n => !existingIds.includes(n.id));
      return [...prev, ...uniqueNotifications];
    });
  };

  // Función para actualizar notificaciones existentes
  const updateNotifications = (updatedNotifications) => {
    setNotifications(updatedNotifications);
  };

  // Función para limpiar notificaciones obsoletas
  const cleanupObsoleteNotifications = (validIds) => {
    setNotifications(prev => prev.filter(notification => validIds.includes(notification.id)));
  };

  return {
    notifications,
    setNotifications,
    addNotifications,
    updateNotifications,
    cleanupObsoleteNotifications,
    lastUpdate: lastUpdateRef.current
  };
};

/**
 * Hook para debounce de funciones (evitar llamadas excesivas)
 */
export const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null);

  const debouncedCallback = (...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  };

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

/**
 * Hook para gestionar el estado de conexión de red
 */
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};
