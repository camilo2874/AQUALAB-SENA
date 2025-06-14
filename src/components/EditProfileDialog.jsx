import React, { useState, useContext, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Box, Avatar, IconButton, Snackbar 
} from '@mui/material';
import { motion } from 'framer-motion';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import AuthContext from '../context/AuthContext';
import axios from 'axios';

const EditProfileDialog = ({ open, handleClose }) => {
  const { user, perfil, login, updatePerfil } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

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
  };

  const handlePhotoChange = e => {
    const file = e.target.files[0];
    if (file) {
      const blob = URL.createObjectURL(file);
      setPreviewPhoto(blob);
      setImageFile(file);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
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
      login({ ...updatedUser, token: user.token });

      setSnackbarMessage('¡Perfil actualizado con éxito!');
      setSnackbarOpen(true);
      handleClose();

    } catch (err) {
      console.error("Error al guardar el perfil:", err);
      alert(err.response?.data?.mensaje || err.message);
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
          >
            <Box sx={{ textAlign: "center", position: "relative" }}>
              <motion.div layoutId="profile-avatar">
                <Avatar
                  src={previewPhoto}
                  sx={{
                    width: 120,
                    height: 120,
                    m: "0 auto",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    transition: "transform 0.3s ease",
                    "&:hover": { transform: "scale(1.05)" },
                  }}
                >
                  {formData.nombre.charAt(0).toUpperCase()}
                </Avatar>
                <IconButton
                  component="label"
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    right: "calc(50% - 60px)",
                    bgcolor: "#fff",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    "&:hover": { bgcolor: "#f0f0f0", cursor: "pointer" },
                    transition: "background-color 0.3s ease",
                  }}
                >
                  <PhotoCamera />
                  <input hidden type="file" accept="image/*" onChange={handlePhotoChange}/>
                </IconButton>
              </motion.div>
            </Box>

            <TextField
              name="nombre"
              label="Nombre"
              variant="outlined"
              value={formData.nombre}
              onChange={handleChange}
              fullWidth
              required
              InputProps={{
                sx: {
                  borderRadius: 2,
                  bgcolor: "#fff",
                  "&:focus": { borderColor: "#1565C0" },
                  transition: "border-color 0.3s ease",
                },
              }}
            />

            <TextField
              name="email"
              label="Email"
              variant="outlined"
              value={formData.email}
              onChange={handleChange}
              fullWidth
              required
              InputProps={{
                sx: {
                  borderRadius: 2,
                  bgcolor: "#fff",
                  "&:focus": { borderColor: "#1565C0" },
                  transition: "border-color 0.3s ease",
                },
              }}
            />

            <TextField
              name="telefono"
              label="Teléfono"
              variant="outlined"
              value={formData.telefono}
              onChange={handleChange}
              fullWidth
              InputProps={{
                sx: {
                  borderRadius: 2,
                  bgcolor: "#fff",
                  "&:focus": { borderColor: "#1565C0" },
                  transition: "border-color 0.3s ease",
                },
              }}
            />

            <TextField
              name="direccion"
              label="Dirección"
              variant="outlined"
              value={formData.direccion}
              onChange={handleChange}
              fullWidth
              InputProps={{
                sx: {
                  borderRadius: 2,
                  bgcolor: "#fff",
                  "&:focus": { borderColor: "#1565C0" },
                  transition: "border-color 0.3s ease",
                },
              }}
            />
          </DialogContent>

          <DialogActions
            sx={{
              justifyContent: "center",
              bgcolor: "#fff",
              borderTop: "1px solid #e0e0e0",
              py: 2,
              transition: "all 0.3s ease",
            }}
          >
            <Button
              onClick={handleClose}
              disabled={isSubmitting}
              sx={{
                textTransform: "none",
                borderRadius: 2,
                color: "#555",
                mr: 2,
                "&:hover": { bgcolor: "#f5f5f5" },
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              variant="contained"
              sx={{
                textTransform: "none",
                borderRadius: 2,
                px: 4,
                bgcolor: "#1565C0",
                "&:hover": { bgcolor: "#125a9c" },
                transition: "background-color 0.3s ease",
              }}
            >
              {isSubmitting ? "Guardando..." : "Guardar"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </>
  );
};

export default EditProfileDialog;