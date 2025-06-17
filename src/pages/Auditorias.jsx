import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Divider,
  CircularProgress,
  Stack,
  Switch,
  Alert
} from "@mui/material";
import {
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  BarChart as BarChartIcon,
  Search as SearchIcon,
  GetApp as GetAppIcon,
  PictureAsPdf as PictureAsPdfIcon
} from '@mui/icons-material';
import { PDFService, excelGenerator } from "../services/pdfGenerator";
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend
} from 'chart.js';
import axios from 'axios';
import Pagination from '@mui/material/Pagination';

// Debounce para búsqueda eficiente
function useDebouncedValue(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

ChartJS.register(
  CategoryScale,
  LinearScale, 
  BarElement,
  Title,
  ChartTooltip,
  Legend
);

// Types and interfaces
const TIPOS_ANALISIS = ['Fisicoquímico', 'Microbiológico'];

// Analysis interface
const ESTADOS_VALIDOS = ['Recibida', 'En análisis','Finalizada', 'Rechazada'];

// Las URLs ahora se manejan en el servicio de documentos
const BASE_URL = "https://backend-registro-muestras.onrender.com/api";

const getEstadoChipProps = (estado) => {
  switch (estado) {
    case "Recibida":
      return { chipcolor: "primary", sx: { backgroundColor: "#39A900", color: "white" } };
    case "En análisis":
      return { chipcolor: "info", sx: { backgroundColor: "#2196F3", color: "white" } };
    case "Pendiente de resultados":
      return { chipcolor: "warning", sx: { backgroundColor: "#FF9800", color: "white" } };
    case "Finalizada":
      return { chipcolor: "success", sx: { backgroundColor: "#4CAF50", color: "white" } };
    case "Rechazada":
      return { chipcolor: "error", sx: { backgroundColor: "#F44336", color: "white" } };
    case "En Cotización":
    case "En Cotizacion": // Cubrimos ambas versiones
      return { chipcolor: "secondary", sx: { backgroundColor: "#9C27B0", color: "white" } };
    default:
      return { chipcolor: "default", sx: { backgroundColor: "#666", color: "white" } };
  }
};

const ExcelGenerator = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedParameter, setSelectedParameter] = useState('');
  const [selectedTab, setSelectedTab] = useState(0);
  const [auditData, setAuditData] = useState({
    muestras: [],
    parametros: [],
    historial: []
  });
  const [filteredData, setFilteredData] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [analisisDisponibles, setAnalisisDisponibles] = useState([]);
  const [filterState, setFilterState] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [estadisticas, setEstadisticas] = useState({
    totalMuestras: 0,
    muestrasFinalizadas: 0,
    muestrasRechazadas: 0,
    muestrasEnAnalisis: 0,
    muestrasPendientes: 0
  });
  const [estadisticasAnalisis, setEstadisticasAnalisis] = useState([]);
  const [loadingAnalisis, setLoadingAnalisis] = useState(false);
  const [errorAnalisis, setErrorAnalisis] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  // Debounce para búsqueda eficiente
  const debouncedSearch = useDebouncedValue(searchTerm, 400);
  const firstNoResultRef = useRef(null);
  // Memoización de analisisDisponibles para evitar renders innecesarios
  const memoAnalisisDisponibles = useMemo(() => analisisDisponibles, [analisisDisponibles]);

  // Memoización de estados válidos
  const memoEstadosValidos = useMemo(() => ESTADOS_VALIDOS, []);

  // Limpieza de logs innecesarios y robustez en fetchAnalisisDisponibles
  const fetchAnalisisDisponibles = useCallback(async () => {
    try {
      const data = await excelGenerator.obtenerDatosAuditoria();
      if (data.success === true && Array.isArray(data.data)) {
        setAnalisisDisponibles(data.data);
      } else if (Array.isArray(data)) {
        setAnalisisDisponibles(data);
      } else if (data && Array.isArray(data.analisis)) {
        setAnalisisDisponibles(data.analisis);
      } else if (data && Array.isArray(data.parametros)) {
        setAnalisisDisponibles(data.parametros);
      } else if (data && Array.isArray(data.data?.parametros)) {
        setAnalisisDisponibles(data.data.parametros);
      } else {
        const muestras = data.data?.muestras || data.muestras || [];
        const parametrosSet = new Set();
        muestras.forEach(muestra => {
          const parametros = [
            ...(muestra.parametros || []),
            ...(muestra.analisisSeleccionados || []),
            ...(muestra.analisis || [])
          ];
          parametros.forEach(param => {
            if (typeof param === 'string') {
              parametrosSet.add(param);
            } else if (param?.nombre) {
              parametrosSet.add(param.nombre);
            } else if (param?.parametro) {
              parametrosSet.add(param.parametro);
            }
          });
        });
        setAnalisisDisponibles(Array.from(parametrosSet).map(nombre => ({ nombre })));
      }
    } catch (error) {
      setAnalisisDisponibles([]);
    }
  }, []);  // Limpieza de logs innecesarios y robustez en loadInitialData
  const loadInitialData = useCallback(async (page = 1, limit = 10) => {
    setInitialLoading(true);
    setError(null);
    try {
      const response = await excelGenerator.obtenerDatosAuditoria();
      let muestrasData = [];
      if (response && response.data) {
        muestrasData = response.data.muestras || response.data || [];
      }
      setAuditData({
        muestras: muestrasData,
        parametros: response.data?.parametros || [],
        historial: response.data?.historial || []
      });
      setFilteredData(muestrasData);
      setPagination({
        page,
        limit,
        total: response.data?.pagination?.total || muestrasData.length,
        totalPages: Math.ceil(muestrasData.length / limit),
      });
    } catch (err) {
      setError('Error al cargar los datos iniciales');
      setAuditData({ muestras: [], parametros: [], historial: [] });
      setFilteredData([]);
    } finally {
      setInitialLoading(false);
    }
  }, []);
  useEffect(() => {
    loadInitialData();
    fetchAnalisisDisponibles();
  }, [loadInitialData, fetchAnalisisDisponibles]);

  // Filtrar datos localmente cuando cambien los filtros
  useEffect(() => {
    try {
      let filtered = Array.isArray(auditData.muestras) ? [...auditData.muestras] : [];

      // Filtrar por estado
      if (filterState) {
        filtered = filtered.filter(muestra => muestra.estado === filterState);
      }

      // Filtrar por parámetro seleccionado
      if (selectedParameter) {
        filtered = filtered.filter(muestra => {
          const parametros = [
            ...(muestra.parametros || []),
            ...(muestra.analisisSeleccionados || []),
            ...(muestra.analisis || [])
          ];
          return parametros.some(param => {
            if (typeof param === 'string') {
              return param.toLowerCase().includes(selectedParameter.toLowerCase());
            } else if (param?.nombre) {
              return param.nombre.toLowerCase().includes(selectedParameter.toLowerCase());
            }
            return false;
          });
        });
      }

      // Filtrar por búsqueda con debounce
      if (debouncedSearch.trim() !== "") {
        const normalizedSearchTerm = debouncedSearch.toLowerCase();
        filtered = filtered.filter(muestra => {
          const idMatch = muestra.id && muestra.id.toString().toLowerCase().includes(normalizedSearchTerm);
          const clienteMatch = muestra.cliente && muestra.cliente.toLowerCase().includes(normalizedSearchTerm);
          return idMatch || clienteMatch;
        });
      }

      setFilteredData(filtered);
      
      // Actualizar paginación
      const totalItems = filtered.length;
      const totalPages = Math.ceil(totalItems / pagination.limit);
      setPagination(prev => ({
        ...prev,
        total: totalItems,
        totalPages: totalPages,
        page: currentPage > totalPages ? 1 : currentPage
      }));

      // Enfocar en mensaje de "no resultados" si no hay muestras
      if (filtered.length === 0 && firstNoResultRef.current) {
        firstNoResultRef.current.focus();
      }
    } catch (err) {
      console.error("Error al filtrar datos:", err);
      setFilteredData([]);
    }
  }, [debouncedSearch, filterState, selectedParameter, auditData.muestras, pagination.limit, currentPage]);

  // Memoizar handlers
  const handleSearchChange = useCallback((event) => {
    setSearchTerm(event.target.value);
  }, []);

  const handleParameterChange = useCallback((event) => {
    setSelectedParameter(event.target.value);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setFilterState('');
    setSelectedParameter('');
    setCurrentPage(1);
  }, []);
  const handleTabChange = useCallback((event, newValue) => {
    setSelectedTab(newValue);
  }, []);

  const handlePageChange = useCallback((event, value) => {
    setCurrentPage(value);
  }, []);

  // Obtener datos paginados
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pagination.limit;
    return filteredData.slice(start, start + pagination.limit);
  }, [filteredData, currentPage, pagination.limit]);

  const handleDownloadExcel = async (periodo = 'general') => {
    setLoading(true);
    setError(null);
    try {
      await excelGenerator.generarExcelAuditoria('download', periodo, '', '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewExcel = async (periodo = 'general') => {
    setLoading(true);
    setError(null);
    try {
      await excelGenerator.generarExcelAuditoria('view', periodo, '', '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderTimeline = (historial) => {
    if (!historial.length) {
      return <Typography color="textSecondary">No hay historial para este parámetro.</Typography>;
    }
    return (
      <Box component="ol" sx={{ pl: 2, borderLeft: '3px solid #1976d2', ml: 1 }}>
        {historial.map((evento, index) => (
          <Box component="li" key={index} sx={{ mb: 3, position: 'relative' }}>
            <Box sx={{ position: 'absolute', left: -28, top: 2 }}>
              <Box sx={{ width: 16, height: 16, borderRadius: '50%', background: evento.tipo === 'creacion' ? '#1976d2' : '#9c27b0', border: '2px solid white', boxShadow: 1 }} />
            </Box>
            <Typography variant="subtitle2" sx={{ color: '#1976d2', fontWeight: 600 }}>{evento.fecha}</Typography>
            <Typography sx={{ mb: 1 }}>{evento.descripcion}</Typography>
            {evento.cambios && (
              <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {Object.entries(evento.cambios).map(([key, value]) => (
                  <Chip
                    key={key}
                    label={`${key}: ${value}`}
                    size="small"
                    color="info"
                  />
                ))}
              </Box>
            )}
          </Box>
        ))}
      </Box>
    );
  };  const obtenerEstadisticas = () => {
    const totalMuestras = filteredData.length;
    const muestrasFinalizadas = filteredData.filter(item => item.estado === 'Finalizada').length;
    const muestrasRechazadas = filteredData.filter(item => item.estado === 'Rechazada').length;
    const muestrasEnAnalisis = filteredData.filter(item => item.estado === 'En análisis').length;
    const muestrasRecibida = filteredData.filter(item => item.estado === 'Recibida').length;

    return {
      totalMuestras,
      muestrasFinalizadas,
      muestrasRechazadas,
      muestrasEnAnalisis,
      muestrasRecibida
    };
  };

  useEffect(() => {
    if (selectedTab === 0) {
      const stats = obtenerEstadisticas();
      setEstadisticas(stats);
    }
  }, [filteredData, selectedTab]);
  const dataGrafico = {
    labels: ['Finalizada', 'Rechazada', 'En análisis', 'Recibida'],
    datasets: [
      {
        label: 'Cantidad de Muestras',
        data: [
          estadisticas?.muestrasFinalizadas || 0,
          estadisticas?.muestrasRechazadas || 0,
          estadisticas?.muestrasEnAnalisis || 0,
          estadisticas?.muestrasRecibida || 0
        ],
        backgroundColor: [
          'rgba(76, 175, 80, 0.7)',  // Verde para finalizadas
          'rgba(244, 67, 54, 0.7)',  // Rojo para rechazadas
          'rgba(33, 150, 243, 0.7)', // Azul para en análisis 
          'rgba(255, 152, 0, 0.7)'   // Naranja para pendientes
        ],
        borderColor: [
          'rgba(76, 175, 80, 1)',
          'rgba(244, 67, 54, 1)', 
          'rgba(33, 150, 243, 1)',
          'rgba(255, 152, 0, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  const opcionesGrafico = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Distribución de Muestras por Estado',
        font: {
          size: 16,
          weight: 'bold'
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Cantidad'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Estado'
        }
      }
    }
  };

  const obtenerEstadisticasAnalisis = async () => {
    setLoadingAnalisis(true);
    setErrorAnalisis(null);
    try {
      const token = localStorage.getItem('token');      const response = await axios.get(
        `${BASE_URL}/auditoria/estadisticas-analisis`,
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          params: {
            parametro: selectedParameter
          }
        }
      );
      
      // Guardamos toda la respuesta para poder acceder tanto a los datos de evolución como a las cantidades
      setEstadisticasAnalisis(response.data);
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      setErrorAnalisis('Error al cargar las estadísticas de análisis');
    } finally {
      setLoadingAnalisis(false);
    }
  };
  useEffect(() => {
    if (selectedTab === 1 && selectedParameter) {
      obtenerEstadisticasAnalisis();
    }
  }, [selectedTab, selectedParameter]);

  return (
    <div>
      {initialLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <CircularProgress />
        </Box>
      ) : (        <Grid container spacing={3}>
          {/* Encabezado con título y botón de actualizar */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <BarChartIcon sx={{ fontSize: 40, color: '#39A900', mr: 2 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#39A900', flex: 1 }}>
                Auditorías y Reportes
              </Typography>
              <Tooltip title="Actualizar datos" placement="left" arrow>
                <IconButton
                  onClick={() => {
                    setInitialLoading(true);
                    loadInitialData();
                    fetchAnalisisDisponibles();
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
          </Grid>          {/* Filtros y Controles Mejorados */}
          <Grid item xs={12}>
            <Card elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <CardContent sx={{ p: 3, background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <FilterListIcon sx={{ color: '#39A900', mr: 1 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#39A900' }}>
                    Filtros de Búsqueda
                  </Typography>
                </Box>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Buscar por ID o Cliente"
                      variant="outlined"
                      value={searchTerm}
                      onChange={handleSearchChange}
                      sx={{ 
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'white',
                          borderRadius: 2,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
                          '&.Mui-focused': { boxShadow: '0 4px 16px rgba(57,169,0,0.3)' }
                        }
                      }}
                      InputProps={{
                        startAdornment: <SearchIcon sx={{ color: '#39A900', mr: 1 }} />
                      }}
                      inputProps={{ 'aria-label': 'Buscar auditoría' }}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Parámetro</InputLabel>
                      <Select
                        value={selectedParameter}
                        onChange={handleParameterChange}
                        label="Parámetro"
                        sx={{ 
                          backgroundColor: 'white', 
                          borderRadius: 2,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }
                        }}
                      >
                        <MenuItem value="">Todos los parámetros</MenuItem>
                        {memoAnalisisDisponibles && memoAnalisisDisponibles.map((param) => (
                          <MenuItem key={param.id || param.nombre} value={typeof param === 'string' ? param : param.nombre}>
                            {typeof param === 'string' ? param : param.nombre}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Estado</InputLabel>
                      <Select
                        value={filterState}
                        onChange={(e) => setFilterState(e.target.value)}
                        label="Estado"
                        sx={{ 
                          backgroundColor: 'white', 
                          borderRadius: 2,
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                          '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }
                        }}
                      >
                        <MenuItem value="">Todos los estados</MenuItem>
                        {memoEstadosValidos.map((estado) => (
                          <MenuItem key={estado} value={estado}>{estado}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={handleClearFilters}
                      startIcon={<RefreshIcon />}
                      sx={{
                        borderColor: '#39A900',
                        color: '#39A900',
                        fontWeight: 'bold',
                        borderRadius: 2,
                        height: 56,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        '&:hover': {
                          backgroundColor: '#e8f5e9',
                          borderColor: '#2d8000',
                          boxShadow: '0 4px 16px rgba(57,169,0,0.3)',
                          transform: 'translateY(-2px)'
                        },
                        '&:disabled': {
                          borderColor: '#ccc',
                          color: '#999'
                        },
                        transition: 'all 0.2s ease'
                      }}
                      disabled={!searchTerm && !filterState && !selectedParameter}
                    >
                      Limpiar Filtros
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Tabs de Visualización */}
          <Grid item xs={12}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={selectedTab} onChange={handleTabChange}>
                <Tab label="Lista de Muestras" />
                <Tab label="Historial de Parámetros" />
                <Tab label="Reportes" />
              </Tabs>
            </Box>
          </Grid>          {/* Contenido de las Tabs */}
          <Grid item xs={12}>
            {selectedTab === 0 && (
              <Card elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <Box sx={{ 
                  background: 'linear-gradient(90deg, #39A900 0%, #4caf50 100%)',
                  p: 2,
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <BarChartIcon sx={{ color: 'white', mr: 1 }} />
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                    Lista de Muestras para Auditoría ({filteredData.length} encontradas)
                  </Typography>
                </Box>
                <TableContainer>
                  <Table sx={{ minWidth: 650 }}>
                    <TableHead>
                      <TableRow sx={{ 
                        backgroundColor: '#f8f9fa',
                        '& .MuiTableCell-head': {
                          fontWeight: 'bold',
                          color: '#39A900',
                          borderBottom: '2px solid #39A900'
                        }
                      }}>
                        <TableCell>ID Muestra</TableCell>
                        <TableCell>Cliente</TableCell>
                        <TableCell>Fecha Ingreso</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell>Parámetros</TableCell>
                        <TableCell align="center">Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedData.length === 0 ? (
                        <TableRow>
                          <TableCell 
                            colSpan={6} 
                            align="center" 
                            sx={{ 
                              py: 4,
                              color: '#666',
                              fontStyle: 'italic'
                            }}
                            ref={firstNoResultRef}
                            tabIndex={-1}
                          >
                            {filteredData.length === 0 && (searchTerm || filterState || selectedParameter) 
                              ? "No se encontraron muestras que coincidan con los filtros aplicados" 
                              : "No hay muestras disponibles"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        paginatedData.map((muestra, index) => (
                          <TableRow 
                            key={muestra.id} 
                            sx={{
                              '&:nth-of-type(odd)': { backgroundColor: '#f8f9fa' },
                              '&:hover': {
                                backgroundColor: '#e3f2fd',
                                transform: 'scale(1.01)',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                transition: 'all 0.2s ease'
                              },
                              cursor: 'pointer'
                            }}
                          >
                            <TableCell sx={{ fontWeight: 'medium' }}>{muestra.id}</TableCell>
                            <TableCell>{muestra.cliente}</TableCell>
                            <TableCell>{muestra.fechaIngreso}</TableCell>
                            <TableCell>
                              <Chip
                                label={muestra.estado}
                                size="small"
                                {...getEstadoChipProps(muestra.estado)}
                              />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {(muestra.parametros || []).slice(0, 3).map((param) => (
                                  <Chip
                                    key={param}
                                    label={param}
                                    size="small"
                                    variant="outlined"
                                    sx={{ 
                                      fontSize: '0.75rem',
                                      height: 24,
                                      borderColor: '#39A900',
                                      color: '#39A900'
                                    }}
                                  />
                                ))}
                                {(muestra.parametros || []).length > 3 && (
                                  <Chip
                                    label={`+${(muestra.parametros || []).length - 3}`}
                                    size="small"
                                    sx={{ 
                                      fontSize: '0.75rem',
                                      height: 24,
                                      backgroundColor: '#e0e0e0'
                                    }}
                                  />
                                )}
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                <Tooltip title="Ver detalles" placement="top">
                                  <IconButton
                                    size="small"
                                    sx={{
                                      backgroundColor: '#2196f3',
                                      color: 'white',
                                      '&:hover': {
                                        backgroundColor: '#1976d2',
                                        transform: 'scale(1.1)'
                                      },
                                      transition: 'all 0.2s ease'
                                    }}
                                    onClick={() => {
                                      // Aquí iría la lógica para ver detalles
                                      console.log('Ver detalles de muestra:', muestra.id);
                                    }}
                                  >
                                    <VisibilityIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Generar PDF" placement="top">
                                  <IconButton
                                    size="small"
                                    sx={{
                                      backgroundColor: '#f44336',
                                      color: 'white',
                                      '&:hover': {
                                        backgroundColor: '#d32f2f',
                                        transform: 'scale(1.1)'
                                      },
                                      transition: 'all 0.2s ease'
                                    }}
                                    onClick={() => {
                                      // Aquí iría la lógica para generar PDF
                                      console.log('Generar PDF de muestra:', muestra.id);
                                    }}
                                  >
                                    <PictureAsPdfIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            )}
            {selectedTab === 1 && (
              <Box sx={{ mt: 3 }}>
                {selectedParameter ? (
                  <Card>
                    <CardContent>
                      <Card sx={{ p: 3, bgcolor: '#f5f5f5' }}>
                        <Typography variant="h6" gutterBottom sx={{ color: '#39A900', fontWeight: 'medium' }}>
                          Cantidad de Muestras por Parámetro
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          {loadingAnalisis ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px' }}>
                              <CircularProgress />
                            </Box>
                          ) : errorAnalisis ? (
                            <Alert severity="error">{errorAnalisis}</Alert>
                          ) : (
                            <Box sx={{ height: 400, width: '100%' }}>
                              {Array.isArray(estadisticasAnalisis.data) ? (
                                <Bar
                                  data={{
                                    labels: estadisticasAnalisis.data.map(item => item._id),
                                    datasets: [{
                                      label: 'Cantidad de Muestras',
                                      data: estadisticasAnalisis.data.map(item => item.cantidad),
                                      backgroundColor: 'rgba(57, 169, 0, 0.7)',
                                      borderColor: '#39A900',
                                      borderWidth: 1
                                    }]
                                  }}
                                  options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    indexAxis: 'y',
                                    plugins: {
                                      legend: {
                                        position: 'top'
                                      },
                                      title: {
                                        display: true,
                                        text: 'Cantidad de Muestras por Parámetro',
                                        font: {
                                          size: 16,
                                          weight: 'bold'
                                        }
                                      }
                                    },
                                    scales: {
                                      x: {
                                        beginAtZero: true,
                                        title: {
                                          display: true,
                                          text: 'Cantidad de Muestras'
                                        }
                                      },
                                      y: {
                                        title: {
                                          display: true,
                                          text: 'Parámetro'
                                        }
                                      }
                                    }
                                  }}
                                />
                              ) : (
                                <Alert severity="info">
                                  No hay datos disponibles sobre la cantidad de muestras por parámetro.
                                </Alert>
                              )}
                            </Box>
                          )}
                        </Box>
                      </Card>

                      {/* Tabla de historial */}
                      <TableContainer component={Paper} sx={{ mt: 2, borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                        <Table>
                          <TableHead>
                            <TableRow sx={{ bgcolor: '#39A900' }}>
                              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Fecha</TableCell>
                              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Tipo</TableCell>
                              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Muestra ID</TableCell>
                              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Resultado</TableCell>
                              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Estado</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {(filteredData || []).map((item) => (
                              <TableRow key={item.id}>
                                <TableCell>{item.fechaIngreso}</TableCell>
                                <TableCell>{item.tipoAnalisis}</TableCell>
                                <TableCell>{item.id}</TableCell>
                                <TableCell>{item.resultados?.[selectedParameter] || 'Pendiente'}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={item.estado}
                                    size="small"
                                    {...getEstadoChipProps(item.estado)}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent>
                      <Alert severity="info" sx={{ borderRadius: 2 }}>
                        Seleccione un parámetro para ver su historial y análisis detallado
                      </Alert>
                    </CardContent>
                  </Card>
                )}
              </Box>
            )}            {selectedTab === 2 && (
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={3}>
                  {/* Gráfico de Distribución de Muestras */}
                  <Grid item xs={12}>
                    <Card elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>
                      <Box sx={{ 
                        background: 'linear-gradient(90deg, #39A900 0%, #4caf50 100%)',
                        p: 2,
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        <BarChartIcon sx={{ color: 'white', mr: 1 }} />
                        <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
                          Estadísticas de Muestras
                        </Typography>
                      </Box>
                      <CardContent sx={{ p: 3 }}>
                        <Grid container spacing={3} alignItems="center">
                          <Grid item xs={12} md={4}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                p: 2,
                                borderRadius: 2,
                                backgroundColor: '#f8f9fa',
                                border: '1px solid #e9ecef'
                              }}>
                                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                  Total de muestras:
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#39A900' }}>
                                  {estadisticas.totalMuestras}
                                </Typography>
                              </Box>
                              <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                p: 2,
                                borderRadius: 2,
                                backgroundColor: '#e8f5e9',
                                border: '1px solid #4caf50'
                              }}>
                                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                  Muestras finalizadas:
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                                  {estadisticas.muestrasFinalizadas}
                                </Typography>
                              </Box>
                              <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                p: 2,
                                borderRadius: 2,
                                backgroundColor: '#ffebee',
                                border: '1px solid #f44336'
                              }}>
                                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                  Muestras rechazadas:
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#f44336' }}>
                                  {estadisticas.muestrasRechazadas}
                                </Typography>
                              </Box>
                              <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                p: 2,
                                borderRadius: 2,
                                backgroundColor: '#e3f2fd',
                                border: '1px solid #2196f3'
                              }}>
                                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                  Muestras en análisis:
                                </Typography>
                                <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#2196f3' }}>
                                  {estadisticas.muestrasEnAnalisis}
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>
                          <Grid item xs={12} md={8}>
                            <Box sx={{ height: 400, p: 2 }}>
                              <Bar
                                data={dataGrafico}
                                options={opcionesGrafico}
                              />
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Botones de Descarga Mejorados */}
                  <Grid item xs={12}>
                    <Card elevation={3} sx={{ borderRadius: 3 }}>
                      <CardContent sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ 
                          color: '#39A900', 
                          fontWeight: 'bold',
                          mb: 3,
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <GetAppIcon sx={{ mr: 1 }} />
                          Reportes de Descarga
                        </Typography>
                        <Grid container spacing={3}>
                          <Grid item xs={12} md={4}>
                            <Card sx={{ height: '100%', border: '2px solid #39A900', borderRadius: 2 }}>
                              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                                <Box sx={{ mb: 2 }}>
                                  <DownloadIcon sx={{ fontSize: 40, color: '#39A900' }} />
                                </Box>
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                                  Reporte General
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 3, color: '#666' }}>
                                  Descarga todos los datos de auditoría
                                </Typography>
                                <Button
                                  fullWidth
                                  variant="contained"
                                  onClick={() => handleDownloadExcel('general')}
                                  disabled={loading}
                                  startIcon={<DownloadIcon />}
                                  sx={{
                                    backgroundColor: '#39A900',
                                    '&:hover': { 
                                      backgroundColor: '#2d8600',
                                      transform: 'translateY(-2px)',
                                      boxShadow: '0 4px 12px rgba(57,169,0,0.3)'
                                    },
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  Descargar Excel
                                </Button>
                              </CardContent>
                            </Card>
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Card sx={{ height: '100%', border: '2px solid #2196f3', borderRadius: 2 }}>
                              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                                <Box sx={{ mb: 2 }}>
                                  <DownloadIcon sx={{ fontSize: 40, color: '#2196f3' }} />
                                </Box>
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                                  Reporte Semanal
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 3, color: '#666' }}>
                                  Datos de los últimos 7 días
                                </Typography>
                                <Button
                                  fullWidth
                                  variant="contained"
                                  onClick={() => handleDownloadExcel('semanal')}
                                  disabled={loading}
                                  startIcon={<DownloadIcon />}
                                  sx={{
                                    backgroundColor: '#2196f3',
                                    '&:hover': { 
                                      backgroundColor: '#1976d2',
                                      transform: 'translateY(-2px)',
                                      boxShadow: '0 4px 12px rgba(33,150,243,0.3)'
                                    },
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  Descargar Excel
                                </Button>
                              </CardContent>
                            </Card>
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Card sx={{ height: '100%', border: '2px solid #ff9800', borderRadius: 2 }}>
                              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                                <Box sx={{ mb: 2 }}>
                                  <DownloadIcon sx={{ fontSize: 40, color: '#ff9800' }} />
                                </Box>
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                                  Reporte Mensual
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 3, color: '#666' }}>
                                  Datos del mes actual
                                </Typography>
                                <Button
                                  fullWidth
                                  variant="contained"
                                  onClick={() => handleDownloadExcel('mensual')}
                                  disabled={loading}
                                  startIcon={<DownloadIcon />}
                                  sx={{
                                    backgroundColor: '#ff9800',
                                    '&:hover': { 
                                      backgroundColor: '#f57c00',
                                      transform: 'translateY(-2px)',
                                      boxShadow: '0 4px 12px rgba(255,152,0,0.3)'
                                    },
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  Descargar Excel
                                </Button>
                              </CardContent>
                            </Card>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Grid>          {/* Paginación */}
          {pagination.totalPages > 1 && (
            <Grid item xs={12}>
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
            </Grid>
          )}
        </Grid>
      )}

      {error && (
        <Typography color="error" sx={{ mt: 2 }}>
          {error}
        </Typography>
      )}
    </div>
  );
};

const Auditorias = () => {
  return (
    <Paper sx={{ padding: 4, maxWidth: 1400, margin: '32px auto', boxShadow: 3 }}>
      <ExcelGenerator />
    </Paper>
  );
};

export default Auditorias;