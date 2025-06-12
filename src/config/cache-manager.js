// Sistema de caché para reducir llamadas a APIs
class CacheManager {
  constructor() {
    this.cache = {};
  }

  /**
   * Guarda datos en caché con un tiempo de expiración
   * @param {string} key - Clave para acceder a los datos
   * @param {any} data - Datos a guardar
   * @param {number} ttl - Tiempo de vida en milisegundos
   */
  set(key, data, ttl) {
    const now = new Date().getTime();
    this.cache[key] = {
      data,
      expiry: now + ttl,
    };
  }

  /**
   * Obtiene datos de la caché si no han expirado
   * @param {string} key - Clave de los datos
   * @returns {any|null} - Los datos o null si expirados/no existen
   */
  get(key) {
    const cachedItem = this.cache[key];
    if (!cachedItem) return null;

    const now = new Date().getTime();
    if (now > cachedItem.expiry) {
      // Expiró, eliminar de caché
      delete this.cache[key];
      return null;
    }

    return cachedItem.data;
  }

  /**
   * Elimina una clave específica de la caché
   * @param {string} key - Clave a eliminar
   */
  invalidate(key) {
    delete this.cache[key];
  }

  /**
   * Elimina todas las claves que inician con cierto prefijo
   * @param {string} prefix - Prefijo de claves a eliminar
   */
  invalidateByPrefix(prefix) {
    Object.keys(this.cache).forEach(key => {
      if (key.startsWith(prefix)) {
        delete this.cache[key];
      }
    });
  }
}

// Exportamos una instancia única para toda la aplicación
const cacheManager = new CacheManager();
export default cacheManager;
