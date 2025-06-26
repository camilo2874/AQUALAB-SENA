import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Snackbar,
  Alert,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import axios from 'axios';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

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

// Umbral para advertencias (5% del rango)
const WARNING_THRESHOLD = 0.05;

// Rangos predefinidos para los análisis (como respaldo)
const PREDEFINED_RANGES = {
  // Análisis Fisicoquímicos
  'pH': { min: 4.0, max: 10.0 },
  'Conductividad': { min: 0, max: 1000 },
  'Color Aparente': { min: 0, max: 50 },
  'Alcalinidad Total': { min: 0, max: 500 },
  'Dureza Total': { min: 0, max: 500 },
  'Dureza Cálcica': { min: 0, max: 400 },
  'Turbidez': { min: 0, max: 5 },
  'Sólidos Totales Disueltos': { min: 0, max: 1500 },
  'Oxígeno Disuelto': { min: 0, max: 15 },
  'Temperatura': { min: 0, max: 40 },
  'Cloruros': { min: 0, max: 250 },
  'Nitratos': { min: 0, max: 50 },
  'Fosfatos': { min: 0, max: 5 },
  'Sulfatos': { min: 0, max: 250 },
  'Cloro Residual': { min: 0, max: 5 },
  // Análisis Microbiológicos
  'Coliformes Totales': { min: 0, max: 1000 },
  'Coliformes Fecales': { min: 0, max: 200 },
  'Escherichia coli': { min: 0, max: 100 },
  'Bacterias Aerobias Mesófilas': { min: 0, max: 10000 },
};

const formatearFecha = (fecha) => {
  if (!fecha) return 'Fecha no disponible';
  
  if (typeof fecha === 'object' && fecha.fecha && fecha.hora) {
    return `${fecha.fecha} ${fecha.hora}`;
  }
  
  return 'Fecha inválida';
};

