import React, { useState } from "react";
import axios from "axios";
import {
  TextField,
  Button,
  Box,
  Typography,
  Paper,
  Alert,
  CircularProgress,
} from "@mui/material";
import { motion } from "framer-motion";
import AqualabLogo from "../assets/Aqualab.png"; // Importa el logo

const RecuperarContrasena = () => {
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMensaje(null);
    setLoading(true);

    if (!email) {
      setError("⚠ Debes ingresar un correo electrónico.");
      setLoading(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("⚠ Ingresa un correo válido.");
      setLoading(false);
      return;
    }

    try {
      const url = 'https://backend-sena-lab-1.onrender.com/api/usuarios/solicitar-recuperacion';
      const response = await axios.post(url, { 
        email 
      });

      if (response.status === 200) {
        setMensaje("Instrucciones Enviadas.");
      } else {
        setError("⚠ No se pudo procesar la solicitud.");
      }
    } catch (error) {
      console.error("Error en la recuperación:", error);
      
      // Por seguridad, siempre mostrar el mismo mensaje
      setMensaje(" Si el correo existe, se enviará un enlace de recuperación.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #d7f7dd 0%, #ffffff 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 2,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <Paper
          elevation={10}
          sx={{
            padding: 4,
            width: "100%",
            maxWidth: 350,
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            borderRadius: 5,
            boxShadow: "0px 4px 30px rgba(0, 0, 0, 0.2)",
            textAlign: "center",
            transition: "all 0.3s ease-in-out",
            "&:hover": {
              transform: "scale(1.02)",
              boxShadow: "0px 8px 40px rgba(0, 0, 0, 0.3)",
            },
          }}
        >
          <motion.img
            src={AqualabLogo}
            alt="Aqualab Logo"
            style={{
              width: "200px", // Tamaño consistente con el componente Login
              marginBottom: "1px", // Espacio entre el logo y el título
            }}
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          />

          <Typography
            variant="h5"
            sx={{ marginBottom: 2, fontWeight: "bold", color: "#39A900" }}
          >
            Recuperar Contraseña
          </Typography>

          {mensaje && <Alert severity="success" sx={{ mb: 2 }}>{mensaje}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <TextField
              label="Correo electrónico"
              name="email"
              type="email"
              value={email}
              onChange={handleChange}
              fullWidth
              required
            />

            {loading ? (
              <CircularProgress size={24} sx={{ alignSelf: "center", margin: 2 }} />
            ) : (
              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{
                  backgroundColor: "#39A900",
                  color: "white",
                  fontWeight: "bold",
                  transition: "all 0.3s ease-in-out",
                  "&:hover": {
                    backgroundColor: "#2e7d00",
                    transform: "scale(1.02)",
                  },
                }}
              >
                Enviar correo
              </Button>
            )}
          </Box>

          <Typography variant="body2" sx={{ marginTop: 2 }}>
            <a href="/login" style={{ color: "#39A900", textDecoration: "none" }}>
              Volver al inicio de sesión
            </a>
          </Typography>
        </Paper>
      </motion.div>
    </Box>
  );
};

export default RecuperarContrasena;