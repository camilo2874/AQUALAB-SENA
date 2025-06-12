// src/routes/AppRouter.jsx
import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { CircularProgress, Box } from "@mui/material";

import Layout from "../components/Layout";
import PrivateRoute from "./PrivateRoute";
import { createLazyComponent } from "../components/LazyLoad";

// Carga dinámica de páginas con prioridades
// Páginas de alta prioridad (carga inmediata)
const Login = createLazyComponent(() => import("../pages/Login"), {
  suspenseProps: { fallback: <div></div> } // Fallback mínimo para login
});

const Dashboard = createLazyComponent(
  () => import(/* webpackPrefetch: true */ "../pages/Dashboard")
);

// Páginas de uso frecuente (prefetch)
const Muestras = createLazyComponent(
  () => import(/* webpackPrefetch: true */ "../pages/Muestras")
);

// Páginas de uso normal (lazy regular)
const Users = createLazyComponent(() => import("../pages/Users"));
const RegistroMuestras = createLazyComponent(() => import("../pages/RegistroMuestras"));
const RecuperarContrasena = createLazyComponent(() => import("../pages/RecuperarContrasena"));
const CambiarContrasena = createLazyComponent(() => import("../pages/CambiarContrasena"));
const RegistrarResultados = createLazyComponent(() => import("../pages/RegistrarResultados"));
const Unauthorized = createLazyComponent(() => import("../pages/Unauthorized"));
const ListaResultados = createLazyComponent(() => import("../pages/ListaResultados"));
const Auditorias = createLazyComponent(() => import("../pages/Auditorias"));

const AppRouter = () => {
  return (
    <Router>
      <Suspense fallback={
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #d7f7dd 100%)'
        }}>
          <CircularProgress color="primary" />
        </Box>
      }>
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login" element={<Login />} />
          <Route path="/recuperar-contrasena" element={<RecuperarContrasena />} />
          <Route path="/restablecer-password" element={<CambiarContrasena />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Rutas protegidas */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/users"
            element={
              <PrivateRoute allowedRoles={["administrador", "super_admin", "laboratorista"]}>
                <Layout>
                  <Users />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/muestras"
            element={
              <PrivateRoute>
                <Layout>
                  <Muestras />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/registro-muestras"
            element={
              <PrivateRoute allowedRoles={["administrador", "super_admin"]}>
                <Layout>
                  <RegistroMuestras />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/lista-resultados"
            element={
              <PrivateRoute allowedRoles={["laboratorista", "administrador", "super_admin"]}>
                <Layout>
                  <ListaResultados />
                </Layout>
              </PrivateRoute>
            }
          />

          <Route
            path="/registrar-resultados/:idMuestra"
            element={
              <PrivateRoute allowedRoles={["laboratorista", "administrador", "super_admin"]}>
                <Layout>
                  <RegistrarResultados />
                </Layout>
              </PrivateRoute>
            }
          />          <Route
            path="/auditorias"
            element={
              <PrivateRoute>
                <Layout>
                  <Auditorias />
                </Layout>
              </PrivateRoute>
            }
          />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default AppRouter;
