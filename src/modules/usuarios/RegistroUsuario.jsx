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
  Box
} from "@mui/material";
import axios from "axios";
import AuthContext from "../../context/AuthContext"; // Ajusta la ruta si es necesario
import EditIcon from '@mui/icons-material/Edit';

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
  });
  const [cargando, setCargando] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  // Definir las opciones de rol según el rol del usuario logueado
  let allowedOptions = [];
  if (tipoUsuario === "super_admin") {
    allowedOptions = [{ value: "administrador", label: "Administrador" }];
  } else if (tipoUsuario === "administrador") {
    allowedOptions = [
      { value: "cliente", label: "Cliente" },
      { value: "laboratorista", label: "Laboratorista" }
    ];
  }

  // Manejar cambios en los campos del formulario
  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setUsuario({ ...usuario, [name]: value });
    setSnackbarOpen(false);
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
    // De esta forma, el objeto "usuario" se mantiene sin la propiedad "password"

    // Validación de campos obligatorios
    if (
      !usuario.tipo ||
      !usuario.nombre ||
      !usuario.documento ||
      !usuario.telefono ||
      !usuario.direccion ||
      !usuario.email ||
      (usuario.tipo !== "cliente" && !usuario.password) ||
      (usuario.tipo === "cliente" && (!usuario.tipo_cliente || !usuario.razonSocial))
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
      setSnackbarOpen(true);
      setUsuario({
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
  };

  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #e8f5e9 0%, #f5f5f5 100%)', py: 6 }}>
      <Paper elevation={8} sx={{
        p: { xs: 2, sm: 4 },
        mt: 4,
        borderRadius: 5,
        maxWidth: 480,
        margin: 'auto',
        background: 'rgba(255,255,255,0.98)',
        boxShadow: '0 8px 32px 0 rgba(57,169,0,0.18)',
        border: '2px solid #39A90033',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Cinta decorativa superior */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: 10,
          background: 'linear-gradient(90deg, #39A900 0%, #8bc34a 100%)',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }} />
        {/* Encabezado atractivo */}
        <Box display="flex" alignItems="center" mb={3} gap={2} mt={1}>
          <Box sx={{ background: '#39A900', borderRadius: '50%', p: 1.2, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 3 }}>
            <EditIcon sx={{ color: 'white', fontSize: 36 }} />
          </Box>
          <Typography variant="h5" fontWeight={700} color="#39A900" letterSpacing={1}>
            Registrar Nuevo Usuario
          </Typography>
        </Box>

        <form onSubmit={registrarUsuario}>
          <Select
            value={usuario.tipo}
            name="tipo"
            onChange={manejarCambio}
            displayEmpty
            fullWidth
            required
            sx={{ mb: 2, background: 'white', borderRadius: 2, boxShadow: 1 }}
          >
            <MenuItem value="" disabled>
              Selecciona un tipo de usuario
            </MenuItem>
            {allowedOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>

          <TextField
            label="Nombre Completo"
            name="nombre"
            value={usuario.nombre}
            onChange={manejarCambio}
            fullWidth
            required
            sx={{ mb: 2, background: 'white', borderRadius: 2, boxShadow: 1 }}
          />
          <TextField
            label="Documento"
            name="documento"
            value={usuario.documento}
            onChange={manejarCambio}
            fullWidth
            required
            sx={{ mb: 2, background: 'white', borderRadius: 2, boxShadow: 1 }}
          />
          <TextField
            label="Teléfono"
            name="telefono"
            value={usuario.telefono}
            onChange={manejarCambio}
            fullWidth
            required
            sx={{ mb: 2, background: 'white', borderRadius: 2, boxShadow: 1 }}
          />
          <TextField
            label="Dirección"
            name="direccion"
            value={usuario.direccion}
            onChange={manejarCambio}
            fullWidth
            required
            sx={{ mb: 2, background: 'white', borderRadius: 2, boxShadow: 1 }}
          />
          <TextField
            label="Correo Electrónico"
            name="email"
            type="email"
            value={usuario.email}
            onChange={manejarCambio}
            fullWidth
            required
            sx={{ mb: 2, background: 'white', borderRadius: 2, boxShadow: 1 }}
          />

          {/* Mostrar campo de contraseña solo para tipos que no sean cliente */}
          {usuario.tipo !== "cliente" && (
            <TextField
              label="Contraseña"
              name="password"
              type="password"
              value={usuario.password}
              onChange={manejarCambio}
              fullWidth
              required
              sx={{ mb: 2, background: 'white', borderRadius: 2, boxShadow: 1 }}
            />
          )}

          {/* Campos específicos para clientes */}
          {usuario.tipo === "cliente" && (
            <>
              <Select
                value={usuario.tipo_cliente}
                name="tipo_cliente"
                onChange={manejarCambio}
                displayEmpty
                fullWidth
                required
                sx={{ mb: 2, background: 'white', borderRadius: 2, boxShadow: 1 }}
              >
                <MenuItem value="" disabled>
                  Selecciona un tipo de cliente
                </MenuItem>
                <MenuItem value="empresas">empresas</MenuItem>
                <MenuItem value="emprendedor">emprendedor</MenuItem>
                <MenuItem value="persona natural">persona natural</MenuItem>
                <MenuItem value="institucion educativa">institucion educativa</MenuItem>
                <MenuItem value="aprendiz/instructor Sena">aprendiz/instructor Sena</MenuItem>
              </Select>
              <TextField
                label="Razón Social"
                name="razonSocial"
                value={usuario.razonSocial}
                onChange={manejarCambio}
                fullWidth
                required
                sx={{ mb: 2, background: 'white', borderRadius: 2, boxShadow: 1 }}
              />
            </>
          )}

          {usuario.tipo === "laboratorista" && (
            <TextField
              label="Especialidad"
              name="especialidad"
              value={usuario.especialidad}
              onChange={manejarCambio}
              fullWidth
              sx={{ mb: 2, background: 'white', borderRadius: 2, boxShadow: 1 }}
            />
          )}
          {usuario.tipo === "super_admin" && (
            <TextField
              label="Código de Seguridad"
              name="codigoSeguridad"
              value={usuario.codigoSeguridad}
              onChange={manejarCambio}
              fullWidth
              sx={{ mb: 2, background: 'white', borderRadius: 2, boxShadow: 1 }}
            />
          )}
          {usuario.tipo === "administrador" && (
            <Typography sx={{ mb: 2 }}>
              Nivel de acceso: 1
            </Typography>
          )}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={cargando}
            sx={{
              backgroundColor: '#39A900',
              fontWeight: 700,
              fontSize: 16,
              py: 1.2,
              borderRadius: 2,
              mt: 1,
              boxShadow: 2,
              letterSpacing: 1,
              textTransform: 'uppercase',
              '&:hover': { backgroundColor: '#2e7d32' }
            }}
          >
            {cargando ? <CircularProgress size={24} /> : "Registrar Usuario"}
          </Button>
        </form>

        <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%', borderRadius: 2, fontWeight: 600 }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Paper>
    </Box>
  );
};

export default RegistroUsuario;
