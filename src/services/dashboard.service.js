import axios from 'axios';
import cacheManager from '../config/cache-manager';
import API_CONFIG from '../config/api-config';

// Constantes
const CACHE_KEYS = {
  DASHBOARD_STATS: 'dashboard:stats',
  SAMPLE_STATS: 'dashboard:sampleStats',
  WATER_TYPES: 'dashboard:waterTypes',
  USER_TYPES: 'dashboard:userTypes',
  RECENT_SAMPLES: 'dashboard:recentSamples',
};

// TTL (tiempo de vida) de la caché en milisegundos
const DASHBOARD_CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Servicio para obtener datos del Dashboard con soporte de caché
 */
class DashboardService {
  constructor() {
    this.API_URL = {
      USUARIOS: API_CONFIG.BASE_URLS.USUARIOS,
      MUESTRAS: API_CONFIG.BASE_URLS.MUESTRAS
    };
  }

  /**
   * Obtiene los headers de autenticación
   */
  getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Obtiene estadísticas generales del dashboard
   */
  async getStats(forceRefresh = false) {
    // Si no se fuerza refresco, intentar obtener de caché
    if (!forceRefresh) {
      const cachedStats = cacheManager.get(CACHE_KEYS.DASHBOARD_STATS);
      if (cachedStats) return cachedStats;
    }

    try {
      // Hacer llamadas en paralelo para optimizar
      const [usersResponse, samplesResponse] = await Promise.all([
        axios.get(`${this.API_URL.USUARIOS}/usuarios/stats`, { 
          headers: this.getHeaders() 
        }),
        axios.get(`${this.API_URL.MUESTRAS}/muestras/stats`, { 
          headers: this.getHeaders() 
        })
      ]);

      const stats = {
        users: usersResponse.data,
        samples: samplesResponse.data
      };

      // Guardar en caché
      cacheManager.set(CACHE_KEYS.DASHBOARD_STATS, stats, DASHBOARD_CACHE_TTL);
      return stats;
    } catch (error) {
      console.error('Error al obtener estadísticas del dashboard:', error);
      throw new Error('No se pudieron cargar las estadísticas');
    }
  }

  /**
   * Obtiene estadísticas de muestras
   */
  async getSampleStats(forceRefresh = false) {
    if (!forceRefresh) {
      const cached = cacheManager.get(CACHE_KEYS.SAMPLE_STATS);
      if (cached) return cached;
    }

    try {
      const response = await axios.get(`${this.API_URL.MUESTRAS}/muestras/stats/details`, { 
        headers: this.getHeaders() 
      });
      
      const stats = response.data;
      cacheManager.set(CACHE_KEYS.SAMPLE_STATS, stats, DASHBOARD_CACHE_TTL);
      return stats;
    } catch (error) {
      console.error('Error al obtener estadísticas de muestras:', error);
      throw new Error('No se pudieron cargar las estadísticas de muestras');
    }
  }

  /**
   * Obtiene estadísticas de tipos de agua
   */
  async getWaterTypeStats(forceRefresh = false) {
    if (!forceRefresh) {
      const cached = cacheManager.get(CACHE_KEYS.WATER_TYPES);
      if (cached) return cached;
    }

    try {
      const response = await axios.get(`${this.API_URL.MUESTRAS}/muestras/stats/water-types`, { 
        headers: this.getHeaders() 
      });
      
      const stats = response.data;
      cacheManager.set(CACHE_KEYS.WATER_TYPES, stats, DASHBOARD_CACHE_TTL);
      return stats;
    } catch (error) {
      console.error('Error al obtener estadísticas de tipos de agua:', error);
      throw new Error('No se pudieron cargar las estadísticas de tipos de agua');
    }
  }

  /**
   * Obtiene muestras recientes con paginación
   */
  async getRecentSamples(page = 1, limit = 5, forceRefresh = false) {
    const cacheKey = `${CACHE_KEYS.RECENT_SAMPLES}:${page}:${limit}`;
    
    if (!forceRefresh) {
      const cached = cacheManager.get(cacheKey);
      if (cached) return cached;
    }

    try {
      const response = await axios.get(`${this.API_URL.MUESTRAS}/muestras/recent`, { 
        params: { page, limit },
        headers: this.getHeaders() 
      });
      
      const samples = response.data;
      cacheManager.set(cacheKey, samples, DASHBOARD_CACHE_TTL);
      return samples;
    } catch (error) {
      console.error('Error al obtener muestras recientes:', error);
      throw new Error('No se pudieron cargar las muestras recientes');
    }
  }

  /**
   * Invalida la caché del dashboard para forzar una recarga fresca
   */
  invalidateCache() {
    cacheManager.invalidateByPrefix('dashboard:');
  }
}

// Exportamos una única instancia
export const dashboardService = new DashboardService();
