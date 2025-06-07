import React, { useState, useEffect, memo, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  TextField,
  Snackbar,
  Modal,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import Pagination from '@mui/material/Pagination';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DownloadIcon from '@mui/icons-material/Download';
import GetAppIcon from '@mui/icons-material/GetApp';
import { PDFService } from '../services/pdfGenerator';

// URLs base actualizadas
const BASE_URLS = {
  USUARIOS: import.meta.env.VITE_BACKEND_URL || 'https://backend-sena-lab-1-qpzp.onrender.com/api',
  MUESTRAS: import.meta.env.VITE_BACKEND_MUESTRAS_URL || 'https://backend-registro-muestras.onrender.com/api'
};

// URLs específicas actualizadas
const API_URLS = {
  USUARIOS: `${BASE_URLS.USUARIOS}/usuarios`,
  MUESTRAS: `${BASE_URLS.MUESTRAS}/api/muestras`,
  RESULTADOS: `${BASE_URLS.MUESTRAS}/api/ingreso-resultados`
};

const formatearFecha = (fecha) => {
  if (!fecha) return 'Fecha no disponible';
  
  // Si la fecha viene en el formato del backend
  if (typeof fecha === 'object' && fecha.fecha && fecha.hora) {
    return `${fecha.fecha} ${fecha.hora}`;
  }
  
  return 'Fecha inválida';
};

const ListaResultados = memo(() => {
  const navigate = useNavigate();
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [filterDate, setFilterDate] = useState('');
  const [selectedResult, setSelectedResult] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [observacionesVerificacion, setObservacionesVerificacion] = useState('');
  const [dialogoVerificacion, setDialogoVerificacion] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const debounceTimeout = useRef();

  // Memoizar handlers
  const handleSearchChange = useCallback((event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  }, []);

  const handleFilterEstadoChange = useCallback((event) => {
    setFilterEstado(event.target.value);
    setCurrentPage(1);
  }, []);

  const handleDateChange = useCallback((e) => {
    setFilterDate(e.target.value);
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((event, value) => {
    setCurrentPage(value);
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilterEstado('todos');
    setFilterDate('');
    setSearchTerm('');
    setCurrentPage(1);
  }, []);

  // Cargar resultados (memoizado)
  const cargarResultados = useCallback(async (page = 1, limit = 10, estado = filterEstado, search = searchTerm, date = filterDate) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      if (!token) {
        setError('No tienes autorización. Inicia sesión.');
        navigate('/login');
        return;
      }
      const userRole = userData.rol?.toLowerCase();
      if (!userRole || (userRole !== 'laboratorista' && userRole !== 'administrador')) {
        setError('No tienes autorización para ver esta página.');
        navigate('/login');
        return;
      }
      const params = {
        page,
        limit,
        ...(search.trim() && { search: search.trim() }),
        ...(estado !== 'todos' && { verificado: estado === 'finalizada' ? 'true' : 'false' }),
        ...(date && { fecha: date }),
      };
      const queryParams = new URLSearchParams(params).toString();
      const response = await axios.get(
        `${API_URLS.RESULTADOS}/resultados?${queryParams}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      if (response.data && response.data.data && response.data.data.data && response.data.data.pagination) {
        let filteredResultados = response.data.data.data;
        if (estado !== 'todos') {
          filteredResultados = filteredResultados.filter(resultado =>
            estado === 'finalizada' ? resultado.verificado : !resultado.verificado
          );
        }
        setResultados(filteredResultados);
        setPagination({
          page: response.data.data.pagination.currentPage,
          limit: response.data.data.pagination.limit,
          total: response.data.data.pagination.total,
          totalPages: response.data.data.pagination.totalPages,
        });
      } else {
        setResultados([]);
        setPagination({ page: 1, limit, total: 0, totalPages: 1 });
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError('Error al cargar los resultados. Por favor, intenta más tarde.');
      }
    } finally {
      setLoading(false);
    }
  }, [filterEstado, searchTerm, filterDate, navigate]);

  // Efecto único para cargar resultados al cambiar cualquier filtro, búsqueda o página
  useEffect(() => {
    clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      cargarResultados(currentPage, pagination.limit, filterEstado, searchTerm, filterDate);
    }, 400);
    return () => clearTimeout(debounceTimeout.current);
  }, [currentPage, filterEstado, filterDate, searchTerm]);

  // Handlers memoizados
  const handleFinalizarMuestra = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      if (userData.rol !== 'administrador') {
        setSnackbar({
          open: true,
          message: 'Solo el administrador puede finalizar muestras',
          severity: 'error'
        });
        return;
      }

      setVerificando(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URLS.RESULTADOS}/verificar/${selectedResult.idMuestra}`,
        { observaciones: observacionesVerificacion },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log("Respuesta de verificación:", response.data);

      if (response.data.success) {
        setDialogoVerificacion(false);
        setSelectedResult(null);
        setObservacionesVerificacion('');
        setSnackbar({
          open: true,
          message: 'Muestra finalizada correctamente',
          severity: 'success'
        });
        cargarResultados();
      }
    } catch (error) {
      console.error('Error al finalizar muestra:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error al finalizar la muestra',
        severity: 'error'
      });
    } finally {
      setVerificando(false);
    }
  };

  const handleVerDetalles = async (resultado) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URLS.RESULTADOS}/muestra/${resultado.idMuestra}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log("Detalles de la muestra:", response.data);

      if (response.data && response.data.data) {
        setSelectedResult(response.data.data);
      } else {
        console.warn("Estructura inesperada en la respuesta de detalles:", response.data);
        setSelectedResult(null);
      }
    } catch (err) {
      console.error('Error al obtener detalles de la muestra:', err);
      setSnackbar({
        open: true,
        message: 'Error al cargar los detalles de la muestra. Por favor, intenta más tarde.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handlers para PDF
  const handleVerPDFResultados = async (idMuestra) => {
    try {
      await PDFService.generarPDFResultados(idMuestra);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Error al generar el PDF de resultados',
        severity: 'error',
      });
    }
  };

  const handleDescargarPDFResultados = async (idMuestra) => {
    try {
      await PDFService.descargarPDFResultados(idMuestra);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.message || 'Error al descargar el PDF de resultados',
        severity: 'error',
      });
    }
  };

  const handleViewResultsPDF = async (resultado) => {
    try {
      await PDFService.generarPDFResultados(resultado.idMuestra || resultado._id);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al generar el PDF de resultados: ' + error.message,
        severity: 'error'
      });
    }
  };

  const handleDownloadResultsPDF = async (resultado) => {
    try {
      await PDFService.descargarPDFResultados(resultado.idMuestra || resultado._id);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Error al descargar el PDF de resultados: ' + error.message,
        severity: 'error'
      });
    }
  };

  // Componente reutilizable para iconos de acción con tooltip y efecto
  const ActionButton = ({ tooltip, onClick, IconComponent, color }) => (
    <Tooltip title={tooltip} placement="top" arrow>
      <IconButton
        onClick={e => {
          e.stopPropagation();
          onClick();
        }}
        sx={{
          transition: 'transform 0.2s',
          '&:hover': { transform: 'scale(1.1)', backgroundColor: 'rgba(57, 169, 0, 0.2)' },
          color: color || '#39A900',
        }}
      >
        <IconComponent />
      </IconButton>
    </Tooltip>
  );

  // Agregar estilos para la tabla en ListaResultados.jsx
  const tableStyles = {
    width: '100%',
    borderCollapse: 'collapse',
  };

  const rowStyles = {
    '&:nth-of-type(odd)': {
      backgroundColor: '#f1f8e9', // Color verde claro para filas impares
    },
    '&:nth-of-type(even)': {
      backgroundColor: 'white', // Color blanco para filas pares
    },
    '&:hover': {
      transform: 'scale(1.01)',
      backgroundColor: '#e0f7fa', // Color azul claro al pasar el mouse
      transition: 'transform 0.2s',
    },
  };

  return (
    <Paper sx={{ p: 4, margin: 'auto', maxWidth: 1200, mt: 4, bgcolor: 'background.paper', boxShadow: 6, borderRadius: 3 }}>
      <Typography variant="h4" align="center" gutterBottom sx={{ 
        color: '#39A900',
        fontWeight: 'bold',
        mb: 3
      }}>
        Lista de Resultados
      </Typography>

      {/* Filtros y búsqueda en tarjeta, igual que en Muestras */}
      <Paper elevation={3} sx={{ mb: 3, p: 2, borderRadius: 3, background: '#f9fbe7' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <Select
              value={filterEstado}
              onChange={handleFilterEstadoChange}
              fullWidth
              sx={{ background: 'white', borderRadius: 2, boxShadow: 1 }}
              displayEmpty
            >
              <MenuItem value="todos">Todos</MenuItem>
              <MenuItem value="finalizada">Finalizada</MenuItem>
              <MenuItem value="en analisis">En análisis</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              type="date"
              label="Filtrar por Fecha"
              fullWidth
              value={filterDate || ''}
              onChange={handleDateChange}
              InputLabelProps={{ shrink: true }}
              sx={{ background: 'white', borderRadius: 2, boxShadow: 1 }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Buscar por ID de muestra"
              variant="outlined"
              fullWidth
              value={searchTerm}
              onChange={handleSearchChange}
              sx={{ background: 'white', borderRadius: 2, boxShadow: 1 }}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button variant="outlined" fullWidth onClick={handleClearFilters} sx={{ borderColor: '#39A900', color: '#39A900', fontWeight: 'bold', borderRadius: 2, boxShadow: 1, '&:hover': { background: '#e8f5e9', borderColor: '#2d8000' } }}>
              Limpiar Filtros
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress sx={{ color: '#39A900' }} />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ maxWidth: '1800%' }}>
            <Table sx={tableStyles}>
              <TableHead sx={{ bgcolor: '#39A900' }}>
                <TableRow>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ID Muestra</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Cliente</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Última Actualización</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Estado</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {resultados.length === 0 && !loading ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No hay resultados para los filtros/búsqueda seleccionados.
                    </TableCell>
                  </TableRow>
                ) : (
                  resultados.map((resultado) => (
                    <TableRow 
                      key={resultado._id}
                      sx={rowStyles}
                    >
                      <TableCell>{resultado.idMuestra}</TableCell>
                      <TableCell>{resultado.cliente?.nombre || 'Sin nombre'}</TableCell>
                      <TableCell>
                        {resultado.updatedAt?.fecha && resultado.updatedAt?.hora 
                          ? `${resultado.updatedAt.fecha} ${resultado.updatedAt.hora}`
                          : formatearFecha(resultado.updatedAt)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={resultado.verificado ? "Finalizada" : "En análisis"}
                          color={resultado.verificado ? "success" : "primary"}
                          sx={{
                            bgcolor: resultado.verificado ? '#39A900' : '#1976D2',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: 15,
                            px: 2,
                            boxShadow: resultado.verificado ? '0 2px 8px 0 rgba(57,169,0,0.10)' : '0 2px 8px 0 rgba(25,118,210,0.10)'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }} onClick={e => e.stopPropagation()}>
                          <ActionButton
                            tooltip="Ver Detalles"
                            onClick={() => handleVerDetalles(resultado)}
                            IconComponent={VisibilityIcon}
                            color="#39A900"
                          />
                          {resultado.verificado && (
                            <>
                              <ActionButton
                                tooltip="Ver PDF Resultados"
                                onClick={() => handleViewResultsPDF(resultado)}
                                IconComponent={PictureAsPdfIcon}
                                color="#39A900"
                              />
                              <ActionButton
                                tooltip="Descargar PDF Resultados"
                                onClick={() => handleDownloadResultsPDF(resultado)}
                                IconComponent={GetAppIcon}
                                color="#39A900"
                              />
                            </>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {pagination.total > pagination.limit && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination
                count={pagination.totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                sx={{
                  '& .MuiPaginationItem-root': {
                    color: '#39A900',
                  },
                  '& .Mui-selected': {
                    backgroundColor: '#39A900',
                    color: 'white',
                    '&:hover': {
                      backgroundColor: '#2d8000',
                    }
                  }
                }}
              />
            </Box>
          )}

          <Modal
            open={selectedResult !== null}
            onClose={() => setSelectedResult(null)}
          >
            <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 800,
              bgcolor: 'background.paper',
              boxShadow: 24,
              p: 4,
              borderRadius: 2,
              maxHeight: '90vh',
              overflowY: 'auto',
              border: '2px solid #39A900'
            }}>
              {selectedResult && (
                <>
                  <Typography variant="h5" gutterBottom sx={{ color: '#39A900', textAlign: 'center', fontWeight: 'bold' }}>
                    Detalles del Resultado
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Paper sx={{ p: 2, bgcolor: '#f5f5f5', borderLeft: '5px solid #39A900' }}>
                        <Typography variant="h6" gutterBottom sx={{ color: '#39A900', fontWeight: 'bold' }}>
                          Información General
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography><strong>ID Muestra:</strong> {selectedResult.idMuestra}</Typography>
                            <Typography><strong>Cliente:</strong> {selectedResult.cliente?.nombre || 'Sin nombre'}</Typography>
                            <Typography><strong>Fecha:</strong> {formatearFecha(selectedResult.fechaHoraMuestreo)}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography><strong>Estado:</strong> <span style={{ color: selectedResult.verificado ? '#39A900' : '#1976D2', fontWeight: 'bold' }}>{selectedResult.verificado ? "Finalizada" : "En análisis"}</span></Typography>
                            <Typography><strong>Laboratorista:</strong> {selectedResult.nombreLaboratorista || 'No disponible'}</Typography>
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>

                    <Grid item xs={12}>
                      <Paper sx={{ p: 2, bgcolor: '#f5f5f5', borderLeft: '5px solid #39A900' }}>
                        <Typography variant="h6" gutterBottom sx={{ color: '#39A900', fontWeight: 'bold' }}>
                          Resultados de Análisis
                        </Typography>
                        <Grid container spacing={2}>
                          {Object.entries(selectedResult.resultados || {}).map(([key, value]) => (
                            <Grid item xs={6} key={key}>
                              <Typography>
                                <strong>{key}:</strong> {value.valor} {value.unidad || ''}
                              </Typography>
                            </Grid>
                          ))}
                        </Grid>
                      </Paper>
                    </Grid>

                    {selectedResult.verificado && (
                      <Grid item xs={12}>
                        <Paper sx={{ p: 2, bgcolor: '#f5f5f5', borderLeft: '5px solid #39A900' }}>
                          <Typography variant="h6" gutterBottom sx={{ color: '#39A900', fontWeight: 'bold' }}>
                            Observaciones de Verificación
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                            Verificado por: {selectedResult.historialCambios?.find(c => c.cambiosRealizados?.verificacion)?.nombre || 'No disponible'}
                          </Typography>
                          <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                            Fecha de verificación: {
                              (() => {
                                const cambioVerificacion = selectedResult.historialCambios?.find(c => c.cambiosRealizados?.verificacion);
                                return cambioVerificacion?.fecha?.fecha && cambioVerificacion?.fecha?.hora
                                  ? `${cambioVerificacion.fecha.fecha} ${cambioVerificacion.fecha.hora}`
                                  : 'No disponible'
                              })()
                            }
                          </Typography>
                          <Typography>
                            {selectedResult.historialCambios?.find(c => c.cambiosRealizados?.verificacion)?.observaciones || 'No hay observaciones disponibles'}
                          </Typography>
                        </Paper>
                      </Grid>
                    )}

                    {selectedResult.historialCambios?.length > 0 && (
                      <Grid item xs={12}>
                        <Paper sx={{ p: 2, bgcolor: '#f5f5f5', borderLeft: '5px solid #39A900' }}>
                          <Typography variant="h6" gutterBottom sx={{ color: '#39A900', fontWeight: 'bold' }}>
                            Historial de Cambios
                          </Typography>
                          {selectedResult.historialCambios.map((cambio, index) => (
                            <Box 
                              key={index} 
                              sx={{ 
                                mb: 2, 
                                p: 2, 
                                bgcolor: 'white', 
                                borderRadius: 1,
                                border: '1px solid #e0e0e0'
                              }}
                            >
                              <Grid container spacing={2}>
                                <Grid item xs={12}>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#39A900' }}>
                                    Cambio #{selectedResult.historialCambios.length - index}
                                  </Typography>
                                  <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                                    Realizado por: {cambio.nombre || 'No disponible'} | Fecha: {cambio.fecha?.fecha && cambio.fecha?.hora 
                                      ? `${cambio.fecha.fecha} ${cambio.fecha.hora}`
                                      : formatearFecha(cambio.fecha)}
                                  </Typography>
                                  <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }}>
                                    Observaciones: {cambio.observaciones || 'Sin observaciones'}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                  <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                      <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                                        <TableRow>
                                          <TableCell sx={{ fontWeight: 'bold' }}>Parámetro</TableCell>
                                          <TableCell sx={{ fontWeight: 'bold' }}>Valor Anterior</TableCell>
                                          <TableCell sx={{ fontWeight: 'bold' }}>Valor Nuevo</TableCell>
                                          <TableCell sx={{ fontWeight: 'bold' }}>Unidad</TableCell>
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        {cambio.cambiosRealizados?.resultados && Object.keys(cambio.cambiosRealizados.resultados).length > 0 ? (
                                          Object.entries(cambio.cambiosRealizados.resultados).map(([param, valores], i) => (
                                            <TableRow key={i}>
                                              <TableCell>{param}</TableCell>
                                              <TableCell>{valores.valorAnterior ?? 'No disponible'}</TableCell>
                                              <TableCell>{valores.valorNuevo ?? 'No disponible'}</TableCell>
                                              <TableCell>{valores.unidad || '-'}</TableCell>
                                            </TableRow>
                                          ))
                                        ) : cambio.cambiosRealizados?.verificacion && cambio.cambiosRealizados?.estado ? (
                                          <TableRow>
                                            <TableCell>Estado</TableCell>
                                            <TableCell>{cambio.cambiosRealizados.estado.anterior ?? 'No disponible'}</TableCell>
                                            <TableCell>{cambio.cambiosRealizados.estado.nuevo ?? 'No disponible'}</TableCell>
                                            <TableCell>-</TableCell>
                                          </TableRow>
                                        ) : (
                                          <TableRow>
                                            <TableCell colSpan={4}>No hay cambios registrados</TableCell>
                                          </TableRow>
                                        )}
                                      </TableBody>
                                    </Table>
                                  </TableContainer>
                                </Grid>
                              </Grid>
                            </Box>
                          ))}
                        </Paper>
                      </Grid>
                    )}
                  </Grid>

                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    {!selectedResult.verificado && JSON.parse(localStorage.getItem('user') || '{}').rol === 'administrador' && (
                      <Button
                        variant="contained"
                        onClick={() => setDialogoVerificacion(true)}
                        sx={{
                          backgroundColor: '#39A900',
                          '&:hover': { backgroundColor: '#2d8000' },
                          fontWeight: 'bold',
                          px: 3
                        }}
                      >
                        Finalizar
                      </Button>
                    )}
                    <Button 
                      variant="outlined"
                      onClick={() => setSelectedResult(null)}
                      sx={{ borderColor: '#39A900', color: '#39A900', fontWeight: 'bold', px: 3, '&:hover': { borderColor: '#2d8000', color: '#2d8000' } }}
                    >
                      Cerrar
                    </Button>
                  </Box>
                </>
              )}
            </Box>
          </Modal>

          <Dialog
            open={dialogoVerificacion}
            onClose={() => setDialogoVerificacion(false)}
          >
            <DialogTitle sx={{ color: '#39A900', fontWeight: 'bold' }}>Finalizar Muestra</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Por favor, ingrese las observaciones para finalizar la muestra:
              </DialogContentText>
              <TextField
                autoFocus
                margin="dense"
                label="Observaciones"
                type="text"
                fullWidth
                multiline
                rows={4}
                value={observacionesVerificacion}
                onChange={(e) => setObservacionesVerificacion(e.target.value)}
                sx={{ mt: 2, '& label.Mui-focused': { color: '#39A900' }, '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#39A900' } }}
              />
            </DialogContent>
            <DialogActions>
              <Button 
                onClick={() => setDialogoVerificacion(false)}
                color="inherit"
                sx={{ fontWeight: 'bold' }}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleFinalizarMuestra}
                variant="contained"
                disabled={verificando || !observacionesVerificacion.trim()}
                sx={{
                  backgroundColor: '#39A900',
                  '&:hover': { backgroundColor: '#2d8000' },
                  fontWeight: 'bold'
                }}
              >
                {verificando ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Finalizar'}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%', bgcolor: snackbar.severity === 'success' ? '#39A900' : undefined, color: snackbar.severity === 'success' ? 'white' : undefined }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
});

export default ListaResultados;