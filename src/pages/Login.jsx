import React, { useState, useContext } from "react";
import axios from "axios";
import {
  TextField,
  Button,
  Box,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { motion } from "framer-motion";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import AuthContext from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import AqualabLogo from "../assets/Aqualab.png";

const Login = () => {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Estado para visibilidad de contraseña
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleClickShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!credentials.email || !credentials.password) {
      setError("⚠ Todos los campos son obligatorios.");
      setLoading(false);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.email)) {
      setError("⚠ Por favor, ingresa un correo electrónico válido.");
      setLoading(false);
      return;
    }

    try {
      const url = `${import.meta.env.VITE_BACKEND_URL || 'https://backend-sena-lab-1-qpzp.onrender.com'}/api/usuarios/login`;
      const response = await axios.post(url, credentials);

      if (response.data && response.data.token) {
        const { token, usuario } = response.data;
        if (!usuario.rol) {
          setError("Error: Usuario sin rol asignado");
          setLoading(false);
          return;
        }
        const usuarioFinal = {
          ...usuario,
          email: credentials.email,
          token,
          rol: usuario.rol,
        };
        console.log("Datos del usuario desde el backend:", usuario); // Depuración
        console.log("usuarioFinal:", usuarioFinal); // Depuración
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(usuarioFinal));
        login(usuarioFinal);
        navigate("/dashboard");
      } else {
        setError("Error: Respuesta inválida del servidor");
      }
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Error al iniciar sesión"
      );
    }
    setLoading(false);
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
            maxWidth: 400,
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
              width: "200px",
              marginBottom: "1px",
            }}
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          />

          <Typography
            variant="h5"
            fontWeight="bold"
            gutterBottom
            color="#00324D"
          >
            Iniciar Sesión
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 2 }}
          >
            <TextField
              label="Correo"
              name="email"
              type="email"
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              label="Contraseña"
              name="password"
              type={showPassword ? "text" : "password"}
              onChange={handleChange}
              fullWidth
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {loading ? (
              <CircularProgress sx={{ alignSelf: "center" }} />
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
                Ingresar
              </Button>
            )}
          </Box>

          <Typography variant="body2" sx={{ mt: 2 }}>
            <a
              href="/recuperar-contrasena"
              style={{ color: "#39A900", textDecoration: "none" }}
            >
              ¿Olvidaste tu contraseña?
            </a>
          </Typography>
        </Paper>
      </motion.div>
    </Box>
  );
};

export default Login;