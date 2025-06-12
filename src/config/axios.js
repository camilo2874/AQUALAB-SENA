import axios from 'axios';
import cacheManager from './cache-manager';
import API_CONFIG from './api-config';

const axiosInstance = axios.create({
  baseURL: API_CONFIG.BASE_URLS.RESULTADOS,
  headers: {
    'Content-Type': 'application/json'
  },
  // Mejorar timeout para evitar esperas excesivas
  timeout: 15000,
});

// Agregar soporte para caché en métodos GET
const originalGet = axiosInstance.get;
axiosInstance.get = async function(url, config = {}) {
  // Ver si la petición debe ser cacheada
  const shouldCache = config.cache !== false;
  const ttl = config.cacheTTL || 60000; // 1 minuto por defecto
  
  // Generar clave única para la caché
  const cacheKey = `get:${url}:${JSON.stringify(config.params || {})}`;
  
  // Intentar obtener de caché primero
  if (shouldCache) {
    const cachedData = cacheManager.get(cacheKey);
    if (cachedData) {
      console.log(`[Cache hit] ${url}`);
      return Promise.resolve({ ...cachedData, cached: true });
    }
  }
  
  // Si no está en caché o no se debe cachear, hacer petición real
  try {
    const response = await originalGet.call(this, url, config);
    
    // Guardar en caché si la petición fue exitosa
    if (shouldCache && response.status >= 200 && response.status < 300) {
      cacheManager.set(cacheKey, response, ttl);
    }
    
    return response;
  } catch (error) {
    throw error;
  }
};

// Interceptor para agregar el token a todas las peticiones
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Añadir un identificador único a cada solicitud para evitar el caché del navegador
    if (config.method === 'get' && config.cache === false) {
      config.params = {
        ...config.params,
        _: new Date().getTime()
      };
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores comunes
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      // Manejo de errores de red
      if (!error.response) {
        console.error('Error de red. Verifica tu conexión.');
      }
      // Manejo de autorización
      else if (error.response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      // Mostrar mensajes de error específicos para otros códigos
      else if (error.response.status >= 500) {
        console.error('Error en el servidor. Intenta más tarde.');
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;