import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import AuthContext from "../context/AuthContext";

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { user, isAuthenticated, loading } = useContext(AuthContext); // ✅ ahora usamos loading  const location = useLocation();

  // ✅ Espera a que se cargue el contexto antes de decidir
  if (loading) return null;
  // Si no hay usuario autenticado, redirige a /login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  // Si se especifican roles permitidos, verificar el rol del usuario
  if (allowedRoles.length > 0) {    if (!allowedRoles.includes(user.rol)) {
      return <Navigate to="/unauthorized" replace />;
    }
  }
  // Si pasa las validaciones, renderiza el contenido protegido
  return children;
};

export default PrivateRoute;