const RegistrarResultados = () => {
  const { idMuestra } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [resultadoExistente, setResultadoExistente] = useState(null);
  const [muestraInfo, setMuestraInfo] = useState(null);
  const [historialCambios, setHistorialCambios] = useState([]);
  const [openConfirm, setOpenConfirm] = useState(false);
  
  // Estado para los resultados dinámicos
  const [resultados, setResultados] = useState({
    resultados: {},
    observaciones: ''
  });
  
  // Estados para validación
  const [errors, setErrors] = useState({});
  const [warnings, setWarnings] = useState({});

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  const debounceTimeout = useRef();

  // Memoizar validación y parseo de rangos
  const parseRangeString = useCallback((rangeString) => {
    if (typeof rangeString !== 'string') return null;
    const parts = rangeString.split(' - ');
    if (parts.length !== 2) return null;
    const min = parseFloat(parts[0]);
    const max = parseFloat(parts[1]);
    if (isNaN(min) || isNaN(max)) return null;
    return { min, max };
  }, []);

  const getRangeForAnalysis = useCallback((analisis) => {
    if (analisis.rango) {
      if (typeof analisis.rango === 'object' && 'min' in analisis.rango && 'max' in analisis.rango) {
        return analisis.rango;
      }
      const parsedRange = parseRangeString(analisis.rango);
      if (parsedRange) return parsedRange;
    }
    return PREDEFINED_RANGES[analisis.nombre] || null;
  }, [parseRangeString]);

  const validateInput = useCallback((analisis, value) => {
    const range = getRangeForAnalysis(analisis);
    if (!range) return { error: false, warning: false, message: '' };
    const numValue = parseFloat(value);
    if (isNaN(numValue) && value !== '') {
      return {
        error: true,
        warning: false,
        message: 'Por favor, ingrese un valor numérico válido'
      };
    }
    const { min, max } = range;
    const rangeDiff = max - min;
    const warningMin = min + rangeDiff * WARNING_THRESHOLD;
    const warningMax = max - rangeDiff * WARNING_THRESHOLD;
    if (numValue < min || numValue > max) {
      return {
        error: false,
        warning: true,
        message: `Valor fuera del rango recomendado (${min} - ${max} ${analisis.unidad || ''}). Se puede registrar de todas formas.`
      };
    }
    if (numValue < warningMin || numValue > warningMax) {
      return {
        error: false,
        warning: true,
        message: `Valor cerca del límite recomendado (${min} - ${max} ${analisis.unidad || ''})`
      };
    }
    return { error: false, warning: false, message: '' };
  }, [getRangeForAnalysis]);

  // Memoizar handleChange para evitar renders innecesarios
  const handleChange = useCallback((analisis, campo) => (e) => {
    const { value } = e.target;
    
    if (campo === 'observaciones') {
      setResultados(prev => ({
        ...prev,
        observaciones: value
      }));
    } else {
      setResultados(prev => ({
        ...prev,
        resultados: {
          ...prev.resultados,
          [analisis.nombre]: {
            ...prev.resultados[analisis.nombre],
            [campo]: value
          }
        }
      }));

      // Validar el valor ingresado
      if (campo === 'valor') {
        clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(() => {
          const validation = validateInput(analisis, value);
          setErrors(prev => ({
            ...prev,
            [analisis.nombre]: validation.error ? validation.message : ''
          }));
          setWarnings(prev => ({
            ...prev,
            [analisis.nombre]: validation.warning ? validation.message : ''
          }));
        }, 250);
      }
    }
  }, [validateInput]);

  // Memoizar handleSubmit
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    // Verificar si hay errores críticos (solo valores no numéricos) antes de abrir el diálogo
    const hasCriticalErrors = Object.values(errors).some(error => error !== '' && error.includes('numérico válido'));
    if (hasCriticalErrors) {
      setSnackbar({
        open: true,
        message: 'Por favor, corrija los valores no numéricos antes de guardar',
        severity: 'error'
      });
      return;
    }
    setOpenConfirm(true);
  }, [errors]);

  // Memoizar handleConfirmSubmit
  const handleConfirmSubmit = useCallback(async () => {
    setOpenConfirm(false);
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      const endpoint = resultadoExistente
        ? `${API_URLS.RESULTADOS}/editar/${idMuestra}`
        : `${API_URLS.RESULTADOS}/registrar/${idMuestra}`;
      
      const method = resultadoExistente ? 'put' : 'post';

      // Formatear los resultados
      const resultadosFormateados = {};
      Object.entries(resultados.resultados).forEach(([nombre, datos]) => {
        const analisisEncontrado = muestraInfo.analisisSeleccionados.find(
          a => a.nombre === nombre
        );
        if (analisisEncontrado) {
          resultadosFormateados[analisisEncontrado.nombre] = {
            valor: parseFloat(datos.valor) || 0,
            unidad: datos.unidad || analisisEncontrado.unidad
          };
        }
      });
      
      const response = await axios[method](
        endpoint,
        {
          resultados: resultadosFormateados,
          observaciones: resultados.observaciones
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data?.success) {
        if (response.data.data) {
          setResultadoExistente(response.data.data);
          setHistorialCambios(response.data.data.historialCambios || []);
        }

        setSnackbar({
          open: true,
          message: resultadoExistente ? 'Resultados actualizados correctamente' : 'Resultados registrados correctamente',
          severity: 'success'
        });
        // Redirigir a la lista de muestras después de guardar
        setTimeout(() => navigate('/muestras'), 2000);
      }

    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error: ${error.response?.data?.message || 'Error al procesar la solicitud'}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [resultadoExistente, idMuestra, resultados, muestraInfo, navigate]);

  // useEffect para cargar datos de la muestra y resultados existentes
  useEffect(() => {
    let isMounted = true;
    const verificarMuestra = async () => {
      try {
        const token = localStorage.getItem('token');
        setLoading(true);
        
        // Obtener información de la muestra
        const muestraResponse = await axios.get(
          `${API_URLS.MUESTRAS}/${idMuestra}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (!muestraResponse.data?.data?.muestra) {
          throw new Error('No se encontró la muestra');
        }

        const muestraData = muestraResponse.data.data.muestra;
        if (!isMounted) return;
        setMuestraInfo(muestraData);

        // Intentar obtener los resultados existentes
        try {
          const resultadosResponse = await axios.get(
            `${API_URLS.RESULTADOS}/muestra/${idMuestra}`,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          
          if (resultadosResponse.data?.success && resultadosResponse.data?.data) {
            const resultado = resultadosResponse.data.data;
            setResultadoExistente(resultado);
            setHistorialCambios(resultado.historialCambios || []);

            // Formatear valores existentes
            const resultadosExistentes = {};
            Object.entries(resultado.resultados).forEach(([nombre, datos]) => {
              resultadosExistentes[nombre] = {
                valor: datos.valor,
                unidad: datos.unidad
              };
            });

            setResultados({
              resultados: resultadosExistentes,
              observaciones: resultado.observaciones || ''
            });
          } else {
            // Inicializar con valores vacíos si no hay datos
            const resultadosIniciales = {};
            muestraData.analisisSeleccionados.forEach(analisis => {
              resultadosIniciales[analisis.nombre] = {
                valor: '',
                unidad: analisis.unidad || 'mg/L'
              };
            });

            setResultados({
              resultados: resultadosIniciales,
              observaciones: ''
            });
          }
        } catch (error) {
          // Manejar diferentes tipos de error de forma silenciosa
          if (error.response?.status === 404) {
            // 404 es esperado cuando no hay resultados previos - manejar silenciosamente
            if (process.env.NODE_ENV === 'development') {
              console.info('ℹ️ No hay resultados previos para esta muestra (comportamiento normal)');
            }
          } else {
            // Solo registrar otros errores en desarrollo
            if (process.env.NODE_ENV === 'development') {
              console.warn('⚠️ Error al obtener resultados previos:', error.response?.status || error.message);
            }
          }
          
          // Inicializar con valores vacíos independientemente del tipo de error
          const resultadosIniciales = {};
          muestraData.analisisSeleccionados.forEach(analisis => {
            resultadosIniciales[analisis.nombre] = {
              valor: '',
              unidad: analisis.unidad || 'mg/L'
            };
          });

          setResultados({
            resultados: resultadosIniciales,
            observaciones: ''
          });
        }
      } catch (error) {
        // Manejo mejorado de errores de carga inicial
        console.error('❌ Error al cargar la información de la muestra:', error.message);
        
        let errorMessage = 'Error al cargar la información de la muestra';
        
        if (error.response?.status === 404) {
          errorMessage = 'La muestra solicitada no fue encontrada';
        } else if (error.response?.status === 401) {
          errorMessage = 'No tienes permisos para acceder a esta muestra';
        } else if (error.response?.status >= 500) {
          errorMessage = 'Error del servidor. Por favor, intenta de nuevo más tarde';
        } else if (!navigator.onLine) {
          errorMessage = 'Error de conexión. Verifica tu conexión a internet';
        }
        
        setSnackbar({
          open: true,
          message: errorMessage,
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    verificarMuestra();
    return () => { isMounted = false; };
  }, [idMuestra]);

  // Memoizar análisis seleccionados
  const analisisSeleccionados = useMemo(() => muestraInfo?.analisisSeleccionados || [], [muestraInfo]);

  // Debounce para validación de inputs numéricos
  const debounceValidate = useRef();

  // Mejorar el control de guardado: bloquear solo si hay errores críticos (valores no numéricos)
  const hasCriticalErrors = useMemo(() => Object.values(errors).some(error => error !== '' && error.includes('numérico válido')), [errors]);
  const hasWarnings = useMemo(() => Object.values(warnings).some(w => w !== ''), [warnings]);
  const disableSave = loading || hasCriticalErrors;

  // Foco automático en el primer campo con error crítico al intentar guardar
  const firstErrorRef = useRef();
  useEffect(() => {
    if (hasCriticalErrors && firstErrorRef.current) {
      firstErrorRef.current.focus();
    }
  }, [hasCriticalErrors]);

  return (
    <Box sx={{ maxWidth: 1200, margin: 'auto', p: 2 }}>
      {/* Header Principal Mejorado */}
      <Paper 
        elevation={4}
        sx={{ 
          p: 4, 
          mb: 3, 
          background: 'linear-gradient(135deg, #39A900 0%, #2d8000 100%)',
          color: 'white',
          borderRadius: 3,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 50%)',
            pointerEvents: 'none'
          }
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
            {resultadoExistente ? '🔬 Editar Resultados' : '📋 Registrar Resultados'}
          </Typography>
          <Typography variant="h6" align="center" sx={{ opacity: 0.95, fontWeight: 500 }}>
            Sistema de Gestión de Análisis - AQUALAB SENA
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Box sx={{ 
              backgroundColor: 'rgba(255,255,255,0.2)', 
              borderRadius: 2, 
              px: 3, 
              py: 1,
              backdropFilter: 'blur(10px)'
            }}>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                Muestra: {idMuestra}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Información de la Muestra Mejorada */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={3}
            sx={{ 
              p: 3, 
              textAlign: 'center',
              borderLeft: '5px solid #39A900',
              borderRadius: 2,
              transition: 'all 0.3s ease',
              '&:hover': { 
                transform: 'translateY(-4px)', 
                boxShadow: '0 8px 25px rgba(57, 169, 0, 0.15)' 
              },
              background: 'linear-gradient(145deg, #ffffff 0%, #f8fff8 100%)'
            }}
          >
            <Box sx={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: 50,
              height: 50,
              borderRadius: '50%',
              backgroundColor: '#39A900',
              mb: 2
            }}>
              <Typography variant="h6" sx={{ color: 'white' }}>🏷️</Typography>
            </Box>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 'bold', display: 'block' }}>
              ID de Muestra
            </Typography>
            <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold', mt: 1 }}>
              {idMuestra}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper 
            elevation={3}
            sx={{ 
              p: 3, 
              textAlign: 'center',
              borderLeft: '5px solid #2196f3',
              borderRadius: 2,
              transition: 'all 0.3s ease',
              '&:hover': { 
                transform: 'translateY(-4px)', 
                boxShadow: '0 8px 25px rgba(33, 150, 243, 0.15)' 
              },
              background: 'linear-gradient(145deg, #ffffff 0%, #f0f7ff 100%)'
            }}
          >
            <Box sx={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: 50,
              height: 50,
              borderRadius: '50%',
              backgroundColor: '#2196f3',
              mb: 2
            }}>
              <Typography variant="h6" sx={{ color: 'white' }}>📊</Typography>
            </Box>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 'bold', display: 'block' }}>
              Estado
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: muestraInfo?.estado === 'Pendiente' ? '#ff9800' : 
                                   muestraInfo?.estado === 'En Proceso' ? '#2196f3' : '#4caf50',
                  mr: 1,
                  animation: 'pulse 2s infinite'
                }}
              />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                {muestraInfo?.estado || 'Cargando...'}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper 
            elevation={3}
            sx={{ 
              p: 3, 
              textAlign: 'center',
              borderLeft: '5px solid #ff9800',
              borderRadius: 2,
              transition: 'all 0.3s ease',
              '&:hover': { 
                transform: 'translateY(-4px)', 
                boxShadow: '0 8px 25px rgba(255, 152, 0, 0.15)' 
              },
              background: 'linear-gradient(145deg, #ffffff 0%, #fff8f0 100%)'
            }}
          >
            <Box sx={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: 50,
              height: 50,
              borderRadius: '50%',
              backgroundColor: '#ff9800',
              mb: 2
            }}>
              <Typography variant="h6" sx={{ color: 'white' }}>🧪</Typography>
            </Box>
            <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 'bold', display: 'block' }}>
              Tipo de Análisis
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mt: 1 }}>
              {muestraInfo?.tipoAnalisis || 'N/A'}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Detalles de Análisis Mejorados */}
      {muestraInfo && (
        <Paper 
          elevation={3}
          sx={{ 
            p: 4, 
            mb: 3, 
            borderRadius: 3,
            border: '1px solid #e0e0e0',
            background: 'linear-gradient(145deg, #ffffff 0%, #f9f9f9 100%)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Box sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: '#39A900',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mr: 2
              }}>
                <Typography variant="h6" sx={{ color: 'white' }}>🔬</Typography>
              </Box>
              <Box>
                <Typography variant="h5" sx={{ color: '#39A900', fontWeight: 'bold' }}>
                  Análisis Programados
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {muestraInfo.analisisSeleccionados?.length || 0} parámetros a evaluar
                </Typography>
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 3 }}>
              {muestraInfo.analisisSeleccionados?.map((analisis, index) => (
                <Box
                  key={index}
                  sx={{
                    backgroundColor: '#f8fff8',
                    border: '2px solid #e8f5e8',
                    borderRadius: 3,
                    px: 3,
                    py: 2,
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#2d5016',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: '#39A900',
                      color: 'white',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(57, 169, 0, 0.3)'
                    },
                    cursor: 'default'
                  }}
                >
                  {analisis.nombre}
                </Box>
              ))}
            </Box>
          </Box>
          
          {/* Decorative background element */}
          <Box sx={{
            position: 'absolute',
            top: -20,
            right: -20,
            width: 100,
            height: 100,
            borderRadius: '50%',
            backgroundColor: 'rgba(57, 169, 0, 0.05)',
            zIndex: 0
          }} />
        </Paper>
      )}

      {/* Indicador de Carga Mejorado */}
      {loading && (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: '400px',
          textAlign: 'center'
        }}>
          <Paper 
            elevation={3}
            sx={{ 
              p: 4, 
              borderRadius: 3,
              background: 'linear-gradient(145deg, #ffffff 0%, #f8fff8 100%)',
              border: '1px solid #e8f5e8'
            }}
          >
            <Box sx={{ position: 'relative', display: 'inline-flex', mb: 3 }}>
              <CircularProgress 
                size={60} 
                thickness={4}
                sx={{ 
                  color: '#39A900',
                  animationDuration: '550ms'
                }} 
              />
              <Box sx={{
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                position: 'absolute',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Typography variant="h6" sx={{ color: '#39A900' }}>
                  🔬
                </Typography>
              </Box>
            </Box>
            <Typography variant="h6" sx={{ color: '#39A900', fontWeight: 'bold', mb: 1 }}>
              Cargando Información
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Obteniendo datos de la muestra y resultados previos...
            </Typography>
          </Paper>
        </Box>
      )}

      {/* Mensaje informativo mejorado */}
      {!loading && muestraInfo && !resultadoExistente && (
        <Alert 
          severity="info" 
          sx={{ 
            mb: 3, 
            bgcolor: '#e3f2fd', 
            color: '#1565c0', 
            fontWeight: 'bold',
            borderRadius: 3,
            border: '1px solid #bbdefb'
          }}
          icon={<Typography sx={{ fontSize: '1.5rem' }}>📋</Typography>}
        >
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 0.5 }}>
              Primera vez registrando resultados
            </Typography>
            <Typography variant="body2">
              No existen resultados previos para esta muestra. Puedes comenzar a registrar los nuevos resultados de análisis.
            </Typography>
          </Box>
        </Alert>
      )}

      {!loading && muestraInfo && (
        <form onSubmit={handleSubmit} autoComplete="off">
          {/* Header del Formulario */}
          <Paper 
            elevation={2}
            sx={{ 
              p: 3, 
              mb: 4, 
              borderRadius: 3,
              background: 'linear-gradient(135deg, #f8fff8 0%, #e8f5e8 100%)',
              border: '1px solid #39A900'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box sx={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  backgroundColor: '#39A900',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 3
                }}>
                  <Typography variant="h5" sx={{ color: 'white' }}>📊</Typography>
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ color: '#39A900', fontWeight: 'bold' }}>
                    Ingreso de Resultados
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Complete los valores para cada parámetro analizado
                  </Typography>
                </Box>
              </Box>
              
              {/* Indicador de progreso */}
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h6" sx={{ color: '#39A900', fontWeight: 'bold' }}>
                  {Object.values(resultados.resultados).filter(r => r.valor !== '').length}/{analisisSeleccionados.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Completados
                </Typography>
                <Box sx={{ 
                  width: 60, 
                  height: 6, 
                  backgroundColor: '#e0e0e0', 
                  borderRadius: 3, 
                  mt: 1,
                  overflow: 'hidden'
                }}>
                  <Box sx={{
                    width: `${(Object.values(resultados.resultados).filter(r => r.valor !== '').length / analisisSeleccionados.length) * 100}%`,
                    height: '100%',
                    backgroundColor: '#39A900',
                    borderRadius: 3,
                    transition: 'width 0.3s ease'
                  }} />
                </Box>
              </Box>
            </Box>
          </Paper>

          {/* Grid de Tarjetas de Análisis */}
          <Grid container spacing={3}>
            {analisisSeleccionados.map((analisis, idx) => {
              const range = getRangeForAnalysis(analisis);
              const showWarning = !!warnings[analisis.nombre];
              const showError = !!errors[analisis.nombre];
              const hasValue = resultados.resultados[analisis.nombre]?.valor !== '';
              const currentValue = resultados.resultados[analisis.nombre]?.valor || '';
              
              return (
                <Grid item xs={12} md={6} lg={4} key={analisis.nombre}>
                  <Paper
                    elevation={hasValue ? 4 : 2}
                    sx={{
                      p: 3,
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      border: showError 
                        ? '2px solid #f44336' 
                        : showWarning 
                        ? '2px solid #ff9800'
                        : hasValue
                        ? '2px solid #39A900'
                        : '1px solid #e0e0e0',
                      backgroundColor: showError 
                        ? '#ffebee' 
                        : showWarning 
                        ? '#fff8e1'
                        : hasValue
                        ? '#f8fff8'
                        : '#ffffff',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(0,0,0,0.12)'
                      }
                    }}
                  >
                    {/* Header de la tarjeta */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        backgroundColor: showError 
                          ? '#f44336' 
                          : showWarning 
                          ? '#ff9800'
                          : hasValue
                          ? '#39A900'
                          : '#9e9e9e',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                        transition: 'all 0.3s ease'
                      }}>
                        <Typography sx={{ color: 'white', fontSize: '1.2rem' }}>
                          {showError ? '⚠️' : showWarning ? '⚡' : hasValue ? '✅' : '🔬'}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ 
                          fontWeight: 'bold', 
                          color: showError ? '#d32f2f' : '#333',
                          fontSize: '1.1rem'
                        }}>
                          {analisis.nombre}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          Unidad: {analisis.unidad} | Método: {analisis.metodo}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Campo de entrada */}
                    <TextField
                      fullWidth
                      name={`${analisis.nombre}-valor`}
                      label={`Valor (${analisis.unidad})`}
                      type="number"
                      value={currentValue}
                      onChange={handleChange(analisis, 'valor')}
                      error={showError}
                      placeholder="Ingrese el valor"
                      InputLabelProps={{ shrink: true }}
                      inputRef={showError && !firstErrorRef.current ? firstErrorRef : null}
                      sx={{
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          backgroundColor: 'white',
                          '& fieldset': {
                            borderWidth: 2,
                            borderColor: showError
                              ? '#f44336'
                              : showWarning
                              ? '#ff9800'
                              : hasValue
                              ? '#39A900'
                              : '#e0e0e0',
                          },
                          '&:hover fieldset': {
                            borderColor: showError
                              ? '#f44336'
                              : showWarning
                              ? '#ff9800'
                              : '#39A900',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: showError
                              ? '#f44336'
                              : showWarning
                              ? '#ff9800'
                              : '#39A900',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: showError ? '#f44336' : showWarning ? '#ff9800' : '#666',
                          fontWeight: 600
                        }
                      }}
                    />

                    {/* Visualización del Rango Mejorada */}
                    {range && (
                      <Box sx={{ mb: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="caption" sx={{ fontWeight: 'bold', color: '#666' }}>
                            📏 RANGO NORMAL
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            fontWeight: 'bold', 
                            color: showError ? '#f44336' : showWarning ? '#ff9800' : '#39A900',
                            fontSize: '0.9rem'
                          }}>
                            {range.min} - {range.max} {analisis.unidad}
                          </Typography>
                        </Box>
                        
                        {/* Barra de Rango Visual Mejorada */}
                        <Box sx={{ position: 'relative', mt: 1.5, mb: 2 }}>
                          {/* Contenedor principal de la barra */}
                          <Box sx={{
                            width: '100%',
                            height: 12,
                            backgroundColor: '#ffcdd2',
                            borderRadius: 6,
                            position: 'relative',
                            overflow: 'hidden'
                          }}>
                            {/* Zona de rango normal */}
                            <Box sx={{
                              position: 'absolute',
                              left: '15%',
                              width: '70%',
                              height: '100%',
                              backgroundColor: '#4caf50',
                              borderRadius: 6,
                              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
                            }} />
                            
                            {/* Indicador de valor actual - solo si hay valor */}
                            {hasValue && currentValue !== '' && !isNaN(parseFloat(currentValue)) && (
                              <Box sx={{
                                position: 'absolute',
                                left: `${Math.max(5, Math.min(95, ((parseFloat(currentValue) - range.min) / (range.max - range.min)) * 100))}%`,
                                top: -4,
                                width: 20,
                                height: 20,
                                backgroundColor: showError ? '#f44336' : showWarning ? '#ff9800' : '#39A900',
                                borderRadius: '50%',
                                border: '3px solid white',
                                boxShadow: '0 3px 8px rgba(0,0,0,0.3)',
                                transform: 'translateX(-50%)',
                                zIndex: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}>
                                <Typography sx={{ color: 'white', fontSize: '10px', fontWeight: 'bold' }}>
                                  {showError ? '!' : showWarning ? '?' : '✓'}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                          
                          {/* Etiquetas de los extremos */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, px: 1 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                              {range.min}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                              {range.max}
                            </Typography>
                          </Box>
                        </Box>
                        
                        {/* Información adicional del valor actual */}
                        {hasValue && currentValue !== '' && !isNaN(parseFloat(currentValue)) && (
                          <Box sx={{ 
                            p: 1.5, 
                            backgroundColor: showError ? '#ffebee' : showWarning ? '#fff3e0' : '#e8f5e8',
                            borderRadius: 2,
                            border: `1px solid ${showError ? '#f44336' : showWarning ? '#ff9800' : '#39A900'}`
                          }}>
                            <Typography variant="caption" sx={{ 
                              color: showError ? '#d32f2f' : showWarning ? '#e65100' : '#2e7d32',
                              fontWeight: 'bold',
                              display: 'block'
                            }}>
                              Valor ingresado: {currentValue} {analisis.unidad}
                            </Typography>
                            {showError && (
                              <Typography variant="caption" sx={{ color: '#d32f2f', display: 'block' }}>
                                ⚠️ Fuera del rango recomendado
                              </Typography>
                            )}
                            {showWarning && !showError && (
                              <Typography variant="caption" sx={{ color: '#e65100', display: 'block' }}>
                                ⚡ Verificar valor ingresado
                              </Typography>
                            )}
                            {!showError && !showWarning && (
                              <Typography variant="caption" sx={{ color: '#2e7d32', display: 'block' }}>
                                ✅ Dentro del rango normal
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Box>
                    )}

                    {/* Mensajes de Validación Mejorados */}
                    {showError && (
                      <Alert 
                        severity="error" 
                        sx={{ 
                          mb: 2, 
                          fontSize: '0.875rem',
                          borderRadius: 2,
                          '& .MuiAlert-icon': {
                            fontSize: '1.2rem'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                              ❌ Error de Validación
                            </Typography>
                            <Typography variant="body2">
                              {errors[analisis.nombre]}
                            </Typography>
                          </Box>
                        </Box>
                      </Alert>
                    )}
                    
                    {showWarning && !showError && (
                      <Alert 
                        severity="warning" 
                        sx={{ 
                          mb: 2, 
                          fontSize: '0.875rem',
                          borderRadius: 2,
                          '& .MuiAlert-icon': {
                            fontSize: '1.2rem'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                              ⚠️ Advertencia
                            </Typography>
                            <Typography variant="body2">
                              {warnings[analisis.nombre]}
                            </Typography>
                            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontStyle: 'italic' }}>
                              Puedes continuar guardando este valor
                            </Typography>
                          </Box>
                        </Box>
                      </Alert>
                    )}
                    
                    {hasValue && !showError && !showWarning && (
                      <Alert 
                        severity="success" 
                        sx={{ 
                          mb: 2, 
                          fontSize: '0.875rem',
                          borderRadius: 2,
                          backgroundColor: '#e8f5e8',
                          '& .MuiAlert-icon': {
                            fontSize: '1.2rem'
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                              ✅ Valor Válido
                            </Typography>
                            <Typography variant="body2">
                              El valor está dentro del rango recomendado
                            </Typography>
                          </Box>
                          <Box sx={{
                            width: 30,
                            height: 30,
                            borderRadius: '50%',
                            backgroundColor: '#39A900',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Typography sx={{ color: 'white', fontSize: '14px' }}>✓</Typography>
                          </Box>
                        </Box>
                      </Alert>
                    )}

                    {/* Footer de Estado Mejorado */}
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      mt: 2,
                      p: 2,
                      backgroundColor: hasValue ? 'rgba(57, 169, 0, 0.05)' : 'rgba(158, 158, 158, 0.05)',
                      borderRadius: 2,
                      border: `1px solid ${hasValue ? '#39A900' : '#e0e0e0'}`
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Box sx={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          backgroundColor: hasValue ? '#39A900' : '#e0e0e0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 1.5
                        }}>
                          <Typography sx={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>
                            {hasValue ? '✓' : '○'}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ 
                          color: hasValue ? '#39A900' : '#999', 
                          fontWeight: 'bold'
                        }}>
                          {hasValue ? 'Completado' : 'Pendiente'}
                        </Typography>
                      </Box>
                      
                      {hasValue && (
                        <Box sx={{ textAlign: 'right' }}>
                          <Typography variant="body2" sx={{ 
                            color: '#666',
                            fontWeight: 'bold',
                            fontSize: '0.9rem'
                          }}>
                            {currentValue} {analisis.unidad}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Valor registrado
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Paper>
                </Grid>
              );
            })}

            {hasWarnings && (
              <Grid item xs={12}>
                <Alert severity="info" sx={{ mb: 2, bgcolor: '#fff3cd', color: '#856404', fontWeight: 'bold' }}>
                  Hay algunos valores fuera de los rangos recomendados, pero aún puedes registrar los resultados con los datos reales.
                </Alert>
              </Grid>
            )}

            {/* Sección de Observaciones Mejorada */}
            <Grid item xs={12}>
              <Paper 
                elevation={3}
                sx={{ 
                  p: 4, 
                  borderRadius: 3,
                  background: 'linear-gradient(145deg, #ffffff 0%, #f9f9f9 100%)',
                  border: '1px solid #e0e0e0',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Header de la sección */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Box sx={{
                    width: 45,
                    height: 45,
                    borderRadius: '50%',
                    backgroundColor: '#39A900',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mr: 2
                  }}>
                    <Typography variant="h6" sx={{ color: 'white' }}>📝</Typography>
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ color: '#39A900', fontWeight: 'bold' }}>
                      Observaciones y Comentarios
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Agregue cualquier observación importante sobre los resultados obtenidos
                    </Typography>
                  </Box>
                  {/* Contador de caracteres */}
                  <Box sx={{ ml: 'auto', textAlign: 'right' }}>
                    <Typography variant="caption" color="text.secondary">
                      {resultados.observaciones.length}/500 caracteres
                    </Typography>
                  </Box>
                </Box>

                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  name="observaciones"
                  label="Observaciones"
                  placeholder="Ejemplo: Los valores de pH están ligeramente por encima del rango normal debido a..."
                  value={resultados.observaciones}
                  onChange={handleChange(null, 'observaciones')}
                  inputProps={{ maxLength: 500 }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: 'white',
                      '& fieldset': {
                        borderWidth: 2,
                        borderColor: '#e0e0e0'
                      },
                      '&:hover fieldset': {
                        borderColor: '#39A900'
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#39A900'
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: '#666',
                      fontWeight: 600
                    }
                  }}
                />

                {/* Decorative background element */}
                <Box sx={{
                  position: 'absolute',
                  top: -10,
                  right: -10,
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(57, 169, 0, 0.05)',
                  zIndex: 0
                }} />
              </Paper>
            </Grid>

            {/* Sección de Acciones Mejorada */}
            <Grid item xs={12}>
              <Paper 
                elevation={2}
                sx={{ 
                  p: 3, 
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                  border: '1px solid #dee2e6'
                }}
              >
                <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Botón Volver */}
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate('/muestras')}
                    disabled={loading}
                    startIcon={<Typography>⬅️</Typography>}
                    sx={{
                      borderWidth: 2,
                      borderColor: '#6c757d',
                      color: '#6c757d',
                      fontWeight: 'bold',
                      px: 4,
                      py: 1.5,
                      borderRadius: 3,
                      '&:hover': {
                        borderWidth: 2,
                        borderColor: '#495057',
                        backgroundColor: '#495057',
                        color: 'white',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(73, 80, 87, 0.3)'
                      },
                      '&:disabled': {
                        borderColor: '#dee2e6',
                        color: '#adb5bd'
                      }
                    }}
                  >
                    Volver a Muestras
                  </Button>

                  {/* Información de estado */}
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2,
                    px: 3,
                    py: 1,
                    backgroundColor: disableSave ? '#ffebee' : hasWarnings ? '#fff3e0' : '#e8f5e8',
                    borderRadius: 2,
                    border: `2px solid ${disableSave ? '#f44336' : hasWarnings ? '#ff9800' : '#39A900'}`
                  }}>
                    <Typography sx={{ 
                      fontSize: '1.5rem',
                      color: disableSave ? '#f44336' : hasWarnings ? '#ff9800' : '#39A900'
                    }}>
                      {disableSave ? '❌' : hasWarnings ? '⚠️' : '✅'}
                    </Typography>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {disableSave ? 'Errores detectados' : hasWarnings ? 'Advertencias presentes' : 'Listo para guardar'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {disableSave ? 'Corrija los errores antes de continuar' : 
                         hasWarnings ? 'Puede guardar con advertencias' : 
                         'Todos los valores son válidos'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Botón Guardar */}
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    disabled={disableSave}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Typography>💾</Typography>}
                    sx={{
                      backgroundColor: disableSave ? '#bdbdbd' : '#39A900',
                      color: 'white',
                      fontWeight: 'bold',
                      px: 5,
                      py: 1.5,
                      borderRadius: 3,
                      fontSize: '1.1rem',
                      boxShadow: disableSave ? 'none' : '0 4px 12px rgba(57, 169, 0, 0.3)',
                      '&:hover': { 
                        backgroundColor: disableSave ? '#bdbdbd' : '#2d8000',
                        transform: disableSave ? 'none' : 'translateY(-2px)',
                        boxShadow: disableSave ? 'none' : '0 6px 20px rgba(45, 128, 0, 0.4)'
                      },
                      '&:disabled': {
                        backgroundColor: '#bdbdbd',
                        color: '#fff'
                      }
                    }}
                  >
                    {loading ? 'Guardando...' : resultadoExistente ? 'Actualizar Resultados' : 'Guardar Resultados'}
                  </Button>
                </Box>

                {/* Información adicional */}
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    Los cambios se guardarán en el historial y podrán ser revisados posteriormente
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Historial de Cambios Mejorado */}
          {resultadoExistente && historialCambios.length > 0 && (
            <Paper 
              elevation={3}
              sx={{ 
                mt: 4, 
                borderRadius: 3,
                background: 'linear-gradient(145deg, #ffffff 0%, #f9f9f9 100%)',
                border: '1px solid #e0e0e0',
                overflow: 'hidden'
              }}
            >
              {/* Header del historial */}
              <Box sx={{ 
                p: 3, 
                backgroundColor: '#39A900', 
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mr: 2 }}>
                      📚 Historial de Cambios
                    </Typography>
                    <Box sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      borderRadius: 3,
                      px: 2,
                      py: 0.5
                    }}>
                      <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                        {historialCambios.length} registro{historialCambios.length !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" sx={{ opacity: 0.9, mt: 1 }}>
                    Registro completo de todas las modificaciones realizadas
                  </Typography>
                </Box>
                
                {/* Decorative background */}
                <Box sx={{
                  position: 'absolute',
                  top: -20,
                  right: -20,
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  zIndex: 0
                }} />
              </Box>

              {/* Lista de cambios */}
              <Box sx={{ p: 3 }}>
                {historialCambios.map((cambio, index) => (
                  <Box key={index} sx={{ position: 'relative', mb: 3 }}>
                    {/* Línea de tiempo vertical */}
                    {index < historialCambios.length - 1 && (
                      <Box sx={{
                        position: 'absolute',
                        left: 20,
                        top: 50,
                        bottom: -24,
                        width: 2,
                        backgroundColor: '#e0e0e0',
                        zIndex: 0
                      }} />
                    )}

                    <Paper
                      elevation={2}
                      sx={{
                        p: 3,
                        borderRadius: 3,
                        border: '1px solid #e8f5e8',
                        background: 'linear-gradient(145deg, #ffffff 0%, #fafafa 100%)',
                        position: 'relative',
                        ml: 1,
                        '&:hover': {
                          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                          transform: 'translateY(-2px)'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {/* Indicador de timeline */}
                      <Box sx={{
                        position: 'absolute',
                        left: -21,
                        top: 20,
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        backgroundColor: '#39A900',
                        border: '3px solid white',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1
                      }}>
                        <Typography sx={{ color: 'white', fontSize: '10px', fontWeight: 'bold' }}>
                          {historialCambios.length - index}
                        </Typography>
                      </Box>

                      {/* Header del cambio */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333', mr: 2 }}>
                              👤 {cambio.nombre}
                            </Typography>
                            <Box sx={{
                              backgroundColor: '#e8f5e8',
                              color: '#2e7d32',
                              borderRadius: 2,
                              px: 2,
                              py: 0.5
                            }}>
                              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                                Cambio #{historialCambios.length - index}
                              </Typography>
                            </Box>
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                            🕒 {formatearFecha(cambio.fecha)}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Detalles de los cambios */}
                      {cambio.cambiosRealizados.resultados && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#39A900', mb: 1 }}>
                            📊 Cambios en Resultados:
                          </Typography>
                          <Box sx={{ pl: 2 }}>
                            {Object.entries(cambio.cambiosRealizados.resultados).map(([param, valores]) => (
                              <Box key={param} sx={{ 
                                mb: 1, 
                                p: 2, 
                                backgroundColor: '#f8f9fa',
                                borderRadius: 2,
                                border: '1px solid #e9ecef'
                              }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#495057', mb: 0.5 }}>
                                  🧪 {param}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <Box sx={{ 
                                    backgroundColor: '#ffebee',
                                    color: '#c62828',
                                    borderRadius: 1,
                                    px: 2,
                                    py: 0.5,
                                    border: '1px solid #ffcdd2'
                                  }}>
                                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                                      Anterior: {valores.valorAnterior}
                                    </Typography>
                                  </Box>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#666' }}>
                                    →
                                  </Typography>
                                  <Box sx={{ 
                                    backgroundColor: '#e8f5e8',
                                    color: '#2e7d32',
                                    borderRadius: 1,
                                    px: 2,
                                    py: 0.5,
                                    border: '1px solid #c8e6c9'
                                  }}>
                                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                                      Nuevo: {valores.valorNuevo}
                                    </Typography>
                                  </Box>
                                </Box>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      )}

                      {/* Observaciones del cambio */}
                      <Box sx={{ 
                        p: 2, 
                        backgroundColor: '#fff3e0',
                        borderRadius: 2,
                        border: '1px solid #ffcc02',
                        borderLeft: '4px solid #ff9800'
                      }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#e65100', mb: 1 }}>
                          📝 Observaciones:
                        </Typography>
                        <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#bf360c' }}>
                          {cambio.observaciones || 'Sin observaciones adicionales'}
                        </Typography>
                      </Box>
                    </Paper>
                  </Box>
                ))}
              </Box>
            </Paper>
          )}
        </form>
      )}

      {/* Diálogo de Confirmación Mejorado */}
      <Dialog
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1
          }
        }}
      >
        <DialogTitle sx={{ 
          color: '#39A900', 
          textAlign: 'center',
          pb: 1,
          fontWeight: 'bold',
          fontSize: '1.5rem'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
            <Box sx={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              backgroundColor: '#39A900',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2
            }}>
              <Typography variant="h4" sx={{ color: 'white' }}>
                {resultadoExistente ? '✏️' : '💾'}
              </Typography>
            </Box>
          </Box>
          Confirmar {resultadoExistente ? 'Actualización' : 'Registro'}
        </DialogTitle>
        
        <DialogContent sx={{ textAlign: 'center', pb: 2 }}>
          <DialogContentText sx={{ mb: 3, fontSize: '1.1rem' }}>
            ¿Está seguro de que desea {resultadoExistente ? 'actualizar' : 'registrar'} los resultados de la muestra?
          </DialogContentText>
          
          {/* Resumen de datos a guardar */}
          <Paper sx={{ 
            p: 2, 
            backgroundColor: '#f8fff8', 
            borderRadius: 2,
            border: '1px solid #e8f5e8',
            mb: 2
          }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#39A900', mb: 1 }}>
              📊 Resumen de Datos:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Muestra: <strong>{idMuestra}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Parámetros completados: <strong>
                {Object.values(resultados.resultados).filter(r => r.valor !== '').length}/{analisisSeleccionados.length}
              </strong>
            </Typography>
            {resultados.observaciones && (
              <Typography variant="body2" color="text.secondary">
                • Con observaciones adicionales
              </Typography>
            )}
          </Paper>

          {hasWarnings && (
            <Alert severity="warning" sx={{ mb: 2, textAlign: 'left' }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                ⚠️ Algunos valores están fuera de los rangos recomendados
              </Typography>
              <Typography variant="caption">
                Los datos se guardarán de todas formas con las advertencias correspondientes
              </Typography>
            </Alert>
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 3, justifyContent: 'center', gap: 2 }}>
          <Button
            onClick={() => setOpenConfirm(false)}
            variant="outlined"
            size="large"
            sx={{
              borderWidth: 2,
              borderColor: '#6c757d',
              color: '#6c757d',
              fontWeight: 'bold',
              px: 3,
              borderRadius: 2,
              '&:hover': {
                borderWidth: 2,
                borderColor: '#495057',
                backgroundColor: '#495057',
                color: 'white'
              }
            }}
          >
            ❌ Cancelar
          </Button>
          <Button
            onClick={handleConfirmSubmit}
            variant="contained"
            size="large"
            sx={{
              backgroundColor: '#39A900',
              fontWeight: 'bold',
              px: 4,
              borderRadius: 2,
              '&:hover': { 
                backgroundColor: '#2d8000',
                boxShadow: '0 4px 12px rgba(45, 128, 0, 0.3)'
              }
            }}
          >
            ✅ {resultadoExistente ? 'Actualizar' : 'Registrar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
          aria-live="assertive"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RegistrarResultados;