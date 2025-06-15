export const API_CONFIG = {
  USUARIOS_BASE_URL: import.meta.env.VITE_BACKEND_URL || 'https://backend-sena-lab-1-qpzp.onrender.com/api',
  MUESTRAS_BASE_URL: import.meta.env.VITE_BACKEND_MUESTRAS_URL || 'https://backend-registro-muestras.onrender.com',
  ENDPOINTS: {
    USUARIOS: '/usuarios',
    MUESTRAS: '/api/muestras',
    TIPOS_AGUA: '/api/tipos-agua',
    CAMBIOS_ESTADO: '/api/cambios-estado'
  }
};
