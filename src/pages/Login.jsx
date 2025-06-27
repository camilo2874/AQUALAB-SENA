import React, { useState, useContext, useEffect } from "react";
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
  Chip,
  Fade,
  Slide,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Visibility, 
  VisibilityOff, 
  Email, 
  Lock, 
  Login as LoginIcon,
  WaterDrop,
  Science,
  Biotech,
  LocalDrink,
  Opacity,
  Waves,
  BubbleChart,
  Analytics
} from "@mui/icons-material";
import AuthContext from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import AqualabLogo from "../assets/Aqualab.png";

const Login = () => {
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [particles, setParticles] = useState([]);
  const [clickedIcons, setClickedIcons] = useState(new Set());
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Crear partículas animadas para el fondo
  useEffect(() => {
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 10 + 5,
    }));
    setParticles(newParticles);
  }, []);

  // Iconos flotantes de laboratorio (más grandes y jugables) - Distribuidos por TODA la pantalla
  const floatingIcons = [
    { Icon: WaterDrop, color: "#4FC3F7", size: 55 },
    { Icon: Science, color: "#66BB6A", size: 60 },
    { Icon: Biotech, color: "#9575CD", size: 58 },
    { Icon: LocalDrink, color: "#42A5F5", size: 56 },
    { Icon: Opacity, color: "#26C6DA", size: 54 },
    { Icon: Waves, color: "#29B6F6", size: 62 },
    { Icon: BubbleChart, color: "#AB47BC", size: 52 },
    { Icon: Analytics, color: "#7E57C2", size: 58 },
    { Icon: WaterDrop, color: "#81C784", size: 50 },
    { Icon: Science, color: "#FFB74D", size: 64 },
    { Icon: Biotech, color: "#F06292", size: 55 },
    { Icon: LocalDrink, color: "#4DD0E1", size: 59 },
    { Icon: Opacity, color: "#AED581", size: 53 },
    { Icon: Waves, color: "#64B5F6", size: 61 },
    { Icon: BubbleChart, color: "#BA68C8", size: 48 },
    { Icon: Analytics, color: "#9575CD", size: 57 },
    { Icon: WaterDrop, color: "#4FC3F7", size: 52 },
    { Icon: Science, color: "#66BB6A", size: 56 },
    { Icon: Biotech, color: "#9575CD", size: 54 },
    { Icon: LocalDrink, color: "#42A5F5", size: 58 },
    { Icon: Opacity, color: "#26C6DA", size: 50 },
    { Icon: Waves, color: "#29B6F6", size: 60 },
    { Icon: BubbleChart, color: "#AB47BC", size: 55 },
    { Icon: Analytics, color: "#7E57C2", size: 53 }
  ];

  // Función para manejar clicks en los iconos
  const handleIconClick = (iconIndex) => {
    setClickedIcons(prev => new Set([...prev, iconIndex]));
    // Remover el estado de "clicked" después de la animación
    setTimeout(() => {
      setClickedIcons(prev => {
        const newSet = new Set(prev);
        newSet.delete(iconIndex);
        return newSet;
      });
    }, 3000); // Aumentado a 3 segundos para la nueva animación más larga
  };

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
    setError(null); // Limpiar errores al escribir
  };

  const handleClickShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleFocus = (fieldName) => {
    setFocusedField(fieldName);
  };

  const handleBlur = () => {
    setFocusedField(null);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validaciones en cliente para evitar llamadas innecesarias
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
      // Usar la configuración centralizada de APIs
      const url = `${import.meta.env.VITE_BACKEND_URL}/usuarios/login`;
      
      // Optimización: Precarga el dashboard mientras se autentica
      const prefetchDashboardModule = import('../pages/Dashboard.jsx');
      
      // Realizar login
      const response = await axios.post(url, credentials);

      if (response.data && response.data.token) {
        const { token, usuario } = response.data;
        if (!usuario.rol) {
          setError("Error: Usuario sin rol asignado");
          setLoading(false);
          return;
        }
        
        // Crear objeto de usuario sin console.logs innecesarios
        const usuarioFinal = {
          ...usuario,
          email: credentials.email,
          token,
          rol: usuario.rol,
        };
        
        // Guardar datos en localStorage
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(usuarioFinal));
        
        // Usar login del AuthContext (que ahora está optimizado)
        login(usuarioFinal);
        
        // Verificar que el módulo del dashboard se haya cargado antes de navegar
        await prefetchDashboardModule;
        
        // Navegar al dashboard
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
        background: "linear-gradient(135deg, #E8F5E8 0%, #DDF0DD 25%, #F2F9F2 50%, #E5F2E5 75%, #EEF7EE 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 2,
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 20% 80%, rgba(220, 245, 220, 0.15) 0%, transparent 50%),
                      radial-gradient(circle at 80% 20%, rgba(230, 250, 230, 0.20) 0%, transparent 50%),
                      radial-gradient(circle at 40% 40%, rgba(240, 252, 240, 0.25) 0%, transparent 50%)`,
          animation: "float 6s ease-in-out infinite",
        },
        "@keyframes float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      }}
    >
      {/* Partículas flotantes */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0, 1, 0],
            x: [particle.x + "%", (particle.x + 10) + "%"],
            y: [particle.y + "%", (particle.y - 20) + "%"],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            width: particle.size,
            height: particle.size,
            borderRadius: "50%",
            background: "rgba(255, 255, 255, 0.6)",
            pointerEvents: "none",
          }}
        />
      ))}

      {/* Iconos flotantes de laboratorio interactivos */}
      {floatingIcons.map((iconData, index) => {
        const { Icon, color, size } = iconData;
        
        // Distribución por TODA la pantalla
        const startX = 2 + (index % 6) * 16 + Math.random() * 10; // 6 columnas distribuidas: 2%, 18%, 34%, 50%, 66%, 82%
        const startY = 5 + Math.floor(index / 6) * 25 + Math.random() * 15; // Filas distribuidas cada 25%
        
        const duration = Math.random() * 3 + 4; // Duración entre 4-7 segundos
        const isClicked = clickedIcons.has(index);
        
        return (
          <motion.div
            key={`icon-${index}`}
            initial={{ 
              x: `${startX}vw`, 
              y: `${startY}vh`,
              opacity: 0 
            }}
            animate={isClicked ? {
              // Animación especial cuando se hace click - rebote por TODA la pantalla
              y: [`${startY}vh`, "5vh", "95vh", "50vh", `${startY}vh`],
              x: [`${startX}vw`, `${Math.random() * 90 + 5}vw`, `${Math.random() * 90 + 5}vw`, `${Math.random() * 90 + 5}vw`, `${startX}vw`],
              opacity: [0.8, 1, 1, 1, 0.8],
              rotate: [0, 360, 720, 1080, 1440],
              scale: [1, 2, 1.8, 1.5, 1]
            } : {
              // Animación normal de rebote
              y: [`${startY}vh`, `${Math.max(5, startY - 25)}vh`, `${startY}vh`],
              x: [`${startX}vw`, `${Math.max(5, Math.min(95, startX + (Math.random() * 40 - 20)))}vw`, `${startX}vw`],
              opacity: [0, 0.8, 0],
              rotate: [0, 360, 720],
              scale: [0.8, 1.4, 0.8]
            }}
            transition={{
              duration: isClicked ? 3 : duration,
              repeat: isClicked ? 0 : Infinity,
              ease: isClicked ? "easeInOut" : "easeInOut",
              delay: isClicked ? 0 : index * 0.3
            }}
            style={{
              position: "absolute",
              pointerEvents: "auto",
              zIndex: 5,
              filter: "drop-shadow(0px 6px 12px rgba(0, 0, 0, 0.3))",
              cursor: "pointer"
            }}
            onClick={() => handleIconClick(index)}
            whileHover={{ 
              scale: 1.3, 
              rotate: 20,
              transition: { duration: 0.2 }
            }}
            whileTap={{ 
              scale: 0.8,
              transition: { duration: 0.1 }
            }}
          >
            <Icon 
              sx={{ 
                fontSize: size, 
                color: color,
                opacity: 0.9,
                transition: "all 0.3s ease",
                "&:hover": {
                  opacity: 1,
                  filter: "brightness(1.3) saturate(1.2)"
                }
              }} 
            />
          </motion.div>
        );
      })}

      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ 
          duration: 0.8, 
          type: "spring", 
          stiffness: 100,
          damping: 20 
        }}
        whileHover={{ scale: 1.02 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        style={{ zIndex: 15, position: "relative" }}
      >
        <Paper
          elevation={isHovered ? 25 : 15}
          sx={{
            padding: 3,
            width: "100%",
            maxWidth: 420,
            background: "linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.85))",
            borderRadius: 6,
            boxShadow: isHovered 
              ? "0px 20px 60px rgba(0, 0, 0, 0.3), 0px 0px 40px rgba(57, 169, 0, 0.2)"
              : "0px 10px 40px rgba(0, 0, 0, 0.2)",
            textAlign: "center",
            transition: "all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            position: "relative"
          }}
        >
          {/* Logo con animación mejorada */}
          <motion.div
            initial={{ opacity: 0, y: -30, rotateY: 180 }}
            animate={{ opacity: 1, y: 0, rotateY: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            whileHover={{ 
              scale: 1.05, 
              rotateY: 5,
              transition: { duration: 0.3 } 
            }}
          >
            <Box sx={{ position: "relative", mb: 0 }}>
              <motion.img
                src={AqualabLogo}
                alt="Aqualab Logo"
                style={{
                  width: "200px",
                  height: "auto",
                  filter: "drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.1))"
                }}
                whileHover={{ 
                  filter: "drop-shadow(0px 6px 12px rgba(57, 169, 0, 0.3))"
                }}
              />
            </Box>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Typography
              variant="h5"
              fontWeight="bold"
              gutterBottom
              sx={{
                background: "linear-gradient(45deg, #0B4D2C, #39A900)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                mb: 0.3,
                textShadow: "0px 2px 4px rgba(0,0,0,0.1)"
              }}
            >
              Bienvenido
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mb: 1.5, fontStyle: "italic" }}
            >
              Ingresa a tu laboratorio digital
            </Typography>
          </motion.div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Alert 
                  severity="error" 
                  sx={{ 
                    mb: 2, 
                    borderRadius: 3,
                    "& .MuiAlert-icon": {
                      animation: "shake 0.5s ease-in-out"
                    },
                    "@keyframes shake": {
                      "0%, 100%": { transform: "translateX(0)" },
                      "25%": { transform: "translateX(-5px)" },
                      "75%": { transform: "translateX(5px)" },
                    }
                  }}
                >
                  {error}
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{ display: "flex", flexDirection: "column", gap: 1.8 }}
            >
              {/* Campo Email con animaciones */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileFocus={{ scale: 1.02 }}
              >
                <TextField
                  label="Correo Electrónico"
                  name="email"
                  type="email"
                  value={credentials.email}
                  onChange={handleChange}
                  onFocus={() => handleFocus('email')}
                  onBlur={handleBlur}
                  fullWidth
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <motion.div
                          animate={{ 
                            color: focusedField === 'email' ? '#39A900' : '#666',
                            scale: focusedField === 'email' ? 1.2 : 1
                          }}
                          transition={{ duration: 0.2 }}
                        >
                          <Email />
                        </motion.div>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 3,
                      transition: "all 0.3s ease",
                      "&:hover": {
                        boxShadow: "0px 4px 20px rgba(57, 169, 0, 0.1)",
                      },
                      "&.Mui-focused": {
                        boxShadow: "0px 4px 20px rgba(57, 169, 0, 0.2)",
                        "& fieldset": {
                          borderColor: "#39A900",
                          borderWidth: "2px",
                        },
                      },
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "#39A900",
                      fontWeight: "bold",
                    },
                  }}
                />
              </motion.div>

              {/* Campo Contraseña con animaciones */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileFocus={{ scale: 1.02 }}
              >
                <TextField
                  label="Contraseña"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={credentials.password}
                  onChange={handleChange}
                  onFocus={() => handleFocus('password')}
                  onBlur={handleBlur}
                  fullWidth
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <motion.div
                          animate={{ 
                            color: focusedField === 'password' ? '#39A900' : '#666',
                            scale: focusedField === 'password' ? 1.2 : 1
                          }}
                          transition={{ duration: 0.2 }}
                        >
                          <Lock />
                        </motion.div>
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <motion.div
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <IconButton
                            aria-label="toggle password visibility"
                            onClick={handleClickShowPassword}
                            edge="end"
                            sx={{
                              color: showPassword ? '#39A900' : '#666',
                              transition: 'color 0.3s ease'
                            }}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </motion.div>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 3,
                      transition: "all 0.3s ease",
                      "&:hover": {
                        boxShadow: "0px 4px 20px rgba(57, 169, 0, 0.1)",
                      },
                      "&.Mui-focused": {
                        boxShadow: "0px 4px 20px rgba(57, 169, 0, 0.2)",
                        "& fieldset": {
                          borderColor: "#39A900",
                          borderWidth: "2px",
                        },
                      },
                    },
                    "& .MuiInputLabel-root.Mui-focused": {
                      color: "#39A900",
                      fontWeight: "bold",
                    },
                  }}
                />
              </motion.div>

              {/* Botón de login mejorado */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <CircularProgress 
                        sx={{ 
                          color: "#39A900",
                          filter: "drop-shadow(0px 2px 4px rgba(57, 169, 0, 0.3))"
                        }} 
                      />
                    </motion.div>
                  </Box>
                ) : (
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    startIcon={<LoginIcon />}
                    sx={{
                      background: "linear-gradient(45deg, #39A900, #2e7d00)",
                      color: "white",
                      fontWeight: "bold",
                      fontSize: "1rem",
                      py: 1.2,
                      borderRadius: 3,
                      boxShadow: "0px 8px 25px rgba(57, 169, 0, 0.3)",
                      transition: "all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
                      "&:hover": {
                        background: "linear-gradient(45deg, #2e7d00, #39A900)",
                        boxShadow: "0px 12px 35px rgba(57, 169, 0, 0.4)",
                        transform: "translateY(-2px)",
                      },
                      "&:active": {
                        transform: "translateY(0px)",
                      },
                    }}
                  >
                    Ingresar al Sistema
                  </Button>
                )}
              </motion.div>
            </Box>
          </motion.div>

          {/* Enlace de recuperación con animación */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <Typography variant="body2" sx={{ mt: 1.5 }}>
              <motion.a
                href="/recuperar-contrasena"
                style={{ 
                  color: "#39A900", 
                  textDecoration: "none",
                  fontWeight: "500"
                }}
                whileHover={{ 
                  color: "#2e7d00",
                  textDecoration: "underline"
                }}
                transition={{ duration: 0.2 }}
              >
                ¿Olvidaste tu contraseña?
              </motion.a>
            </Typography>
          </motion.div>

          {/* Indicadores de laboratorio */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1.5, gap: 1 }}>
              <Chip 
                icon={<Science />} 
                label="Sistema Seguro" 
                size="small" 
                sx={{ 
                  backgroundColor: 'rgba(57, 169, 0, 0.1)',
                  color: '#39A900',
                  fontWeight: 'bold',
                  fontSize: '0.75rem'
                }} 
              />
              <Chip 
                icon={<WaterDrop />} 
                label="Análisis Avanzado" 
                size="small" 
                sx={{ 
                  backgroundColor: 'rgba(11, 77, 44, 0.1)',
                  color: '#0B4D2C',
                  fontWeight: 'bold',
                  fontSize: '0.75rem'
                }} 
              />
            </Box>
          </motion.div>
        </Paper>
      </motion.div>
    </Box>
  );
};

export default Login;