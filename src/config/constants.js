// Configuración centralizada para AQUALAB
export const API_CONFIG = {
  // URLs base de los servicios
  BASE_URLS: {
    USUARIOS: "https://backend-sena-lab-1-qpzp.onrender.com/api",
    MUESTRAS: "https://backend-registro-muestras.onrender.com/api"
  },
  
  // Timeouts y configuraciones de red
  NETWORK: {
    REQUEST_TIMEOUT: 10000, // 10 segundos
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000 // 1 segundo
  },
  
  // Configuración de notificaciones
  NOTIFICATIONS: {
    REFRESH_INTERVAL: 30000, // 30 segundos
    MAX_AGE_HOURS: 24, // 24 horas
    DEBOUNCE_DELAY: 1000, // 1 segundo
    STORAGE_KEY: 'aqualab_notifications'
  },
  
  // Estados de muestras
  SAMPLE_STATES: {
    EN_COTIZACION: ["En Cotización", "En Cotizacion"],
    ACEPTADA: "Aceptada",
    RECHAZADA: "Rechazada",
    RECIBIDA: "Recibida",
    EN_ANALISIS: "En análisis",
    FINALIZADA: "Finalizada"
  },
  
  // Colores del tema
  THEME: {
    PRIMARY: '#39A900',
    PRIMARY_DARK: '#2d8000',
    SECONDARY: '#1565C0',
    SUCCESS: '#4caf50',
    ERROR: '#f44336',
    WARNING: '#ff9800',
    INFO: '#2196f3'
  }
};

// URLs específicas construidas a partir de las URLs base
export const API_URLS = {
  USUARIOS: `${API_CONFIG.BASE_URLS.USUARIOS}/usuarios`,
  MUESTRAS: `${API_CONFIG.BASE_URLS.MUESTRAS}/muestras`,
  ANALISIS_FISICOQUIMICOS: `${API_CONFIG.BASE_URLS.MUESTRAS}/analisis/fisicoquimico`,
  ANALISIS_MICROBIOLOGICOS: `${API_CONFIG.BASE_URLS.MUESTRAS}/analisis/microbiologico`
};

// Tipos de datos para la aplicación
export const DATA_TYPES = {
  TIPOS_AGUA: ['potable', 'natural', 'residual', 'otra'],
  TIPOS_AGUA_RESIDUAL: ['Doméstica', 'No Doméstica'],
  TIPOS_PRESERVACION: ['Refrigeración', 'Congelación', 'Acidificación', 'Otro'],
  TIPOS_MUESTREO: ['Simple', 'Compuesto'],
  TIPOS_ANALISIS: ['Fisicoquímico', 'Microbiológico']
};

// Mensajes de la aplicación
export const MESSAGES = {
  NOTIFICATIONS: {
    NEW_SAMPLE_TITLE: 'Nueva Muestra en Cotización',
    NEW_SAMPLE_MESSAGE: (id) => `Muestra ${id} requiere cotización`,
    NO_NOTIFICATIONS: 'No hay notificaciones nuevas',
    OFFLINE_WARNING: 'Sin conexión - Las notificaciones se actualizarán cuando se restaure la conexión'
  },
  ERRORS: {
    NETWORK_ERROR: 'Error de conexión. Verifique su conexión a internet.',
    FETCH_ERROR: 'Error al obtener los datos del servidor.',
    SAVE_ERROR: 'Error al guardar los datos.',
    VALIDATION_ERROR: 'Por favor, complete todos los campos requeridos.'
  },
  SUCCESS: {
    SAVE_SUCCESS: 'Datos guardados correctamente.',
    DELETE_SUCCESS: 'Elemento eliminado correctamente.',
    UPDATE_SUCCESS: 'Datos actualizados correctamente.'
  }
};

// Configuración de localStorage
export const STORAGE_KEYS = {
  NOTIFICATIONS: 'aqualab_notifications',
  USER_PREFERENCES: 'aqualab_user_preferences',
  CACHE_PREFIX: 'aqualab_cache_'
};
