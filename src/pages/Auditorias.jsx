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
  BarChart as BarChartIcon
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
  const [searchTerm, setSearchTerm] = useState(''); // Nuevo estado para búsqueda por ID o cliente
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
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const searchDebounceRef = useRef();

  // Memoización de analisisDisponibles para evitar renders innecesarios
  const memoAnalisisDisponibles = useMemo(() => analisisDisponibles, [analisisDisponibles]);

  // Memoización de estados válidos
  const memoEstadosValidos = useMemo(() => ESTADOS_VALIDOS, []);

  // Memoización de datos de paginación
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pagination.limit;
    return filteredData.slice(start, start + pagination.limit);
  }, [filteredData, currentPage, pagination.limit]);

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
  }, []);

  // Limpieza de logs innecesarios y robustez en loadInitialData
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

  // Debounce en búsqueda
  const handleSearchChange = useCallback((event) => {
    const value = event.target.value;
    setSearchTerm(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      filterData(value, filterState);
    }, 350);
  }, [filterState]);

  // Memoización de filterData
  const filterData = useCallback((searchTerm, estado) => {
    let filtered = auditData.muestras || [];
    if (searchTerm) {
      const normalizedSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(muestra => {
        const idMatch = muestra.id && muestra.id.toString().toLowerCase().includes(normalizedSearchTerm);
        const clienteMatch = muestra.cliente && muestra.cliente.toLowerCase().includes(normalizedSearchTerm);
        return idMatch || clienteMatch;
      });
    }
    if (estado) {
      filtered = filtered.filter(muestra => muestra.estado === estado);
    }
    setFilteredData(filtered);
  }, [auditData.muestras]);

  // Memoización de handlers
  const handleParameterChange = useCallback((event) => {
    const parameter = event.target.value;
    setSelectedParameter(parameter);
    filterData(parameter, filterState);
  }, [filterData, filterState]);

  const handleClearFilters = useCallback(() => {
    setSearchTerm('');
    setFilterState('');
    filterData('', '');
  }, [filterData]);

  const handleTabChange = useCallback((event, newValue) => {
    setSelectedTab(newValue);
  }, []);

  const handlePageChange = useCallback((event, value) => {
    setCurrentPage(value);
  }, []);

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

  // Estilos de tabla
  const tableStyles = {
    width: '100%',
    borderCollapse: 'collapse',
  };

  const rowStyles = {
    '&:nth-of-type(odd)': {
      backgroundColor: '#f1f8e9',
    },
    '&:nth-of-type(even)': {
      backgroundColor: 'white',
    },
    '&:hover': {
      transform: 'scale(1.01)',
      backgroundColor: '#e0f7fa',
      transition: 'transform 0.2s',
    },
  };

  return (
    <div>
      {initialLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>          {/* Filtros y Controles */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={3}>
                    <TextField
                      fullWidth
                      label="Buscar por ID o Cliente"
                      variant="outlined"
                      value={searchTerm}
                      onChange={handleSearchChange}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Parámetro</InputLabel>
                      <Select
                        value={selectedParameter}
                        onChange={handleParameterChange}
                        label="Parámetro"
                        sx={{ bgcolor: 'white', borderRadius: 2 }}
                      >
                        <MenuItem value="">Todos</MenuItem>
                        {memoAnalisisDisponibles && memoAnalisisDisponibles.map((param) => (
                          <MenuItem key={param.id || param.nombre} value={typeof param === 'string' ? param : param.nombre}>
                            {typeof param === 'string' ? param : param.nombre}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth size="small">
                      <InputLabel>Estado</InputLabel>
                      <Select
                        value={filterState}
                        onChange={(e) => setFilterState(e.target.value)}
                        label="Estado"
                        sx={{ bgcolor: 'white', borderRadius: 2 }}
                      >
                        <MenuItem value="">Todos</MenuItem>
                        {memoEstadosValidos.map((estado) => (
                          <MenuItem key={estado} value={estado}>{estado}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="secondary"
                      onClick={handleClearFilters}
                      size="medium"
                      sx={{
                        bgcolor: '#39A900',
                        height: '40px',
                        '&:hover': { bgcolor: '#2d8600', transform: 'translateY(-2px)', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' },
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
          </Grid>

          {/* Contenido de las Tabs */}
          <Grid item xs={12}>
            {selectedTab === 0 && (
              <TableContainer component={Paper}>
                <Table sx={tableStyles}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#39A900' }}>
                      <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>ID Muestra</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Cliente</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Fecha Ingreso</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Estado</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Parámetros</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* Evitar nodos de texto/espacios entre <TableRow> para prevenir errores de hidratación */}
                    {paginatedData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ color: '#888' }}>
                          No hay muestras para mostrar
                        </TableCell>
                      </TableRow>
                    ) : paginatedData.map((muestra) => (
                      <TableRow key={muestra.id} sx={rowStyles}>
                        <TableCell>{muestra.id}</TableCell>
                        <TableCell>{muestra.cliente}</TableCell>
                        <TableCell>{muestra.fechaIngreso}</TableCell>
                        <TableCell>
                          <Chip
                            label={muestra.estado}
                            {...getEstadoChipProps(muestra.estado)}
                          />
                        </TableCell>
                        <TableCell>
                          {(muestra.parametros || []).map((param) => (
                            <Chip
                              key={param}
                              label={param}
                              size="small"
                              sx={{ mr: 1 }}
                            />
                          ))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
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
            )}

            {selectedTab === 2 && (
              <Grid container spacing={2}>
                {/* Gráfico de Distribución de Muestras */}
                <Grid item xs={12}>
                  <Card sx={{ mt: 2, p: 3, borderRadius: 2, boxShadow: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 'medium', color: '#39A900' }}>
                      Estadísticas de Muestras
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          Total de muestras: <strong>{estadisticas.totalMuestras}</strong>
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          Muestras finalizadas: <strong>{estadisticas.muestrasFinalizadas}</strong>
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          Muestras rechazadas: <strong>{estadisticas.muestrasRechazadas}</strong>
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 1 }}>
                          Muestras en análisis: <strong>{estadisticas.muestrasEnAnalisis}</strong>
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <Box sx={{ height: 300 }}>
                          <Bar
                            data={dataGrafico}
                            options={opcionesGrafico}
                          />
                        </Box>
                      </Grid>
                    </Grid>
                  </Card>
                </Grid>

                {/* Botones de Descarga */}
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Reporte General
                      </Typography>
                      <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        onClick={() => handleDownloadExcel('general')}
                        disabled={loading}
                        startIcon={<DownloadIcon />}
                        sx={{
                          bgcolor: '#39A900',
                          '&:hover': { bgcolor: '#2d8600' }
                        }}
                      >
                        Descargar Excel
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Reporte Semanal
                      </Typography>
                      <Button
                        fullWidth
                        variant="contained"
                        color="secondary"
                        onClick={() => handleDownloadExcel('semanal')}
                        disabled={loading}
                        startIcon={<DownloadIcon />}
                      >
                        Descargar Excel
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Reporte Mensual
                      </Typography>
                      <Button
                        fullWidth
                        variant="contained"
                        color="info"
                        onClick={() => handleDownloadExcel('mensual')}
                        disabled={loading}
                        startIcon={<DownloadIcon />}
                      >
                        Descargar Excel
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </Grid>

          {/* Paginación */}
          <Grid item xs={12}>
            <Box display="flex" justifyContent="center" mt={2}>
              <Pagination
                count={pagination.totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          </Grid>
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
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: '#222', mb: 3, textAlign: 'center' }}>
        Auditorías
      </Typography>
      <ExcelGenerator />
    </Paper>
  );
};

export default Auditorias;