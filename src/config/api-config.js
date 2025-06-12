// Configuración centralizada para APIs
const API_CONFIG = {
  BASE_URLS: {
    USUARIOS: import.meta.env.VITE_BACKEND_URL || 'https://backend-sena-lab-1-qpzp.onrender.com/api',
    MUESTRAS: import.meta.env.VITE_BACKEND_MUESTRAS_URL || 'https://backend-registro-muestras.onrender.com/api',
    RESULTADOS: 'https://daniel-back-dom.onrender.com/api/ingreso-resultados'
  },
  CACHE_TTL: {
    USER_PROFILE: 5 * 60 * 1000, // 5 minutos en ms
    SAMPLES: 2 * 60 * 1000,      // 2 minutos en ms
    RESULTS: 2 * 60 * 1000,      // 2 minutos en ms
  }
};

export default API_CONFIG;
