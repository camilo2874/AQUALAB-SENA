// src/modules/usuarios/RegistroUsuario.jsx
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Paper,
  TextField,
  Button,
  CircularProgress,
  Typography,
  Select,
  MenuItem,
  Snackbar,
  Alert,
  Box,
  InputAdornment,
  FormControl,
  InputLabel,
  Divider
} from "@mui/material";
import axios from "axios";
import AuthContext from "../../context/AuthContext"; // Ajusta la ruta si es necesario
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import BadgeIcon from '@mui/icons-material/Badge';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import BusinessIcon from '@mui/icons-material/Business';
import WorkIcon from '@mui/icons-material/Work';
import SecurityIcon from '@mui/icons-material/Security';
import GroupIcon from '@mui/icons-material/Group';

const RegistroUsuario = () => {
  const { tipoUsuario } = useContext(AuthContext);
  const navigate = useNavigate();

  const [usuario, setUsuario] = useState({
    tipo: "",
    nombre: "",
    documento: "",
    telefono: "",
    direccion: "",
    email: "",
    password: "",
    tipo_cliente: "", // Usamos "tipo_cliente" según lo espera el backend
    especialidad: "",
    codigoSeguridad: "",
    razonSocial: ""
  });  const [cargando, setCargando] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  const [errores, setErrores] = useState({
    nombre: "",
    documento: "",
    telefono: ""
  });

  // Definir las opciones de rol según el rol del usuario logueado
  let allowedOptions = [];
  if (tipoUsuario === "super_admin") {
    allowedOptions = [{ value: "administrador", label: "Administrador" }];
  } else if (tipoUsuario === "administrador") {
    allowedOptions = [
      { value: "cliente", label: "Cliente" },
      { value: "laboratorista", label: "Laboratorista" }
    ];
  }  // Manejar cambios en los campos del formulario
  const manejarCambio = (e) => {
    const { name, value } = e.target;
    
    // Si se selecciona "persona natural" como tipo de cliente, limpiar razón social
    if (name === "tipo_cliente" && value === "persona natural") {
      setUsuario({ ...usuario, [name]: value, razonSocial: "" });
    } else {
      setUsuario({ ...usuario, [name]: value });
    }
    
    setSnackbarOpen(false);
  };

  // Función para manejar solo letras en el nombre
  const manejarCambioNombre = (e) => {
    const { value } = e.target;
    const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]*$/;
    
    if (soloLetras.test(value) || value === "") {
      setUsuario({ ...usuario, nombre: value });
      setErrores({ ...errores, nombre: "" });
      setSnackbarOpen(false);
    } else {
      setErrores({ ...errores, nombre: "⚠ El nombre solo puede contener letras y espacios" });
    }
  };

  // Función para manejar solo números en documento (máximo 15)
  const manejarCambioDocumento = (e) => {
    const { value } = e.target;
    const soloNumeros = /^\d*$/;
    
    if (soloNumeros.test(value) && value.length <= 15) {
      setUsuario({ ...usuario, documento: value });
      setErrores({ ...errores, documento: "" });
      setSnackbarOpen(false);
    } else if (value.length > 15) {
      setErrores({ ...errores, documento: "⚠ El documento no puede tener más de 15 dígitos" });
    } else {
      setErrores({ ...errores, documento: "⚠ El documento solo puede contener números" });
    }
  };
  // Función para manejar solo números en teléfono
  const manejarCambioTelefono = (e) => {
    const { value } = e.target;
    const soloNumeros = /^\d*$/;
    
    if (soloNumeros.test(value) && value.length <= 10) {
      setUsuario({ ...usuario, telefono: value });
      setErrores({ ...errores, telefono: "" });
      setSnackbarOpen(false);
    } else if (value.length > 10) {
      setErrores({ ...errores, telefono: "⚠ El teléfono no puede tener más de 10 dígitos" });
    } else {
      setErrores({ ...errores, telefono: "⚠ El teléfono solo puede contener números" });
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };

  const registrarUsuario = async (e) => {
    e.preventDefault();
    setCargando(true);
    setSnackbarOpen(false);

    // Verificar token
    const token = localStorage.getItem("token");
    if (!token) {
      setSnackbarMessage("⚠ No tienes permiso para registrar usuarios. Inicia sesión.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      setCargando(false);
      return;
    }

    // **IMPORTANTE:** Para clientes no se debe asignar la contraseña en el front,
    // es decir, no se ejecuta:
    // if (usuario.tipo === "cliente") { usuario.password = usuario.documento; }
    // De esta forma, el objeto "usuario" se mantiene sin la propiedad "password"    // Validación de campos obligatorios
    if (
      !usuario.tipo ||
      !usuario.nombre ||
      !usuario.documento ||
      !usuario.telefono ||
      !usuario.direccion ||
      !usuario.email ||
      (usuario.tipo !== "cliente" && !usuario.password) ||
      (usuario.tipo === "cliente" && !usuario.tipo_cliente) ||
      (usuario.tipo === "cliente" && usuario.tipo_cliente !== "persona natural" && !usuario.razonSocial)
    ) {
      setSnackbarMessage("⚠ Todos los campos obligatorios deben completarse.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      setCargando(false);
      return;
    }

    // Validaciones de formato
    if (!/^\d+$/.test(usuario.documento)) {
      setSnackbarMessage("⚠ El documento debe contener solo números.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      setCargando(false);
      return;
    }

    if (!/^\d{10}$/.test(usuario.telefono)) {
      setSnackbarMessage("⚠ El teléfono debe contener exactamente 10 dígitos numéricos.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      setCargando(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(usuario.email)) {
      setSnackbarMessage("⚠ El correo electrónico no tiene un formato válido.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      setCargando(false);
      return;
    }

    // Validaciones de contraseña para usuarios que no sean cliente
    if (usuario.tipo !== "cliente") {
      if (usuario.password.length < 8) {
        setSnackbarMessage("⚠ La contraseña debe tener al menos 8 caracteres.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        setCargando(false);
        return;
      }
      if (!/[A-Z]/.test(usuario.password)) {
        setSnackbarMessage("⚠ La contraseña debe incluir al menos una letra mayúscula.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        setCargando(false);
        return;
      }
      if (!/\d/.test(usuario.password)) {
        setSnackbarMessage("⚠ La contraseña debe incluir al menos un número.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        setCargando(false);
        return;
      }
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(usuario.password)) {
        setSnackbarMessage("⚠ La contraseña debe incluir al menos un carácter especial.");
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        setCargando(false);
        return;
      }
    }

    // Construir el objeto a enviar según el tipo de usuario
    let datosRegistro;
    if (usuario.tipo === "cliente") {
      // Para clientes se envía sin el campo "password"
      datosRegistro = {
        tipo: usuario.tipo,
        nombre: usuario.nombre,
        documento: usuario.documento,
        telefono: usuario.telefono,
        direccion: usuario.direccion,
        email: usuario.email,
        detalles: {
          tipo_cliente: usuario.tipo_cliente,
          razonSocial: usuario.razonSocial
        }
      };
    } else {
      datosRegistro = { ...usuario };
    }

    console.log("Datos que se envían al backend:", datosRegistro);

    try {
      const url = `${import.meta.env.VITE_BACKEND_URL}/usuarios/registro`;
      const respuesta = await axios.post(url, datosRegistro, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      console.log("✔ Registro exitoso:", respuesta.data);
      setSnackbarMessage("✔ Usuario registrado correctamente.");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);      setUsuario({
        tipo: "",
        nombre: "",
        documento: "",
        telefono: "",
        direccion: "",
        email: "",
        password: "",
        tipo_cliente: "",
        especialidad: "",
        codigoSeguridad: "",
        razonSocial: ""
      });
      setErrores({
        nombre: "",
        documento: "",
        telefono: ""
      });
      setTimeout(() => navigate("/users"), 2000);
    } catch (error) {
      console.error(
        "❌ Error en la solicitud:",
        error.response ? error.response.data : error.message
      );
      if (error.response) {
        setSnackbarMessage(
          error.response.data.mensaje ||
          error.response.data.error ||
          "⚠ Error en el registro."
        );
      } else {
        setSnackbarMessage("⚠ Error de conexión con el servidor.");
      }
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setCargando(false);
    }
  };  return (
    <Box sx={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 50%, #e9ecef 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      py: 4,
      px: 2,
      position: 'relative'
    }}>      <Paper elevation={20} sx={{
        p: { xs: 3, sm: 4 },
        borderRadius: 3,
        maxWidth: 520,
        width: '100%',
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(15px)',
        boxShadow: '0 15px 50px rgba(0,0,0,0.12), 0 0 0 1px rgba(255,255,255,0.2)',
        border: '1px solid rgba(255,255,255,0.15)',
        position: 'relative',
        overflow: 'hidden',
        animation: 'slideInScale 0.5s ease-out',
        '@keyframes slideInScale': {
          '0%': {
            opacity: 0,
            transform: 'translateY(20px) scale(0.95)'
          },
          '100%': {
            opacity: 1,
            transform: 'translateY(0) scale(1)'
          }
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: 'linear-gradient(90deg, #39A900 0%, #4caf50 50%, #66bb6a 100%)',
        }
      }}>{/* Encabezado mejorado */}
        <Box display="flex" flexDirection="column" alignItems="center" mb={3} mt={2}>          <Box sx={{ 
            background: 'linear-gradient(135deg, #39A900 0%, #4caf50 100%)', 
            borderRadius: '50%', 
            p: 1.5, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            boxShadow: '0 4px 15px rgba(57,169,0,0.3)',
            mb: 1.5,
            animation: 'pulse 3s infinite',
            '@keyframes pulse': {
              '0%, 100%': {
                transform: 'scale(1)',
                boxShadow: '0 4px 15px rgba(57,169,0,0.3)'
              },
              '50%': {
                transform: 'scale(1.05)',
                boxShadow: '0 6px 20px rgba(57,169,0,0.4)'
              }
            }
          }}>
            <EditIcon sx={{ color: 'white', fontSize: 32 }} />
          </Box>
          <Typography 
            variant="h5" 
            fontWeight={700} 
            color="#2e7d32" 
            letterSpacing={0.5}
            textAlign="center"
            sx={{
              background: 'linear-gradient(135deg, #2e7d32 0%, #388e3c 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 0.5
            }}
          >
            Registro de Usuario
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
            textAlign="center"
            sx={{ opacity: 0.8 }}
          >
            Complete la información requerida
          </Typography>
        </Box>        <form onSubmit={registrarUsuario} style={{ 
          animation: 'fadeInUp 0.6s ease-out' 
        }}>
          <style>
            {`
              @keyframes fadeInUp {
                0% {
                  opacity: 0;
                  transform: translateY(30px);
                }
                100% {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
              @keyframes pulse {
                0%, 100% {
                  transform: scale(1);
                  opacity: 0.8;
                }
                50% {
                  transform: scale(1.05);
                  opacity: 1;
                }
              }
              @keyframes shimmer {
                0% { left: -100%; }
                100% { left: 100%; }
              }
            `}
          </style>
          {/* Tipo de Usuario */}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel sx={{ 
              color: '#666',
              '&.Mui-focused': { color: '#39A900' }
            }}>
              Tipo de Usuario
            </InputLabel>
            <Select
              value={usuario.tipo}
              name="tipo"
              onChange={manejarCambio}
              label="Tipo de Usuario"
              startAdornment={
                <InputAdornment position="start">
                  <GroupIcon sx={{ color: '#39A900', mr: 1 }} />
                </InputAdornment>
              }
              sx={{ 
                background: 'rgba(255,255,255,0.8)', 
                borderRadius: 2,
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'rgba(57,169,0,0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(57,169,0,0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#39A900',
                  },
                },
                transition: 'all 0.2s ease'
              }}
            >
              {allowedOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Campos básicos en grid */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>            <TextField
              label="Nombre Completo"
              name="nombre"
              value={usuario.nombre}
              onChange={manejarCambioNombre}
              onKeyPress={(e) => {
                const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]*$/;
                if (!soloLetras.test(e.key)) {
                  e.preventDefault();
                }
              }}
              fullWidth
              required
              error={!!errores.nombre}
              helperText={errores.nombre}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon sx={{ color: errores.nombre ? '#f44336' : '#39A900' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255,255,255,0.8)',
                  borderRadius: 2,
                  '& fieldset': {
                    borderColor: errores.nombre ? '#f44336' : 'rgba(57,169,0,0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: errores.nombre ? '#f44336' : 'rgba(57,169,0,0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: errores.nombre ? '#f44336' : '#39A900',
                  },
                  '&.Mui-error fieldset': {
                    borderColor: '#f44336',
                  }
                },
                '& .MuiInputLabel-root': {
                  color: errores.nombre ? '#f44336' : '#666',
                  '&.Mui-focused': {
                    color: errores.nombre ? '#f44336' : '#39A900',
                  },
                  '&.Mui-error': {
                    color: '#f44336'
                  }
                },
                '& .MuiFormHelperText-root': {
                  color: '#f44336',
                  fontWeight: 500,
                  fontSize: '0.8rem',
                  marginLeft: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                },
                transition: 'all 0.2s ease'
              }}
            />            <TextField
              label="Documento"
              name="documento"
              value={usuario.documento}
              onChange={manejarCambioDocumento}
              onKeyPress={(e) => {
                const soloNumeros = /^\d$/;
                if (!soloNumeros.test(e.key)) {
                  e.preventDefault();
                }
              }}
              fullWidth
              required
              error={!!errores.documento}
              helperText={errores.documento}
              inputProps={{ maxLength: 15 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <BadgeIcon sx={{ color: errores.documento ? '#f44336' : '#39A900' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255,255,255,0.8)',
                  borderRadius: 2,
                  '& fieldset': {
                    borderColor: errores.documento ? '#f44336' : 'rgba(57,169,0,0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: errores.documento ? '#f44336' : 'rgba(57,169,0,0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: errores.documento ? '#f44336' : '#39A900',
                  },
                  '&.Mui-error fieldset': {
                    borderColor: '#f44336',
                  }
                },
                '& .MuiInputLabel-root': {
                  color: errores.documento ? '#f44336' : '#666',
                  '&.Mui-focused': {
                    color: errores.documento ? '#f44336' : '#39A900',
                  },
                  '&.Mui-error': {
                    color: '#f44336'
                  }
                },
                '& .MuiFormHelperText-root': {
                  color: '#f44336',
                  fontWeight: 500,
                  fontSize: '0.8rem',
                  marginLeft: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                },
                transition: 'all 0.2s ease'
              }}
            />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>            <TextField
              label="Teléfono"
              name="telefono"
              value={usuario.telefono}
              onChange={manejarCambioTelefono}
              onKeyPress={(e) => {
                const soloNumeros = /^\d$/;
                if (!soloNumeros.test(e.key)) {
                  e.preventDefault();
                }
              }}
              fullWidth
              required
              error={!!errores.telefono}
              helperText={errores.telefono}
              inputProps={{ maxLength: 10 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon sx={{ color: errores.telefono ? '#f44336' : '#39A900' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255,255,255,0.8)',
                  borderRadius: 2,
                  '& fieldset': {
                    borderColor: errores.telefono ? '#f44336' : 'rgba(57,169,0,0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: errores.telefono ? '#f44336' : 'rgba(57,169,0,0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: errores.telefono ? '#f44336' : '#39A900',
                  },
                  '&.Mui-error fieldset': {
                    borderColor: '#f44336',
                  }
                },
                '& .MuiInputLabel-root': {
                  color: errores.telefono ? '#f44336' : '#666',
                  '&.Mui-focused': {
                    color: errores.telefono ? '#f44336' : '#39A900',
                  },
                  '&.Mui-error': {
                    color: '#f44336'
                  }
                },
                '& .MuiFormHelperText-root': {
                  color: '#f44336',
                  fontWeight: 500,
                  fontSize: '0.8rem',
                  marginLeft: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                },
                transition: 'all 0.2s ease'
              }}
            />

            <TextField
              label="Correo Electrónico"
              name="email"
              type="email"
              value={usuario.email}
              onChange={manejarCambio}
              fullWidth
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: '#39A900' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255,255,255,0.8)',
                  borderRadius: 2,
                  '& fieldset': {
                    borderColor: 'rgba(57,169,0,0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(57,169,0,0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#39A900',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#666',
                  '&.Mui-focused': {
                    color: '#39A900',
                  },
                },
                transition: 'all 0.2s ease'
              }}
            />
          </Box>

          <TextField
            label="Dirección"
            name="direccion"
            value={usuario.direccion}
            onChange={manejarCambio}
            fullWidth
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LocationOnIcon sx={{ color: '#39A900' }} />
                </InputAdornment>
              ),
            }}
            sx={{ 
              mb: 2,
              '& .MuiOutlinedInput-root': {
                background: 'rgba(255,255,255,0.8)',
                borderRadius: 2,
                '& fieldset': {
                  borderColor: 'rgba(57,169,0,0.3)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(57,169,0,0.5)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#39A900',
                },
              },
              '& .MuiInputLabel-root': {
                color: '#666',
                '&.Mui-focused': {
                  color: '#39A900',
                },
              },
              transition: 'all 0.2s ease'
            }}          />          {/* Campo de contraseña para usuarios no cliente */}
          {usuario.tipo !== "cliente" && (
            <Box sx={{ 
              animation: 'fadeInUp 0.4s ease-out',
              '@keyframes fadeInUp': {
                '0%': { opacity: 0, transform: 'translateY(15px)' },
                '100%': { opacity: 1, transform: 'translateY(0)' }
              }
            }}>
              <TextField
                label="Contraseña"
                name="password"
                type="password"
                value={usuario.password}
                onChange={manejarCambio}
                fullWidth
                required
                helperText="8+ caracteres: mayúscula, número y símbolo"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: '#39A900' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ 
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    background: 'rgba(255,255,255,0.8)',
                    borderRadius: 2,
                    '& fieldset': {
                      borderColor: 'rgba(57,169,0,0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(57,169,0,0.5)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#39A900',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: '#666',
                    '&.Mui-focused': {
                      color: '#39A900',
                    },
                  },
                  transition: 'all 0.2s ease'
                }}
              />
            </Box>
          )}{/* Campos específicos para clientes */}
          {usuario.tipo === "cliente" && (
            <Box sx={{ mb: 2 }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel sx={{ 
                  color: '#666',
                  '&.Mui-focused': { color: '#39A900' }
                }}>
                  Tipo de Cliente
                </InputLabel>
                <Select
                  value={usuario.tipo_cliente}
                  name="tipo_cliente"
                  onChange={manejarCambio}
                  label="Tipo de Cliente"
                  required
                  startAdornment={
                    <InputAdornment position="start">
                      <BusinessIcon sx={{ color: '#39A900', mr: 1 }} />
                    </InputAdornment>
                  }
                  sx={{ 
                    background: 'rgba(255,255,255,0.8)', 
                    borderRadius: 2,
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'rgba(57,169,0,0.3)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(57,169,0,0.5)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#39A900',
                      },
                    },
                    transition: 'all 0.2s ease'
                  }}
                >
                  <MenuItem value="empresas">Empresas</MenuItem>
                  <MenuItem value="emprendedor">Emprendedor</MenuItem>
                  <MenuItem value="persona natural">Persona Natural</MenuItem>
                  <MenuItem value="institucion educativa">Institución Educativa</MenuItem>
                  <MenuItem value="aprendiz/instructor Sena">Aprendiz/Instructor SENA</MenuItem>
                </Select>
              </FormControl>
              
              {usuario.tipo_cliente !== "persona natural" && (
                <TextField
                  label="Razón Social"
                  name="razonSocial"
                  value={usuario.razonSocial}
                  onChange={manejarCambio}
                  fullWidth
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BusinessIcon sx={{ color: '#39A900' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      background: 'rgba(255,255,255,0.8)',
                      borderRadius: 2,
                      '& fieldset': {
                        borderColor: 'rgba(57,169,0,0.3)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(57,169,0,0.5)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#39A900',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#666',
                      '&.Mui-focused': {
                        color: '#39A900',
                      },
                    },
                    transition: 'all 0.2s ease'
                  }}
                />
              )}
            </Box>
          )}

          {/* Campos específicos compactos */}
          {usuario.tipo === "laboratorista" && (
            <TextField
              label="Especialidad"
              name="especialidad"
              value={usuario.especialidad}
              onChange={manejarCambio}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <WorkIcon sx={{ color: '#39A900' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255,255,255,0.8)',
                  borderRadius: 2,
                  '& fieldset': {
                    borderColor: 'rgba(57,169,0,0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(57,169,0,0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#39A900',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#666',
                  '&.Mui-focused': {
                    color: '#39A900',
                  },
                },
                transition: 'all 0.2s ease'
              }}
            />
          )}
          
          {usuario.tipo === "super_admin" && (
            <TextField
              label="Código de Seguridad"
              name="codigoSeguridad"
              value={usuario.codigoSeguridad}
              onChange={manejarCambio}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SecurityIcon sx={{ color: '#39A900' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ 
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255,255,255,0.8)',
                  borderRadius: 2,
                  '& fieldset': {
                    borderColor: 'rgba(57,169,0,0.3)',
                  },
                  '&:hover fieldset': {
                    borderColor: 'rgba(57,169,0,0.5)',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#39A900',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#666',
                  '&.Mui-focused': {
                    color: '#39A900',
                  },
                },
                transition: 'all 0.2s ease'
              }}
            />
          )}
          
          {usuario.tipo === "administrador" && (
            <Box sx={{ 
              p: 1.5, 
              background: 'rgba(57,169,0,0.08)', 
              borderRadius: 2, 
              mb: 2,
              border: '1px solid rgba(57,169,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <SecurityIcon sx={{ color: '#39A900', fontSize: 20 }} />
              <Typography sx={{ 
                color: '#39A900', 
                fontWeight: 500,
                fontSize: '0.9rem'
              }}>
                Nivel de acceso: Administrador
              </Typography>
            </Box>
          )}          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={cargando}
            sx={{
              background: cargando 
                ? 'linear-gradient(135deg, #81c784 0%, #a5d6a7 100%)' 
                : 'linear-gradient(135deg, #39A900 0%, #4caf50 100%)',
              fontWeight: 600,
              fontSize: 16,
              py: 1.5,
              borderRadius: 2,
              mt: 2,
              boxShadow: cargando 
                ? '0 2px 8px rgba(129,199,132,0.3)' 
                : '0 3px 10px rgba(57,169,0,0.3)',
              textTransform: 'none',
              position: 'relative',
              overflow: 'hidden',
              '&:hover': !cargando ? { 
                background: 'linear-gradient(135deg, #2e7d32 0%, #388e3c 100%)',
                boxShadow: '0 4px 15px rgba(57,169,0,0.4)',
                transform: 'translateY(-1px)'
              } : {},
              '&:active': !cargando ? {
                transform: 'translateY(0px)'
              } : {},
              '&:disabled': {
                color: 'white',
                cursor: 'not-allowed'
              },
              ...(cargando && {
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                  animation: 'shimmer 1.5s infinite'
                },
                '@keyframes shimmer': {
                  '0%': { left: '-100%' },
                  '100%': { left: '100%' }
                }
              }),
              transition: 'all 0.2s ease'
            }}
          >
            {cargando ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={20} sx={{ color: 'white' }} />
                <span>Registrando...</span>
              </Box>
            ) : (
              "Registrar Usuario"
            )}
          </Button>
        </form>        <Snackbar 
          open={snackbarOpen} 
          autoHideDuration={snackbarSeverity === 'success' ? 2000 : 5000} 
          onClose={handleSnackbarClose} 
          anchorOrigin={{ 
            vertical: snackbarSeverity === 'success' ? 'center' : 'top', 
            horizontal: 'center' 
          }}
          sx={{
            '& .MuiSnackbarContent-root': {
              minWidth: '300px'
            },
            ...(snackbarSeverity === 'success' && {
              top: '50% !important',
              left: '50% !important',
              transform: 'translate(-50%, -50%) !important'
            })
          }}
        >
          <Alert 
            onClose={handleSnackbarClose} 
            severity={snackbarSeverity} 
            variant="filled"
            sx={{ 
              width: '100%', 
              borderRadius: 3, 
              fontWeight: 500,
              fontSize: '0.95rem',
              boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
              '& .MuiAlert-icon': {
                fontSize: '1.5rem'
              },
              '& .MuiAlert-message': {
                display: 'flex',
                alignItems: 'center'
              },
              ...(snackbarSeverity === 'success' && {
                background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
                '& .MuiAlert-icon': {
                  color: 'white'
                }
              }),
              ...(snackbarSeverity === 'error' && {
                background: 'linear-gradient(135deg, #f44336 0%, #ef5350 100%)',
                '& .MuiAlert-icon': {
                  color: 'white'
                }
              }),
              ...(snackbarSeverity === 'warning' && {
                background: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)',
                '& .MuiAlert-icon': {
                  color: 'white'
                }
              }),
              animation: 'slideInDown 0.3s ease-out',
              '@keyframes slideInDown': {
                '0%': {
                  transform: 'translateY(-100%)',
                  opacity: 0
                },
                '100%': {
                  transform: 'translateY(0)',
                  opacity: 1
                }
              }
            }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Paper>
    </Box>
  );
};

export default RegistroUsuario;
