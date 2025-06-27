/**
 * COMPONENTE MUESTRAS - SISTEMA AQUALAB SENA
 * 
 * Mejoras implementadas para el modal de edición:
 * ======================================================
 * 
 * 🐛 PROBLEMAS SOLUCIONADOS:
 * - Error "No hay análisis disponibles" al editar muestras
 * - Error de hidratación HTML en tabla (espacios en blanco)
 * - Error 500 "Cast to embedded failed" - SOLUCIONADO ✅
 * - Error de validación "Path `nombre` is required" - SOLUCIONADO ✅
 * - Problemas de conectividad con servicios de análisis
 * 
 * 🔧 SOLUCIÓN CRÍTICA - Formato de Análisis:
 * El servidor requiere que `analisisSeleccionados` sea un array de OBJETOS COMPLETOS
 * con las propiedades: nombre, unidad, metodo, rango, precio
 * NO strings como se pensó inicialmente.
 * 
 * 🚀 NUEVAS FUNCIONALIDADES: * - Sistema de cache para análisis (10 minutos de duración)
 * - Diagnóstico de conectividad con servicios
 * - Manejo detallado de errores con mensajes específicos
 * - Indicadores de carga mejorados
 * - Botones de reintento y recarga
 * - Limpieza automática de cache
 * - Conversión automática de strings a objetos completos
 * - Validación de integridad de datos de análisis
 * 
 * 🔧 MEJORAS TÉCNICAS:
 * - Normalización mejorada de tipos de análisis
 * - Timeout configurable para peticiones (10s)
 * - Manejo robusto de respuestas del servidor
 * - Validación mejorada de datos antes del envío
 * - Logs detallados para debugging
 * - Conversión automática strings ↔ objetos completos
 * - Sincronización entre análisis disponibles y seleccionados
 * 
 * 📅 Última actualización: 17 de junio de 2025
 */

