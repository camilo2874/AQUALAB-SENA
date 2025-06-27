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
  Alert,
  Modal,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Snackbar
} from "@mui/material";
import {
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  BarChart as BarChartIcon,
  Search as SearchIcon,
  GetApp as GetAppIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  Error as ErrorIcon
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

  // Estados para el modal de detalles
  const [selectedResult, setSelectedResult] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

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

  // Función para ver detalles de la muestra (similar a ListaResultados pero sin botón de finalizar)
  const handleVerDetalles = async (muestra) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // URLs base actualizadas
      const BASE_URLS = {
        MUESTRAS: import.meta.env.VITE_BACKEND_MUESTRAS_URL || 'https://backend-registro-muestras.onrender.com/api'
      };
      
      const API_URLS = {
        MUESTRAS: `${BASE_URLS.MUESTRAS}/api/muestras`,
        RESULTADOS: `${BASE_URLS.MUESTRAS}/api/ingreso-resultados`
      };
      
      let response;
      
      // Verificar si es una muestra que podría estar en resultados (En análisis o Finalizada)
      const estadosConResultados = ['En análisis', 'Finalizada'];
      const deberiaEstarEnResultados = estadosConResultados.includes(muestra.estado);
      
      if (deberiaEstarEnResultados) {
        // Solo intentar desde resultados si el estado indica que podría estar ahí
        try {
          response = await axios.get(
            `${API_URLS.RESULTADOS}/muestra/${muestra.id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );
          
          console.log("Detalles desde resultados:", response.data);
          
          if (response.data && response.data.data) {
            // Formatear datos desde API de resultados con campos adicionales
            const resultData = response.data.data;
            const formattedResultData = {
              ...resultData,
              fechaCreacion: resultData.fechaCreacion || null,
              observaciones: resultData.observaciones || null,
              rechazoMuestra: resultData.rechazoMuestra || null,
              condicionesAmbientales: resultData.condicionesAmbientales || null,
              planMuestreo: resultData.planMuestreo || null,
              preservacion: resultData.preservacion || null,
              metodosConservacion: resultData.metodosConservacion || null,
              temperatura: resultData.temperatura || null,
              tiempoTransporte: resultData.tiempoTransporte || null,
              responsableMuestreo: resultData.responsableMuestreo || null,
              tipoMuestra: resultData.tipoMuestra || null,
              matriz: resultData.matriz || null,
              coordenadas: resultData.coordenadas || null,
              altitud: resultData.altitud || null,
              condicionesMeteoro: resultData.condicionesMeteoro || null
            };
            setSelectedResult(formattedResultData);
            return;
          }
        } catch (resultError) {
          // Si falla, caer a la API principal
          console.log("No se encontró en resultados, usando API principal...");
        }
      }
      
      // Para todas las demás muestras o si falla la primera petición, usar API principal
      response = await axios.get(
        `${API_URLS.MUESTRAS}/${muestra.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log("Detalles desde muestras:", response.data);
      console.log("Estructura de data:", response.data.data);
      
      if (response.data) {
        // Adaptar la estructura para que sea compatible con el modal
        const muestraData = response.data.data?.muestra || response.data.data || response.data;
        
        console.log("Datos de muestra extraídos:", muestraData);
        
        // Formatear los datos para que sean compatibles con el modal
        const formattedData = {
          idMuestra: muestraData.id_muestra || muestraData.id || muestraData._id || muestraData.idMuestra || muestra.id,
          estado: muestraData.estado || 'Sin estado',
          cliente: {
            nombre: muestraData.cliente?.nombre || 
                   muestraData.cliente || 
                   muestraData.nombreCliente ||
                   muestraData.datosCliente?.nombre ||
                   'Sin especificar',
            documento: muestraData.cliente?.numeroIdentificacion || 
                      muestraData.numeroIdentificacion || 
                      muestraData.identificacion ||
                      muestraData.datosCliente?.numeroIdentificacion ||
                      muestraData.cliente?.documento ||
                      'No especificado',
            telefono: muestraData.cliente?.telefono || 
                     muestraData.telefono || 
                     muestraData.datosCliente?.telefono ||
                     'No especificado',
            email: muestraData.cliente?.email ||
                   muestraData.cliente?.correo ||
                   muestraData.email ||
                   muestraData.correo ||
                   muestraData.datosCliente?.email ||
                   muestraData.datosCliente?.correo ||
                   'No especificado',
            direccion: muestraData.cliente?.direccion ||
                      muestraData.direccion ||
                      muestraData.datosCliente?.direccion ||
                      'No especificada',
            ciudad: muestraData.cliente?.ciudad ||
                   muestraData.ciudad ||
                   muestraData.datosCliente?.ciudad ||
                   'No especificada'
          },
          resultados: muestraData.resultados || {},
          historialCambios: muestraData.historialCambios || muestraData.historial || [],
          parametros: muestraData.parametros || 
                     muestraData.analisisSeleccionados || 
                     muestraData.analisis ||
                     muestraData.tiposAnalisis || [],
          fechaIngreso: muestraData.fechaIngreso || muestraData.fecha || muestraData.fechaRecepcion,
          fechaCreacion: muestraData.fechaCreacion || null,
          tipoAnalisis: muestraData.tipoAnalisis || muestraData.tipo || 'No especificado',
          verificado: muestraData.verificado || false,
          fechaRecepcion: muestraData.fechaRecepcion || muestraData.fechaIngreso || muestraData.fecha,
          ubicacionMuestra: muestraData.ubicacionMuestra || 'No especificada',
          observaciones: muestraData.observaciones || null,
          // Campos adicionales críticos
          rechazoMuestra: muestraData.rechazoMuestra || null,
          condicionesAmbientales: muestraData.condicionesAmbientales || null,
          planMuestreo: muestraData.planMuestreo || null,
          preservacion: muestraData.preservacion || null,
          metodosConservacion: muestraData.metodosConservacion || null,
          temperatura: muestraData.temperatura || null,
          tiempoTransporte: muestraData.tiempoTransporte || null,
          responsableMuestreo: muestraData.responsableMuestreo || null,
          tipoMuestra: muestraData.tipoMuestra || null,
          matriz: muestraData.matriz || null,
          coordenadas: muestraData.coordenadas || null,
          altitud: muestraData.altitud || null,
          condicionesMeteoro: muestraData.condicionesMeteoro || null
        };
        
        console.log("Datos formateados para modal:", formattedData);
        
        setSelectedResult(formattedData);
        return;
      }
      
      // Si llegamos aquí, no se pudo obtener la muestra
      throw new Error('No se encontraron detalles para esta muestra');
      
    } catch (err) {
      console.error('Error al obtener detalles de la muestra:', err);
      setSnackbar({
        open: true,
        message: `Error al cargar los detalles de la muestra: ${err.message || 'Por favor, intenta más tarde.'}`,
        severity: 'error'
      });
      setSelectedResult(null);
    } finally {
      setLoading(false);
    }
  };

  // Función para formatear fechas (similar a ListaResultados)
  const formatearFecha = (fecha) => {
    if (!fecha) return 'Fecha inválida';
    
    // Si la fecha viene en el formato del backend
    if (typeof fecha === 'object' && fecha.fecha && fecha.hora) {
      return `${fecha.fecha} ${fecha.hora}`;
    }
    
    return 'Fecha inválida';
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
  };  const obtenerEstadisticasAnalisis = async () => {
    setLoadingAnalisis(true);
    setErrorAnalisis(null);
    try {
      console.log('Iniciando obtención de estadísticas de análisis...');
      
      // Usar el servicio existente en lugar de llamada directa
      const response = await excelGenerator.obtenerEstadisticasAnalisis();
      
      console.log('Respuesta del servicio de estadísticas:', response);
      
      // Verificar si la respuesta tiene la estructura esperada
      if (response && response.success) {
        console.log('Datos de estadísticas con estructura success:', response);
        setEstadisticasAnalisis(response);
      } else if (response && Array.isArray(response)) {
        console.log('Datos de estadísticas como array directo:', response);
        setEstadisticasAnalisis({ data: response });
      } else if (response && response.data) {
        console.log('Datos de estadísticas con propiedad data:', response);
        setEstadisticasAnalisis(response);
      } else {
        console.log('Estructura de respuesta no reconocida:', response);
        // Si no tiene la estructura esperada, usar la respuesta directamente
        setEstadisticasAnalisis({ data: response || [] });
      }
    } catch (error) {
      console.error('Error al obtener estadísticas de análisis:', error);
      setErrorAnalisis('Error al cargar las estadísticas de análisis: ' + (error.message || error.toString()));
    } finally {
      setLoadingAnalisis(false);
    }
  };useEffect(() => {
    if (selectedTab === 1) {
      obtenerEstadisticasAnalisis();
    }
  }, [selectedTab]);

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
                                    onClick={() => handleVerDetalles(muestra)}
                                  >
                                    <VisibilityIcon fontSize="small" />
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
            )}            {selectedTab === 1 && (
              <Box sx={{ mt: 3 }}>
                <Card>
                  <CardContent>                    <Card sx={{ p: 3, bgcolor: '#f5f5f5' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" sx={{ color: '#39A900', fontWeight: 'medium' }}>
                          Cantidad de Muestras por Parámetro
                        </Typography>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<RefreshIcon />}
                          onClick={obtenerEstadisticasAnalisis}
                          disabled={loadingAnalisis}
                          sx={{ 
                            borderColor: '#39A900', 
                            color: '#39A900',
                            '&:hover': { 
                              borderColor: '#2e7d00', 
                              color: '#2e7d00',
                              backgroundColor: 'rgba(57, 169, 0, 0.1)'
                            }
                          }}
                        >
                          Recargar
                        </Button>
                      </Box>
                      <Box sx={{ mt: 2 }}>
                        {loadingAnalisis ? (
                          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px' }}>
                            <CircularProgress />
                          </Box>
                        ) : errorAnalisis ? (
                          <Alert severity="error">{errorAnalisis}</Alert>
                        ) : (                          <Box sx={{ height: 400, width: '100%' }}>
                            {estadisticasAnalisis && estadisticasAnalisis.data && Array.isArray(estadisticasAnalisis.data) && estadisticasAnalisis.data.length > 0 ? (
                              <Bar
                                data={{
                                  labels: estadisticasAnalisis.data.map(item => {
                                    // Manejo flexible de diferentes formatos de nombre
                                    return item._id || item.parametro || item.nombre || item.label || 'Sin nombre';
                                  }),
                                  datasets: [{
                                    label: 'Cantidad de Muestras',
                                    data: estadisticasAnalisis.data.map(item => {
                                      // Manejo flexible de diferentes formatos de cantidad
                                      return item.cantidad || item.count || item.total || item.value || 0;
                                    }),
                                    backgroundColor: 'rgba(57, 169, 0, 0.7)',
                                    borderColor: '#39A900',
                                    borderWidth: 1,
                                    borderRadius: 4,
                                    borderSkipped: false,
                                  }]
                                }}
                                options={{
                                  responsive: true,
                                  maintainAspectRatio: false,
                                  indexAxis: 'y',
                                  plugins: {
                                    legend: {
                                      position: 'top',
                                      labels: {
                                        color: '#333',
                                        font: {
                                          size: 12
                                        }
                                      }
                                    },
                                    title: {
                                      display: true,
                                      text: 'Cantidad de Muestras por Parámetro',
                                      font: {
                                        size: 16,
                                        weight: 'bold'
                                      },
                                      color: '#39A900'
                                    },
                                    tooltip: {
                                      backgroundColor: 'rgba(0,0,0,0.8)',
                                      titleColor: 'white',
                                      bodyColor: 'white',
                                      borderColor: '#39A900',
                                      borderWidth: 1
                                    }
                                  },
                                  scales: {
                                    x: {
                                      beginAtZero: true,
                                      title: {
                                        display: true,
                                        text: 'Cantidad de Muestras',
                                        color: '#666',
                                        font: {
                                          size: 12,
                                          weight: 'bold'
                                        }
                                      },
                                      grid: {
                                        color: 'rgba(0,0,0,0.1)'
                                      },
                                      ticks: {
                                        color: '#666'
                                      }
                                    },
                                    y: {
                                      title: {
                                        display: true,
                                        text: 'Parámetro',
                                        color: '#666',
                                        font: {
                                          size: 12,
                                          weight: 'bold'
                                        }
                                      },
                                      grid: {
                                        color: 'rgba(0,0,0,0.1)'
                                      },
                                      ticks: {
                                        color: '#666',
                                        maxRotation: 0,
                                        minRotation: 0
                                      }
                                    }
                                  },
                                  layout: {
                                    padding: {
                                      left: 10,
                                      right: 10,
                                      top: 10,
                                      bottom: 10
                                    }
                                  }
                                }}
                              />
                            ) : estadisticasAnalisis && (!estadisticasAnalisis.data || estadisticasAnalisis.data.length === 0) ? (
                              <Alert severity="info" sx={{ m: 2 }}>
                                No hay datos disponibles sobre la cantidad de muestras por parámetro. 
                                {estadisticasAnalisis.message && (
                                  <Box component="span" sx={{ display: 'block', mt: 1, fontSize: '0.9em', opacity: 0.8 }}>
                                    {estadisticasAnalisis.message}
                                  </Box>
                                )}
                              </Alert>
                            ) : (
                              <Alert severity="warning" sx={{ m: 2 }}>
                                Los datos de estadísticas no tienen el formato esperado. 
                                <Box component="span" sx={{ display: 'block', mt: 1, fontSize: '0.8em', fontFamily: 'monospace', opacity: 0.7 }}>
                                  Estructura recibida: {JSON.stringify(estadisticasAnalisis, null, 2).substring(0, 100)}...
                                </Box>
                              </Alert>
                            )}
                          </Box>
                        )}
                      </Box>
                    </Card>                    {/* Tabla de historial filtrada por parámetro seleccionado */}
                    {selectedParameter && (
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
                    )}
                  </CardContent>
                </Card>
              </Box>
            )}{selectedTab === 2 && (
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

      {/* Modal de detalles de la muestra (similar a ListaResultados pero sin botón de finalizar) */}
      <Modal
        open={selectedResult !== null}
        onClose={() => setSelectedResult(null)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
        }}
      >
        <Box sx={{
          width: { xs: '90%', sm: '85%', md: '80%', lg: 900 },
          maxWidth: 1000,
          bgcolor: 'background.paper',
          borderRadius: 3,
          maxHeight: '90vh',
          overflowY: 'auto',
          position: 'relative',
          background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
          boxShadow: '0 15px 30px rgba(0, 0, 0, 0.15)',
          border: '1px solid rgba(57, 169, 0, 0.1)',
        }}>
          {selectedResult && (
            <>
              {/* Header con gradiente y botón de cerrar */}
              <Box sx={{
                background: 'linear-gradient(135deg, #39A900 0%, #4CAF50 60%, #66BB6A 100%)',
                borderRadius: '12px 12px 0 0',
                p: 3,
                position: 'relative',
                color: 'white',
                overflow: 'hidden',
                minHeight: 90,
                display: 'flex',
                alignItems: 'center',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: -10,
                  right: -10,
                  width: '80px',
                  height: '80px',
                  background: 'radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.03) 70%)',
                  borderRadius: '50%',
                }
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', zIndex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                    <Box sx={{
                      width: 70,
                      height: 70,
                      borderRadius: '50%',
                      background: 'rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backdropFilter: 'blur(10px)',
                      border: '2px solid rgba(255, 255, 255, 0.3)'
                    }}>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 'bold',
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        fontSize: '0.9rem',
                        lineHeight: 1
                      }}>
                        #{selectedResult.idMuestra}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="h5" sx={{ 
                        fontWeight: 'bold', 
                        mb: 0.5,
                        textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        letterSpacing: '0.3px',
                        fontSize: '1.4rem'
                      }}>
                        Análisis de Muestra
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Chip
                          label={selectedResult.estado}
                          size="small"
                          sx={{
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            color: selectedResult.estado === 'Finalizada' ? '#4caf50' : 
                                   selectedResult.estado === 'Rechazada' ? '#f44336' :
                                   selectedResult.estado === 'En análisis' ? '#ff9800' : '#2196f3',
                            fontWeight: 'bold',
                            fontSize: '0.8rem',
                            border: 'none',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                          }}
                        />
                        <Typography variant="body2" sx={{ 
                          opacity: 0.9,
                          fontSize: '0.85rem',
                          fontWeight: '500'
                        }}>
                          {selectedResult.fechaCreacion?.fecha && selectedResult.fechaCreacion?.hora 
                            ? `${selectedResult.fechaCreacion.fecha} ${selectedResult.fechaCreacion.hora}`
                            : selectedResult.fechaIngreso || 'No especificada'}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                  <IconButton
                    onClick={() => setSelectedResult(null)}
                    sx={{
                      color: 'white',
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      width: 40,
                      height: 40,
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                        transform: 'scale(1.1) rotate(90deg)',
                      },
                      transition: 'all 0.3s ease',
                      zIndex: 2,
                    }}
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>
              </Box>

              {/* Contenido del modal */}
              <Box sx={{ p: 3 }}>
                {/* Sección de resumen rápido */}
                <Box sx={{ mb: 3 }}>
                  <Grid container spacing={1.5}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{
                        background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
                        border: '1px solid #4caf50',
                        borderRadius: 2,
                        p: 1.5,
                        textAlign: 'center',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-3px)',
                          boxShadow: '0 6px 20px rgba(76, 175, 80, 0.25)'
                        }
                      }}>
                        <Typography variant="caption" sx={{ color: '#2e7d32', fontWeight: 'bold', mb: 0.5, display: 'block' }}>
                          VERIFICACIÓN
                        </Typography>
                        <Typography variant="subtitle1" sx={{ color: '#1b5e20', fontWeight: 'bold' }}>
                          {selectedResult.verificado ? '✓ Verificada' : '⚠ Pendiente'}
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{
                        background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                        border: '1px solid #2196f3',
                        borderRadius: 2,
                        p: 1.5,
                        textAlign: 'center',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-3px)',
                          boxShadow: '0 6px 20px rgba(33, 150, 243, 0.25)'
                        }
                      }}>
                        <Typography variant="caption" sx={{ color: '#1976d2', fontWeight: 'bold', mb: 0.5, display: 'block' }}>
                          PARÁMETROS
                        </Typography>
                        <Typography variant="subtitle1" sx={{ color: '#0d47a1', fontWeight: 'bold' }}>
                          {selectedResult.parametros?.length || 0}
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{
                        background: 'linear-gradient(135deg, #fff3e0 0%, #ffcc02 100%)',
                        border: '1px solid #ff9800',
                        borderRadius: 2,
                        p: 1.5,
                        textAlign: 'center',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-3px)',
                          boxShadow: '0 6px 20px rgba(255, 152, 0, 0.25)'
                        }
                      }}>
                        <Typography variant="caption" sx={{ color: '#f57c00', fontWeight: 'bold', mb: 0.5, display: 'block' }}>
                          TIPO ANÁLISIS
                        </Typography>
                        <Typography variant="subtitle1" sx={{ color: '#e65100', fontWeight: 'bold', fontSize: '0.85rem' }}>
                          {selectedResult.tipoAnalisis || 'N/A'}
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{
                        background: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd9 100%)',
                        border: '1px solid #e91e63',
                        borderRadius: 2,
                        p: 1.5,
                        textAlign: 'center',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-3px)',
                          boxShadow: '0 6px 20px rgba(233, 30, 99, 0.25)'
                        }
                      }}>
                        <Typography variant="caption" sx={{ color: '#c2185b', fontWeight: 'bold', mb: 0.5, display: 'block' }}>
                          RESULTADOS
                        </Typography>
                        <Typography variant="subtitle1" sx={{ color: '#880e4f', fontWeight: 'bold' }}>
                          {selectedResult.resultados ? Object.keys(selectedResult.resultados).length : 0}
                        </Typography>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>

                {/* Información básica de la muestra */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ 
                      p: 2, 
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%)',
                      border: '1px solid rgba(57, 169, 0, 0.2)',
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '60px',
                        height: '60px',
                        background: 'radial-gradient(circle, rgba(57, 169, 0, 0.1) 0%, transparent 70%)',
                        borderRadius: '50%',
                        transform: 'translate(20px, -20px)',
                      }
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box sx={{
                          width: 35,
                          height: 35,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #39A900, #4CAF50)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 1.5,
                          color: 'white',
                          fontSize: '1.2rem',
                          fontWeight: 'bold',
                          boxShadow: '0 3px 8px rgba(57, 169, 0, 0.3)'
                        }}>
                          🧪
                        </Box>
                        <Typography variant="h6" sx={{ 
                          color: '#39A900', 
                          fontWeight: 'bold',
                          fontSize: '1.1rem'
                        }}>
                          Información de la Muestra
                        </Typography>
                      </Box>
                      <Stack spacing={2}>
                        <Box sx={{
                          p: 1.5,
                          borderRadius: 2,
                          background: 'rgba(255, 255, 255, 0.8)',
                          border: '1px solid rgba(57, 169, 0, 0.1)',
                          backdropFilter: 'blur(10px)'
                        }}>
                          <Typography variant="caption" sx={{ 
                            color: '#2e7d32', 
                            fontWeight: 'bold', 
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            fontSize: '0.7rem',
                            mb: 0.5,
                            display: 'block'
                          }}>
                            ID de Muestra
                          </Typography>
                          <Typography variant="subtitle1" sx={{ 
                            fontWeight: 'bold', 
                            fontSize: '1.1rem',
                            color: '#1b5e20'
                          }}>
                            #{selectedResult.idMuestra}
                          </Typography>
                        </Box>
                        <Box sx={{
                          p: 1.5,
                          borderRadius: 2,
                          background: 'rgba(255, 255, 255, 0.8)',
                          border: '1px solid rgba(57, 169, 0, 0.1)',
                          backdropFilter: 'blur(10px)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <Box>
                            <Typography variant="caption" sx={{ 
                              color: '#2e7d32', 
                              fontWeight: 'bold',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              fontSize: '0.7rem',
                              mb: 0.5,
                              display: 'block'
                            }}>
                              Estado
                            </Typography>
                            <Chip
                              label={selectedResult.estado}
                              size="small"
                              sx={{
                                backgroundColor: selectedResult.estado === 'Finalizada' ? '#4caf50' : 
                                               selectedResult.estado === 'Rechazada' ? '#f44336' :
                                               selectedResult.estado === 'En análisis' ? '#ff9800' : '#2196f3',
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '0.75rem',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                '&:hover': {
                                  transform: 'scale(1.05)'
                                },
                                transition: 'all 0.2s ease'
                              }}
                            />
                          </Box>
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ color: '#666', fontWeight: 'bold' }}>
                            Fecha de Ingreso:
                          </Typography>
                          <Typography variant="body1">
                            {selectedResult.fechaCreacion?.fecha && selectedResult.fechaCreacion?.hora 
                              ? `${selectedResult.fechaCreacion.fecha} ${selectedResult.fechaCreacion.hora}`
                              : selectedResult.fechaIngreso || 'No especificada'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ color: '#666', fontWeight: 'bold' }}>
                            Tipo de Análisis:
                          </Typography>
                          <Typography variant="body1">
                            {selectedResult.tipoAnalisis || 'No especificado'}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ color: '#666', fontWeight: 'bold' }}>
                            Verificado:
                          </Typography>
                          <Chip
                            label={selectedResult.verificado ? 'Sí' : 'No'}
                            size="small"
                            color={selectedResult.verificado ? 'success' : 'warning'}
                            variant="outlined"
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                        {selectedResult.fechaRecepcion && selectedResult.fechaRecepcion !== selectedResult.fechaIngreso && (
                          <Box>
                            <Typography variant="body2" sx={{ color: '#666', fontWeight: 'bold' }}>
                              Fecha de Recepción:
                            </Typography>
                            <Typography variant="body1">
                              {selectedResult.fechaRecepcion}
                            </Typography>
                          </Box>
                        )}
                        {selectedResult.ubicacionMuestra && selectedResult.ubicacionMuestra !== 'No especificada' && (
                          <Box>
                            <Typography variant="body2" sx={{ color: '#666', fontWeight: 'bold' }}>
                              Ubicación de la Muestra:
                            </Typography>
                            <Typography variant="body1">
                              {selectedResult.ubicacionMuestra}
                            </Typography>
                          </Box>
                        )}
                        {selectedResult.observaciones && selectedResult.observaciones !== 'Sin observaciones' && (
                          <Box>
                            <Typography variant="body2" sx={{ color: '#666', fontWeight: 'bold' }}>
                              Observaciones:
                            </Typography>
                            <Typography variant="body1" sx={{ fontStyle: 'italic' }}>
                              {selectedResult.observaciones}
                            </Typography>
                          </Box>
                        )}
                        {selectedResult.parametros && selectedResult.parametros.length > 0 && (
                          <Box>
                            <Typography variant="body2" sx={{ color: '#666', fontWeight: 'bold', mb: 1 }}>
                              Parámetros Solicitados:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selectedResult.parametros.map((param, index) => (
                                <Chip
                                  key={index}
                                  label={typeof param === 'string' ? param : param.nombre || param}
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
                            </Box>
                          </Box>
                        )}

                        {/* Información adicional crítica */}
                        {selectedResult.rechazoMuestra?.motivo && (
                          <Alert severity="error" 
                            icon={<ErrorIcon />}
                            sx={{ 
                              borderRadius: 2,
                              border: '1px solid #f44336',
                              backgroundColor: '#ffebee',
                              '& .MuiAlert-icon': {
                                color: '#d32f2f'
                              }
                            }}
                          >
                            <Box>
                              <Typography variant="subtitle2" sx={{ 
                                color: '#d32f2f', 
                                fontWeight: 'bold',
                                mb: 1
                              }}>
                                Motivo de Rechazo
                              </Typography>
                              <Typography variant="body2" sx={{ 
                                color: '#c62828',
                                mb: selectedResult.rechazoMuestra.fecha ? 1 : 0
                              }}>
                                {selectedResult.rechazoMuestra.motivo}
                              </Typography>
                              {selectedResult.rechazoMuestra.fecha && (
                                <Typography variant="caption" sx={{ 
                                  color: '#666', 
                                  fontStyle: 'italic',
                                  display: 'block'
                                }}>
                                  📅 {selectedResult.rechazoMuestra.fecha}
                                </Typography>
                              )}
                            </Box>
                          </Alert>
                        )}

                        {selectedResult.condicionesAmbientales && (
                          <Box>
                            <Typography variant="body2" sx={{ color: '#666', fontWeight: 'bold' }}>
                              Condiciones Ambientales:
                            </Typography>
                            <Typography variant="body1">
                              {typeof selectedResult.condicionesAmbientales === 'object' 
                                ? Object.entries(selectedResult.condicionesAmbientales)
                                    .map(([key, value]) => `${key}: ${value}`)
                                    .join(', ')
                                : selectedResult.condicionesAmbientales}
                            </Typography>
                          </Box>
                        )}

                        {selectedResult.planMuestreo && (
                          <Box>
                            <Typography variant="body2" sx={{ color: '#666', fontWeight: 'bold' }}>
                              Plan de Muestreo:
                            </Typography>
                            <Typography variant="body1">
                              {selectedResult.planMuestreo}
                            </Typography>
                          </Box>
                        )}

                        {selectedResult.preservacion && (
                          <Box>
                            <Typography variant="body2" sx={{ color: '#666', fontWeight: 'bold' }}>
                              Preservación:
                            </Typography>
                            <Typography variant="body1">
                              {selectedResult.preservacion}
                            </Typography>
                          </Box>
                        )}

                        {selectedResult.metodosConservacion && (
                          <Box>
                            <Typography variant="body2" sx={{ color: '#666', fontWeight: 'bold' }}>
                              Métodos de Conservación:
                            </Typography>
                            <Typography variant="body1">
                              {Array.isArray(selectedResult.metodosConservacion) 
                                ? selectedResult.metodosConservacion.join(', ')
                                : selectedResult.metodosConservacion}
                            </Typography>
                          </Box>
                        )}

                        {selectedResult.temperatura && (
                          <Box>
                            <Typography variant="body2" sx={{ color: '#666', fontWeight: 'bold' }}>
                              Temperatura:
                            </Typography>
                            <Typography variant="body1">
                              {selectedResult.temperatura}°C
                            </Typography>
                          </Box>
                        )}

                        {selectedResult.tiempoTransporte && (
                          <Box>
                            <Typography variant="body2" sx={{ color: '#666', fontWeight: 'bold' }}>
                              Tiempo de Transporte:
                            </Typography>
                            <Typography variant="body1">
                              {selectedResult.tiempoTransporte}
                            </Typography>
                          </Box>
                        )}

                        {selectedResult.responsableMuestreo && (
                          <Box>
                            <Typography variant="body2" sx={{ color: '#666', fontWeight: 'bold' }}>
                              Responsable de Muestreo:
                            </Typography>
                            <Typography variant="body1">
                              {selectedResult.responsableMuestreo}
                            </Typography>
                          </Box>
                        )}

                        {selectedResult.tipoMuestra && (
                          <Box>
                            <Typography variant="body2" sx={{ color: '#666', fontWeight: 'bold' }}>
                              Tipo de Muestra:
                            </Typography>
                            <Typography variant="body1">
                              {selectedResult.tipoMuestra}
                            </Typography>
                          </Box>
                        )}

                        {selectedResult.matriz && (
                          <Box>
                            <Typography variant="body2" sx={{ color: '#666', fontWeight: 'bold' }}>
                              Matriz:
                            </Typography>
                            <Typography variant="body1">
                              {selectedResult.matriz}
                            </Typography>
                          </Box>
                        )}

                        {selectedResult.coordenadas && (
                          <Box>
                            <Typography variant="body2" sx={{ color: '#666', fontWeight: 'bold' }}>
                              Coordenadas:
                            </Typography>
                            <Typography variant="body1">
                              {typeof selectedResult.coordenadas === 'object' 
                                ? `Lat: ${selectedResult.coordenadas.latitud || 'N/A'}, Lng: ${selectedResult.coordenadas.longitud || 'N/A'}`
                                : selectedResult.coordenadas}
                            </Typography>
                          </Box>
                        )}

                        {selectedResult.altitud && (
                          <Box>
                            <Typography variant="body2" sx={{ color: '#666', fontWeight: 'bold' }}>
                              Altitud:
                            </Typography>
                            <Typography variant="body1">
                              {selectedResult.altitud} msnm
                            </Typography>
                          </Box>
                        )}

                        {selectedResult.condicionesMeteoro && (
                          <Box>
                            <Typography variant="body2" sx={{ color: '#666', fontWeight: 'bold' }}>
                              Condiciones Meteorológicas:
                            </Typography>
                            <Typography variant="body1">
                              {typeof selectedResult.condicionesMeteoro === 'object'
                                ? Object.entries(selectedResult.condicionesMeteoro)
                                    .map(([key, value]) => `${key}: ${value}`)
                                    .join(', ')
                                : selectedResult.condicionesMeteoro}
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                    </Paper>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Paper elevation={2} sx={{ 
                      p: 2, 
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, #e3f2fd 0%, #e1f5fe 100%)',
                      border: '1px solid rgba(33, 150, 243, 0.2)',
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '60px',
                        height: '60px',
                        background: 'radial-gradient(circle, rgba(33, 150, 243, 0.1) 0%, transparent 70%)',
                        borderRadius: '50%',
                        transform: 'translate(20px, -20px)',
                      }
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Box sx={{
                          width: 35,
                          height: 35,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #2196F3, #42A5F5)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 1.5,
                          color: 'white',
                          fontSize: '1.2rem',
                          fontWeight: 'bold',
                          boxShadow: '0 3px 8px rgba(33, 150, 243, 0.3)'
                        }}>
                          👤
                        </Box>
                        <Typography variant="h6" sx={{ 
                          color: '#2196F3', 
                          fontWeight: 'bold',
                          fontSize: '1.1rem'
                        }}>
                          Detalles del Cliente
                        </Typography>
                      </Box>
                      <Stack spacing={2}>
                        <Box sx={{
                          p: 1.5,
                          borderRadius: 2,
                          background: 'rgba(255, 255, 255, 0.8)',
                          border: '1px solid rgba(33, 150, 243, 0.1)',
                          backdropFilter: 'blur(10px)'
                        }}>
                          <Typography variant="caption" sx={{ 
                            color: '#1976d2', 
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            fontSize: '0.7rem',
                            mb: 0.5,
                            display: 'block'
                          }}>
                            Nombre del Cliente
                          </Typography>
                          <Typography variant="subtitle1" sx={{ 
                            fontWeight: 'bold', 
                            fontSize: '1.1rem',
                            color: '#0d47a1'
                          }}>
                            {selectedResult.cliente?.nombre || 'Sin especificar'}
                          </Typography>
                        </Box>
                        <Grid container spacing={1}>
                          <Grid item xs={6}>
                            <Box sx={{
                              p: 1.5,
                              borderRadius: 2,
                              background: 'rgba(255, 255, 255, 0.8)',
                              border: '1px solid rgba(33, 150, 243, 0.1)',
                              backdropFilter: 'blur(10px)'
                            }}>
                              <Typography variant="caption" sx={{ 
                                color: '#1976d2', 
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                fontSize: '0.7rem',
                                mb: 0.5,
                                display: 'block'
                              }}>
                                Documento
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: '600', color: '#0d47a1' }}>
                                {selectedResult.cliente?.documento || 'No especificado'}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box sx={{
                              p: 1.5,
                              borderRadius: 2,
                              background: 'rgba(255, 255, 255, 0.8)',
                              border: '1px solid rgba(33, 150, 243, 0.1)',
                              backdropFilter: 'blur(10px)'
                            }}>
                              <Typography variant="caption" sx={{ 
                                color: '#1976d2', 
                                fontWeight: 'bold',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                fontSize: '0.7rem',
                                mb: 0.5,
                                display: 'block'
                              }}>
                                Teléfono
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: '600', color: '#0d47a1' }}>
                                {selectedResult.cliente?.telefono || 'No especificado'}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                        <Box sx={{
                          p: 1.5,
                          borderRadius: 2,
                          background: 'rgba(255, 255, 255, 0.8)',
                          border: '1px solid rgba(33, 150, 243, 0.1)',
                          backdropFilter: 'blur(10px)'
                        }}>
                          <Typography variant="caption" sx={{ 
                            color: '#1976d2', 
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            fontSize: '0.7rem',
                            mb: 0.5,
                            display: 'block'
                          }}>
                            Email
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: '600', color: '#0d47a1' }}>
                            {selectedResult.cliente?.email || selectedResult.cliente?.correo || 'No especificado'}
                          </Typography>
                        </Box>
                        {selectedResult.cliente?.direccion && selectedResult.cliente.direccion !== 'No especificada' && (
                          <Box>
                            <Typography variant="body2" sx={{ color: '#666', fontWeight: 'bold' }}>
                              Dirección:
                            </Typography>
                            <Typography variant="body1">
                              {selectedResult.cliente.direccion}
                            </Typography>
                          </Box>
                        )}
                        {selectedResult.cliente?.ciudad && selectedResult.cliente.ciudad !== 'No especificada' && (
                          <Box>
                            <Typography variant="body2" sx={{ color: '#666', fontWeight: 'bold' }}>
                              Ciudad:
                            </Typography>
                            <Typography variant="body1">
                              {selectedResult.cliente.ciudad}
                            </Typography>
                          </Box>
                        )}
                      </Stack>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Resultados del análisis */}
                {selectedResult.resultados && Object.keys(selectedResult.resultados).length > 0 && (
                  <Paper elevation={4} sx={{ 
                    p: 0, 
                    mb: 4,
                    borderRadius: 4,
                    background: 'linear-gradient(135deg, #fff3e0 0%, #fef7ed 100%)',
                    border: '2px solid rgba(255, 152, 0, 0.2)',
                    overflow: 'hidden',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      width: '150px',
                      height: '150px',
                      background: 'radial-gradient(circle, rgba(255, 152, 0, 0.1) 0%, transparent 70%)',
                      borderRadius: '50%',
                      transform: 'translate(50px, -50px)',
                    }
                  }}>
                    <Box sx={{ 
                      background: 'linear-gradient(135deg, #FF9800 0%, #FFB74D 100%)',
                      p: 3,
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <Box sx={{
                        width: 50,
                        height: 50,
                        borderRadius: '50%',
                        background: 'rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                        color: 'white',
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        backdropFilter: 'blur(10px)',
                        border: '2px solid rgba(255, 255, 255, 0.3)'
                      }}>
                        📊
                      </Box>
                      <Typography variant="h6" sx={{ 
                        color: 'white', 
                        fontWeight: 'bold',
                        fontSize: '1.3rem',
                        textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}>
                        Resultados del Análisis
                      </Typography>
                    </Box>
                    <TableContainer sx={{ 
                      borderRadius: 0,
                      background: 'rgba(255, 255, 255, 0.9)',
                      backdropFilter: 'blur(10px)'
                    }}>
                      <Table>
                        <TableHead sx={{ 
                          background: 'linear-gradient(90deg, #FFB74D 0%, #FFCC02 100%)'
                        }}>
                          <TableRow>
                            <TableCell sx={{ 
                              fontWeight: 'bold', 
                              color: 'white',
                              fontSize: '1rem',
                              textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                            }}>
                              Parámetro
                            </TableCell>
                            <TableCell sx={{ 
                              fontWeight: 'bold', 
                              color: 'white',
                              fontSize: '1rem',
                              textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                            }}>
                              Resultado
                            </TableCell>
                            <TableCell sx={{ 
                              fontWeight: 'bold', 
                              color: 'white',
                              fontSize: '1rem',
                              textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                            }}>
                              Unidad
                            </TableCell>
                            <TableCell sx={{ 
                              fontWeight: 'bold', 
                              color: 'white',
                              fontSize: '1rem',
                              textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                            }}>
                              Estado
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {Object.entries(selectedResult.resultados).map(([parametro, datos], index) => (
                            <TableRow key={index} sx={{
                              '&:nth-of-type(odd)': { 
                                backgroundColor: 'rgba(255, 152, 0, 0.05)' 
                              },
                              '&:hover': { 
                                backgroundColor: 'rgba(255, 152, 0, 0.15)',
                                transform: 'scale(1.01)',
                                transition: 'all 0.2s ease'
                              },
                              transition: 'all 0.2s ease'
                            }}>
                              <TableCell sx={{ 
                                fontWeight: 'bold',
                                fontSize: '0.95rem',
                                color: '#e65100'
                              }}>
                                {parametro}
                              </TableCell>
                              <TableCell sx={{ 
                                fontWeight: 'bold', 
                                color: datos?.resultado ? '#2e7d32' : '#d32f2f',
                                fontSize: '1rem'
                              }}>
                                {datos?.resultado || 'Pendiente'}
                              </TableCell>
                              <TableCell sx={{ 
                                color: '#666',
                                fontWeight: '500'
                              }}>
                                {datos?.unidad || '-'}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={datos?.resultado ? 'Completado' : 'Pendiente'}
                                  size="small"
                                  sx={{
                                    backgroundColor: datos?.resultado ? '#4caf50' : '#ff9800',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                    '&:hover': {
                                      transform: 'scale(1.05)'
                                    },
                                    transition: 'all 0.2s ease'
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                )}

                {/* Historial de cambios */}
                {selectedResult.historialCambios && selectedResult.historialCambios.length > 0 && (
                  <Paper elevation={2} sx={{ 
                    p: 3,
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd9 100%)',
                    border: '1px solid rgba(233, 30, 99, 0.1)'
                  }}>
                    <Typography variant="h6" sx={{ 
                      color: '#E91E63', 
                      fontWeight: 'bold',
                      mb: 3,
                      borderBottom: '2px solid #E91E63',
                      pb: 1
                    }}>
                      Historial de Cambios
                    </Typography>
                    {selectedResult.historialCambios.map((cambio, index) => (
                      <Accordion key={index} sx={{ 
                        mb: 2,
                        borderRadius: 2,
                        '&:before': { display: 'none' },
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}>
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon />}
                          sx={{
                            backgroundColor: '#E91E63',
                            color: 'white',
                            borderRadius: '8px 8px 0 0',
                            '&:hover': {
                              backgroundColor: '#C2185B',
                            },
                            '& .MuiAccordionSummary-content': {
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              fontWeight: 'bold',
                              fontSize: '0.9rem',
                            }
                          }}
                        >
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            Cambio #{index + 1}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            {cambio.fecha?.fecha && cambio.fecha?.hora 
                              ? `${cambio.fecha.fecha} ${cambio.fecha.hora}`
                              : formatearFecha(cambio.fecha)}
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 3 }}>
                          <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                              <Box sx={{ 
                                p: 2, 
                                backgroundColor: 'rgba(233, 30, 99, 0.1)', 
                                borderRadius: 2
                              }}>
                                <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8rem', mb: 0.5 }}>
                                  REALIZADO POR
                                </Typography>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#E91E63' }}>
                                  {cambio.nombre || 'No disponible'}
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} md={6}>
                              <Box sx={{ 
                                p: 2, 
                                backgroundColor: 'rgba(233, 30, 99, 0.1)', 
                                borderRadius: 2
                              }}>
                                <Typography variant="body2" sx={{ color: '#666', fontSize: '0.8rem', mb: 0.5 }}>
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
                          </Grid>
                        </AccordionDetails>
                      </Accordion>
                    ))}
                  </Paper>
                )}

                {/* Botón de cerrar compacto */}
                <Box sx={{ 
                  mt: 3, 
                  display: 'flex', 
                  justifyContent: 'center',
                  borderTop: '1px solid rgba(57, 169, 0, 0.1)',
                  pt: 2,
                  background: 'rgba(255,255,255,0.5)',
                  borderRadius: '0 0 12px 12px',
                  mx: -3,
                  mb: -3,
                  px: 3,
                  pb: 2
                }}>
                  <Button 
                    variant="contained"
                    onClick={() => setSelectedResult(null)}
                    startIcon={<CloseIcon />}
                    sx={{ 
                      background: 'linear-gradient(135deg, #39A900 0%, #4CAF50 100%)',
                      color: 'white',
                      fontWeight: 'bold', 
                      px: 3,
                      py: 1,
                      borderRadius: 2,
                      fontSize: '0.9rem',
                      boxShadow: '0 3px 12px rgba(57, 169, 0, 0.3)',
                      border: 'none',
                      '&:hover': { 
                        background: 'linear-gradient(135deg, #2d8000 0%, #388e3c 100%)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 4px 16px rgba(57, 169, 0, 0.4)',
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

      {/* Snackbar para notificaciones */}
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