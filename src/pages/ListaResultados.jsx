import React, { useState, useEffect, memo, useCallback, useRef, useMemo } from 'react';
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
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import { PDFService } from '../services/pdfGenerator';

// Debounce para búsqueda eficiente
function useDebouncedValue(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

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
  const [filteredResultados, setFilteredResultados] = useState([]);
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

  // Debounce para búsqueda eficiente
  const debouncedSearch = useDebouncedValue(searchTerm, 400);
  const firstNoResultRef = useRef(null);
  // Memoizar handlers
  const handleSearchChange = useCallback((event) => {
    setSearchTerm(event.target.value);
  }, []);

  const handleFilterEstadoChange = useCallback((event) => {
    setFilterEstado(event.target.value);
  }, []);

  const handleDateChange = useCallback((e) => {
    setFilterDate(e.target.value);
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
  // Función para obtener todos los resultados (sin filtros del servidor)
  const cargarTodosLosResultados = useCallback(async () => {
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

      // Obtener todos los resultados sin filtros para poder filtrar localmente
      const params = {
        page: 1,
        limit: 1000, // Obtener un número grande para tener todos los resultados
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
      
      if (response.data && response.data.data && response.data.data.data) {
        setResultados(Array.isArray(response.data.data.data) ? response.data.data.data : []);
      } else {
        setResultados([]);
      }
      
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError('Error al cargar los resultados. Por favor, intenta más tarde.');
      }
      setResultados([]);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Cargar resultados al inicio
  useEffect(() => {
    cargarTodosLosResultados();
  }, [cargarTodosLosResultados]);

  // Filtrar resultados localmente cuando cambien los filtros
  useEffect(() => {
    try {
      let filtered = Array.isArray(resultados) ? [...resultados] : [];

      // Filtrar por estado
      if (filterEstado !== 'todos') {
        filtered = filtered.filter((resultado) => {
          if (filterEstado === 'finalizada') {
            return resultado.verificado === true;
          } else if (filterEstado === 'en analisis') {
            return resultado.verificado === false;
          }
          return true;
        });
      }

      // Filtrar por fecha
      if (filterDate.trim() !== "") {
        filtered = filtered.filter((resultado) => {
          if (!resultado.updatedAt) return false;
          
          let fechaResultado = '';
          if (resultado.updatedAt.fecha) {
            fechaResultado = resultado.updatedAt.fecha;
          } else if (typeof resultado.updatedAt === 'string') {
            // Si es una fecha ISO, convertirla
            const date = new Date(resultado.updatedAt);
            if (!isNaN(date)) {
              const day = String(date.getDate()).padStart(2, '0');
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const year = date.getFullYear();
              fechaResultado = `${day}/${month}/${year}`;
            }
          }
          
          // Convertir fecha de filtro de YYYY-MM-DD a DD/MM/YYYY
          const [year, month, day] = filterDate.split("-");
          const fechaFiltro = `${day}/${month}/${year}`;
          
          return fechaResultado === fechaFiltro;
        });
      }

      // Filtrar por búsqueda con debounce
      if (debouncedSearch.trim() !== "") {
        filtered = filtered.filter((resultado) => {
          const searchTerm = debouncedSearch.toLowerCase();
          const idMuestra = (resultado.idMuestra || "").toString().toLowerCase();
          const cliente = (resultado.cliente?.nombre || "").toLowerCase();
          
          return idMuestra.includes(searchTerm) || cliente.includes(searchTerm);
        });
      }

      setFilteredResultados(filtered);
      
      // Actualizar paginación
      const totalItems = filtered.length;
      const totalPages = Math.ceil(totalItems / pagination.limit);
      setPagination(prev => ({
        ...prev,
        total: totalItems,
        totalPages: totalPages,
        page: currentPage > totalPages ? 1 : currentPage
      }));

      // Enfocar en mensaje de "no resultados" si no hay resultados
      if (filtered.length === 0 && firstNoResultRef.current) {
        firstNoResultRef.current.focus();
      }
    } catch (err) {
      console.error("Error al filtrar resultados:", err);
      setFilteredResultados([]);
    }
  }, [debouncedSearch, filterEstado, filterDate, resultados, pagination.limit, currentPage]);  // Ajustar la página actual cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [filterEstado, filterDate, debouncedSearch]);

  // Obtener resultados para la página actual
  const paginatedResultados = useMemo(() => {
    const startIndex = (currentPage - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    return filteredResultados.slice(startIndex, endIndex);
  }, [filteredResultados, currentPage, pagination.limit]);

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
        setObservacionesVerificacion('');        setSnackbar({
          open: true,
          message: 'Muestra finalizada correctamente',
          severity: 'success'
        });
        cargarTodosLosResultados(); // Recargar todos los resultados
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
  // Componente reutilizable para iconos de acción con tooltip y efecto mejorado
  const ActionButton = ({ tooltip, onClick, IconComponent, color = '#39A900', variant = 'default' }) => {
    const getButtonStyles = () => {
      const baseStyles = {
        transition: 'all 0.3s ease',
        borderRadius: 2,
        p: 1,
        minWidth: 36,
        minHeight: 36,
        '&:hover': {
          transform: 'scale(1.1)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }
      };

      switch (variant) {
        case 'view':
          return {
            ...baseStyles,
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            color: '#2196F3',
            border: '1px solid rgba(33, 150, 243, 0.3)',
            '&:hover': {
              ...baseStyles['&:hover'],
              backgroundColor: 'rgba(33, 150, 243, 0.2)',
              borderColor: '#2196F3',
            }
          };
        case 'pdf':
          return {
            ...baseStyles,
            backgroundColor: 'rgba(255, 87, 34, 0.1)',
            color: '#FF5722',
            border: '1px solid rgba(255, 87, 34, 0.3)',
            '&:hover': {
              ...baseStyles['&:hover'],
              backgroundColor: 'rgba(255, 87, 34, 0.2)',
              borderColor: '#FF5722',
            }
          };
        case 'download':
          return {
            ...baseStyles,
            backgroundColor: 'rgba(57, 169, 0, 0.1)',
            color: '#39A900',
            border: '1px solid rgba(57, 169, 0, 0.3)',
            '&:hover': {
              ...baseStyles['&:hover'],
              backgroundColor: 'rgba(57, 169, 0, 0.2)',
              borderColor: '#39A900',
            }
          };
        default:
          return {
            ...baseStyles,
            backgroundColor: `rgba(${color === '#39A900' ? '57, 169, 0' : '33, 150, 243'}, 0.1)`,
            color: color,
            border: `1px solid rgba(${color === '#39A900' ? '57, 169, 0' : '33, 150, 243'}, 0.3)`,
            '&:hover': {
              ...baseStyles['&:hover'],
              backgroundColor: `rgba(${color === '#39A900' ? '57, 169, 0' : '33, 150, 243'}, 0.2)`,
            }
          };
      }
    };

    return (
      <Tooltip title={tooltip} placement="top" arrow>
        <IconButton
          onClick={e => {
            e.stopPropagation();
            onClick();
          }}
          sx={getButtonStyles()}
        >
          <IconComponent />
        </IconButton>
      </Tooltip>
    );
  };
  // Estilos mejorados para la tabla
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
      transition: 'all 0.3s ease',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      cursor: 'pointer'
    },
    transition: 'all 0.2s ease',
  };

  return (    <Paper sx={{ p: 4, margin: 'auto', maxWidth: 1390, mt: 4, bgcolor: 'background.paper', boxShadow: 6, borderRadius: 4 }}>
      {/* Encabezado con ícono */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ 
          color: '#39A900',
          fontWeight: 'bold',
          flex: 1
        }}>
          Lista de Resultados
        </Typography>
        <Tooltip title="Actualizar tabla" placement="left" arrow>
          <IconButton
            onClick={() => {
              setLoading(true);
              cargarTodosLosResultados();
            }}
            sx={{
              backgroundColor: '#39A900',
              color: 'white',
              borderRadius: 2,
              p: 1.5,
              '&:hover': {
                backgroundColor: '#2d8000',
                transform: 'scale(1.1)',
              },
              transition: 'all 0.2s ease',
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Cinta decorativa */}
      <Box sx={{ height: 6, width: 120, background: 'linear-gradient(90deg, #39A900 60%, #b2dfdb 100%)', borderRadius: 3, mb: 3 }} />

      {/* Filtros y búsqueda en tarjeta */}
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
              <MenuItem value="todos">Todos los estados</MenuItem>
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
              label="Buscar (ID de muestra o Cliente)"
              variant="outlined"
              fullWidth
              value={searchTerm}
              onChange={handleSearchChange}
              sx={{ background: 'white', borderRadius: 2, boxShadow: 1 }}
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ color: '#39A900', mr: 1 }} />
                ),
              }}
              inputProps={{ 'aria-label': 'Buscar resultado' }}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button 
              variant="outlined" 
              fullWidth 
              onClick={handleClearFilters} 
              sx={{ 
                borderColor: '#39A900', 
                color: '#39A900', 
                fontWeight: 'bold', 
                borderRadius: 2, 
                boxShadow: 1, 
                '&:hover': { 
                  background: '#e8f5e9', 
                  borderColor: '#2d8000' 
                } 
              }}
              disabled={filterEstado === 'todos' && !filterDate && !searchTerm}
            >
              Limpiar Filtros
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress sx={{ color: '#39A900' }} />
        </Box>
      ) : (        <>
          <Paper elevation={2} sx={{ borderRadius: 3, boxShadow: 3, overflow: 'auto', minWidth: 1100 }}>
            <TableContainer sx={{ minWidth: 1100 }}>
              <Table sx={tableStyles}>
                <TableHead sx={{ bgcolor: '#39A900' }}>
                  <TableRow>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>ID Muestra</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Cliente</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Última Actualización</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Estado</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', fontSize: 16, width: 180, minWidth: 160 }}>Acciones</TableCell>
                </TableRow>
              </TableHead><TableBody>
                {paginatedResultados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography ref={firstNoResultRef} tabIndex={-1} sx={{ color: 'text.secondary', fontWeight: 600, fontSize: 18 }}>
                        No hay resultados que coincidan con la búsqueda o filtros.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedResultados.map((resultado) => (
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
                      </TableCell>                      <TableCell>
                        <Chip
                          label={resultado.verificado ? "Finalizada" : "En análisis"}
                          color={resultado.verificado ? "success" : "primary"}
                          sx={{
                            bgcolor: resultado.verificado ? '#39A900' : '#1976D2',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: 14,
                            px: 2,
                            py: 0.5,
                            borderRadius: 3,
                            boxShadow: resultado.verificado 
                              ? '0 2px 8px 0 rgba(57,169,0,0.15)' 
                              : '0 2px 8px 0 rgba(25,118,210,0.15)',
                            '&:hover': {
                              transform: 'scale(1.05)',
                              transition: 'transform 0.2s ease'
                            }
                          }}
                        />
                      </TableCell><TableCell sx={{ width: 180, minWidth: 160 }}>
                        <Box 
                          sx={{ 
                            display: 'flex', 
                            gap: 1, 
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            flexWrap: 'wrap'
                          }} 
                          onClick={e => e.stopPropagation()}
                        >
                          <ActionButton
                            tooltip="Ver Detalles"
                            onClick={() => handleVerDetalles(resultado)}
                            IconComponent={VisibilityIcon}
                            variant="view"
                          />
                          {resultado.verificado ? (
                            <>
                              <ActionButton
                                tooltip="Ver PDF Resultados"
                                onClick={() => handleViewResultsPDF(resultado)}
                                IconComponent={PictureAsPdfIcon}
                                variant="pdf"
                              />
                              <ActionButton
                                tooltip="Descargar PDF Resultados"
                                onClick={() => handleDownloadResultsPDF(resultado)}
                                IconComponent={GetAppIcon}
                                variant="download"
                              />
                            </>
                          ) : (
                            <Chip
                              label="En proceso"
                              size="small"
                              sx={{
                                backgroundColor: 'rgba(255, 193, 7, 0.1)',
                                color: '#FFC107',
                                border: '1px solid rgba(255, 193, 7, 0.3)',
                                fontSize: '0.75rem',
                                fontWeight: 'bold'
                              }}
                            />
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>            </Table>
          </TableContainer>
          </Paper>

          {pagination.totalPages > 1 && (
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
          )}          <Modal
            open={selectedResult !== null}
            onClose={() => setSelectedResult(null)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box sx={{
              width: { xs: '95%', sm: '90%', md: 900 },
              maxWidth: 1000,
              bgcolor: 'background.paper',
              borderRadius: 4,
              maxHeight: '95vh',
              overflowY: 'auto',
              position: 'relative',
              background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)',
              border: '1px solid rgba(57, 169, 0, 0.1)',
            }}>
              {selectedResult && (
                <>
                  {/* Header con gradiente y botón de cerrar */}
                  <Box sx={{
                    background: 'linear-gradient(135deg, #39A900 0%, #4CAF50 100%)',
                    borderRadius: '16px 16px 0 0',
                    p: 3,
                    position: 'relative',
                    color: 'white',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: '100px',
                      height: '100px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '50%',
                      transform: 'translate(30px, -30px)',
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      width: '60px',
                      height: '60px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      borderRadius: '50%',
                      transform: 'translate(-20px, 20px)',
                    }
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="h4" sx={{ 
                          fontWeight: 'bold', 
                          mb: 1,
                          textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                          Detalles del Análisis
                        </Typography>
                        <Typography variant="subtitle1" sx={{ 
                          opacity: 0.9,
                          fontSize: '1.1rem'
                        }}>
                          Muestra #{selectedResult.idMuestra}
                        </Typography>
                      </Box>
                      <IconButton
                        onClick={() => setSelectedResult(null)}
                        sx={{
                          color: 'white',
                          backgroundColor: 'rgba(255, 255, 255, 0.2)',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 255, 255, 0.3)',
                            transform: 'scale(1.1)',
                          },
                          transition: 'all 0.2s ease',
                          zIndex: 1,
                        }}
                      >
                        <CloseIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  <Box sx={{ p: 4 }}>
                    {/* Estado badge mejorado */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                      <Chip
                        label={selectedResult.verificado ? "✓ Análisis Finalizado" : "⏳ En Proceso"}
                        sx={{
                          backgroundColor: selectedResult.verificado ? '#39A900' : '#FF9800',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '1rem',
                          px: 2,
                          py: 1,
                          borderRadius: 3,
                          boxShadow: selectedResult.verificado 
                            ? '0 4px 12px rgba(57, 169, 0, 0.3)' 
                            : '0 4px 12px rgba(255, 152, 0, 0.3)',
                        }}
                      />
                    </Box>

                    <Grid container spacing={3}>
                      {/* Información General - Card mejorada */}
                      <Grid item xs={12}>
                        <Paper elevation={2} sx={{ 
                          p: 3, 
                          borderRadius: 3,
                          background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
                          border: '1px solid rgba(57, 169, 0, 0.1)',
                          position: 'relative',
                          overflow: 'hidden',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '4px',
                            height: '100%',
                            background: 'linear-gradient(180deg, #39A900 0%, #4CAF50 100%)',
                          }
                        }}>
                          <Typography variant="h6" sx={{ 
                            color: '#39A900', 
                            fontWeight: 'bold',
                            mb: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}>
                            📋 Información General
                          </Typography>
                          <Grid container spacing={3}>
                            <Grid item xs={12} sm={6}>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box sx={{ 
                                  p: 2, 
                                  backgroundColor: 'rgba(57, 169, 0, 0.05)', 
                                  borderRadius: 2,
                                  border: '1px solid rgba(57, 169, 0, 0.1)'
                                }}>
                                  <Typography variant="body2" sx={{ color: '#666', fontSize: '0.85rem', mb: 0.5 }}>
                                    ID DE MUESTRA
                                  </Typography>
                                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#39A900' }}>
                                    {selectedResult.idMuestra}
                                  </Typography>
                                </Box>
                                <Box sx={{ 
                                  p: 2, 
                                  backgroundColor: 'rgba(33, 150, 243, 0.05)', 
                                  borderRadius: 2,
                                  border: '1px solid rgba(33, 150, 243, 0.1)'
                                }}>
                                  <Typography variant="body2" sx={{ color: '#666', fontSize: '0.85rem', mb: 0.5 }}>
                                    CLIENTE
                                  </Typography>
                                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1976D2' }}>
                                    {selectedResult.cliente?.nombre || 'Sin nombre'}
                                  </Typography>
                                </Box>
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <Box sx={{ 
                                  p: 2, 
                                  backgroundColor: 'rgba(156, 39, 176, 0.05)', 
                                  borderRadius: 2,
                                  border: '1px solid rgba(156, 39, 176, 0.1)'
                                }}>
                                  <Typography variant="body2" sx={{ color: '#666', fontSize: '0.85rem', mb: 0.5 }}>
                                    FECHA DE MUESTREO
                                  </Typography>
                                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#9C27B0' }}>
                                    {formatearFecha(selectedResult.fechaHoraMuestreo)}
                                  </Typography>
                                </Box>
                                <Box sx={{ 
                                  p: 2, 
                                  backgroundColor: 'rgba(255, 152, 0, 0.05)', 
                                  borderRadius: 2,
                                  border: '1px solid rgba(255, 152, 0, 0.1)'
                                }}>
                                  <Typography variant="body2" sx={{ color: '#666', fontSize: '0.85rem', mb: 0.5 }}>
                                    LABORATORISTA
                                  </Typography>
                                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#FF9800' }}>
                                    {selectedResult.nombreLaboratorista || 'No asignado'}
                                  </Typography>
                                </Box>
                              </Box>
                            </Grid>
                          </Grid>
                        </Paper>
                      </Grid>

                      {/* Resultados de Análisis - Card mejorada */}
                      <Grid item xs={12}>
                        <Paper elevation={2} sx={{ 
                          p: 3, 
                          borderRadius: 3,
                          background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
                          border: '1px solid rgba(57, 169, 0, 0.1)',
                          position: 'relative',
                          overflow: 'hidden',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '4px',
                            height: '100%',
                            background: 'linear-gradient(180deg, #2196F3 0%, #21CBF3 100%)',
                          }
                        }}>
                          <Typography variant="h6" sx={{ 
                            color: '#2196F3', 
                            fontWeight: 'bold',
                            mb: 3,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}>
                            🧪 Resultados de Análisis
                          </Typography>
                          <Grid container spacing={2}>
                            {Object.entries(selectedResult.resultados || {}).map(([key, value], index) => (
                              <Grid item xs={12} sm={6} md={4} key={key}>
                                <Paper elevation={1} sx={{
                                  p: 2.5,
                                  textAlign: 'center',
                                  borderRadius: 3,
                                  background: `linear-gradient(135deg, ${
                                    index % 4 === 0 ? '#e3f2fd' : 
                                    index % 4 === 1 ? '#f3e5f5' : 
                                    index % 4 === 2 ? '#e8f5e8' : '#fff3e0'
                                  } 0%, #ffffff 100%)`,
                                  border: `1px solid ${
                                    index % 4 === 0 ? 'rgba(33, 150, 243, 0.2)' : 
                                    index % 4 === 1 ? 'rgba(156, 39, 176, 0.2)' : 
                                    index % 4 === 2 ? 'rgba(57, 169, 0, 0.2)' : 'rgba(255, 152, 0, 0.2)'
                                  }`,
                                  transition: 'all 0.3s ease',
                                  '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                                  }
                                }}>
                                  <Typography variant="body2" sx={{ 
                                    color: '#666', 
                                    fontSize: '0.8rem', 
                                    mb: 1,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    fontWeight: 500
                                  }}>
                                    {key}
                                  </Typography>
                                  <Typography variant="h5" sx={{ 
                                    fontWeight: 'bold',
                                    color: index % 4 === 0 ? '#2196F3' : 
                                           index % 4 === 1 ? '#9C27B0' : 
                                           index % 4 === 2 ? '#39A900' : '#FF9800',
                                    mb: 0.5
                                  }}>
                                    {value.valor}
                                  </Typography>
                                  <Typography variant="body2" sx={{ 
                                    color: '#888',
                                    fontSize: '0.85rem',
                                    fontWeight: 500
                                  }}>
                                    {value.unidad || 'Sin unidad'}
                                  </Typography>
                                </Paper>
                              </Grid>
                            ))}
                          </Grid>                        </Paper>
                      </Grid>

                      {/* Observaciones de Verificación - Card mejorada */}
                      {selectedResult.verificado && (
                        <Grid item xs={12}>
                          <Paper elevation={2} sx={{ 
                            p: 3, 
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, #e8f5e8 0%, #ffffff 100%)',
                            border: '1px solid rgba(57, 169, 0, 0.2)',
                            position: 'relative',
                            overflow: 'hidden',
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '4px',
                              height: '100%',
                              background: 'linear-gradient(180deg, #39A900 0%, #4CAF50 100%)',
                            }
                          }}>
                            <Typography variant="h6" sx={{ 
                              color: '#39A900', 
                              fontWeight: 'bold',
                              mb: 2,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1
                            }}>
                              ✅ Verificación Completa
                            </Typography>
                            <Grid container spacing={2}>
                              <Grid item xs={12} md={6}>
                                <Box sx={{ 
                                  p: 2, 
                                  backgroundColor: 'rgba(57, 169, 0, 0.1)', 
                                  borderRadius: 2,
                                  mb: 2
                                }}>
                                  <Typography variant="body2" sx={{ color: '#666', fontSize: '0.85rem', mb: 0.5 }}>
                                    VERIFICADO POR
                                  </Typography>
                                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#39A900' }}>
                                    {selectedResult.historialCambios?.find(c => c.cambiosRealizados?.verificacion)?.nombre || 'No disponible'}
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <Box sx={{ 
                                  p: 2, 
                                  backgroundColor: 'rgba(57, 169, 0, 0.1)', 
                                  borderRadius: 2,
                                  mb: 2
                                }}>
                                  <Typography variant="body2" sx={{ color: '#666', fontSize: '0.85rem', mb: 0.5 }}>
                                    FECHA DE VERIFICACIÓN
                                  </Typography>
                                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#39A900' }}>
                                    {
                                      (() => {
                                        const cambioVerificacion = selectedResult.historialCambios?.find(c => c.cambiosRealizados?.verificacion);
                                        return cambioVerificacion?.fecha?.fecha && cambioVerificacion?.fecha?.hora
                                          ? `${cambioVerificacion.fecha.fecha} ${cambioVerificacion.fecha.hora}`
                                          : 'No disponible'
                                      })()
                                    }
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={12}>
                                <Box sx={{ 
                                  p: 3, 
                                  backgroundColor: 'white', 
                                  borderRadius: 2,
                                  border: '1px solid rgba(57, 169, 0, 0.2)',
                                  boxShadow: '0 2px 8px rgba(57, 169, 0, 0.1)'
                                }}>
                                  <Typography variant="body2" sx={{ color: '#666', fontSize: '0.85rem', mb: 1 }}>
                                    OBSERVACIONES
                                  </Typography>
                                  <Typography variant="body1" sx={{ 
                                    fontStyle: 'italic',
                                    color: '#333',
                                    lineHeight: 1.6
                                  }}>
                                    {selectedResult.historialCambios?.find(c => c.cambiosRealizados?.verificacion)?.observaciones || 'No hay observaciones disponibles'}
                                  </Typography>
                                </Box>
                              </Grid>
                            </Grid>
                          </Paper>
                        </Grid>
                      )}

                      {/* Historial de Cambios - Card mejorada */}
                      {selectedResult.historialCambios?.length > 0 && (
                        <Grid item xs={12}>
                          <Paper elevation={2} sx={{ 
                            p: 3, 
                            borderRadius: 3,
                            background: 'linear-gradient(135deg, #fff3e0 0%, #ffffff 100%)',
                            border: '1px solid rgba(255, 152, 0, 0.2)',
                            position: 'relative',
                            overflow: 'hidden',
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '4px',
                              height: '100%',
                              background: 'linear-gradient(180deg, #FF9800 0%, #FFB74D 100%)',
                            }
                          }}>
                            <Typography variant="h6" sx={{ 
                              color: '#FF9800', 
                              fontWeight: 'bold',
                              mb: 3,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1
                            }}>
                              📝 Historial de Cambios
                            </Typography>
                            {selectedResult.historialCambios.map((cambio, index) => (
                              <Box 
                                key={index} 
                                sx={{ 
                                  mb: 3, 
                                  p: 3, 
                                  bgcolor: 'white', 
                                  borderRadius: 3,
                                  border: '1px solid rgba(255, 152, 0, 0.2)',
                                  boxShadow: '0 4px 12px rgba(255, 152, 0, 0.1)',
                                  position: 'relative',
                                  '&::before': {
                                    content: `"${selectedResult.historialCambios.length - index}"`,
                                    position: 'absolute',
                                    top: -10,
                                    left: 20,
                                    backgroundColor: '#FF9800',
                                    color: 'white',
                                    width: 30,
                                    height: 30,
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 'bold',
                                    fontSize: '0.9rem',
                                    boxShadow: '0 2px 8px rgba(255, 152, 0, 0.3)'
                                  }
                                }}
                              >
                                <Box sx={{ pt: 1 }}>
                                  <Grid container spacing={2}>
                                    <Grid item xs={12} md={6}>
                                      <Box sx={{ 
                                        p: 2, 
                                        backgroundColor: 'rgba(255, 152, 0, 0.1)', 
                                        borderRadius: 2
                                      }}>
                                        <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8rem', mb: 0.5 }}>
                                          REALIZADO POR
                                        </Typography>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#FF9800' }}>
                                          {cambio.nombre || 'No disponible'}
                                        </Typography>
                                      </Box>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                      <Box sx={{ 
                                        p: 2, 
                                        backgroundColor: 'rgba(255, 152, 0, 0.1)', 
                                        borderRadius: 2
                                      }}>
                                        <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8rem', mb: 0.5 }}>
                                          FECHA Y HORA
                                        </Typography>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#FF9800' }}>
                                          {cambio.fecha?.fecha && cambio.fecha?.hora 
                                            ? `${cambio.fecha.fecha} ${cambio.fecha.hora}`
                                            : formatearFecha(cambio.fecha)}
                                        </Typography>
                                      </Box>
                                    </Grid>
                                    <Grid item xs={12}>
                                      <Box sx={{ 
                                        p: 2, 
                                        backgroundColor: 'rgba(255, 152, 0, 0.05)', 
                                        borderRadius: 2,
                                        border: '1px solid rgba(255, 152, 0, 0.1)'
                                      }}>
                                        <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8rem', mb: 1 }}>
                                          OBSERVACIONES
                                        </Typography>
                                        <Typography variant="body1" sx={{ 
                                          fontStyle: 'italic',
                                          color: '#333',
                                          lineHeight: 1.6
                                        }}>
                                          {cambio.observaciones || 'Sin observaciones'}
                                        </Typography>
                                      </Box>
                                    </Grid>
                                    <Grid item xs={12}>
                                      <TableContainer component={Paper} sx={{ 
                                        borderRadius: 2,
                                        overflow: 'hidden',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                      }}>
                                        <Table size="small">
                                          <TableHead sx={{ 
                                            background: 'linear-gradient(90deg, #FF9800 0%, #FFB74D 100%)'
                                          }}>
                                            <TableRow>
                                              <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Parámetro</TableCell>
                                              <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Valor Anterior</TableCell>
                                              <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Valor Nuevo</TableCell>
                                              <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Unidad</TableCell>
                                            </TableRow>
                                          </TableHead>
                                          <TableBody>
                                            {cambio.cambiosRealizados?.resultados && Object.keys(cambio.cambiosRealizados.resultados).length > 0 ? (
                                              Object.entries(cambio.cambiosRealizados.resultados).map(([param, valores], i) => (
                                                <TableRow key={i} sx={{
                                                  '&:nth-of-type(odd)': { backgroundColor: 'rgba(255, 152, 0, 0.03)' },
                                                  '&:hover': { backgroundColor: 'rgba(255, 152, 0, 0.1)' }
                                                }}>
                                                  <TableCell sx={{ fontWeight: 'bold' }}>{param}</TableCell>
                                                  <TableCell sx={{ color: '#d32f2f' }}>{valores.valorAnterior ?? 'No disponible'}</TableCell>
                                                  <TableCell sx={{ color: '#2e7d32', fontWeight: 'bold' }}>{valores.valorNuevo ?? 'No disponible'}</TableCell>
                                                  <TableCell>{valores.unidad || '-'}</TableCell>
                                                </TableRow>
                                              ))
                                            ) : cambio.cambiosRealizados?.verificacion && cambio.cambiosRealizados?.estado ? (
                                              <TableRow sx={{
                                                '&:hover': { backgroundColor: 'rgba(255, 152, 0, 0.1)' }
                                              }}>
                                                <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                                                <TableCell sx={{ color: '#d32f2f' }}>{cambio.cambiosRealizados.estado.anterior ?? 'No disponible'}</TableCell>
                                                <TableCell sx={{ color: '#2e7d32', fontWeight: 'bold' }}>{cambio.cambiosRealizados.estado.nuevo ?? 'No disponible'}</TableCell>
                                                <TableCell>-</TableCell>
                                              </TableRow>
                                            ) : (
                                              <TableRow>
                                                <TableCell colSpan={4} sx={{ textAlign: 'center', fontStyle: 'italic', color: '#666' }}>
                                                  No hay cambios registrados
                                                </TableCell>
                                              </TableRow>
                                            )}
                                          </TableBody>
                                        </Table>
                                      </TableContainer>
                                    </Grid>
                                  </Grid>
                                </Box>
                              </Box>
                            ))}
                          </Paper>
                        </Grid>
                      )}
                    </Grid>

                    {/* Botones de acción mejorados */}
                    <Box sx={{ 
                      mt: 4, 
                      display: 'flex', 
                      justifyContent: 'center', 
                      gap: 2,
                      borderTop: '1px solid rgba(0,0,0,0.1)',
                      pt: 3
                    }}>
                      {!selectedResult.verificado && JSON.parse(localStorage.getItem('user') || '{}').rol === 'administrador' && (
                        <Button
                          variant="contained"
                          onClick={() => setDialogoVerificacion(true)}
                          startIcon={<PictureAsPdfIcon />}
                          sx={{
                            background: 'linear-gradient(135deg, #39A900 0%, #4CAF50 100%)',
                            color: 'white',
                            fontWeight: 'bold',
                            px: 4,
                            py: 1.5,
                            borderRadius: 3,
                            boxShadow: '0 4px 15px rgba(57, 169, 0, 0.3)',
                            '&:hover': {
                              background: 'linear-gradient(135deg, #2d8000 0%, #388E3C 100%)',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 6px 20px rgba(57, 169, 0, 0.4)',
                            },
                            transition: 'all 0.3s ease',
                          }}
                        >
                          Finalizar Análisis
                        </Button>
                      )}
                      <Button 
                        variant="outlined"
                        onClick={() => setSelectedResult(null)}
                        startIcon={<CloseIcon />}
                        sx={{ 
                          borderColor: '#39A900', 
                          color: '#39A900', 
                          fontWeight: 'bold', 
                          px: 4,
                          py: 1.5,
                          borderRadius: 3,
                          '&:hover': { 
                            borderColor: '#2d8000', 
                            color: '#2d8000',
                            backgroundColor: 'rgba(57, 169, 0, 0.05)',
                            transform: 'translateY(-2px)',
                          },
                          transition: 'all 0.3s ease',
                        }}
                      >
                        Cerrar
                      </Button>
                    </Box>
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