import React, { useState, useEffect, useContext, memo, useMemo, useCallback, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { PDFService } from '../services/pdfGenerator';
import SignatureCanvas from 'react-signature-canvas';

// Debounce para búsqueda eficiente
function useDebouncedValue(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  TextField,
  Select,
  MenuItem,
  Button,
  Modal,
  Box,  Typography,
  IconButton,
  Checkbox,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Tooltip,
  Pagination,
  Snackbar,
  Alert,  Grid,
  Divider,
  Card,
  CardContent,
  Fade,
  Backdrop,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import GetAppIcon from "@mui/icons-material/GetApp";
import EditIcon from "@mui/icons-material/Edit";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AssignmentIcon from "@mui/icons-material/Assignment";
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ScienceIcon from '@mui/icons-material/Science';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import AuthContext from "../context/AuthContext";
import { muestrasService } from "../services/muestras.service";
import { cambiosEstadoService } from "../services/cambiosEstado.service";

// ----- URLs para las peticiones -----
const BASE_URLS = {
  USUARIOS: "https://backend-sena-lab-1-qpzp.onrender.com/api",
  MUESTRAS: "https://backend-registro-muestras.onrender.com/api"
};

const API_URLS = {
  USUARIOS: `${BASE_URLS.USUARIOS}/usuarios`,
  MUESTRAS: `${BASE_URLS.MUESTRAS}/muestras`,
  ANALISIS_FISICOQUIMICOS: `${BASE_URLS.MUESTRAS}/analisis/fisicoquimico`,
  ANALISIS_MICROBIOLOGICOS: `${BASE_URLS.MUESTRAS}/analisis/microbiologico`
};

/**
 * Formatea la fecha y hora completa (para detalle y PDF).
 * Si el objeto fechaHoraMuestreo es { fecha, hora } con fecha en formato "dd/MM/yyyy",
 * lo transforma a un string ISO y lo muestra en formato local.
 */
function formatFechaHora(fechaHoraMuestreo) {
  if (!fechaHoraMuestreo) return "N/A";
  if (fechaHoraMuestreo.fecha && fechaHoraMuestreo.hora) {
    let { fecha, hora } = fechaHoraMuestreo;
    if (fecha.includes("/")) {
      const [dd, MM, yyyy] = fecha.split("/");
      fecha = `${yyyy}-${MM}-${dd}`;
    }
    const isoDate = `${fecha}T${hora}`;
    const d = new Date(isoDate);
    return isNaN(d) ? `${fechaHoraMuestreo.fecha} ${fechaHoraMuestreo.hora}` : d.toLocaleString();
  } else {
    const d = new Date(fechaHoraMuestreo);
    return isNaN(d) ? fechaHoraMuestreo : d.toLocaleString();
  }
}

/**
 * Formatea solamente la fecha (sin hora) para mostrar en la tabla.
 */
function formatFecha(fechaHoraMuestreo) {
  if (!fechaHoraMuestreo) return "N/A";
  if (fechaHoraMuestreo.fecha && fechaHoraMuestreo.hora) {
    let { fecha } = fechaHoraMuestreo;
    if (fecha.includes("/")) {
      const [dd, MM, yyyy] = fecha.split("/");
      fecha = `${yyyy}-${MM}-${dd}`;
    }
    const d = new Date(`${fecha}T00:00`);
    return isNaN(d) ? fechaHoraMuestreo.fecha : d.toLocaleDateString();
  } else {
    const d = new Date(fechaHoraMuestreo);
    return isNaN(d) ? fechaHoraMuestreo : d.toLocaleDateString();
  }
}

/**
 * Convierte fechaHoraMuestreo en formato ISO (yyyy-mm-dd) a partir de la propiedad "fecha".
 */
function convertFechaToISO(fechaHoraMuestreo) {
  if (!fechaHoraMuestreo) return "";
  if (fechaHoraMuestreo.fecha) {
    let fecha = fechaHoraMuestreo.fecha;
    if (fecha.includes("/")) {
      const [dd, MM, yyyy] = fecha.split("/");
      fecha = `${yyyy}-${MM}-${dd}`;
    }
    return fecha;
  }
  return "";
}

/**
 * Convierte un string ISO (formato "yyyy-MM-ddThh:mm") al objeto que espera el backend,
 * con formato: { fecha: "dd/MM/yyyy", hora: "hh:mm AM/PM" }.
 * Si ya es un objeto con { fecha, hora } o una instancia de Date, se maneja correctamente.
 */
function convertISOToFechaHoraObject(isoInput) {
  if (!isoInput) return null;
  if (typeof isoInput === "object") {
    if (isoInput.fecha && isoInput.hora) return isoInput;
    if (isoInput instanceof Date) {
      const dd = String(isoInput.getDate()).padStart(2, "0");
      const MM = String(isoInput.getMonth() + 1).padStart(2, "0");
      const yyyy = isoInput.getFullYear();
      const fecha = `${dd}/${MM}/${yyyy}`;
      let hours = isoInput.getHours();
      const minutes = String(isoInput.getMinutes()).padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      let hours12 = hours % 12;
      if (hours12 === 0) hours12 = 12;
      const hora = `${hours12}:${minutes} ${ampm}`;
      return { fecha, hora };
    }
  }
  if (typeof isoInput !== "string") return null;
  const parts = isoInput.split("T");
  if (parts.length < 2) return null;
  const [datePart, timePart] = parts;
  const [yyyy, MM, dd] = datePart.split("-");
  const fecha = `${dd}/${MM}/${yyyy}`;
  let [hours, minutes] = timePart.split(":");
  hours = parseInt(hours, 10);
  const ampm = hours >= 12 ? "PM" : "AM";
  let hours12 = hours % 12;
  if (hours12 === 0) hours12 = 12;
  const hora = `${hours12}:${minutes} ${ampm}`;
  return { fecha, hora };
}

/**
 * Componente para el botón con tooltip.
 */
const ActionButton = ({ tooltip, onClick, IconComponent }) => (
  <Tooltip title={tooltip} placement="top" arrow>
    <IconButton
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      sx={{
        transition: "transform 0.2s",
        "&:hover": { transform: "scale(1.1)", backgroundColor: "rgba(57, 169, 0, 0.2)" },
      }}
    >
      <IconComponent />
    </IconButton>
  </Tooltip>
);

/**
 * Retorna las propiedades para el Chip según el estado.
 */
const getEstadoChipProps = (estado) => {
  switch (estado) {
    case "Recibida":
      return { chipColor: "primary", sx: { backgroundColor: "#39A900", color: "white" } };
    case "En análisis":
      return { chipColor: "info", sx: { backgroundColor: "#2196F3", color: "white" } };
    case "Pendiente de resultados":
      return { chipColor: "warning", sx: { backgroundColor: "#FF9800", color: "white" } };
    case "Finalizada":
      return { chipColor: "success", sx: { backgroundColor: "#4CAF50", color: "white" } };
    case "Rechazada":
      return { chipColor: "error", sx: { backgroundColor: "#F44336", color: "white" } };
    case "En Cotización":
    case "En Cotizacion": // Cubrimos ambas versiones
      return { chipColor: "secondary", sx: { backgroundColor: "#9C27B0", color: "white" } };    case "Aceptada":
      return { chipColor: "info", sx: { backgroundColor: "#FF9800", color: "white" } };
    default:
      return { chipColor: "default", sx: { backgroundColor: "#666", color: "white" } };
  }
};

/* ======================== MODALES ======================== */

/* Modal de Detalle Completo: se muestran todos los datos */
const DetailMuestraModal = ({ selectedMuestra, onClose, modalStyle, hideClientData, tipoUsuario, onEstadoChange, onFirmarDocumento, isProcessing, setIsProcessing }) => {
  
  const handleViewPDF = async () => {
    if (!selectedMuestra) return;
    try {
      await PDFService.generarPDFMuestra(selectedMuestra.id_muestra || selectedMuestra.id_muestrea || selectedMuestra._id);
    } catch (error) {
      console.error("Error al ver PDF:", error);
    }
  };  const handleAceptarCotizacion = async () => {
    if (!selectedMuestra || isProcessing) return;
    
    setIsProcessing(true);
    try {
      const idMuestra = selectedMuestra.id_muestra || selectedMuestra.id_muestrea || selectedMuestra._id;
      
      // Usar el servicio de cambios de estado para aceptar la cotización
      const response = await cambiosEstadoService.aceptarCotizacion(idMuestra);
      
      // Actualizar la muestra local con los datos de la respuesta
      const muestraActualizada = {
        ...selectedMuestra,
        estado: "Aceptada",
        historialEstados: response.muestra?.historialEstados || selectedMuestra.historialEstados
      };
      
      onEstadoChange(muestraActualizada);
      
    } catch (error) {
      console.error("Error al aceptar cotización:", error);
      alert("Error al aceptar la cotización: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };  const handleRechazarCotizacion = async () => {
    if (!selectedMuestra || isProcessing) return;
    
    const esAceptada = selectedMuestra.estado === "Aceptada";
    const mensaje = esAceptada 
      ? "¿Está seguro de que desea rechazar esta muestra aceptada? Esta acción cambiará el estado de la muestra a 'Rechazada'."
      : "¿Está seguro de que desea rechazar esta cotización? Esta acción cambiará el estado de la muestra a 'Rechazada'.";
      
    const confirmacion = window.confirm(mensaje);
    if (!confirmacion) return;
    
    setIsProcessing(true);
    try {
      const idMuestra = selectedMuestra.id_muestra || selectedMuestra.id_muestrea || selectedMuestra._id;
      
      // Actualizar el estado de la muestra a rechazada
      const datosActualizacion = {
        estado: "Rechazada",
        observaciones: (selectedMuestra.observaciones || '') + `\n[SISTEMA] ${esAceptada ? 'Muestra' : 'Cotización'} rechazada por el cliente`
      };

      await muestrasService.actualizarMuestra(idMuestra, datosActualizacion);
      
      // Actualizar la muestra local
      const muestraActualizada = {
        ...selectedMuestra,
        estado: "Rechazada",
        observaciones: datosActualizacion.observaciones
      };
      
      onEstadoChange(muestraActualizada);
      onClose(); // Cerrar modal después de rechazar
      
    } catch (error) {
      console.error("Error al rechazar:", error);
      alert(`Error al rechazar la ${esAceptada ? 'muestra' : 'cotización'}: ` + error.message);
    } finally {
      setIsProcessing(false);
    }
  };
  const esCotizacion = selectedMuestra?.estado === "En Cotización" || selectedMuestra?.estado === "En Cotizacion";
  const esAceptada = selectedMuestra?.estado === "Aceptada";  return (
    <Modal 
      open={selectedMuestra !== null} 
      onClose={onClose}
      closeAfterTransition
      BackdropComponent={Backdrop}
      BackdropProps={{
        timeout: 500,
      }}
    >
      <Fade in={selectedMuestra !== null}>
        <Box sx={modalStyle}>        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, pb: 1.5, borderBottom: '2px solid #39A900' }}>
          <Typography variant="h5" sx={{ 
            fontWeight: 'bold', 
            color: '#39A900',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5
          }}>
            <ScienceIcon sx={{ fontSize: 28 }} />
            Detalles de la Muestra
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {tipoUsuario !== "laboratorista" && (
              <Button
                variant="contained"
                startIcon={<PictureAsPdfIcon />}
                onClick={handleViewPDF}
                sx={{ 
                  backgroundColor: '#39A900', 
                  '&:hover': { backgroundColor: '#2d8600' },
                  borderRadius: 2,
                  fontWeight: 'bold'
                }}
              >
                Ver PDF
              </Button>
            )}
            <IconButton
              onClick={onClose}
              sx={{
                color: 'grey.500',
                backgroundColor: 'grey.100',
                '&:hover': {
                  backgroundColor: 'grey.200',
                  color: 'grey.700',
                  transform: 'scale(1.1)'
                },
                transition: 'all 0.2s ease'
              }}
              title="Cerrar"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
          {/* Botones de Cotización */}
        {(esCotizacion || esAceptada) && tipoUsuario !== "laboratorista" && (
          <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
              {esCotizacion ? 'Acciones de Cotización' : 'Acciones de Muestra'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {esCotizacion ? (
                <>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleAceptarCotizacion}
                    disabled={isProcessing}
                    startIcon={isProcessing ? <CircularProgress size={20} /> : null}
                  >
                    {isProcessing ? 'Procesando...' : 'Aceptar Cotización'}
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={handleRechazarCotizacion}
                    disabled={isProcessing}
                    startIcon={isProcessing ? <CircularProgress size={20} /> : null}
                  >
                    {isProcessing ? 'Procesando...' : 'Rechazar Cotización'}
                  </Button>
                </>
              ) : esAceptada ? (
                <>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={onFirmarDocumento}
                    disabled={isProcessing}
                    sx={{ backgroundColor: '#1976d2' }}
                  >
                    Firmar Documento
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={handleRechazarCotizacion}
                    disabled={isProcessing}
                    startIcon={isProcessing ? <CircularProgress size={20} /> : null}
                  >
                    {isProcessing ? 'Procesando...' : 'Rechazar Muestra'}
                  </Button>
                </>
              ) : null}
            </Box>
          </Box>
        )}        {selectedMuestra && (
          <Box sx={{ maxWidth: "100%", height: '100%' }}>            {/* Información Principal */}
            <Card sx={{ mb: 2, borderLeft: '4px solid #39A900', background: 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)' }}>
              <CardContent sx={{ pb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ 
                      p: 1.5, 
                      borderRadius: '50%', 
                      backgroundColor: '#e8f5e9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <ScienceIcon sx={{ fontSize: 32, color: '#39A900' }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#39A900' }}>
                        Muestra #{selectedMuestra.id_muestra || selectedMuestra._id || "N/A"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedMuestra.identificacionMuestra || "Sin identificación"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Creada: {selectedMuestra.creadoPor?.fechaCreacion?.fecha || "N/A"}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    {(() => {
                      const estadoProps = getEstadoChipProps(selectedMuestra.estado || "No especificado");
                      return (
                        <Chip
                          label={selectedMuestra.estado || "No especificado"}
                          sx={{ 
                            ...estadoProps.sx, 
                            fontSize: '0.875rem', 
                            fontWeight: 'bold',
                            boxShadow: 2,
                            '&:hover': {
                              transform: 'scale(1.05)',
                              transition: 'transform 0.2s ease'
                            }
                          }}
                          size="medium"
                        />
                      );
                    })()}
                  </Box>
                </Box>
                
                {/* Mini estadísticas */}
                <Box sx={{ 
                  display: 'flex', 
                  gap: 3, 
                  mt: 2, 
                  pt: 2, 
                  borderTop: '1px solid #e0e0e0',
                  flexWrap: 'wrap'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      backgroundColor: selectedMuestra.tipoAnalisis === 'Fisicoquímico' ? '#2196F3' : '#9C27B0' 
                    }} />
                    <Typography variant="body2" color="text.secondary">
                      {selectedMuestra.tipoAnalisis || "N/A"}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      backgroundColor: '#FF9800' 
                    }} />
                    <Typography variant="body2" color="text.secondary">
                      {Array.isArray(selectedMuestra.analisisSeleccionados) 
                        ? `${selectedMuestra.analisisSeleccionados.length} análisis`
                        : "Sin análisis"}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      backgroundColor: '#4CAF50' 
                    }} />                    <Typography variant="body2" color="text.secondary">
                      {selectedMuestra.tipoMuestreo || "N/A"}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ 
                      width: 8, 
                      height: 8, 
                      borderRadius: '50%', 
                      backgroundColor: '#795548' 
                    }} />                    <Typography variant="body2" color="text.secondary">
                      {(() => {
                        const campos = [
                          selectedMuestra.lugarMuestreo,
                          selectedMuestra.fechaHoraMuestreo,
                          selectedMuestra.condicionesAmbientales,
                          selectedMuestra.preservacionMuestra,
                          selectedMuestra.planMuestreo,
                          selectedMuestra.tipoDeAgua?.tipo
                        ];
                        const completados = campos.filter(campo => {
                          if (!campo) return false;
                          if (typeof campo === 'string') {
                            return campo.trim() !== '';
                          }
                          if (typeof campo === 'object') {
                            return true; // Si es un objeto, considerarlo como completado
                          }
                          return Boolean(campo); // Para otros tipos de datos
                        }).length;
                        const porcentaje = Math.round((completados / campos.length) * 100);
                        return `${porcentaje}% completo`;
                      })()}
                    </Typography>
                  </Box>
                </Box>              </CardContent>
            </Card>

            <Grid container spacing={2}>{/* Información del Cliente */}
              {!hideClientData && (
                <Grid item xs={12} md={6}>
                  <Card sx={{ 
                    height: '100%', 
                    boxShadow: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    }
                  }}>                    <CardContent sx={{ p: 2.5 }}>
                      <Typography variant="h6" sx={{ mb: 1.5, color: '#39A900', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                        <AssignmentIcon sx={{ mr: 1 }} />
                        Información del Cliente
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                            Cliente
                          </Typography>
                          <Typography variant="body1">
                            {selectedMuestra.nombreCliente || selectedMuestra.cliente?.nombre || "No encontrado"}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                            Documento
                          </Typography>
                          <Typography variant="body1">
                            {selectedMuestra.documento || selectedMuestra.cliente?.documento || "N/A"}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                            Fecha de Creación
                          </Typography>
                          <Typography variant="body1">
                            {selectedMuestra.creadoPor?.fechaCreacion?.fecha ? (
                              `${selectedMuestra.creadoPor.fechaCreacion.fecha} - ${(() => {
                                const hora = selectedMuestra.creadoPor?.fechaCreacion?.hora;
                                if (!hora) return "N/A";
                                const [hours, minutes] = hora.split(":");
                                let hours12 = parseInt(hours, 10) % 12 || 12;
                                const ampm = parseInt(hours, 10) >= 12 ? "PM" : "AM";
                                return `${hours12}:${minutes} ${ampm}`;
                              })()}`
                            ) : "N/A"}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}              {/* Información de Muestreo */}
              <Grid item xs={12} md={hideClientData ? 12 : 6}>
                <Card sx={{ 
                  height: '100%', 
                  boxShadow: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}>                  <CardContent sx={{ p: 2.5 }}>
                    <Typography variant="h6" sx={{ mb: 1.5, color: '#39A900', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                      <ScienceIcon sx={{ mr: 1 }} />
                      Información de Muestreo
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <Box sx={{ display: 'flex', gap: 4 }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                            Tipo de Análisis
                          </Typography>
                          <Chip 
                            label={selectedMuestra.tipoAnalisis || "N/A"} 
                            color={selectedMuestra.tipoAnalisis === 'Fisicoquímico' ? 'primary' : 'secondary'}
                            variant="outlined"
                          />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                            Tipo de Muestreo
                          </Typography>
                          <Typography variant="body1">
                            {selectedMuestra.tipoMuestreo || "N/A"}
                          </Typography>
                        </Box>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                          Fecha y Hora de Muestreo
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          {formatFechaHora(selectedMuestra.fechaHoraMuestreo)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                          Lugar de Muestreo
                        </Typography>
                        <Typography variant="body1">
                          {selectedMuestra.lugarMuestreo || "N/A"}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>              {/* Análisis y Tipo de Agua */}
              <Grid item xs={12} md={6}>
                <Card sx={{ 
                  height: '100%', 
                  boxShadow: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}>                  <CardContent sx={{ p: 2.5 }}>
                    <Typography variant="h6" sx={{ mb: 1.5, color: '#39A900', fontWeight: 'bold' }}>
                      Tipo de Agua y Análisis
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                          Tipo de Agua
                        </Typography>
                        <Typography variant="body1">
                          {selectedMuestra.tipoDeAgua?.descripcionCompleta ||
                            selectedMuestra.tipoDeAgua?.tipo ||
                            "N/A"}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'bold', mb: 1 }}>
                          Análisis Seleccionados
                        </Typography>
                        {Array.isArray(selectedMuestra.analisisSeleccionados) && selectedMuestra.analisisSeleccionados.length > 0 ? (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {selectedMuestra.analisisSeleccionados.map((analisis, index) => {
                              const nombreAnalisis = typeof analisis === "object" && analisis !== null
                                ? analisis.nombre || "Desconocido"
                                : analisis;
                              return (
                                <Chip
                                  key={index}
                                  label={nombreAnalisis}
                                  size="small"
                                  sx={{ 
                                    backgroundColor: '#e8f5e9', 
                                    color: '#2e7d32',
                                    fontWeight: 'medium'
                                  }}
                                />
                              );
                            })}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            No se han seleccionado análisis
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>              {/* Preservación y Plan */}
              <Grid item xs={12} md={6}>
                <Card sx={{ 
                  height: '100%', 
                  boxShadow: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}>                  <CardContent sx={{ p: 2.5 }}>
                    <Typography variant="h6" sx={{ mb: 1.5, color: '#39A900', fontWeight: 'bold' }}>
                      Preservación y Plan
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                          Plan de Muestreo
                        </Typography>
                        <Typography variant="body1">
                          {selectedMuestra.planMuestreo || "N/A"}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                          Preservación de Muestra
                        </Typography>
                        <Typography variant="body1">
                          {selectedMuestra.preservacionMuestra || "N/A"}
                          {selectedMuestra.preservacionMuestra === "Otro" && selectedMuestra.preservacionMuestraOtra && (
                            <Typography component="span" sx={{ fontStyle: 'italic', ml: 1 }}>
                              ({selectedMuestra.preservacionMuestraOtra})
                            </Typography>
                          )}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>              {/* Condiciones Ambientales */}
              <Grid item xs={12}>
                <Card sx={{ 
                  boxShadow: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4
                  }
                }}>                  <CardContent sx={{ p: 2.5 }}>
                    <Typography variant="h6" sx={{ mb: 1.5, color: '#39A900', fontWeight: 'bold' }}>
                      Condiciones Ambientales
                    </Typography>
                    <Typography variant="body1" sx={{ 
                      backgroundColor: '#f5f5f5', 
                      p: 1.5, 
                      borderRadius: 1,
                      minHeight: '50px',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '0.9rem'
                    }}>
                      {selectedMuestra.condicionesAmbientales || "No especificadas"}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>              {/* Observaciones */}
              {selectedMuestra.observaciones && (
                <Grid item xs={12}>
                  <Card sx={{ 
                    boxShadow: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    }
                  }}>                    <CardContent sx={{ p: 2.5 }}>
                      <Typography variant="h6" sx={{ mb: 1.5, color: '#39A900', fontWeight: 'bold' }}>
                        Observaciones
                      </Typography>
                      <Typography variant="body1" sx={{ 
                        backgroundColor: '#fff3e0', 
                        p: 1.5, 
                        borderRadius: 1,
                        borderLeft: '4px solid #ff9800',
                        fontSize: '0.9rem'
                      }}>
                        {selectedMuestra.observaciones}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )}              {/* Historial */}
              {selectedMuestra.historial && selectedMuestra.historial.length > 0 && (
                <Grid item xs={12}>
                  <Card sx={{ 
                    boxShadow: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    }
                  }}>                    <CardContent sx={{ p: 2.5 }}>
                      <Typography variant="h6" sx={{ mb: 1.5, color: '#39A900', fontWeight: 'bold' }}>
                        Historial de Cambios
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        <Box sx={{ display: 'flex', gap: 4 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                              Creada por
                            </Typography>
                            <Typography variant="body1">
                              {selectedMuestra.historial[selectedMuestra.historial.length - 1].administrador?.nombre || "N/A"}
                            </Typography>
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                              Fecha de cambio
                            </Typography>
                            <Typography variant="body1">
                              {new Date(
                                selectedMuestra.historial[selectedMuestra.historial.length - 1].fechaCambio
                              ).toLocaleString()}
                            </Typography>
                          </Box>
                        </Box>
                        {selectedMuestra.historial[selectedMuestra.historial.length - 1].observaciones && (
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                              Observaciones del Historial
                            </Typography>                            <Typography variant="body1" sx={{ 
                              backgroundColor: '#f5f5f5', 
                              p: 1.5, 
                              borderRadius: 1,
                              fontStyle: 'italic',
                              fontSize: '0.9rem'
                            }}>
                              {selectedMuestra.historial[selectedMuestra.historial.length - 1].observaciones}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}            </Grid>
          </Box>
        )}
        </Box>
      </Fade>
    </Modal>
  );
};

/* ======================== MODAL DE EDICIÓN ======================== */
/* Se utiliza la función convertISOToFechaHoraObject para transformar el valor del input antes de enviarlo */
const TIPOS_AGUA = [
  'potable',
  'natural',
  'residual',
  'otra',
];
const TIPOS_AGUA_RESIDUAL = ['Doméstica', 'No Doméstica'];
const TIPOS_PRESERVACION = ['Refrigeración', 'Congelación', 'Acidificación', 'Otro'];
const TIPOS_MUESTREO = ['Simple', 'Compuesto'];
const TIPOS_ANALISIS = ['Fisicoquímico', 'Microbiológico'];

const EditMuestraModal = ({ editingMuestra, setEditingMuestra, onSave, modalStyle }) => {
  const [analisisDisponibles, setAnalisisDisponibles] = useState([]);
  const [error, setError] = useState(null);
  const [cargandoAnalisis, setCargandoAnalisis] = useState(false);  const [diagnostico, setDiagnostico] = useState(null);

  // Función de diagnóstico para verificar conectividad
  const verificarConectividad = async () => {
    const token = localStorage.getItem("token");
    const resultados = {
      fisicoquimico: { status: 'pending', message: 'Verificando...' },
      microbiologico: { status: 'pending', message: 'Verificando...' }
    };
    
    setDiagnostico({ ...resultados });
    
    // Probar fisicoquímico
    try {
      const response = await axios.get(API_URLS.ANALISIS_FISICOQUIMICOS, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000
      });
      resultados.fisicoquimico = { 
        status: 'success', 
        message: `Conectado - ${Array.isArray(response.data) ? response.data.length : '?'} análisis` 
      };
    } catch (error) {
      resultados.fisicoquimico = { 
        status: 'error', 
        message: `Error: ${error.response?.status || error.message}` 
      };
    }
    
    // Probar microbiológico
    try {
      const response = await axios.get(API_URLS.ANALISIS_MICROBIOLOGICOS, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000
      });
      resultados.microbiologico = { 
        status: 'success', 
        message: `Conectado - ${Array.isArray(response.data) ? response.data.length : '?'} análisis` 
      };
    } catch (error) {
      resultados.microbiologico = { 
        status: 'error', 
        message: `Error: ${error.response?.status || error.message}` 
      };
    }
    
    setDiagnostico({ ...resultados });
  };  // Cargar análisis según tipo
  const cargarAnalisis = async (tipo, forzarRecarga = false) => {
    setCargandoAnalisis(true);
    try {

      
      // Intentar cargar desde cache primero (si no es recarga forzada)
      if (!forzarRecarga) {
        const cacheKey = `analisis_${tipo.toLowerCase()}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          try {
            const parsedCache = JSON.parse(cached);
            const cacheTime = parsedCache.timestamp;
            const now = Date.now();
            // Cache válido por 10 minutos
            if (now - cacheTime < 10 * 60 * 1000) {

              setAnalisisDisponibles(parsedCache.data);
              setError(null);
              return;
            }
          } catch (e) {

          }
        }
      }
      
      const token = localStorage.getItem("token");
      
      if (!token) {
        console.error("No hay token disponible");
        setAnalisisDisponibles([]);
        setError("No hay token de autenticación disponible");
        return;
      }

      // Normalizar tipo para endpoint
      let tipoNormalizado = tipo
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remover acentos
        .replace(/[^a-z]/g, ""); // Solo letras
      
      let endpoint = "";
      if (tipoNormalizado === "fisicoquimico") {
        endpoint = API_URLS.ANALISIS_FISICOQUIMICOS;
      } else if (tipoNormalizado === "microbiologico") {
        endpoint = API_URLS.ANALISIS_MICROBIOLOGICOS;
      } else {

        setAnalisisDisponibles([]);
        return;
      }


      
      const response = await axios.get(endpoint, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 segundos de timeout
      });



      // Verificar que la respuesta sea válida
      if (response.data && response.data.success !== false) {
        const analisis = Array.isArray(response.data) ? response.data : 
                        Array.isArray(response.data.data) ? response.data.data : [];
        setAnalisisDisponibles(analisis);

        setError(null); // Limpiar error si la carga fue exitosa
        
        // Guardar en cache
        const cacheKey = `analisis_${tipo.toLowerCase()}`;
        const cacheData = {
          data: analisis,
          timestamp: Date.now()
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        
      } else {
        console.error("Respuesta no válida del servidor:", response.data);
        setAnalisisDisponibles([]);
        setError("No se pudieron cargar los análisis disponibles");
      }
    } catch (error) {
      console.error("Error al cargar análisis:", error);
      setAnalisisDisponibles([]);
      
      // Proporcionar información más específica del error
      if (error.code === 'ECONNABORTED') {
        setError("Tiempo de espera agotado. Verifique su conexión a internet.");
      } else if (error.response) {
        const statusCode = error.response.status;
        if (statusCode === 401) {
          setError("No tiene permisos para acceder a los análisis. Intente cerrar sesión y volver a iniciar.");
        } else if (statusCode === 404) {
          setError("El servicio de análisis no está disponible en este momento.");
        } else if (statusCode === 500) {
          setError("Error interno del servidor. Intente nuevamente más tarde.");
        } else {
          setError(`Error del servidor (${statusCode}): ${error.response.data?.message || 'Error desconocido'}`);
        }
      } else if (error.request) {
        setError("No se pudo conectar con el servidor. Verifique su conexión a internet.");
      } else {
        setError("Error inesperado: " + error.message);
      }
    } finally {
      setCargandoAnalisis(false);
    }
  };  useEffect(() => {
    // Limpiar estados anteriores cuando se abre el modal
    setError(null);
    setDiagnostico(null);
      // Normalizar análisis seleccionados al abrir el modal
    if (editingMuestra && editingMuestra.analisisSeleccionados) {
      const analisisNormalizados = editingMuestra.analisisSeleccionados.map(analisis => {
        // Si ya es un objeto completo, mantenerlo
        if (typeof analisis === 'object' && analisis !== null && analisis.nombre && analisis.unidad && analisis.metodo && analisis.rango) {
          return analisis;
        }
        
        // Si es un string o un objeto incompleto, intentar encontrar el objeto completo
        const nombreAnalisis = typeof analisis === 'object' && analisis !== null ? analisis.nombre : analisis;
        
        // Buscar en analisisDisponibles si están cargados
        if (analisisDisponibles.length > 0) {
          const analisisCompleto = analisisDisponibles.find(a => a.nombre === nombreAnalisis);
          if (analisisCompleto) {
            return analisisCompleto;
          }
        }
        
        // Si no se encuentra, mantener como está y será manejado al cargar los análisis
        return analisis;
      });
      
      // Solo actualizar si hay diferencias
      const sonDiferentes = JSON.stringify(analisisNormalizados) !== JSON.stringify(editingMuestra.analisisSeleccionados);      if (sonDiferentes) {
        setEditingMuestra(prev => ({
          ...prev,
          analisisSeleccionados: analisisNormalizados
        }));
      }
    }
    
    if (editingMuestra && editingMuestra.tipoAnalisis) {

      cargarAnalisis(editingMuestra.tipoAnalisis);
    } else {

      setAnalisisDisponibles([]);
    }
  }, [editingMuestra?.tipoAnalisis]);

  // Normalizar análisis seleccionados cuando se cargan los análisis disponibles
  useEffect(() => {
    if (editingMuestra && editingMuestra.analisisSeleccionados && analisisDisponibles.length > 0) {
      const analisisActualizados = editingMuestra.analisisSeleccionados.map(analisis => {
        // Si ya es un objeto completo, mantenerlo
        if (typeof analisis === 'object' && analisis !== null && analisis.nombre && analisis.unidad && analisis.metodo && analisis.rango) {
          return analisis;
        }
        
        // Si es string o objeto incompleto, buscar el objeto completo
        const nombreAnalisis = typeof analisis === 'object' && analisis !== null ? analisis.nombre : analisis;
        const analisisCompleto = analisisDisponibles.find(a => a.nombre === nombreAnalisis);
        
        if (analisisCompleto) {

          return analisisCompleto;
        }
        
        // Si no se encuentra, mantener como está
        return analisis;
      });
      
      // Solo actualizar si hay cambios
      const hayDiferencias = analisisActualizados.some((analisis, index) => {
        const original = editingMuestra.analisisSeleccionados[index];
        return JSON.stringify(analisis) !== JSON.stringify(original);
      });
      
      if (hayDiferencias) {

        setEditingMuestra(prev => ({
          ...prev,
          analisisSeleccionados: analisisActualizados
        }));
      }
    }
  }, [analisisDisponibles, editingMuestra]);

  if (!editingMuestra) return null;

  // Helpers para campos de tipo de agua
  const handleTipoAguaChange = (e) => {
    const value = e.target.value;
    let descripcion = '';
    if (value === 'potable') descripcion = 'Agua potable';
    else if (value === 'natural') descripcion = 'Agua natural';
    else if (value === 'residual') descripcion = 'Agua residual';
    setEditingMuestra((prev) => ({
      ...prev,
      tipoDeAgua: {
        ...prev.tipoDeAgua,
        tipo: value,
        descripcion: value === 'otra' ? '' : descripcion,
        subtipo: value === 'residual' ? prev.tipoDeAgua?.subtipo : undefined,
      },
    }));
  };
  const handleDescripcionAgua = (e) => {
    setEditingMuestra((prev) => ({
      ...prev,
      tipoDeAgua: { ...prev.tipoDeAgua, descripcion: e.target.value },
    }));
  };
  const handleSubtipoResidual = (e) => {
    setEditingMuestra((prev) => ({
      ...prev,
      tipoDeAgua: {
        ...prev.tipoDeAgua,
        subtipo: e.target.value,
        descripcion: `Agua residual ${e.target.value}`,
      },
    }));
  };

  // Fecha input value
  const fechaInputValue = (() => {
    const fh = editingMuestra.fechaHoraMuestreo;
    if (!fh) return "";
    if (typeof fh === "string") {
      return fh.substring(0, 16);
    }
    if (typeof fh === "object" && fh.fecha && fh.hora) {
      let fecha = fh.fecha;
      if (fecha.includes("/")) {
        const [dd, MM, yyyy] = fecha.split("/");
        fecha = `${yyyy}-${MM}-${dd}`;
      }
      const convertTimeTo24 = (timeStr) => {
        if (!timeStr) return "";
        const parts = timeStr.trim().split(" ");
        if (parts.length !== 2) return timeStr;
        const [time, modifier] = parts;
        let [hours, minutes] = time.split(":");
        hours = parseInt(hours, 10);
        if (modifier.toUpperCase() === "PM" && hours !== 12) hours += 12;
        if (modifier.toUpperCase() === "AM" && hours === 12) hours = 0;
        return `${hours < 10 ? "0" + hours : hours}:${minutes}`;
      };
      const time24 = convertTimeTo24(fh.hora);
      return `${fecha}T${time24}`;
    }
    return "";
  })();
  // Validación básica
  const validar = () => {
    if (!editingMuestra.tipoDeAgua?.tipo) return 'El tipo de agua es requerido';
    if (editingMuestra.tipoDeAgua?.tipo === 'residual' && !editingMuestra.tipoDeAgua?.subtipo) return 'Debe especificar tipo de agua residual';
    if (editingMuestra.tipoDeAgua?.tipo === 'otra' && !editingMuestra.tipoDeAgua?.descripcion) return 'Descripción del tipo de agua es requerida';
    if (!editingMuestra.tipoMuestreo) return 'El tipo de muestreo es requerido';
    if (!editingMuestra.lugarMuestreo) return 'El lugar de muestreo es requerido';
    if (!editingMuestra.fechaHoraMuestreo) return 'La fecha y hora de muestreo son requeridas';
    if (!editingMuestra.tipoAnalisis) return 'El tipo de análisis es requerido';
    if (!editingMuestra.identificacionMuestra) return 'Identificación de la muestra es requerida';
    if (!editingMuestra.planMuestreo) return 'El plan de muestreo es requerido';
    if (!editingMuestra.condicionesAmbientales) return 'Condiciones ambientales requeridas';
    if (!editingMuestra.preservacionMuestra) return 'Preservación de la muestra es requerida';
    if (editingMuestra.preservacionMuestra === 'Otro' && !editingMuestra.preservacionMuestraOtra) return 'Debe especificar preservación "Otro"';    // Validar que los análisis seleccionados estén en formato correcto
    if (!editingMuestra.analisisSeleccionados || editingMuestra.analisisSeleccionados.length === 0) {
      return 'Debe seleccionar al menos un análisis';
    }
    
    // Verificar que los análisis tengan nombres válidos
    const analisisInvalidos = editingMuestra.analisisSeleccionados.filter(analisis => {
      if (typeof analisis === 'object' && analisis !== null) {
        return !analisis.nombre || analisis.nombre.trim() === '';
      }
      if (typeof analisis === 'string') {
        return analisis.trim() === '';
      }
      return true; // Formato no válido
    });
    
    if (analisisInvalidos.length > 0) {
      console.error('Análisis seleccionados en formato inválido:', analisisInvalidos);
      return 'Error: Algunos análisis seleccionados no tienen nombre válido. Intente seleccionar nuevamente.';
    }
    
    return null;
  };  const handleAnalisisChange = (analisisNombre) => {
    setEditingMuestra((prev) => {
      // Verificar si ya está seleccionado (por nombre)
      const alreadySelected = prev.analisisSeleccionados?.some(item => {
        if (typeof item === 'object' && item !== null) {
          return item.nombre === analisisNombre;
        }
        return item === analisisNombre;
      });
      
      if (alreadySelected) {
        // Remover el análisis
        return {
          ...prev,
          analisisSeleccionados: prev.analisisSeleccionados.filter((item) => {
            if (typeof item === 'object' && item !== null) {
              return item.nombre !== analisisNombre;
            }
            return item !== analisisNombre;
          })
        };
      } else {
        // Agregar el análisis completo (para UI) o como string (fallback)
        const analisisCompleto = analisisDisponibles.find(a => a.nombre === analisisNombre);
        const nuevoAnalisis = analisisCompleto || analisisNombre;
        
        return {
          ...prev,
          analisisSeleccionados: [...(prev.analisisSeleccionados || []), nuevoAnalisis]
        };
      }
    });
  };

  const handleGuardar = () => {
    const err = validar();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    onSave();
  };
  return (
    <Modal open={editingMuestra !== null} onClose={() => setEditingMuestra(null)}>
      <Box sx={{ ...modalStyle, width: 700, maxWidth: '98vw' }}>        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#39A900' }}>
            Editar Muestra
          </Typography>
          <IconButton
            onClick={() => setEditingMuestra(null)}
            sx={{
              color: 'grey.500',
              '&:hover': {
                backgroundColor: 'grey.100',
                color: 'grey.700'
              }
            }}
            title="Cerrar"
          >
            <CloseIcon />
          </IconButton>
        </Box>
        
        {/* Información de ayuda */}
        {!editingMuestra.tipoAnalisis && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              💡 Consejo: Comience seleccionando el tipo de análisis
            </Typography>
            <Typography variant="body2">
              Una vez que seleccione el tipo de análisis (Fisicoquímico o Microbiológico), 
              se cargarán automáticamente los análisis disponibles para ese tipo.
            </Typography>
          </Alert>
        )}        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        )}        {/* Aviso si hay problemas con los análisis seleccionados */}
        {editingMuestra.analisisSeleccionados && editingMuestra.analisisSeleccionados.some(a => {
          if (typeof a === 'string') {
            return a.trim() === '';
          }
          if (typeof a === 'object' && a !== null) {
            return !a.nombre || a.nombre.trim() === '';
          }
          return true;
        }) && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              ⚠️ Análisis inválidos detectados
            </Typography>
            <Typography variant="body2">
              Algunos análisis seleccionados no tienen nombres válidos.
            </Typography>
            <Button 
              size="small" 
              onClick={() => setEditingMuestra(prev => ({ ...prev, analisisSeleccionados: [] }))}
              sx={{ mt: 1 }}
            >
              Limpiar análisis seleccionados
            </Button>
          </Alert>
        )}
        <Box component="form" noValidate autoComplete="off">
          {/* Sección: Tipo de Agua */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Tipo de Agua</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Select
                  fullWidth
                  value={editingMuestra.tipoDeAgua?.tipo || ''}
                  onChange={handleTipoAguaChange}
                  displayEmpty
                >
                  <MenuItem value="">Seleccione tipo de agua</MenuItem>
                  {TIPOS_AGUA.map((tipo) => (
                    <MenuItem key={tipo} value={tipo}>{tipo.charAt(0).toUpperCase() + tipo.slice(1)}</MenuItem>
                  ))}
                </Select>
              </Grid>
              {editingMuestra.tipoDeAgua?.tipo === 'residual' && (
                <Grid item xs={12} sm={6}>
                  <Select
                    fullWidth
                    value={editingMuestra.tipoDeAgua?.subtipo || ''}
                    onChange={handleSubtipoResidual}
                    displayEmpty
                  >
                    <MenuItem value="">Seleccione subtipo</MenuItem>
                    {TIPOS_AGUA_RESIDUAL.map((sub) => (
                      <MenuItem key={sub} value={sub}>{sub}</MenuItem>
                    ))}
                  </Select>
                </Grid>
              )}
              {editingMuestra.tipoDeAgua?.tipo === 'otra' && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Descripción"
                    value={editingMuestra.tipoDeAgua?.descripcion || ''}
                    onChange={handleDescripcionAgua}
                  />
                </Grid>
              )}
            </Grid>
          </Box>
          <Divider sx={{ my: 2 }} />
          {/* Sección: Muestreo y Análisis */}
          <Box sx={{ mb: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Tipo de Muestreo</Typography>
                <Select
                  fullWidth
                  value={editingMuestra.tipoMuestreo || ''}
                  onChange={e => setEditingMuestra({ ...editingMuestra, tipoMuestreo: e.target.value })}
                  displayEmpty
                >
                  <MenuItem value="">Seleccione tipo de muestreo</MenuItem>
                  {TIPOS_MUESTREO.map((tipo) => (
                    <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>
                  ))}
                </Select>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Tipo de Análisis</Typography>                <Select
                  fullWidth
                  value={editingMuestra.tipoAnalisis || ''}
                  onChange={e => {
                    const nuevoTipo = e.target.value;
                    setEditingMuestra({ 
                      ...editingMuestra, 
                      tipoAnalisis: nuevoTipo, 
                      analisisSeleccionados: [] // Limpiar análisis seleccionados al cambiar tipo
                    });
                    // Limpiar estados
                    setError(null);
                    setDiagnostico(null);
                  }}
                  displayEmpty
                >
                  <MenuItem value="">Seleccione tipo de análisis</MenuItem>
                  {TIPOS_ANALISIS.map((tipo) => (
                    <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>
                  ))}
                </Select>
              </Grid>
            </Grid>
          </Box>
          <Divider sx={{ my: 2 }} />
          {/* Sección: Lugar, Fecha, Identificación, Plan */}
          <Box sx={{ mb: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Lugar de Muestreo"
                  value={editingMuestra.lugarMuestreo || ''}
                  onChange={e => setEditingMuestra({ ...editingMuestra, lugarMuestreo: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Fecha y Hora de Muestreo"
                  type="datetime-local"
                  InputLabelProps={{ shrink: true }}
                  value={fechaInputValue}
                  onChange={e => setEditingMuestra({ ...editingMuestra, fechaHoraMuestreo: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Identificación de Muestra"
                  value={editingMuestra.identificacionMuestra || ''}
                  onChange={e => setEditingMuestra({ ...editingMuestra, identificacionMuestra: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Plan de Muestreo"
                  value={editingMuestra.planMuestreo || ''}
                  onChange={e => setEditingMuestra({ ...editingMuestra, planMuestreo: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>
          <Divider sx={{ my: 2 }} />
          {/* Sección: Condiciones Ambientales */}
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label="Condiciones Ambientales"
              multiline
              rows={3}
              value={editingMuestra.condicionesAmbientales || ''}
              onChange={e => setEditingMuestra({ ...editingMuestra, condicionesAmbientales: e.target.value })}
            />
          </Box>
          <Divider sx={{ my: 2 }} />
          {/* Sección: Preservación */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Preservación de la Muestra</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Select
                  fullWidth
                  value={editingMuestra.preservacionMuestra || ''}
                  onChange={e => setEditingMuestra({ ...editingMuestra, preservacionMuestra: e.target.value })}
                  displayEmpty
                >
                  <MenuItem value="">Seleccione preservación</MenuItem>
                  {TIPOS_PRESERVACION.map((tipo) => (
                    <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>
                  ))}
                </Select>
              </Grid>
              {editingMuestra.preservacionMuestra === 'Otro' && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Detalle de Preservación"
                    value={editingMuestra.preservacionMuestraOtra || ''}
                    onChange={e => setEditingMuestra({ ...editingMuestra, preservacionMuestraOtra: e.target.value })}
                  />
                </Grid>
              )}
            </Grid>
          </Box>
          <Divider sx={{ my: 2 }} />          {/* Sección: Análisis a Realizar */}
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Análisis a Realizar
              </Typography>              {editingMuestra.tipoAnalisis && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => cargarAnalisis(editingMuestra.tipoAnalisis, true)} // Forzar recarga
                  disabled={cargandoAnalisis}
                  startIcon={cargandoAnalisis ? <CircularProgress size={16} /> : <RefreshIcon />}
                  sx={{ 
                    borderColor: '#39A900', 
                    color: '#39A900',
                    '&:hover': { backgroundColor: '#e8f5e9' }
                  }}
                >
                  {cargandoAnalisis ? 'Cargando...' : 'Recargar Análisis'}
                </Button>
              )}
            </Box>
              {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
                <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>                  <Button 
                    size="small" 
                    onClick={() => cargarAnalisis(editingMuestra.tipoAnalisis, true)} // Forzar recarga
                  >
                    Reintentar
                  </Button>
                  <Button 
                    size="small" 
                    variant="outlined"
                    onClick={verificarConectividad}
                  >
                    Diagnóstico
                  </Button>
                </Box>
                
                {/* Mostrar resultados del diagnóstico */}
                {diagnostico && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>Estado de los servicios:</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip 
                          label="Fisicoquímico" 
                          color={diagnostico.fisicoquimico.status === 'success' ? 'success' : 'error'}
                          size="small"
                        />
                        <Typography variant="body2">{diagnostico.fisicoquimico.message}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip 
                          label="Microbiológico" 
                          color={diagnostico.microbiologico.status === 'success' ? 'success' : 'error'}
                          size="small"
                        />
                        <Typography variant="body2">{diagnostico.microbiologico.message}</Typography>
                      </Box>
                    </Box>
                  </Box>
                )}
              </Alert>
            )}
              {!editingMuestra.tipoAnalisis ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                Seleccione un tipo de análisis para ver los análisis disponibles.
              </Alert>
            ) : cargandoAnalisis ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3 }}>
                <CircularProgress sx={{ color: '#39A900' }} />
                <Typography sx={{ ml: 2 }}>Cargando análisis disponibles...</Typography>
              </Box>            ) : analisisDisponibles.length === 0 && !error ? (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  No hay análisis disponibles para este tipo
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Esto puede suceder por varias razones:
                </Typography>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  <li>Los análisis aún no se han cargado desde el servidor</li>
                  <li>No hay análisis configurados para este tipo</li>
                  <li>Problemas de conectividad con el servicio</li>
                </ul>
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>                  <Button 
                    size="small" 
                    variant="outlined" 
                    onClick={() => cargarAnalisis(editingMuestra.tipoAnalisis, true)} // Forzar recarga
                    startIcon={<RefreshIcon />}
                  >
                    Intentar cargar
                  </Button>
                  <Button 
                    size="small" 
                    variant="outlined"
                    onClick={verificarConectividad}
                  >
                    Verificar servicios
                  </Button>
                </Box>
              </Alert>
            ) : (
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>
                    {editingMuestra.tipoAnalisis === "Fisicoquímico"
                      ? "Análisis Fisicoquímicos"
                      : "Análisis Microbiológicos"} 
                    ({analisisDisponibles.length} disponibles)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    {analisisDisponibles.map((analisis) => (
                      <Grid item xs={12} sm={6} key={analisis.nombre}>
                        <FormControlLabel
                          control={                            <Checkbox
                              checked={editingMuestra.analisisSeleccionados?.some(item => {
                                if (typeof item === 'object' && item !== null) {
                                  return item.nombre === analisis.nombre;
                                }
                                return item === analisis.nombre;
                              })}
                              onChange={() => handleAnalisisChange(analisis.nombre)}
                            />
                          }
                          label={
                            <span>
                              {analisis.nombre}
                              {analisis.unidad && analisis.unidad !== "N/A" && (
                                <span style={{ color: 'gray' }}> (Unidad: {analisis.unidad})</span>
                              )}
                              <span style={{ color: 'green', marginLeft: '8px' }}> - ${analisis.precio}</span>
                            </span>
                          }
                        />
                      </Grid>
                    ))}
                  </Grid>
                </AccordionDetails>
              </Accordion>
            )}
          </Box>
          <Divider sx={{ my: 2 }} />
          {/* Sección: Observaciones */}
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              label="Observaciones"
              multiline
              rows={3}
              value={editingMuestra.observaciones || ''}
              onChange={e => setEditingMuestra({ ...editingMuestra, observaciones: e.target.value })}
            />
          </Box>          <Button variant="contained" color="primary" fullWidth onClick={handleGuardar} sx={{ mt: 2, py: 1.5, fontWeight: 'bold', bgcolor: '#39A900', '&:hover': { bgcolor: '#2d8600' } }}>
            Guardar Cambios
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

/* =================== COMPONENTE PRINCIPAL: Muestras =================== */
const Muestras = memo(() => {
  const [muestras, setMuestras] = useState([]);
  const [filteredMuestras, setFilteredMuestras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("todos");
  const [filterDate, setFilterDate] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [selectedMuestra, setSelectedMuestra] = useState(null);
  const [editingMuestra, setEditingMuestra] = useState(null);
  const navigate = useNavigate();
  const { tipoUsuario } = useContext(AuthContext);
  // Define la variable que indica si se debe ocultar la información del cliente
  const hideClientData = tipoUsuario === "laboratorista";
  
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");
  // Estados para el modal de firmas
  const [openFirmasModal, setOpenFirmasModal] = useState(false);
  const [firmas, setFirmas] = useState({
    administrador: null,
    cliente: null
  });
  const [firmandoMuestra, setFirmandoMuestra] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const firmaAdministradorRef = useRef(null);
  const firmaClienteRef = useRef(null);

  // Debounce para búsqueda eficiente
  const debouncedSearch = useDebouncedValue(search, 400);
  const firstNoResultRef = useRef(null);

  // Función para manejar cambios de estado desde el modal
  const handleEstadoChange = useCallback((muestraActualizada) => {
    setMuestras(prevMuestras => 
      prevMuestras.map(m => {
        const idMuestra = m.id_muestra || m.id_muestrea || m._id;
        const idActualizada = muestraActualizada.id_muestra || muestraActualizada.id_muestrea || muestraActualizada._id;
        
        if (idMuestra === idActualizada) {
          return { ...m, ...muestraActualizada };
        }
        return m;
      })
    );
    
    // Actualizar la muestra seleccionada si es la misma
    if (selectedMuestra) {
      const idSeleccionada = selectedMuestra.id_muestra || selectedMuestra.id_muestrea || selectedMuestra._id;
      const idActualizada = muestraActualizada.id_muestra || muestraActualizada.id_muestrea || muestraActualizada._id;
      
      if (idSeleccionada === idActualizada) {
        setSelectedMuestra({ ...selectedMuestra, ...muestraActualizada });
      }
    }
    
    setSnackbarMessage("Estado de la muestra actualizado exitosamente");
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
  }, [selectedMuestra]);

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") return;
    setSnackbarOpen(false);
  };  const modalStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: '90vw',
    maxWidth: 1000,
    bgcolor: "background.paper",
    boxShadow: 24,
    p: 3,
    borderRadius: 2,
    maxHeight: "90vh",
    overflowY: "auto",
  };// Función para obtener todas las muestras (sin filtros del servidor)
  const fetchAllMuestras = useCallback(async () => {
    try {
      setLoading(true);
      // Obtener todas las muestras sin filtros para poder filtrar localmente
      const response = await muestrasService.obtenerMuestras({
        page: 1,
        limit: 1000, // Obtener un número grande para tener todas las muestras
        sortBy: "createdAt",
        sortOrder: "desc",
        applyFiltersToAllPages: false // No aplicar filtros en el servidor
      });
      
      if (response.success && response.data) {
        setMuestras(Array.isArray(response.data.items) ? response.data.items : []);
      } else {
        throw new Error("No se pudieron obtener las muestras");
      }
    } catch (error) {
      setSnackbarMessage(
        "Error al cargar las muestras: " + (error.message || "Error desconocido")
      );
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      setMuestras([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar muestras al inicio
  useEffect(() => {
    fetchAllMuestras();
  }, [fetchAllMuestras]);

  // Filtrar muestras localmente cuando cambien los filtros
  useEffect(() => {
    try {
      let filtered = Array.isArray(muestras) ? [...muestras] : [];

      // Filtrar por tipo de análisis
      if (filterType !== "todos") {
        filtered = filtered.filter(
          (muestra) => muestra.tipoAnalisis?.toLowerCase() === filterType.toLowerCase()
        );
      }

      // Filtrar por fecha
      if (filterDate.trim() !== "") {
        filtered = filtered.filter((muestra) => {
          const fechaMuestra = muestra.creadoPor?.fechaCreacion?.fecha;
          if (!fechaMuestra) return false;
          
          // Convertir fecha de filtro de YYYY-MM-DD a DD/MM/YYYY
          const [year, month, day] = filterDate.split("-");
          const fechaFiltro = `${day}/${month}/${year}`;
          
          return fechaMuestra === fechaFiltro;
        });
      }

      // Filtrar por búsqueda con debounce
      if (debouncedSearch.trim() !== "") {
        filtered = filtered.filter((muestra) => {
          const searchTerm = debouncedSearch.toLowerCase();
          const idMuestra = (muestra.id_muestra || muestra.id_muestrea || muestra._id || "").toString().toLowerCase();
          const cliente = (muestra.cliente?.nombre || muestra.nombreCliente || "").toLowerCase();
          const documento = (muestra.cliente?.documento || muestra.documento || "").toString().toLowerCase();
          
          return idMuestra.includes(searchTerm) || 
                 cliente.includes(searchTerm) || 
                 documento.includes(searchTerm);
        });
      }

      setFilteredMuestras(filtered);
      
      // Actualizar paginación
      const totalItems = filtered.length;
      const totalPages = Math.ceil(totalItems / pagination.limit);
      setPagination(prev => ({
        ...prev,
        total: totalItems,
        totalPages: totalPages,
        page: prev.page > totalPages ? 1 : prev.page
      }));

      // Enfocar en mensaje de "no resultados" si no hay muestras
      if (filtered.length === 0 && firstNoResultRef.current) {
        firstNoResultRef.current.focus();
      }
    } catch (err) {
      console.error("Error al filtrar muestras:", err);
      setFilteredMuestras([]);
    }
  }, [debouncedSearch, filterType, filterDate, muestras, pagination.limit]);

  // Obtener muestras para la página actual
  const paginatedMuestras = useMemo(() => {
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    return filteredMuestras.slice(startIndex, endIndex);
  }, [filteredMuestras, pagination.page, pagination.limit]);
  const handleViewDetails = useCallback((muestra) => setSelectedMuestra(muestra), []);
  const handleEditMuestra = useCallback((muestra) => setEditingMuestra(muestra), []);
  const handleClearFilters = useCallback(() => {
    setFilterType("todos");
    setFilterDate("");
    setSearch("");
  }, []);
  const handleSaveEdit = async () => {
    try {

      
      // Obtener el ID de la muestra
      const idMuestra = editingMuestra.id_muestra || editingMuestra.id_muestrea || editingMuestra._id;
      
      if (!idMuestra) {
        throw new Error("No se pudo identificar el ID de la muestra");
      }        // Preparar los datos de actualización - SOLO CAMPOS BÁSICOS PRIMERO
      const updateData = {
        tipoAnalisis: editingMuestra.tipoAnalisis,
        tipoMuestreo: editingMuestra.tipoMuestreo,
        lugarMuestreo: editingMuestra.lugarMuestreo,
        identificacionMuestra: editingMuestra.identificacionMuestra,
        planMuestreo: editingMuestra.planMuestreo,
        condicionesAmbientales: editingMuestra.condicionesAmbientales,
        preservacionMuestra: editingMuestra.preservacionMuestra,
        observaciones: editingMuestra.observaciones || "",        analisisSeleccionados: (editingMuestra.analisisSeleccionados || []).map(analisisSeleccionado => {
          // El backend requiere objetos con los campos: nombre, unidad, metodo, rango (todos obligatorios)
          if (typeof analisisSeleccionado === 'object' && analisisSeleccionado !== null) {
            // Si ya es un objeto, extraer solo los campos requeridos
            return {
              nombre: analisisSeleccionado.nombre || analisisSeleccionado.name || '',
              unidad: analisisSeleccionado.unidad || analisisSeleccionado.unit || '',
              metodo: analisisSeleccionado.metodo || analisisSeleccionado.method || '',
              rango: analisisSeleccionado.rango || analisisSeleccionado.range || ''
            };
          }
          
          // Si es string, buscar en la lista de análisis disponibles para obtener los datos completos
          const analisisCompleto = analisisDisponibles.find(a => 
            a.nombre === analisisSeleccionado || a.name === analisisSeleccionado
          );
          
          if (analisisCompleto) {
            return {
              nombre: analisisCompleto.nombre || analisisCompleto.name || analisisSeleccionado,
              unidad: analisisCompleto.unidad || analisisCompleto.unit || '',
              metodo: analisisCompleto.metodo || analisisCompleto.method || '',
              rango: analisisCompleto.rango || analisisCompleto.range || ''
            };
          }
          
          // Si no se encuentra, crear objeto con campos mínimos (esto puede causar error)
          console.warn('⚠️ Análisis no encontrado en lista disponible:', analisisSeleccionado);
          return {
            nombre: String(analisisSeleccionado),
            unidad: '',
            metodo: '',
            rango: ''
          };
        }).filter(analisis => analisis.nombre) // Solo incluir si tiene nombre
      };
      
      // Agregar campos opcionales solo si existen y son válidos
      if (editingMuestra.preservacionMuestra === "Otro" && editingMuestra.preservacionMuestraOtra) {
        updateData.preservacionMuestraOtra = editingMuestra.preservacionMuestraOtra;
      }
      
      // Manejar fechaHoraMuestreo con cuidado
      if (editingMuestra.fechaHoraMuestreo) {
        try {
          const fechaConvertida = convertISOToFechaHoraObject(editingMuestra.fechaHoraMuestreo);
          if (fechaConvertida && fechaConvertida.fecha && fechaConvertida.hora) {
            updateData.fechaHoraMuestreo = fechaConvertida;
          }
        } catch (error) {
          console.warn('Error al convertir fecha:', error);
        }
      }
      
      // Manejar tipoDeAgua con cuidado
      if (editingMuestra.tipoDeAgua && editingMuestra.tipoDeAgua.tipo) {
        updateData.tipoDeAgua = {
          tipo: editingMuestra.tipoDeAgua.tipo,
          descripcion: editingMuestra.tipoDeAgua.descripcion || '',
          ...(editingMuestra.tipoDeAgua.subtipo && { subtipo: editingMuestra.tipoDeAgua.subtipo })
        };
      }
        // Limpiar campos undefined para evitar problemas en el servidor
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      // Validar que todos los análisis tengan los campos requeridos
      const analisisIncompletos = updateData.analisisSeleccionados.filter(a => 
        !a.nombre || !a.unidad || !a.metodo || !a.rango
      );
      
      if (analisisIncompletos.length > 0) {
        console.warn('⚠️ Análisis con campos faltantes:', analisisIncompletos);
        throw new Error(`Algunos análisis seleccionados no tienen toda la información requerida (unidad, método, rango). Análisis incompletos: ${analisisIncompletos.map(a => a.nombre).join(', ')}`);
      }

      if (updateData.analisisSeleccionados.length === 0) {        throw new Error('Debe seleccionar al menos un análisis');
      }

      // Usar el servicio de muestras para la actualización
      const response = await muestrasService.actualizarMuestra(idMuestra, updateData);
      
      if (response.success) {
        // Actualizar la lista local de muestras
        const updatedMuestras = muestras.map((m) => {
          const mId = m.id_muestra || m.id_muestrea || m._id;
          if (mId === idMuestra) {
            return { ...m, ...updateData };
          }
          return m;
        });
          setMuestras(updatedMuestras);
        setEditingMuestra(null);
        setSnackbarMessage(`Muestra ${idMuestra} actualizada exitosamente con ${updateData.analisisSeleccionados.length} análisis`);
        setSnackbarSeverity("success");
        setSnackbarOpen(true);
      } else {
        throw new Error(response.message || "Error desconocido al actualizar la muestra");
      }
    } catch (error) {
      console.error("Error al actualizar la muestra:", error);
      
      let errorMessage = "Error al actualizar la muestra: ";
      
      if (error.response) {
        // Error de respuesta del servidor
        const status = error.response.status;
        const data = error.response.data;
        
        switch (status) {
          case 400:
            errorMessage += "Datos inválidos. Verifique que todos los campos requeridos estén completos.";
            break;
          case 401:
            errorMessage += "No tiene permisos para realizar esta acción. Intente cerrar sesión y volver a iniciar.";
            break;
          case 404:
            errorMessage += "La muestra no fue encontrada en el servidor.";
            break;
          case 500:
            errorMessage += "Error interno del servidor. " + (data?.message || "Intente nuevamente más tarde.");
            break;
          default:
            errorMessage += `Error del servidor (${status}): ${data?.message || 'Error desconocido'}`;
        }
      } else if (error.request) {
        errorMessage += "No se pudo conectar con el servidor. Verifique su conexión a internet.";
      } else {
        errorMessage += error.message || "Error desconocido";
      }
      
      setSnackbarMessage(errorMessage);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handleDownloadPDF = async (muestra) => {
    try {
      await PDFService.descargarPDFMuestra(muestra.id_muestra || muestra._id);
    } catch (error) {
      setSnackbarMessage("Error al descargar el PDF: " + error.message);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  const handlePreviewPDF = async (muestra) => {
    try {
      await PDFService.generarPDFMuestra(muestra.id_muestra || muestra._id);
    } catch (error) {
      setSnackbarMessage("Error al previsualizar el PDF: " + error.message);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    }
  };

  // 1. Memoizar ActionButton para evitar renders innecesarios
  const MemoActionButton = React.memo(ActionButton);
  // 2. Definir handler de selección de muestra correctamente (sin custom hook)
  const selectMuestraHandler = useCallback(
    (muestra) => () => setSelectedMuestra(muestra),
    [setSelectedMuestra]
  );

  // Memoizar handlers para filtros
  const handleFilterChange = useCallback((e) => {
    setFilterType(e.target.value);
  }, []);

  const handleDateChange = useCallback((e) => {
    setFilterDate(e.target.value);
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearch(e.target.value);
  }, []);

  const handlePageChange = useCallback((event, value) => {
    setPagination((prev) => ({ ...prev, page: value }));
  }, []);

  // Funciones para manejar las firmas
  const handleFirmarDocumento = async () => {
    if (!selectedMuestra || isProcessing) return;
    
    // Abrir modal de firmas
    setFirmandoMuestra(selectedMuestra);
    setFirmas({
      administrador: null,
      cliente: null
    });
    setOpenFirmasModal(true);
  };

  const handleGuardarFirmaAdministrador = () => {
    if (firmaAdministradorRef.current && !firmaAdministradorRef.current.isEmpty()) {
      const firmaData = firmaAdministradorRef.current.toDataURL();
      setFirmas(prev => ({
        ...prev,
        administrador: {
          firma: firmaData,
          fecha: new Date().toISOString(),
          nombre: localStorage.getItem('nombre') || 'Administrador',
          documento: localStorage.getItem('cedula') || 'admin'
        }
      }));
    }
  };

  const handleGuardarFirmaCliente = () => {
    if (firmaClienteRef.current && !firmaClienteRef.current.isEmpty()) {
      const firmaData = firmaClienteRef.current.toDataURL();
      setFirmas(prev => ({
        ...prev,
        cliente: {
          firma: firmaData,
          fecha: new Date().toISOString(),
          nombre: firmandoMuestra?.cliente?.nombre || firmandoMuestra?.nombreCliente || 'Cliente',
          documento: firmandoMuestra?.cliente?.documento || firmandoMuestra?.documento || ''
        }
      }));
    }
  };

  const handleLimpiarFirmaAdministrador = () => {
    if (firmaAdministradorRef.current) {
      firmaAdministradorRef.current.clear();
    }
    setFirmas(prev => ({ ...prev, administrador: null }));
  };

  const handleLimpiarFirmaCliente = () => {
    if (firmaClienteRef.current) {
      firmaClienteRef.current.clear();
    }
    setFirmas(prev => ({ ...prev, cliente: null }));
  };

  const handleCompletarFirmas = async () => {
    if (!firmandoMuestra || !firmas.administrador || !firmas.cliente) {
      setSnackbarMessage("Ambas firmas son requeridas para completar el proceso");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    setIsProcessing(true);
    try {
      const idMuestra = firmandoMuestra.id_muestra || firmandoMuestra.id_muestrea || firmandoMuestra._id;
      
      // Actualizar la muestra con las firmas y cambiar estado a "Recibida"
      const datosActualizacion = {
        estado: "Recibida",
        firmas: {
          firmaAdministrador: firmas.administrador,
          firmaCliente: firmas.cliente
        },
        observaciones: (firmandoMuestra.observaciones || '') + '\n[SISTEMA] Documento firmado digitalmente'
      };

      await muestrasService.actualizarMuestra(idMuestra, datosActualizacion);
      
      // Actualizar la muestra local
      const muestraActualizada = {
        ...firmandoMuestra,
        estado: "Recibida",
        firmas: datosActualizacion.firmas,
        observaciones: datosActualizacion.observaciones,
        cotizacionAceptada: true // Mantener que fue aceptada
      };
      
      handleEstadoChange(muestraActualizada);
      
      // Cerrar modales
      setOpenFirmasModal(false);
      setFirmandoMuestra(null);
      setFirmas({
        administrador: null,
        cliente: null
      });
      
      setSnackbarMessage("Documento firmado exitosamente. La muestra ha sido recibida.");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
      
    } catch (error) {
      console.error("Error al completar firmas:", error);
      setSnackbarMessage("Error al completar las firmas: " + error.message);
      setSnackbarSeverity("error");
      setSnackbarOpen(true);    } finally {
      setIsProcessing(false);
    }
  };

  const handleCerrarModalFirmas = () => {
    setOpenFirmasModal(false);
    setFirmandoMuestra(null);
    setFirmas({
      administrador: null,
      cliente: null
    });
    if (firmaAdministradorRef.current) {
      firmaAdministradorRef.current.clear();
    }
    if (firmaClienteRef.current) {
      firmaClienteRef.current.clear();
    }
  };

  if (loading)
    return <CircularProgress sx={{ display: "block", margin: "20px auto" }} />;

  return (
    <Box
      sx={{
        minHeight: '100vh',
        py: 4,
        px: { xs: 0, md: 2 },
      }}
    >
      <Box
        sx={{
          maxWidth: 1400, // Aumenta el ancho máximo
          mx: 'auto',
          boxShadow: 6,
          borderRadius: 4,
          background: 'white',
          p: { xs: 2, md: 4 },
          position: 'relative',
        }}
      >        {/* Encabezado con ícono */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <ScienceIcon sx={{ fontSize: 40, color: '#39A900', mr: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#39A900', flex: 1 }}>
            Muestras Registradas
          </Typography>          <Tooltip title="Actualizar tabla" placement="left" arrow>
            <IconButton
              onClick={() => {
                setLoading(true);
                fetchAllMuestras();
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
        <Box sx={{ height: 6, width: 120, background: 'linear-gradient(90deg, #39A900 60%, #b2dfdb 100%)', borderRadius: 3, mb: 3 }} />        {/* Filtros y búsqueda en tarjeta */}
        <Paper elevation={3} sx={{ mb: 3, p: 2, borderRadius: 3, background: '#f9fbe7' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <Select 
                value={filterType} 
                onChange={handleFilterChange} 
                fullWidth 
                sx={{ background: 'white', borderRadius: 2, boxShadow: 1 }}
                displayEmpty
              >
                <MenuItem value="todos">Todos los tipos</MenuItem>
                <MenuItem value="Fisicoquímico">Fisicoquímico</MenuItem>
                <MenuItem value="Microbiológico">Microbiológico</MenuItem>
              </Select>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                type="date"
                label="Filtrar por Fecha"
                fullWidth
                value={filterDate}
                onChange={handleDateChange}
                InputLabelProps={{ shrink: true }}
                sx={{ background: 'white', borderRadius: 2, boxShadow: 1 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Buscar (ID, Cliente o Documento)"
                variant="outlined"
                fullWidth
                value={search}
                onChange={handleSearchChange}
                sx={{ background: 'white', borderRadius: 2, boxShadow: 1 }}
                InputProps={{
                  startAdornment: (
                    <SearchIcon sx={{ color: '#39A900', mr: 1 }} />
                  ),
                }}
                inputProps={{ 'aria-label': 'Buscar muestra' }}
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
                disabled={filterType === 'todos' && !filterDate && !search}
              >
                Limpiar Filtros
              </Button>
            </Grid>
          </Grid>
        </Paper>        <Paper elevation={2} sx={{ borderRadius: 3, boxShadow: 3, overflow: 'auto', minWidth: 1100 }}>
          <TableContainer sx={{ minWidth: 1100 }}>
            <Table>
              <TableHead sx={{ backgroundColor: "#39A900" }}>
                <TableRow>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>ID Muestra</TableCell>
                  {!hideClientData && (
                    <>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>Cliente</TableCell>
                      <TableCell sx={{ color: "white", fontWeight: "bold" }}>Documento</TableCell>
                    </>
                  )}
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Estado</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Fecha</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Lugar de Muestreo</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Tipo de Análisis</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedMuestras.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={hideClientData ? 6 : 8} align="center">
                      <Typography ref={firstNoResultRef} tabIndex={-1} sx={{ color: 'text.secondary', fontWeight: 600, fontSize: 18 }}>
                        No hay muestras que coincidan con la búsqueda o filtros.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedMuestras.map((muestra, idx) => (
                    <TableRow
                      key={muestra.id_muestra || muestra.id_muestrea || muestra._id}
                      sx={{
                        background: idx % 2 === 0 ? '#f1f8e9' : 'white',
                        transition: "transform 0.2s",
                        "&:hover": { transform: "scale(1.01)", background: '#e0f2f1' },
                        cursor: "pointer",
                      }}
                    >
                    <TableCell onClick={selectMuestraHandler(muestra)}>
                      {muestra.id_muestrea || muestra.id_muestra || muestra._id}
                    </TableCell>
                    {!hideClientData && (
                      <>
                        <TableCell onClick={selectMuestraHandler(muestra)}>
                          {muestra.cliente?.nombre || "N/A"}
                        </TableCell>
                        <TableCell onClick={selectMuestraHandler(muestra)}>
                          {muestra.cliente?.documento || "N/A"}
                        </TableCell>
                      </>
                    )}
                    <TableCell onClick={selectMuestraHandler(muestra)}>
                      <Chip label={muestra.estado} sx={getEstadoChipProps(muestra.estado).sx} />
                    </TableCell>
                    <TableCell onClick={selectMuestraHandler(muestra)}>
                      {formatFecha(muestra.creadoPor?.fechaCreacion?.fecha)}
                    </TableCell>
                    <TableCell onClick={selectMuestraHandler(muestra)}>
                      {muestra.lugarMuestreo}
                    </TableCell>
                    <TableCell onClick={selectMuestraHandler(muestra)}>
                      <Typography variant="subtitle1" color="text.primary">
                        {muestra.tipoAnalisis || "N/A"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: "flex", gap: 1 }} onClick={(e) => e.stopPropagation()}>
                        <MemoActionButton
                          tooltip="Ver Detalles"
                          onClick={() => handleViewDetails(muestra)}
                          IconComponent={VisibilityIcon}
                        />
                        {tipoUsuario !== "laboratorista" && (
                          <>
                            <MemoActionButton
                              tooltip="Ver PDF"
                              onClick={() => handlePreviewPDF(muestra)}
                              IconComponent={PictureAsPdfIcon}
                            />
                            <MemoActionButton
                              tooltip="Descargar PDF"
                              onClick={() => handleDownloadPDF(muestra)}
                              IconComponent={GetAppIcon}
                            />
                            <MemoActionButton
                              tooltip="Editar Muestra"
                              onClick={() => handleEditMuestra(muestra)}
                              IconComponent={EditIcon}
                            />
                          </>
                        )}
                        {tipoUsuario === "laboratorista" && (
                          <MemoActionButton
                            tooltip="Registrar Resultados"
                            onClick={() => navigate(`/registrar-resultados/${muestra.id_muestrea || muestra.id_muestra || muestra._id}`)}
                            IconComponent={AssignmentIcon}
                          />
                        )}                      </Box>
                    </TableCell>
                  </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
        {/* Paginador clásico debajo de la tabla */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination
            count={pagination.totalPages}
            page={pagination.page}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
        {/* Modales y Snackbar */}        <DetailMuestraModal
          selectedMuestra={selectedMuestra}
          onClose={() => setSelectedMuestra(null)}
          modalStyle={modalStyle}
          hideClientData={hideClientData}
          tipoUsuario={tipoUsuario}
          onEstadoChange={handleEstadoChange}
          onFirmarDocumento={handleFirmarDocumento}
          isProcessing={isProcessing}
          setIsProcessing={setIsProcessing}
        /><EditMuestraModal
          editingMuestra={editingMuestra}
          setEditingMuestra={setEditingMuestra}
          onSave={handleSaveEdit}
          modalStyle={modalStyle}
        />
        
        {/* Modal de Firmas */}
        <Modal
          open={openFirmasModal}
          onClose={handleCerrarModalFirmas}
          closeAfterTransition
          slots={{ backdrop: Backdrop }}
          slotProps={{ backdrop: { timeout: 500 } }}
        >
          <Fade in={openFirmasModal}>
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '90%',
                maxWidth: 800,
                bgcolor: 'background.paper',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                p: 4,
                borderRadius: 3,
                maxHeight: '90vh',
                overflowY: 'auto',
              }}
            >
              <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: '#39A900', textAlign: 'center' }}>
                Firmas Digitales
              </Typography>
              
              <Typography variant="body1" sx={{ mb: 3, textAlign: 'center', color: 'text.secondary' }}>
                Para completar el proceso, tanto el administrador como el cliente deben firmar digitalmente
              </Typography>

              <Grid container spacing={3}>
                {/* Firma del Administrador */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 2, borderRadius: 2, boxShadow: 2 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, color: '#39A900', textAlign: 'center' }}>
                        Firma del Administrador
                      </Typography>
                      
                      {firmas.administrador ? (
                        <Box sx={{ textAlign: 'center' }}>
                          <img 
                            src={firmas.administrador.firma} 
                            alt="Firma Administrador" 
                            style={{ 
                              maxWidth: '100%', 
                              height: '150px', 
                              border: '2px solid #39A900', 
                              borderRadius: '8px',
                              backgroundColor: 'white'
                            }} 
                          />
                          <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                            Firmado por: {firmas.administrador.nombre}
                          </Typography>
                          <Button 
                            variant="outlined" 
                            color="error" 
                            onClick={handleLimpiarFirmaAdministrador}
                            sx={{ mt: 1 }}
                          >
                            Limpiar Firma
                          </Button>
                        </Box>
                      ) : (
                        <Box>
                          <Box sx={{ 
                            border: '2px dashed #ccc', 
                            borderRadius: 2, 
                            p: 1,
                            backgroundColor: 'white'
                          }}>
                            <SignatureCanvas
                              ref={firmaAdministradorRef}
                              canvasProps={{
                                width: 300,
                                height: 150,
                                style: { width: '100%', height: '150px' }
                              }}
                              backgroundColor="white"
                            />
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: 'center' }}>
                            <Button 
                              variant="contained" 
                              onClick={handleGuardarFirmaAdministrador}
                              sx={{ backgroundColor: '#39A900', '&:hover': { backgroundColor: '#2d8000' } }}
                            >
                              Guardar Firma
                            </Button>
                            <Button 
                              variant="outlined" 
                              onClick={handleLimpiarFirmaAdministrador}
                            >
                              Limpiar
                            </Button>
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Firma del Cliente */}
                <Grid item xs={12} md={6}>
                  <Card sx={{ p: 2, borderRadius: 2, boxShadow: 2 }}>
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, color: '#39A900', textAlign: 'center' }}>
                        Firma del Cliente
                      </Typography>
                      
                      {firmas.cliente ? (
                        <Box sx={{ textAlign: 'center' }}>
                          <img 
                            src={firmas.cliente.firma} 
                            alt="Firma Cliente" 
                            style={{ 
                              maxWidth: '100%', 
                              height: '150px', 
                              border: '2px solid #39A900', 
                              borderRadius: '8px',
                              backgroundColor: 'white'
                            }} 
                          />
                          <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                            Firmado por: {firmas.cliente.nombre}
                          </Typography>
                          <Button 
                            variant="outlined" 
                            color="error" 
                            onClick={handleLimpiarFirmaCliente}
                            sx={{ mt: 1 }}
                          >
                            Limpiar Firma
                          </Button>
                        </Box>
                      ) : (
                        <Box>
                          <Box sx={{ 
                            border: '2px dashed #ccc', 
                            borderRadius: 2, 
                            p: 1,
                            backgroundColor: 'white'
                          }}>
                            <SignatureCanvas
                              ref={firmaClienteRef}
                              canvasProps={{
                                width: 300,
                                height: 150,
                                style: { width: '100%', height: '150px' }
                              }}
                              backgroundColor="white"
                            />
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: 'center' }}>
                            <Button 
                              variant="contained" 
                              onClick={handleGuardarFirmaCliente}
                              sx={{ backgroundColor: '#39A900', '&:hover': { backgroundColor: '#2d8000' } }}
                            >
                              Guardar Firma
                            </Button>
                            <Button 
                              variant="outlined" 
                              onClick={handleLimpiarFirmaCliente}
                            >
                              Limpiar
                            </Button>
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Botones de acción */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 4 }}>
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleCompletarFirmas}
                  disabled={!firmas.administrador || !firmas.cliente || isProcessing}
                  startIcon={isProcessing ? <CircularProgress size={20} /> : null}
                  sx={{ 
                    px: 4, 
                    py: 1.5,
                    backgroundColor: '#39A900',
                    '&:hover': { backgroundColor: '#2d8000' }
                  }}
                >
                  {isProcessing ? 'Procesando...' : 'Completar Firma y Recibir Muestra'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleCerrarModalFirmas}
                  disabled={isProcessing}
                  sx={{ px: 4, py: 1.5 }}
                >
                  Cancelar
                </Button>
              </Box>
            </Box>
          </Fade>
        </Modal>
        <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
          <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: "100%" }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
});

export default Muestras;