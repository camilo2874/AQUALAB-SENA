import React, { createContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import cacheManager from "../config/cache-manager";
import API_CONFIG from "../config/api-config";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState({
    user: null,
    token: null,
    tipoUsuario: null,
    isAuthenticated: false
  });

  const [loading, setLoading] = useState(true);
  const [perfil, setPerfil] = useState(null);
  const [isPerfilManuallyUpdated, setIsPerfilManuallyUpdated] = useState(false);
  const [perfilLoading, setPerfilLoading] = useState(false);

  // Carga inicial desde localStorage - optimizada
  useEffect(() => {
    const initAuth = () => {
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("token");
      const storedPerfilManual = localStorage.getItem("isPerfilManuallyUpdated");

      if (storedUser && storedToken) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setAuth({
            user: parsedUser,
            token: storedToken,
            tipoUsuario: parsedUser.rol,
            isAuthenticated: true
          });
          // Si el usuario actualizó el perfil manualmente, respetar ese flag
          setIsPerfilManuallyUpdated(storedPerfilManual === 'true');
        } catch (error) {
          console.error("Error parsing stored user data:", error);
          // Limpiar datos corruptos
          localStorage.removeItem("user");
          localStorage.removeItem("token");
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Función memoizada para obtener perfil del usuario
  const fetchUserProfile = useCallback(async (userId, token) => {
    if (!userId || !token) return null;
    
    // Verificar primero en caché
    const cacheKey = `perfil:${userId}`;
    const cachedPerfil = cacheManager.get(cacheKey);
    
    if (cachedPerfil) {

      return cachedPerfil;
    }
    
    // Si no está en caché, hacer la petición
    try {
      setPerfilLoading(true);
      const { data } = await axios.get(
        `${API_CONFIG.BASE_URLS.USUARIOS}/usuarios/${userId}/perfil`, 
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      // Guardar en caché
      cacheManager.set(cacheKey, data, API_CONFIG.CACHE_TTL.USER_PROFILE);
      return data;
    } catch (err) {
      console.error("Error fetching perfil:", err);
      return null;
    } finally {
      setPerfilLoading(false);
    }
  }, []);

  // Fetch del perfil del usuario autenticado - optimizado
  useEffect(() => {
    if (!auth.token || !auth.user || !auth.isAuthenticated) return;

    if (isPerfilManuallyUpdated) {

      return;
    }

    const userId = auth.user.usuarioId || auth.user._id || auth.user.id;

    if (!userId) {
      console.warn("No encuentro userId en auth.user:", auth.user);
      return;
    }


    fetchUserProfile(userId, auth.token).then(data => {
      if (data) setPerfil(data);
    });
  }, [auth.token, auth.user, auth.isAuthenticated, isPerfilManuallyUpdated, fetchUserProfile]);

  // Función login - optimizada
  const login = useCallback((userData) => {
    if (!userData.token) {
      console.error("Falta token en login");
      return;
    }

    localStorage.setItem("token", userData.token);
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.removeItem("isPerfilManuallyUpdated"); // Limpiar flag al login

    setAuth({
      user: userData,
      token: userData.token,
      tipoUsuario: userData.rol,
      isAuthenticated: true
    });

    setPerfil(userData);
    setIsPerfilManuallyUpdated(false);
    
    // Invalidar cualquier caché previa al hacer login
    cacheManager.invalidateByPrefix('perfil:');
  }, []);

  // Función para actualizar el perfil directamente - optimizada
  const updatePerfil = useCallback((newPerfil) => {

    setPerfil(newPerfil);
    setIsPerfilManuallyUpdated(true);
    localStorage.setItem("isPerfilManuallyUpdated", "true");
    
    // Actualizar la caché con el nuevo perfil
    const userId = auth.user?.usuarioId || auth.user?._id || auth.user?.id;
    if (userId) {
      cacheManager.set(`perfil:${userId}`, newPerfil, API_CONFIG.CACHE_TTL.USER_PROFILE);
    }
  }, [auth.user]);

  // Función logout
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("isPerfilManuallyUpdated");

    setAuth({
      user: null,
      token: null,
      tipoUsuario: null,
      isAuthenticated: false
    });

    setPerfil(null);
    setIsPerfilManuallyUpdated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        ...auth,
        perfil,
        loading,
        login,
        updatePerfil,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;