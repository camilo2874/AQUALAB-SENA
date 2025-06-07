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
    if (isNaN(numValue)) {
      return {
        error: false,
        warning: true,
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
        message: `El valor está fuera del rango permitido (${min} - ${max} ${analisis.unidad || ''})`
      };
    }
    if (numValue < warningMin || numValue > warningMax) {
      return {
        error: false,
        warning: true,
        message: `El valor está cerca del límite permitido (${min} - ${max} ${analisis.unidad || ''})`
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
    // Verificar si hay errores antes de abrir el diálogo
    const hasErrors = Object.values(errors).some(error => error !== '');
    if (hasErrors) {
      setSnackbar({
        open: true,
        message: 'Por favor, corrija los errores antes de guardar',
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
            // Inicializar con valores vacíos
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
          console.log('No hay resultados previos para esta muestra');
          // Inicializar con valores vacíos
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
        console.error('Error al cargar la información:', error);
        setSnackbar({
          open: true,
          message: 'Error al cargar la información de la muestra',
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

  // Mejorar el control de guardado: bloquear si hay errores o warnings críticos
  const hasErrors = useMemo(() => Object.values(errors).some(error => error !== ''), [errors]);
  const hasCriticalWarnings = useMemo(() => Object.values(warnings).some(w => w && w.includes('fuera del rango')), [warnings]);
  const disableSave = loading || hasErrors || hasCriticalWarnings;

  // Foco automático en el primer campo con error al intentar guardar
  const firstErrorRef = useRef();
  useEffect(() => {
    if (hasErrors && firstErrorRef.current) {
      firstErrorRef.current.focus();
    }
  }, [hasErrors]);

  return (
    <Paper sx={{ p: 4, margin: 'auto', maxWidth: 800, mt: 4 }}>
      <Typography variant="h4" align="center" gutterBottom>
        {resultadoExistente ? 'Editar Resultados' : 'Registrar Resultados'}
      </Typography>
      <Typography variant="h6" gutterBottom>
        Muestra: {idMuestra}
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Estado: {muestraInfo?.estado || 'Cargando...'}
      </Typography>

      {muestraInfo && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1">
            Tipo de Análisis: {muestraInfo.tipoAnalisis}
          </Typography>
          <Typography variant="subtitle1">
            Análisis Seleccionados: {muestraInfo.analisisSeleccionados?.map(a => a.nombre).join(', ')}
          </Typography>
        </Box>
      )}

      {loading && <CircularProgress sx={{ display: 'block', margin: '20px auto' }} />}

      {/* Mensaje si no hay resultados previos */}
      {!loading && muestraInfo && !resultadoExistente && (
        <Alert severity="info" sx={{ mb: 2, bgcolor: '#e3f2fd', color: '#1565c0', fontWeight: 'bold' }}>
          No existen resultados previos para esta muestra. Puedes registrar nuevos resultados.
        </Alert>
      )}

      {!loading && muestraInfo && (
        <form onSubmit={handleSubmit} autoComplete="off">
          <Grid container spacing={3}>
            {analisisSeleccionados.map((analisis, idx) => {
              const range = getRangeForAnalysis(analisis);
              const showWarning = !!warnings[analisis.nombre];
              const showError = !!errors[analisis.nombre];
              return (
                <Grid item xs={12} sm={6} key={analisis.nombre}>
                  <TextField
                    fullWidth
                    name={`${analisis.nombre}-valor`}
                    label={`${analisis.nombre} (${analisis.unidad})`}
                    type="number"
                    value={resultados.resultados[analisis.nombre]?.valor || ''}
                    onChange={handleChange(analisis, 'valor')}
                    error={showError}
                    helperText={
                      showError ? errors[analisis.nombre] :
                      showWarning ? <span style={{color:'orange',display:'flex',alignItems:'center'}}><WarningAmberIcon fontSize="small" sx={{mr:0.5}}/>{warnings[analisis.nombre]}</span> :
                      (range
                        ? `Rango: ${range.min} - ${range.max} | Método: ${analisis.metodo}`
                        : `Rango no definido | Método: ${analisis.metodo}`)
                    }
                    InputLabelProps={{ shrink: true }}
                    inputRef={showError && !firstErrorRef.current ? firstErrorRef : null}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: showError
                            ? 'red'
                            : showWarning
                            ? 'orange'
                            : 'inherit',
                        },
                        '&:hover fieldset': {
                          borderColor: showError
                            ? 'red'
                            : showWarning
                            ? 'orange'
                            : 'inherit',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: showError
                            ? 'red'
                            : showWarning
                            ? 'orange'
                            : '#39A900',
                        },
                      },
                    }}
                  />
                </Grid>
              );
            })}

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                name="observaciones"
                label="Observaciones"
                value={resultados.observaciones}
                onChange={handleChange(null, 'observaciones')}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2 }}>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={() => navigate('/muestras')}
                  disabled={loading}
                >
                  Volver
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={disableSave}
                  sx={{
                    backgroundColor: disableSave ? '#bdbdbd' : '#39A900',
                    '&:hover': { backgroundColor: disableSave ? '#bdbdbd' : '#2d8000' },
                  }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Guardar Cambios'}
                </Button>
              </Box>
            </Grid>
          </Grid>

          {resultadoExistente && historialCambios.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Historial de Cambios
              </Typography>
              {historialCambios.map((cambio, index) => (
                <Paper key={index} sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5' }}>
                  <Typography variant="subtitle2">
                    Realizado por: {cambio.nombre}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Fecha: {formatearFecha(cambio.fecha)}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    {cambio.cambiosRealizados.resultados && 
                      Object.entries(cambio.cambiosRealizados.resultados).map(([param, valores]) => (
                        <Typography key={param} variant="body2">
                          {param}: {valores.valorAnterior} → {valores.valorNuevo}
                        </Typography>
                      ))}
                    <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                      Observaciones: {cambio.observaciones}
                    </Typography>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </form>
      )}

      <Dialog
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
      >
        <DialogTitle sx={{ color: '#39A900' }}>
          Confirmar Acción
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro de que desea {resultadoExistente ? 'actualizar' : 'registrar'} los resultados?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setOpenConfirm(false)}
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmSubmit}
            variant="contained"
            sx={{
              backgroundColor: '#39A900',
              '&:hover': { backgroundColor: '#2d8000' }
            }}
          >
            Confirmar
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
    </Paper>
  );
};

export default RegistrarResultados;