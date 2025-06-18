import React, { useContext, useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Box,
  Divider,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import LogoutIcon from "@mui/icons-material/Logout"; // Nuevo ícono de logout
import AuthContext from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { keyframes } from "@emotion/react"; // Para animaciones

// Animación de pulso para el título
const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.03); }
  100% { transform: scale(1); }
`;

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Estado para controlar el menú del avatar
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  const handleLogout = () => {
    // Cerrar el menú primero
    handleMenuClose();
    
    // Ejecutar logout
    logout();
    
    // Navegar de forma segura
    setTimeout(() => {
      navigate("/login", { replace: true });
    }, 100);
  };

  return (
    <AppBar
      position="static"
      sx={{
        background: "linear-gradient(90deg, #1565C0)", // Gradiente vibrante
        boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)", // Sombra pronunciada
        paddingX: 2,
      }}
    >
      <Toolbar sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {/* Espacio vacío a la izquierda para equilibrar */}
        <Box sx={{ flexGrow: 1.5 }} />

        {/* Título "AQUALAB", centrado */}
        <Box sx={{ display: "flex", alignItems: "center", flexGrow: 0, justifyContent: "center" }}>
          <Typography
            variant="h4" // Tamaño grande
            noWrap
            sx={{
              fontWeight: "bold",
              fontFamily: "'Montserrat', sans-serif", // Fuente profesional
              letterSpacing: "2px", // Espaciado elegante
              color: "#E0F7FA", // Color cian claro para contraste y nitidez
              animation: `${pulse} 3s infinite ease-in-out`, // Animación de pulso sutil
              "&:hover": {
                color: "#ffffff", // Cambio de color al pasar el mouse
                transform: "scale(1.05)", // Escala al pasar el mouse
                transition: "color 0.3s ease-in-out, transform 0.3s ease-in-out",
              },
            }}
          >
            AQUALAB
          </Typography>
        </Box>

        {/* Ícono de notificaciones y avatar a la derecha */}
        <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
          <IconButton size="large" sx={{ color: "white", mr: 1 }}>
            <NotificationsIcon />
          </IconButton>

          {/* Avatar interactivo con menú personalizado */}
          {user && (
            <Box sx={{ ml: 2 }}>
              <IconButton
                onClick={handleMenuOpen}
                sx={{
                  p: 0,
                  "&:hover": {
                    transform: "scale(1.1)",
                    transition: "transform 0.3s",
                  },
                }}
              >
                <Avatar
                  alt={user.nombre}
                  src={user.fotoPerfil}
                  sx={{
                    width: 40,
                    height: 40,
                    border: "2px solid #ffffff",
                    boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.3)",
                    transition: "border-color 0.3s",
                    "&:hover": { borderColor: "#FF9800" },
                  }}
                >
                  {!user.fotoPerfil && user.nombre ? user.nombre.charAt(0) : ""}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                PaperProps={{
                  sx: {
                    mt: 1,
                    borderRadius: 2,
                    minWidth: 220,
                    backgroundColor: "#f9f9f9",
                    boxShadow: "0px 2px 8px rgba(0,0,0,0.2)",
                    p: 1,
                  },
                }}
              >
                <Box sx={{ p: 1, textAlign: "center" }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                    {user.nombre}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {user.email}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                </Box>
                <MenuItem
                  onClick={handleLogout}
                  sx={{
                    display: "flex", // Para alinear el texto y el ícono
                    justifyContent: "space-between", // Espacio entre el texto y el ícono
                    alignItems: "center", // Centrado vertical
                    "&:hover": {
                      backgroundColor: "#E53935",
                      color: "#fff",
                    },
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                    Cerrar Sesión
                  </Typography>
                  <LogoutIcon
                    sx={{
                      color: "inherit", // Hereda el color del MenuItem (cambia a blanco al pasar el mouse)
                      fontSize: "1.2rem", // Tamaño pequeño
                    }}
                  />
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;