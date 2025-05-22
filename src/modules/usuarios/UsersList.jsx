// src/components/UsersList.jsx
import React, { useState, useEffect, useContext, memo } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  TextField,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Switch,
  IconButton,
  Box,
  Typography,
  Pagination,
  Snackbar,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { useNavigate } from "react-router-dom";
import AuthContext from "../../context/AuthContext";

const UsersList = memo(() => {
  const { tipoUsuario } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("todos");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editUser, setEditUser] = useState(null);
  const [openEdit, setOpenEdit] = useState(false);
  const [detailUser, setDetailUser] = useState(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const navigate = useNavigate();

  // Función auxiliar para obtener el nombre del rol
  const getRoleName = (user) => {
    if (!user || !user.rol) return "";
    return typeof user.rol === "string" ? user.rol : user.rol.name || "";
  };

  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No tienes permiso para acceder a esta información. Inicia sesión.");
        navigate("/login");
        return;
      }
      try {
        const response = await axios.get("https://backend-sena-lab-1-qpzp.onrender.com/api/usuarios", {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Aseguramos que response.data sea un array
        setUsers(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        } else {
          setError("Error al cargar los usuarios.");
          console.error("❌ Error en la solicitud:", error);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [navigate]);

  useEffect(() => {
    try {
      let visibleUsers = Array.isArray(users) ? [...users] : [];

      if (tipoUsuario === "laboratorista") {
        visibleUsers = visibleUsers.filter(
          (user) => getRoleName(user).toLowerCase() === "cliente"
        );
      } else if (tipoUsuario === "administrador") {
        visibleUsers = visibleUsers.filter((user) => {
          const role = getRoleName(user).toLowerCase();
          return role === "cliente" || role === "laboratorista";
        });
      } else if (tipoUsuario === "super_admin") {
        // Excluir usuarios con rol super_admin
        visibleUsers = visibleUsers.filter(
          (user) => getRoleName(user).toLowerCase() !== "super_admin"
        );
      }

      if (filterType !== "todos") {
        visibleUsers = visibleUsers.filter(
          (user) => getRoleName(user).toLowerCase() === filterType.toLowerCase()
        );
      }

      if (search.trim() !== "") {
        visibleUsers = visibleUsers.filter(
          (user) =>
            user.nombre?.toLowerCase().includes(search.toLowerCase()) ||
            (user.documento && user.documento.toString().includes(search))
        );
      }

      setFilteredUsers(visibleUsers);
      setPage(0);
    } catch (err) {
      console.error("Error en el filtrado:", err);
      setFilteredUsers([]);
    }
  }, [search, filterType, users, tipoUsuario]);

  const handleSearchChange = (e) => setSearch(e.target.value);
  const handleFilterChange = (e) => setFilterType(e.target.value);
  const handleEditClick = (user) => {
    setEditUser(user);
    setOpenEdit(true);
  };
  const handleCloseEdit = () => {
    setOpenEdit(false);
    setEditUser(null);
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };

  const handleEditSubmit = async () => {
    const token = localStorage.getItem("token");
    if (!editUser || !editUser._id) {
      setSnackbarMessage("No se encontró el usuario a editar.");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }
    const datosActualizados = {
      nombre: editUser.nombre,
      documento: editUser.documento,
      telefono: editUser.telefono,
      direccion: editUser.direccion,
      email: editUser.email,
    };
    try {
      await axios.put(
        `https://backend-sena-lab-1-qpzp.onrender.com/api/usuarios/${editUser._id}`,
        datosActualizados,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );
      setUsers(
        users.map((user) =>
          user._id === editUser._id ? { ...user, ...datosActualizados } : user
        )
      );
      handleCloseEdit();
    } catch (error) {
      console.error("❌ Error al actualizar usuario:", error);
      setSnackbarMessage(
        error.response?.data?.message || "Error al actualizar usuario."
      );
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleToggleActivo = async (userId, nuevoEstado) => {
    const token = localStorage.getItem("token");
    try {
      await axios.put(
        `https://backend-sena-lab-1-qpzp.onrender.com/api/usuarios/${userId}/estado`,
        { activo: nuevoEstado },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );
      setUsers(
        users.map((user) =>
          user._id === userId ? { ...user, activo: nuevoEstado } : user
        )
      );
      setSnackbarMessage(`Usuario ${nuevoEstado ? "activado" : "desactivado"} con éxito.`);
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("❌ Error al actualizar el estado:", error);
      setSnackbarMessage(
        error.response?.data?.message || "Error al actualizar el estado del usuario."
      );
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleRowClick = (user) => {
    setDetailUser(user);
    setOpenDetail(true);
  };

  const handleCloseDetail = () => {
    setOpenDetail(false);
    setDetailUser(null);
  };

  if (loading) {
    return <CircularProgress style={{ display: "block", margin: "20px auto" }} />;
  }
  if (error) {
    return <Alert severity="error" style={{ margin: "20px" }}>{error}</Alert>;
  }

  // Se actualiza el select de opciones para que el rol super_admin no sea listado para el super administrador
  const getFilterOptions = () => {
    if (tipoUsuario === "laboratorista") return ["cliente"];
    if (tipoUsuario === "administrador") return ["cliente", "laboratorista"];
    if (tipoUsuario === "super_admin") return ["cliente", "laboratorista", "administrador"];
    return ["cliente", "laboratorista", "administrador", "super_admin"];
  };

  // Paleta de colores personalizada
  const primaryColor = "#39A900";
  const secondaryColor = "#F5F5F5";
  const accentColor = "#1A1A1A";

  return (
    <Paper elevation={4} sx={{ p: 3, mt: 4, borderRadius: 4, background: secondaryColor, boxShadow: "0 6px 24px 0 rgba(57,169,0,0.10)" }}>
      {/* Encabezado atractivo */}
      <Box display="flex" alignItems="center" mb={3} gap={2}>
        <Box sx={{ background: primaryColor, borderRadius: "50%", p: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <EditIcon sx={{ color: "white", fontSize: 32 }} />
        </Box>
        <Typography variant="h4" fontWeight={700} color={primaryColor} letterSpacing={1}>
          Gestión de Usuarios
        </Typography>
      </Box>

      {/* Filtros y búsqueda en tarjeta, igual que en Muestras */}
      <Paper elevation={3} sx={{ mb: 3, p: 2, borderRadius: 3, background: '#f9fbe7' }}>
        <Box display="flex" flexDirection={{ xs: "column", md: "row" }} gap={2} alignItems="center">
          <Select
            value={filterType}
            onChange={handleFilterChange}
            fullWidth
            variant="outlined"
            sx={{ minWidth: 180, background: "white", borderRadius: 2, boxShadow: 1 }}
            displayEmpty
          >
            <MenuItem value="todos">Todos</MenuItem>
            {getFilterOptions().map((rol) => (
              <MenuItem key={rol} value={rol}>
                {rol.charAt(0).toUpperCase() + rol.slice(1)}
              </MenuItem>
            ))}
          </Select>
          <TextField
            label="Buscar usuario (nombre o documento)"
            variant="outlined"
            fullWidth
            sx={{ background: "white", borderRadius: 2, boxShadow: 1 }}
            value={search}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <EditIcon sx={{ color: primaryColor, mr: 1 }} />
              ),
            }}
          />
          <Button variant="outlined" fullWidth onClick={() => { setFilterType('todos'); setSearch(''); }} sx={{ borderColor: primaryColor, color: primaryColor, fontWeight: 'bold', borderRadius: 2, boxShadow: 1, '&:hover': { background: '#e8f5e9', borderColor: '#2d8000' } }}>
            Limpiar Filtros
          </Button>
        </Box>
      </Paper>

      {/* Tabla de usuarios */}
      <TableContainer sx={{ borderRadius: 3, boxShadow: 2, background: "white" }}>
        <Table>
          <TableHead>
            <TableRow sx={{ background: primaryColor }}>
              <TableCell sx={{ color: "white", fontWeight: "bold", fontSize: 16 }}>Nombre</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold", fontSize: 16 }}>Documento</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold", fontSize: 16 }}>Teléfono</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold", fontSize: 16 }}>Dirección</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold", fontSize: 16 }}>Email</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold", fontSize: 16 }}>Rol</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold", fontSize: 16 }}>Activo</TableCell>
              {tipoUsuario !== "laboratorista" && (
                <TableCell sx={{ color: "white", fontWeight: "bold", fontSize: 16 }}>Acciones</TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((user, idx) => (
                <TableRow
                  key={user._id}
                  onClick={() => handleRowClick(user)}
                  sx={{
                    background: idx % 2 === 0 ? secondaryColor : "#fff",
                    transition: "box-shadow 0.2s, transform 0.2s",
                    cursor: "pointer",
                    '&:hover': {
                      boxShadow: `0 2px 12px 0 ${primaryColor}33`,
                      transform: "scale(1.01)",
                    },
                  }}
                >
                  <TableCell>{user.nombre}</TableCell>
                  <TableCell>{user.documento}</TableCell>
                  <TableCell>{user.telefono}</TableCell>
                  <TableCell>{user.direccion}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getRoleName(user)}</TableCell>
                  <TableCell>
                    <Typography fontWeight={600} color={user.activo ? primaryColor : "error"}>
                      {user.activo ? "Sí" : "No"}
                    </Typography>
                  </TableCell>
                  {tipoUsuario !== "laboratorista" && (
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        {tipoUsuario === "super_admin" && (
                          <>
                            <Switch
                              checked={user.activo}
                              onChange={() => handleToggleActivo(user._id, !user.activo)}
                              color="success"
                              onClick={(e) => e.stopPropagation()}
                              sx={{
                                '& .MuiSwitch-thumb': { backgroundColor: user.activo ? primaryColor : "#ccc" },
                              }}
                            />
                            {getRoleName(user).toLowerCase() === "administrador" && (
                              <IconButton
                                color="primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditClick(user);
                                }}
                                sx={{ background: "#e3f2fd", borderRadius: 2 }}
                              >
                                <EditIcon />
                              </IconButton>
                            )}
                          </>
                        )}
                        {tipoUsuario === "administrador" &&
                          getRoleName(user).toLowerCase() !== "administrador" &&
                          getRoleName(user).toLowerCase() !== "super_admin" && (
                            <IconButton
                              color="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditClick(user);
                              }}
                              sx={{ background: "#e8f5e9", borderRadius: 2 }}
                            >
                              <EditIcon />
                            </IconButton>
                          )}
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Paginación (estilo clásico) */}
      {filteredUsers.length > rowsPerPage && (
        <Box style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
          <Pagination
            count={Math.ceil(filteredUsers.length / rowsPerPage)}
            page={page + 1}
            onChange={(event, value) => setPage(value - 1)}
            color="primary"
            style={{ color: primaryColor }}
          />
        </Box>
      )}

      {/* Diálogo de edición */}
      <Dialog open={openEdit} onClose={handleCloseEdit} PaperProps={{ sx: { borderRadius: 4, minWidth: 350 } }}>
        <DialogTitle sx={{ color: primaryColor, fontWeight: 700, textAlign: "center" }}>Editar Usuario</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2}>
            {["nombre", "documento", "telefono", "direccion", "email"].map((field) => (
              <TextField
                key={field}
                fullWidth
                margin="dense"
                label={field.charAt(0).toUpperCase() + field.slice(1)}
                value={editUser?.[field] || ""}
                onChange={(e) => setEditUser({ ...editUser, [field]: e.target.value })}
                variant="outlined"
                sx={{ borderRadius: 2, background: "#f9f9f9" }}
              />
            ))}
            {getRoleName(editUser) && (
              <TextField
                fullWidth
                margin="dense"
                label="Rol"
                value={getRoleName(editUser)}
                InputProps={{ readOnly: true }}
                variant="outlined"
                sx={{ borderRadius: 2, background: "#f9f9f9" }}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
          <Button onClick={handleCloseEdit} sx={{ color: accentColor, fontWeight: 600 }}>Cancelar</Button>
          <Button onClick={handleEditSubmit} variant="contained" sx={{ background: primaryColor, fontWeight: 700, px: 4 }}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de detalle */}
      <Dialog open={openDetail} onClose={handleCloseDetail} PaperProps={{ sx: { borderRadius: 4, minWidth: 350 } }}>
        <DialogTitle sx={{ color: primaryColor, fontWeight: 700, textAlign: "center" }}>Detalle del Usuario</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ border: `1px solid ${primaryColor}33`, borderRadius: 3, p: 2, background: "#f9f9f9" }}>
            <Typography variant="h6" align="center" color={primaryColor} fontWeight={700}>
              {detailUser?.nombre}
            </Typography>
            <Box mt={2} display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }} gap={1.5}>
              <Typography variant="body2"><strong>Documento:</strong> {detailUser?.documento}</Typography>
              <Typography variant="body2"><strong>Teléfono:</strong> {detailUser?.telefono}</Typography>
              <Typography variant="body2"><strong>Dirección:</strong> {detailUser?.direccion}</Typography>
              <Typography variant="body2"><strong>Email:</strong> {detailUser?.email}</Typography>
              <Typography variant="body2"><strong>Rol:</strong> {getRoleName(detailUser)}</Typography>
              <Typography variant="body2"><strong>Activo:</strong> {detailUser?.activo ? "Sí" : "No"}</Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 2 }}>
          <Button onClick={handleCloseDetail} sx={{ color: accentColor, fontWeight: 600 }}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar de notificaciones */}
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: "100%", borderRadius: 2, fontWeight: 600 }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
});

export default UsersList;
