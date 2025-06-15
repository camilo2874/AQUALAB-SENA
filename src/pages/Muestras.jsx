import React, { useState, useEffect, useContext, memo, useMemo, useCallback, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { PDFService } from '../services/pdfGenerator';
import SignatureCanvas from 'react-signature-canvas';
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
  Box,
  Typography,
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
import AuthContext from "../context/AuthContext";
import { muestrasService } from "../services/muestras.service";

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
      return { chipColor: "secondary", sx: { backgroundColor: "#9C27B0", color: "white" } };
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
  };
  const handleAceptarCotizacion = async () => {
    if (!selectedMuestra || isProcessing) return;
    
    setIsProcessing(true);
    try {
      const idMuestra = selectedMuestra.id_muestra || selectedMuestra.id_muestrea || selectedMuestra._id;
      
      // Actualizar la muestra para marcar como aceptada
      const datosActualizacion = {
        cotizacionAceptada: true,
        observaciones: (selectedMuestra.observaciones || '') + '\n[SISTEMA] Cotización aceptada por el cliente'
      };

      await muestrasService.actualizarMuestra(idMuestra, datosActualizacion);
      
      // Actualizar la muestra local
      const muestraActualizada = {
        ...selectedMuestra,
        cotizacionAceptada: true,
        observaciones: datosActualizacion.observaciones
      };
      
      onEstadoChange(muestraActualizada);
      
    } catch (error) {
      console.error("Error al aceptar cotización:", error);
      alert("Error al aceptar la cotización: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };
  const handleRechazarCotizacion = async () => {
    if (!selectedMuestra || isProcessing) return;
    
    const confirmacion = window.confirm("¿Está seguro de que desea rechazar esta cotización? Esta acción cambiará el estado de la muestra a 'Rechazada'.");
    if (!confirmacion) return;
    
    setIsProcessing(true);
    try {
      const idMuestra = selectedMuestra.id_muestra || selectedMuestra.id_muestrea || selectedMuestra._id;
      
      // Actualizar el estado de la muestra a rechazada
      const datosActualizacion = {
        estado: "Rechazada",
        observaciones: (selectedMuestra.observaciones || '') + '\n[SISTEMA] Cotización rechazada por el cliente'
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
      console.error("Error al rechazar cotización:", error);
      alert("Error al rechazar la cotización: " + error.message);    } finally {
      setIsProcessing(false);
    }
  };

  const esCotizacion = selectedMuestra?.estado === "En Cotización" || selectedMuestra?.estado === "En Cotizacion";
  const cotizacionAceptada = selectedMuestra?.cotizacionAceptada;
  return (
    <Modal open={selectedMuestra !== null} onClose={onClose}>
      <Box sx={modalStyle}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Detalles de la Muestra</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {tipoUsuario !== "laboratorista" && (
              <Button
                variant="contained"
                startIcon={<PictureAsPdfIcon />}
                onClick={handleViewPDF}
                sx={{ backgroundColor: '#39A900', '&:hover': { backgroundColor: '#2d8000' } }}
              >
                Ver PDF
              </Button>
            )}
          </Box>
        </Box>
        
        {/* Botones de Cotización */}
        {esCotizacion && tipoUsuario !== "laboratorista" && (
          <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
              Acciones de Cotización
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {!cotizacionAceptada ? (
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
              ) : (
                <>                  <Button
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
                    {isProcessing ? 'Procesando...' : 'Rechazar Cotización'}
                  </Button>
                </>
              )}
            </Box>
          </Box>
        )}
        {selectedMuestra && (
          <TableContainer component={Paper} sx={{ maxWidth: "100%" }}>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>ID Muestra</TableCell>
                  <TableCell>{selectedMuestra.id_muestra || selectedMuestra._id || "N/A"}</TableCell>
                </TableRow>
                {!hideClientData && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>Documento</TableCell>
                    <TableCell>
                      {selectedMuestra.documento || selectedMuestra.cliente?.documento || "N/A"}
                    </TableCell>
                  </TableRow>
                )}
                {!hideClientData && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>Cliente</TableCell>
                    <TableCell>
                      {selectedMuestra.nombreCliente || selectedMuestra.cliente?.nombre || "No encontrado"}
                    </TableCell>
                  </TableRow>
                )}
                {!hideClientData && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>Fecha de Creación</TableCell>
                    <TableCell>
                      {selectedMuestra.creadoPor?.fechaCreacion?.fecha || "N/A"}
                    </TableCell>
                  </TableRow>
                )}
                {!hideClientData && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>Hora de Creación</TableCell>
                    <TableCell>
                      {(() => {
                        const hora = selectedMuestra.creadoPor?.fechaCreacion?.hora;
                        if (!hora) return "N/A";
                        const [hours, minutes, seconds] = hora.split(":");
                        let hours12 = parseInt(hours, 10) % 12 || 12;
                        const ampm = parseInt(hours, 10) >= 12 ? "PM" : "AM";
                        return `${hours12}:${minutes} ${ampm}`;
                      })()}
                    </TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>Tipo de Análisis</TableCell>
                  <TableCell>{selectedMuestra.tipoAnalisis || "N/A"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>Tipo de Muestreo</TableCell>
                  <TableCell>{selectedMuestra.tipoMuestreo || "N/A"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>Fecha y Hora de Muestreo</TableCell>
                  <TableCell>{formatFechaHora(selectedMuestra.fechaHoraMuestreo)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>Lugar de Muestreo</TableCell>
                  <TableCell>{selectedMuestra.lugarMuestreo || "N/A"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>Identificación de Muestra</TableCell>
                  <TableCell>{selectedMuestra.identificacionMuestra || "N/A"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>Plan de Muestreo</TableCell>
                  <TableCell>{selectedMuestra.planMuestreo || "N/A"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>Condiciones Ambientales</TableCell>
                  <TableCell>{selectedMuestra.condicionesAmbientales || "N/A"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>Preservación de Muestra</TableCell>
                  <TableCell>{selectedMuestra.preservacionMuestra || "N/A"}</TableCell>
                </TableRow>
                {selectedMuestra.preservacionMuestra === "Otro" && (
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold" }}>Detalle de Preservación</TableCell>
                    <TableCell>{selectedMuestra.preservacionMuestraOtra || "N/A"}</TableCell>
                  </TableRow>
                )}
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>Tipo de Agua</TableCell>
                  <TableCell>
                    {selectedMuestra.tipoDeAgua?.descripcionCompleta ||
                      selectedMuestra.tipoDeAgua?.tipo ||
                      "N/A"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>Análisis Seleccionados</TableCell>
                  <TableCell>
                    {Array.isArray(selectedMuestra.analisisSeleccionados) && selectedMuestra.analisisSeleccionados.length > 0
                      ? selectedMuestra.analisisSeleccionados
                          .map((analisis) =>
                            typeof analisis === "object" && analisis !== null
                              ? analisis.nombre || "Desconocido"
                              : analisis
                          )
                          .join(", ")
                      : "Ninguno"}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>Observaciones</TableCell>
                  <TableCell>{selectedMuestra.observaciones || "N/A"}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>Estado</TableCell>
                  <TableCell>
                    {(() => {
                      const estadoProps = getEstadoChipProps(selectedMuestra.estado || "No especificado");
                      return (
                        <Chip
                          label={selectedMuestra.estado || "No especificado"}
                          sx={estadoProps.sx}
                        />
                      );
                    })()}
                  </TableCell>
                </TableRow>
                {selectedMuestra.historial && selectedMuestra.historial.length > 0 && (
                  <>
                    <TableRow>
                      <TableCell sx={{ fontWeight: "bold" }}>Muestra creada por:</TableCell>
                      <TableCell>
                        {selectedMuestra.historial[selectedMuestra.historial.length - 1].administrador?.nombre || "N/A"}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: "bold" }}>Fecha de cambio</TableCell>
                      <TableCell>
                        {new Date(
                          selectedMuestra.historial[selectedMuestra.historial.length - 1].fechaCambio
                        ).toLocaleString()}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: "bold" }}>Observaciones Hist.</TableCell>
                      <TableCell>
                        {selectedMuestra.historial[selectedMuestra.historial.length - 1].observaciones || "N/A"}
                      </TableCell>
                    </TableRow>
                  </>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
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

  // Cargar análisis según tipo
  const cargarAnalisis = async (tipo) => {
    try {
      const token = localStorage.getItem("token");
      // Normalizar tipo para endpoint
      let tipoNormalizado = tipo
        .toLowerCase()
        .replace('í', 'i')
        .replace('ó', 'o')
        .replace('químico', 'quimico')
        .replace('microbiológico', 'microbiologico');
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
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnalisisDisponibles(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      setAnalisisDisponibles([]);
    }
  };

  useEffect(() => {
    if (editingMuestra && editingMuestra.tipoAnalisis) {
      cargarAnalisis(editingMuestra.tipoAnalisis);
    } else {
      setAnalisisDisponibles([]);
    }
  }, [editingMuestra?.tipoAnalisis]);

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
    if (editingMuestra.preservacionMuestra === 'Otro' && !editingMuestra.preservacionMuestraOtra) return 'Debe especificar preservación "Otro"';
    if (!editingMuestra.analisisSeleccionados || editingMuestra.analisisSeleccionados.length === 0) return 'Debe seleccionar al menos un análisis';
    return null;
  };

  const handleAnalisisChange = (analisisNombre) => {
    setEditingMuestra((prev) => {
      const alreadySelected = prev.analisisSeleccionados?.includes(analisisNombre);
      return {
        ...prev,
        analisisSeleccionados: alreadySelected
          ? prev.analisisSeleccionados.filter((item) => item !== analisisNombre)
          : [...(prev.analisisSeleccionados || []), analisisNombre],
      };
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
      <Box sx={{ ...modalStyle, width: 700, maxWidth: '98vw' }}>
        <Typography variant="h5" align="center" sx={{ mb: 2, fontWeight: 'bold', color: '#39A900' }}>
          Editar Muestra
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
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
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Tipo de Análisis</Typography>
                <Select
                  fullWidth
                  value={editingMuestra.tipoAnalisis || ''}
                  onChange={e => setEditingMuestra({ ...editingMuestra, tipoAnalisis: e.target.value, analisisSeleccionados: [] })}
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
          <Divider sx={{ my: 2 }} />
          {/* Sección: Análisis a Realizar */}
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Análisis a Realizar</Typography>
            {analisisDisponibles.length === 0 ? (
              <Alert severity="info" sx={{ mb: 2 }}>
                No hay análisis disponibles para este tipo (o aún no se han cargado).
              </Alert>
            ) : (
              <Accordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>
                    {editingMuestra.tipoAnalisis === "Fisicoquímico"
                      ? "Análisis Fisicoquímicos"
                      : "Análisis Microbiológicos"}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={2}>
                    {analisisDisponibles.map((analisis) => (
                      <Grid item xs={12} sm={6} key={analisis.nombre}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={editingMuestra.analisisSeleccionados?.includes(analisis.nombre)}
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
          </Box>
          <Button variant="contained" color="primary" fullWidth onClick={handleGuardar} sx={{ mt: 2, py: 1.5, fontWeight: 'bold', bgcolor: '#39A900', '&:hover': { bgcolor: '#2d8600' } }}>
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
  const hideClientData = tipoUsuario === "laboratorista";  const [snackbarOpen, setSnackbarOpen] = useState(false);
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
  };

  const modalStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 600,
    bgcolor: "background.paper",
    boxShadow: 24,
    p: 4,
    borderRadius: 2,
    maxHeight: "90vh",
    overflowY: "auto",
  };

  // Ajustar la función fetchMuestras para manejar correctamente el formato de fecha
  const fetchMuestras = useCallback(async (
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
    tipo = filterType,
    searchQuery = search,
    dateFilter = filterDate,
    applyFiltersToAllPages = true
  ) => {
    try {
      setLoading(true);
      const formattedDate = dateFilter ? dateFilter.split("-").reverse().join("/") : "";
      const response = await muestrasService.obtenerMuestras({
        page,
        limit,
        sortBy,
        sortOrder,
        tipo: tipo !== "todos" ? tipo : undefined,
        search: searchQuery.trim() || undefined,
        date: formattedDate || undefined,
        applyFiltersToAllPages
      });
      if (response.success && response.data) {
        setMuestras(response.data.items);
        setPagination({
          page: response.data.page,
          limit: response.data.limit,
          total: response.data.total,
          totalPages: response.data.totalPages,
        });
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
  }, [filterType, search, filterDate]);

  useEffect(() => {
    fetchMuestras(pagination.page, pagination.limit, "createdAt", "desc", filterType, search, filterDate);
  }, [fetchMuestras, pagination.page, filterType, search, filterDate]);

  const handleViewDetails = useCallback((muestra) => setSelectedMuestra(muestra), []);
  const handleEditMuestra = useCallback((muestra) => setEditingMuestra(muestra), []);
  const handleClearFilters = useCallback(() => {
    setFilterType("todos");
    setFilterDate("");
    setSearch("");
    fetchMuestras(1, pagination.limit, "createdAt", "desc", "todos", "", "");
  }, [fetchMuestras, pagination.limit]);

  const handleSaveEdit = async () => {
    try {
      const updateData = {
        tipoAnalisis: editingMuestra.tipoAnalisis,
        tipoMuestreo: editingMuestra.tipoMuestreo,
        fechaHoraMuestreo: convertISOToFechaHoraObject(editingMuestra.fechaHoraMuestreo),
        lugarMuestreo: editingMuestra.lugarMuestreo,
        identificacionMuestra: editingMuestra.identificacionMuestra,
        planMuestreo: editingMuestra.planMuestreo,
        condicionesAmbientales: editingMuestra.condicionesAmbientales,
        preservacionMuestra: editingMuestra.preservacionMuestra,
        preservacionMuestraOtra:
          editingMuestra.preservacionMuestra === "Otro" ? editingMuestra.preservacionMuestraOtra : "",
        analisisSeleccionados: editingMuestra.analisisSeleccionados,
        observaciones: editingMuestra.observaciones,
      };

      await axios.put(
        `${API_URLS.MUESTRAS}/${editingMuestra.id_muestra || editingMuestra._id}`,
        updateData,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const updatedMuestras = muestras.map((m) =>
        (m.id_muestra === editingMuestra.id_muestrea || m.id_muestrea === editingMuestra.id_muestrea || m.id_muestra === editingMuestra.id_muestra || m._id === editingMuestra._id)
          ? { ...m, ...updateData }
          : m
      );
      setMuestras(updatedMuestras);
      setEditingMuestra(null);
      setSnackbarMessage("Muestra actualizada exitosamente");
      setSnackbarSeverity("success");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Error al actualizar la muestra:", error);
      setSnackbarMessage("Error al actualizar la muestra: " + (error.response?.data?.message || error.message));
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

  const handleFilterChange = useCallback((e) => {
    setFilterType(e.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handleDateChange = useCallback((e) => {
    setFilterDate(e.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handleSearchChange = useCallback((e) => {
    setSearch(e.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
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
      >
        {/* Encabezado con ícono */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <ScienceIcon sx={{ fontSize: 40, color: '#39A900', mr: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#39A900', flex: 1 }}>
            Muestras Registradas
          </Typography>
        </Box>
        {/* Cinta decorativa */}
        <Box sx={{ height: 6, width: 120, background: 'linear-gradient(90deg, #39A900 60%, #b2dfdb 100%)', borderRadius: 3, mb: 3 }} />
        {/* Filtros y búsqueda en tarjeta */}
        <Paper elevation={3} sx={{ mb: 3, p: 2, borderRadius: 3, background: '#f9fbe7' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <Select value={filterType} onChange={handleFilterChange} fullWidth sx={{ background: 'white', borderRadius: 2, boxShadow: 1 }}>
                <MenuItem value="todos">Todos</MenuItem>
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
                label="Buscar (ID o Cliente)"
                variant="outlined"
                fullWidth
                value={search}
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
        {/* Tabla Resumida en tarjeta */}
        <Paper elevation={2} sx={{ borderRadius: 3, boxShadow: 3, overflow: 'auto', minWidth: 1100 }}>
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
                {muestras.map((muestra, idx) => (
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
                        <MemoActionButton
                          tooltip="Registrar Resultados"
                          onClick={() => navigate(`/registrar-resultados/${muestra.id_muestrea || muestra.id_muestra || muestra._id}`)}
                          IconComponent={AssignmentIcon}
                        />
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
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