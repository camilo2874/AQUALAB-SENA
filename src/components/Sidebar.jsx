// src/components/Sidebar.jsx
import React, { useEffect, useState } from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Box,
  Divider,
} from "@mui/material";
import { NavLink } from "react-router-dom";

// Iconos para el menú
import DashboardIcon from "@mui/icons-material/Dashboard";
import PeopleIcon from "@mui/icons-material/People";
import ScienceIcon from "@mui/icons-material/Science";
import BiotechIcon from "@mui/icons-material/Biotech";
import AssignmentIcon from "@mui/icons-material/Assignment";
import FactCheckIcon from "@mui/icons-material/FactCheck";

// Logo SENA
import senaLogo from "../assets/sena-logo.png";

// Importación de componentes
import UserProfile from "./UserProfile";
import EditProfileDialog from "./EditProfileDialog";

// Ancho del Drawer
const drawerWidth = 260;

const Sidebar = () => {
  const [userRole, setUserRole] = useState("");
  const [editOpen, setEditOpen] = useState(false);  const [connectionStatus, setConnectionStatus] = useState({
    isOnline: true,
    lastCheck: new Date()
  });

  // Verificar estado de conexión a internet
  useEffect(() => {
    const updateConnectionStatus = () => {
      setConnectionStatus({
        isOnline: navigator.onLine,
        lastCheck: new Date()
      });
    };

    // Verificar conexión inicial
    updateConnectionStatus();

    // Escuchar eventos de conexión/desconexión
    const handleOnline = () => updateConnectionStatus();
    const handleOffline = () => updateConnectionStatus();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificar cada 10 segundos para mantener actualizada la hora de última verificación
    const interval = setInterval(updateConnectionStatus, 10000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  // Determinar color y mensaje del indicador
  const getIndicatorStatus = () => {
    if (!connectionStatus.isOnline) {
      return {
        color: "#f44336", // Rojo
        message: "Sin conexión a internet",
        status: "offline"
      };
    }
    return {
      color: "#4CAF50", // Verde
      message: "Conectado a internet",
      status: "online"
    };
  };

  const indicatorStatus = getIndicatorStatus();

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {        const user = JSON.parse(userStr);
        const role = (user.rol || "").toLowerCase();
        setUserRole(role);
      }
    } catch (error) {
      console.error("Error leyendo user de localStorage:", error);
    }
  }, []);

  const menuItems = [
    {
      text: "Panel",
      icon: <DashboardIcon />,
      path: "/dashboard",
      roles: [],
    },
    {
      text: "Usuarios",
      icon: <PeopleIcon />,
      path: "/users",
      roles: ["administrador", "super_admin", "laboratorista"],
    },
    {
      text: "Registrar Muestra",
      icon: <BiotechIcon />,
      path: "/registro-muestras",
      roles: ["administrador"],
    },
    {
      text: "Muestras",
      icon: <ScienceIcon />,
      path: "/muestras",
      roles: ["administrador", "laboratorista"],
      
    },
    {
      text: "Resultados",
      icon: <AssignmentIcon />,
      path: "/lista-resultados",
      roles: ["administrador"],
    },
    {
      text: "Auditorias",
      icon: <FactCheckIcon />,
      path: "/auditorias",
      roles: ["administrador"],
    },
  ];

  const shouldShowMenuItem = (item) => {
    if (!item.roles || item.roles.length === 0) return true;
    return item.roles.includes(userRole);
  };

  const filteredMenuItems = menuItems.filter(shouldShowMenuItem);

  const drawerContent = (    <Box
      sx={{
        height: "100%",
        background: "linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <Box>        <Toolbar>
          <Box sx={{ width: "100%", textAlign: "center", p: 1, position: "relative" }}>
            <img src={senaLogo} alt="Logo SENA" width="80" />            {/* Indicador de estado */}
            <Box
              sx={{
                position: "absolute",
                top: 8,
                left: 8,
                width: 12,
                height: 12,
                backgroundColor: indicatorStatus.color,
                borderRadius: "50%",
                border: "2px solid #fff",
                boxShadow: `0 2px 4px rgba(0,0,0,0.2), 0 0 0 0 rgba(76, 175, 80, 0.4)`,                animation: indicatorStatus.status === 'online' 
                  ? "pulseGlow 3s infinite, breathe 4s infinite alternate" 
                  : "pulseRed 2s infinite",
                cursor: "pointer",
                "@keyframes pulseGlow": {
                  "0%": {
                    boxShadow: `0 2px 4px rgba(0,0,0,0.2), 0 0 0 0 rgba(76, 175, 80, 0.7), 0 0 0 0 rgba(76, 175, 80, 0.4)`,
                  },
                  "50%": {
                    boxShadow: `0 2px 8px rgba(0,0,0,0.3), 0 0 0 6px rgba(76, 175, 80, 0.3), 0 0 0 12px rgba(76, 175, 80, 0.1)`,
                  },
                  "100%": {
                    boxShadow: `0 2px 4px rgba(0,0,0,0.2), 0 0 0 0 rgba(76, 175, 80, 0.7), 0 0 0 0 rgba(76, 175, 80, 0.4)`,
                  },
                },                "@keyframes pulseRed": {
                  "0%": {
                    boxShadow: `0 2px 4px rgba(0,0,0,0.2), 0 0 0 0 rgba(244, 67, 54, 0.7)`,
                  },
                  "50%": {
                    boxShadow: `0 2px 8px rgba(0,0,0,0.3), 0 0 0 6px rgba(244, 67, 54, 0.4)`,
                  },
                  "100%": {
                    boxShadow: `0 2px 4px rgba(0,0,0,0.2), 0 0 0 0 rgba(244, 67, 54, 0.7)`,
                  },
                },
                "@keyframes breathe": {
                  "0%": {
                    backgroundColor: "#4CAF50",
                    transform: "scale(1)",
                  },
                  "100%": {
                    backgroundColor: "#66BB6A",
                    transform: "scale(1.05)",
                  },
                },
                "&:hover": {
                  transform: "scale(1.3)",
                  transition: "transform 0.2s ease-in-out",
                  boxShadow: `0 4px 12px rgba(0,0,0,0.3), 0 0 0 8px ${indicatorStatus.color}40, 0 0 0 16px ${indicatorStatus.color}20`,
                }
              }}
              title={`${indicatorStatus.message} - Última verificación: ${connectionStatus.lastCheck.toLocaleTimeString()}`}
            />
          </Box>
        </Toolbar>        {/* Sección de perfil: al hacer clic en la foto se abre el diálogo de edición */}
        <Box 
          sx={{ 
            p: 2, 
            textAlign: "center",
            borderRadius: 2,
            transition: "all 0.3s ease-in-out",
            cursor: "pointer",
            "&:hover": {
              backgroundColor: "rgba(57, 169, 0, 0.05)",
              transform: "translateY(-2px)",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              "& .user-profile": {
                transform: "scale(1.05)",
              }
            }
          }}
          onClick={() => setEditOpen(true)}
        >
          <Box className="user-profile" sx={{ transition: "transform 0.3s ease-in-out" }}>
            <UserProfile onEdit={() => setEditOpen(true)} />
          </Box>
        </Box>

        {/* Separador elegante con gradiente */}
        <Box sx={{ px: 2, mb: 2 }}>
          <Box
            sx={{
              height: "1px",
              background: "linear-gradient(90deg, transparent 0%, #39A900 50%, transparent 100%)",
              position: "relative",
              "&::before": {
                content: '""',
                position: "absolute",
                top: "-2px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "6px",
                height: "6px",
                backgroundColor: "#39A900",
                borderRadius: "50%",
                boxShadow: "0 0 8px rgba(57, 169, 0, 0.4)",
              }
            }}
          />
        </Box>        <List>
          {filteredMenuItems.map((item, index) => (            <ListItem 
              key={item.text} 
              disablePadding 
              sx={{ 
                m: 1,
                opacity: 0,
                transform: "translateX(-20px)",
                animation: `slideIn 0.5s ease-out ${index * 0.1}s forwards`,
                "@keyframes slideIn": {
                  "0%": {
                    opacity: 0,
                    transform: "translateX(-20px)",
                  },
                  "100%": {
                    opacity: 1,
                    transform: "translateX(0)",
                  },
                }
              }}
            ><ListItemButton
                component={NavLink}
                to={item.path}
                sx={{
                  borderRadius: 2,
                  px: 2,
                  py: 1,
                  transition: "all 0.3s ease-in-out",
                  "&:hover": {
                    backgroundColor: "#f0f0f0",
                    transform: "scale(1.02)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    "& .MuiListItemIcon-root": {
                      color: "#39A900",
                      transform: "scale(1.1) rotate(5deg)",
                    }
                  },
                  "&.active": {
                    backgroundColor: "#E0F2F1",
                    boxShadow: "inset 3px 0 0 #39A900",
                    "& .MuiListItemIcon-root": {
                      color: "#39A900",
                    }
                  }
                }}
              >
                <ListItemIcon 
                  sx={{ 
                    color: "#666",
                    transition: "all 0.3s ease-in-out",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{ fontWeight: "bold" }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>

      <Box sx={{ p: 2, textAlign: "center", fontSize: "12px", color: "#777" }}>
        © {new Date().getFullYear()} SENA
      </Box>
      {/* Diálogo para editar perfil */}
      <EditProfileDialog open={editOpen} handleClose={() => setEditOpen(false)} />
    </Box>
  );

  return (    <Drawer
      variant="permanent"
      sx={{
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          borderRight: "none",
          boxShadow: "2px 0 5px rgba(0,0,0,0.05)",
          background: "linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%)",
        },
      }}
      open
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
