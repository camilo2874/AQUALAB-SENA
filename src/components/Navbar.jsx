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
  Badge,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Chip,
  MenuList,
  Paper,
  Popper,
  ClickAwayListener,
  Grow,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import LogoutIcon from "@mui/icons-material/Logout";
import DeleteIcon from "@mui/icons-material/Delete";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import ScienceIcon from "@mui/icons-material/Science";
import VisibilityIcon from "@mui/icons-material/Visibility";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import WifiIcon from "@mui/icons-material/Wifi";
import AuthContext from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";
import { useNetworkStatus } from "../hooks/useNotificationHooks";
import NotificationDetailModal from "./NotificationDetailModal";
import ConnectionStatus from "./ConnectionStatus";
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
  const { notifications, unreadCount, removeNotification, clearAllNotifications, markAsRead } = useNotifications();
  const isOnline = useNetworkStatus();
  const navigate = useNavigate();

  // Estado para controlar el menú del avatar
  const [anchorEl, setAnchorEl] = useState(null);
  
  // Estados para las notificaciones
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Handlers para notificaciones
  const handleNotificationClick = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };  const handleNotificationDetail = (notification) => {
    setSelectedNotification(notification);
    setDetailModalOpen(true);
    handleNotificationClose();
    // Eliminar la notificación al ver el detalle (según requerimiento del usuario)
    removeNotification(notification.id);
  };

  const handleDetailModalClose = () => {
    setDetailModalOpen(false);
    setSelectedNotification(null);
  };  const handleRemoveNotification = (notificationId) => {
    removeNotification(notificationId);
  };

  const handleClearAllNotifications = () => {
    clearAllNotifications();
    handleNotificationClose();
  };

  const notificationOpen = Boolean(notificationAnchorEl);
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
        </Box>        {/* Ícono de notificaciones y avatar a la derecha */}
        <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
          {/* Indicador de Estado de Conexión */}
          <ConnectionStatus />

          {/* Sistema de Notificaciones */}
          <IconButton 
            size="large" 
            sx={{ color: "white", mr: 1 }}
            onClick={handleNotificationClick}
          >
            <Badge 
              badgeContent={unreadCount} 
              color="error"
              sx={{
                '& .MuiBadge-badge': {
                  animation: unreadCount > 0 ? `${pulse} 2s infinite` : 'none',
                }
              }}
            >
              <NotificationsIcon />
            </Badge>
          </IconButton>

          {/* Menú de Notificaciones */}
          <Popper
            open={notificationOpen}
            anchorEl={notificationAnchorEl}
            placement="bottom-end"
            transition
            disablePortal
            sx={{ zIndex: 1300 }}
          >
            {({ TransitionProps }) => (
              <Grow {...TransitionProps}>
                <Paper
                  sx={{
                    mt: 1,
                    borderRadius: 2,
                    minWidth: 360,
                    maxWidth: 400,
                    maxHeight: 500,
                    backgroundColor: "#ffffff",
                    boxShadow: "0px 4px 20px rgba(0,0,0,0.15)",
                    border: '1px solid #e0e0e0'
                  }}
                >
                  <ClickAwayListener onClickAway={handleNotificationClose}>
                    <Box>
                      {/* Header de notificaciones */}
                      <Box sx={{ 
                        p: 2, 
                        bgcolor: '#39A900', 
                        color: 'white',
                        borderRadius: '8px 8px 0 0',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          Notificaciones ({notifications.length})
                        </Typography>
                        {notifications.length > 0 && (
                          <IconButton
                            size="small"
                            onClick={handleClearAllNotifications}
                            sx={{ 
                              color: 'white',
                              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
                            }}
                            title="Eliminar todas las notificaciones"
                          >
                            <ClearAllIcon />
                          </IconButton>
                        )}
                      </Box>

                      {/* Lista de notificaciones */}
                      <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                          <Box sx={{ p: 3, textAlign: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                              No hay notificaciones nuevas
                            </Typography>
                          </Box>
                        ) : (
                          <List sx={{ p: 0 }}>
                            {notifications.map((notification, index) => (
                              <ListItem
                                key={notification.id}
                                sx={{
                                  borderBottom: index < notifications.length - 1 ? '1px solid #f0f0f0' : 'none',
                                  '&:hover': { backgroundColor: '#f8f9fa' },
                                  flexDirection: 'column',
                                  alignItems: 'stretch',
                                  py: 1.5
                                }}
                              >
                                <Box sx={{ 
                                  display: 'flex', 
                                  alignItems: 'flex-start',
                                  width: '100%',
                                  mb: 1
                                }}>
                                  <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                                    <ScienceIcon 
                                      sx={{ 
                                        color: notification.leida ? '#9e9e9e' : '#39A900',
                                        fontSize: 20
                                      }} 
                                    />
                                  </ListItemIcon>
                                  <Box sx={{ flex: 1 }}>
                                    <ListItemText
                                      primary={
                                        <Typography 
                                          variant="subtitle2" 
                                          sx={{ 
                                            fontWeight: notification.leida ? 'normal' : 'bold',
                                            color: notification.leida ? 'text.secondary' : 'text.primary'
                                          }}
                                        >
                                          {notification.titulo}
                                        </Typography>
                                      }
                                      secondary={
                                        <Typography 
                                          variant="body2" 
                                          sx={{ 
                                            color: 'text.secondary',
                                            fontSize: '0.875rem'
                                          }}
                                        >
                                          {notification.mensaje}
                                        </Typography>
                                      }
                                    />
                                    {!notification.leida && (
                                      <Chip
                                        label="Nueva"
                                        size="small"
                                        sx={{
                                          bgcolor: '#39A900',
                                          color: 'white',
                                          fontSize: '0.7rem',
                                          height: 20,
                                          mt: 0.5
                                        }}
                                      />
                                    )}
                                  </Box>
                                </Box>
                                
                                {/* Botones de acción */}
                                <Box sx={{ 
                                  display: 'flex', 
                                  gap: 1, 
                                  justifyContent: 'flex-end',
                                  width: '100%'
                                }}>
                                  <Button
                                    size="small"
                                    startIcon={<VisibilityIcon />}
                                    onClick={() => handleNotificationDetail(notification)}
                                    sx={{ 
                                      fontSize: '0.75rem',
                                      bgcolor: '#39A900',
                                      color: 'white',
                                      '&:hover': { bgcolor: '#2d8000' }
                                    }}
                                  >
                                    Ver Detalle
                                  </Button>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleRemoveNotification(notification.id)}
                                    sx={{ 
                                      color: '#f44336',
                                      '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.1)' }
                                    }}
                                    title="Eliminar notificación"
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </ListItem>
                            ))}
                          </List>
                        )}
                      </Box>
                    </Box>
                  </ClickAwayListener>
                </Paper>
              </Grow>
            )}
          </Popper>

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
            </Box>          )}
        </Box>
      </Toolbar>

      {/* Modal de Detalle de Notificación */}
      <NotificationDetailModal
        notification={selectedNotification}
        open={detailModalOpen}
        onClose={handleDetailModalClose}
        onRemove={handleRemoveNotification}
      />
    </AppBar>
  );
};

export default Navbar;