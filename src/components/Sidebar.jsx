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
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const user = JSON.parse(userStr);
        const role = (user.rol || "").toLowerCase();
        console.log("Rol del usuario obtenido:", role); // Registro para depuración
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
      roles: ["administrador", "super_admin"],
    },
    {
      text: "Muestras",
      icon: <ScienceIcon />,
      path: "/muestras",
      roles: [],
      
    },
    {
      text: "Resultados",
      icon: <AssignmentIcon />,
      path: "/lista-resultados",
      roles: ["administrador", "super_admin"],
    },
    {
      text: "Auditorias",
      icon: <FactCheckIcon />,
      path: "/auditorias",
      roles: ["administrador", "super_admin"],
    },
  ];

  const shouldShowMenuItem = (item) => {
    if (!item.roles || item.roles.length === 0) return true;
    return item.roles.includes(userRole);
  };

  const filteredMenuItems = menuItems.filter(shouldShowMenuItem);

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        backgroundColor: "#fff",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <Box>
        <Toolbar>
          <Box sx={{ width: "100%", textAlign: "center", p: 1 }}>
            <img src={senaLogo} alt="Logo SENA" width="80" />
          </Box>
        </Toolbar>

        {/* Sección de perfil: al hacer clic en la foto se abre el diálogo de edición */}
        <Box sx={{ p: 2, textAlign: "center" }}>
          <UserProfile onEdit={() => setEditOpen(true)} />
        </Box>

        <Divider sx={{ mb: 1 }} />

        <List>
          {filteredMenuItems.map((item) => (            <ListItem key={item.text} disablePadding sx={{ m: 1 }}>
              <ListItemButton
                component={NavLink}
                to={item.path}
                sx={{
                  borderRadius: 2,
                  px: 2,
                  py: 1,
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    backgroundColor: "#f0f0f0",
                    transform: "scale(1.02)",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                  },
                  "&.active": {
                    backgroundColor: "#E0F2F1",
                    boxShadow: "inset 3px 0 0 #39A900",
                  }
                }}
              >
                <ListItemIcon sx={{ color: "inherit" }}>
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

  return (
    <Drawer
      variant="permanent"
      sx={{
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          borderRight: "none",
          boxShadow: "2px 0 5px rgba(0,0,0,0.05)",
          backgroundColor: "#fff",
        },
      }}
      open
    >
      {drawerContent}
    </Drawer>
  );
};

export default Sidebar;
