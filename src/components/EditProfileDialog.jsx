import React, { useState, useContext, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Box, Avatar, IconButton, Snackbar,
  Badge, CircularProgress, Tooltip, InputAdornment, Alert
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import AuthContext from '../context/AuthContext';
import axios from 'axios';

const EditProfileDialog = ({ open, handleClose }) => {
  const { user, perfil, login, updatePerfil } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
  });  const [imageFile, setImageFile] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState('');  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);  const [fieldErrors, setFieldErrors] = useState({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  // 1) Precarga desde perfil cuando cambia
  useEffect(() => {
    if (perfil) {
      setFormData({
        nombre: perfil.nombre || '',
        email: perfil.email || '',
        telefono: perfil.telefono || '',
        direccion: perfil.direccion || '',
      });
      setPreviewPhoto(perfil.fotoPerfil || '');
      setImageFile(null);
    }
  }, [perfil]);

  // 2) Limpia al cerrar
  useEffect(() => {
    if (!open) {
      setFormData({ nombre: '', email: '', telefono: '', direccion: '' });
      setPreviewPhoto('');
      setImageFile(null);
    }
  }, [open]);

  // 3) Libera URL de blob
  useEffect(() => {
    return () => {
      if (previewPhoto.startsWith('blob:')) URL.revokeObjectURL(previewPhoto);
    };
  }, [previewPhoto]);
  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(f => ({ ...f, [name]: value }));
    
    // Limpiar errores cuando el usuario empiece a escribir
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: false }));
    }
  };

  const validateFields = () => {
    const errors = {};
    
    if (!formData.nombre.trim()) {
      errors.nombre = true;
    }
    
    if (!formData.email.trim()) {
      errors.email = true;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = true;
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const handlePhotoChange = e => {
    const file = e.target.files[0];
    if (file) {
      setIsUploadingImage(true);
      
      // Simular un pequeño delay para mostrar el loading
      setTimeout(() => {
        const blob = URL.createObjectURL(file);
        setPreviewPhoto(blob);
        setImageFile(file);
        setIsUploadingImage(false);
      }, 500);
    }
  };
  const handleSubmit = async e => {
    e.preventDefault();
      // Validar campos antes de enviar
    if (!validateFields()) {
      setSnackbarMessage('Por favor, completa todos los campos requeridos');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (!user?._id) throw new Error('No autenticado');
      const apiUrl = import.meta.env.VITE_BACKEND_URL;
      const url = `${apiUrl}/usuarios/${user._id}/perfil`;

      const fd = new FormData();
      fd.append('nombre', formData.nombre);
      fd.append('email', formData.email);
      fd.append('telefono', formData.telefono);
      fd.append('direccion', formData.direccion);
      if (imageFile) fd.append('fotoPerfil', imageFile);

      // Paso 1: Guardamos los cambios en el servidor
      await axios.patch(url, fd, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Paso 2: Pedimos los datos nuevos al servidor
      const { data } = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Cache-Control': 'no-cache' // Evita el caché
        }
      });
      console.log("Datos obtenidos del servidor después de actualizar:", data);

      // Paso 3: Actualizamos directamente el perfil en el contexto
      updatePerfil(data);

      // Paso 4: Actualizamos el usuario en localStorage y auth
      const updatedUser = {
        ...user,
        nombre: data.nombre,
        email: data.email,
        telefono: data.telefono,
        direccion: data.direccion,
        fotoPerfil: data.fotoPerfil
      };
      console.log("Usuario actualizado para guardar en localStorage:", updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      login({ ...updatedUser, token: user.token });      setSnackbarMessage('¡Perfil actualizado con éxito!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      handleClose();

    } catch (err) {
      console.error("Error al guardar el perfil:", err);
      setSnackbarMessage(err.response?.data?.mensaje || 'Error al actualizar el perfil');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            bgcolor: "#fafafa",
            borderRadius: 3,
            boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
            p: 0,
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            textAlign: "center",
            fontWeight: "bold",
            fontSize: "1.25rem",
            borderBottom: "1px solid #e0e0e0",
            bgcolor: "#fff",
            py: 2,
            transition: "all 0.3s ease-in-out",
            "&:hover": { bgcolor: "#f5f5f5" }
          }}
        >
          Editar Perfil
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent
            sx={{
              px: 4,
              pt: 3,
              pb: 1,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              transition: "all 0.3s ease",
              "&:hover": { transform: "scale(1.01)" },
            }}
          >            <Box sx={{ 
              textAlign: "center", 
              position: "relative", 
              mb: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <motion.div 
                layoutId="profile-avatar"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    <Tooltip title="Cambiar foto de perfil" arrow>
                      <IconButton
                        component="label"
                        size="small"
                        disabled={isUploadingImage}
                        sx={{
                          bgcolor: "#1565C0",
                          color: "white",
                          width: 40,
                          height: 40,
                          boxShadow: "0 4px 12px rgba(21, 101, 192, 0.3)",
                          "&:hover": { 
                            bgcolor: "#125a9c",
                            transform: "scale(1.1)",
                            boxShadow: "0 6px 16px rgba(21, 101, 192, 0.4)",
                          },
                          "&:disabled": {
                            bgcolor: "#ccc",
                            color: "white"
                          },
                          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                      >
                        {isUploadingImage ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          <PhotoCamera fontSize="small" />
                        )}
                        <input 
                          hidden 
                          type="file" 
                          accept="image/*" 
                          onChange={handlePhotoChange}
                          disabled={isUploadingImage}
                        />
                      </IconButton>
                    </Tooltip>
                  }
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Avatar
                      src={previewPhoto}
                      sx={{
                        width: 140,
                        height: 140,
                        background: previewPhoto ? 'none' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                        border: "4px solid #fff",
                        fontSize: "3rem",
                        fontWeight: "bold",
                        color: "white",
                        position: "relative",
                        overflow: "hidden",
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: "linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)",
                          opacity: previewPhoto ? 0 : 1,
                          transition: "opacity 0.3s ease"
                        },
                        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                    >
                      {!previewPhoto && (
                        <PersonIcon sx={{ fontSize: "4rem", opacity: 0.9 }} />
                      )}
                    </Avatar>
                  </motion.div>
                </Badge>
              </motion.div>
              
              <AnimatePresence>
                {isUploadingImage && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Box sx={{ 
                      mt: 2, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      color: '#1565C0',
                      fontSize: '0.875rem'
                    }}>
                      <CircularProgress size={16} />
                      Cargando imagen...
                    </Box>
                  </motion.div>
                )}
              </AnimatePresence>
            </Box>            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <TextField
                name="nombre"
                label="Nombre completo"
                variant="outlined"
                value={formData.nombre}
                onChange={handleChange}
                fullWidth
                required
                error={fieldErrors.nombre}
                helperText={fieldErrors.nombre ? "El nombre es requerido" : ""}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccountCircleIcon sx={{ color: '#1565C0' }} />
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: 3,
                    bgcolor: "#fff",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#e0e0e0",
                      borderWidth: 2,
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#1565C0",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#1565C0",
                      borderWidth: 2,
                    },
                    "&.Mui-error .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#d32f2f",
                    },
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  },
                }}
                InputLabelProps={{
                  sx: {
                    color: "#666",
                    "&.Mui-focused": {
                      color: "#1565C0",
                    },
                    "&.Mui-error": {
                      color: "#d32f2f",
                    },
                  },
                }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <TextField
                name="email"
                label="Correo electrónico"
                variant="outlined"
                value={formData.email}
                onChange={handleChange}
                fullWidth
                required
                type="email"
                error={fieldErrors.email}
                helperText={fieldErrors.email ? "Ingresa un email válido" : ""}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: '#1565C0' }} />
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: 3,
                    bgcolor: "#fff",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#e0e0e0",
                      borderWidth: 2,
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#1565C0",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#1565C0",
                      borderWidth: 2,
                    },
                    "&.Mui-error .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#d32f2f",
                    },
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  },
                }}
                InputLabelProps={{
                  sx: {
                    color: "#666",
                    "&.Mui-focused": {
                      color: "#1565C0",
                    },
                    "&.Mui-error": {
                      color: "#d32f2f",
                    },
                  },
                }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
            >
              <TextField
                name="telefono"
                label="Número de teléfono"
                variant="outlined"
                value={formData.telefono}
                onChange={handleChange}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PhoneIcon sx={{ color: '#1565C0' }} />
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: 3,
                    bgcolor: "#fff",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#e0e0e0",
                      borderWidth: 2,
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#1565C0",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#1565C0",
                      borderWidth: 2,
                    },
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  },
                }}
                InputLabelProps={{
                  sx: {
                    color: "#666",
                    "&.Mui-focused": {
                      color: "#1565C0",
                    },
                  },
                }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
            >
              <TextField
                name="direccion"
                label="Dirección"
                variant="outlined"
                value={formData.direccion}
                onChange={handleChange}
                fullWidth
                multiline
                rows={2}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1 }}>
                      <LocationOnIcon sx={{ color: '#1565C0' }} />
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: 3,
                    bgcolor: "#fff",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#e0e0e0",
                      borderWidth: 2,
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#1565C0",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#1565C0",
                      borderWidth: 2,
                    },
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  },
                }}
                InputLabelProps={{
                  sx: {
                    color: "#666",
                    "&.Mui-focused": {
                      color: "#1565C0",
                    },
                  },
                }}
              />
            </motion.div>
          </DialogContent>          <DialogActions
            sx={{
              justifyContent: "space-between",
              bgcolor: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
              borderTop: "1px solid #e0e0e0",
              py: 3,
              px: 4,
              gap: 2,
            }}
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={handleClose}
                disabled={isSubmitting}
                startIcon={<CancelIcon />}
                sx={{
                  textTransform: "none",
                  borderRadius: 3,
                  px: 3,
                  py: 1.5,
                  fontSize: "1rem",
                  fontWeight: 500,
                  color: "#666",
                  bgcolor: "#fff",
                  border: "2px solid #e0e0e0",
                  minWidth: 120,
                  "&:hover": { 
                    bgcolor: "#f8f9fa",
                    borderColor: "#d0d0d0",
                    color: "#555",
                    transform: "translateY(-1px)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  },
                  "&:disabled": {
                    bgcolor: "#f5f5f5",
                    color: "#ccc",
                    borderColor: "#f0f0f0",
                  },
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                Cancelar
              </Button>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                type="submit"
                disabled={isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                variant="contained"
                sx={{
                  textTransform: "none",
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                  fontSize: "1rem",
                  fontWeight: 600,
                  minWidth: 140,
                  background: isSubmitting 
                    ? "linear-gradient(135deg, #90caf9 0%, #64b5f6 100%)" 
                    : "linear-gradient(135deg, #1565C0 0%, #0d47a1 100%)",
                  boxShadow: "0 4px 16px rgba(21, 101, 192, 0.3)",
                  "&:hover": { 
                    background: "linear-gradient(135deg, #0d47a1 0%, #0b3d91 100%)",
                    transform: "translateY(-2px)",
                    boxShadow: "0 8px 24px rgba(21, 101, 192, 0.4)",
                  },
                  "&:active": {
                    transform: "translateY(0px)",
                  },
                  "&:disabled": {
                    background: "linear-gradient(135deg, #90caf9 0%, #64b5f6 100%)",
                    color: "#fff",
                    boxShadow: "0 2px 8px rgba(21, 101, 192, 0.2)",
                  },
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              >
                {isSubmitting ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </motion.div>
          </DialogActions>
        </form>
      </Dialog>      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{
          "& .MuiSnackbarContent-root": {
            borderRadius: 3,
          }
        }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity}
          variant="filled"
          sx={{
            borderRadius: 3,
            fontWeight: 500,
            "& .MuiAlert-icon": {
              fontSize: "1.5rem"
            },
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default EditProfileDialog;