import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Chip,
  Box,
  Divider,
  IconButton,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  Science as ScienceIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { cambiosEstadoService } from '../services/cambiosEstado.service';
import { muestrasService } from '../services/muestras.service';

const NotificationDetailModal = ({ notification, open, onClose, onRemove }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  
  if (!notification || !notification.muestra) return null;

  const { muestra } = notification;

  // Función para formatear fecha
  const formatFecha = (fechaHoraMuestreo) => {
    if (!fechaHoraMuestreo) return "N/A";
    
    if (fechaHoraMuestreo.fecha && fechaHoraMuestreo.hora) {
      return `${fechaHoraMuestreo.fecha} ${fechaHoraMuestreo.hora}`;
    }
    
    const date = new Date(fechaHoraMuestreo);
    return isNaN(date) ? fechaHoraMuestreo : date.toLocaleDateString();
  };

  // Función para obtener las propiedades del chip según el estado
  const getEstadoChipProps = (estado) => {
    switch (estado) {
      case "En Cotización":
      case "En Cotizacion":
        return {
          sx: {
            backgroundColor: "#FFF3E0",
            color: "#E65100",
            fontWeight: "bold",
            border: "1px solid #FFB74D"
          }
        };
      default:
        return {
          sx: {
            backgroundColor: "#E3F2FD",
            color: "#1976D2",
            fontWeight: "bold"
          }
        };
    }
  };  const handleRemoveAndClose = () => {
    onRemove(notification.id);
    onClose();
  };

  const handleAceptarMuestra = async () => {
    if (!muestra || isProcessing) return;
    
    setIsProcessing(true);
    try {
      const idMuestra = muestra.id_muestra || muestra.id_muestrea || muestra._id;
        // Usar el servicio de cambios de estado para aceptar la cotización
      await cambiosEstadoService.aceptarCotizacion(idMuestra);
      
      // Remover la notificación y cerrar el modal
      handleRemoveAndClose();
      
    } catch (error) {
      console.error("Error al aceptar muestra:", error);
      alert("Error al aceptar la muestra: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRechazarMuestra = async () => {
    if (!muestra || isProcessing) return;
    
    const confirmacion = window.confirm(
      "¿Está seguro de que desea rechazar esta cotización? Esta acción cambiará el estado de la muestra a 'Rechazada'."
    );
    if (!confirmacion) return;
    
    setIsProcessing(true);
    try {
      const idMuestra = muestra.id_muestra || muestra.id_muestrea || muestra._id;
      
      // Actualizar el estado de la muestra a rechazada
      const datosActualizacion = {
        estado: "Rechazada",
        observaciones: (muestra.observaciones || '') + `\n[SISTEMA] Cotización rechazada por el cliente desde notificación`
      };      await muestrasService.actualizarMuestra(idMuestra, datosActualizacion);
      
      // Remover la notificación y cerrar el modal
      handleRemoveAndClose();
      
    } catch (error) {
      console.error("Error al rechazar muestra:", error);
      alert("Error al rechazar la muestra: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
        }
      }}
    >
      <DialogTitle sx={{ 
        bgcolor: '#39A900', 
        color: 'white', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <ScienceIcon sx={{ mr: 1 }} />
          <Typography variant="h6" component="div">
            Detalle de Muestra en Cotización
          </Typography>
        </Box>
        <IconButton 
          onClick={onClose}
          sx={{ color: 'white' }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Información básica */}
          <Grid item xs={12}>
            <Box sx={{ 
              p: 2, 
              bgcolor: '#f8f9fa', 
              borderRadius: 2, 
              border: '1px solid #e9ecef' 
            }}>
              <Typography variant="h6" sx={{ mb: 2, color: '#39A900', fontWeight: 'bold' }}>
                Información de la Muestra
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    ID de Muestra
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {muestra.id_muestra || muestra.id_muestrea || muestra._id || "N/A"}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Estado
                  </Typography>
                  <Chip 
                    label={muestra.estado} 
                    sx={getEstadoChipProps(muestra.estado).sx}
                    size="small"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    <PersonIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                    Cliente
                  </Typography>
                  <Typography variant="body1">
                    {muestra.cliente?.nombre || muestra.nombreCliente || "N/A"}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Documento
                  </Typography>
                  <Typography variant="body1">
                    {muestra.cliente?.documento || muestra.documento || "N/A"}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    <LocationIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                    Lugar de Muestreo
                  </Typography>
                  <Typography variant="body1">
                    {muestra.lugarMuestreo || "N/A"}
                  </Typography>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    <CalendarIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                    Fecha de Muestreo
                  </Typography>
                  <Typography variant="body1">
                    {formatFecha(muestra.fechaHoraMuestreo)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Grid>

          {/* Análisis y tipo */}
          <Grid item xs={12}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 2, color: '#39A900', fontWeight: 'bold' }}>
              Información del Análisis
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Tipo de Análisis
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                  {muestra.tipoAnalisis || "N/A"}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Tipo de Agua
                </Typography>
                <Typography variant="body1">
                  {muestra.tipoDeAgua?.descripcionCompleta || 
                   muestra.tipoDeAgua?.tipo || 
                   "N/A"}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Análisis Seleccionados
                </Typography>
                <Typography variant="body1">
                  {Array.isArray(muestra.analisisSeleccionados) && muestra.analisisSeleccionados.length > 0
                    ? muestra.analisisSeleccionados
                        .map((analisis) =>
                          typeof analisis === "object" && analisis !== null
                            ? analisis.nombre || "Desconocido"
                            : analisis
                        )
                        .join(", ")
                    : "Ninguno"}
                </Typography>
              </Grid>

              {muestra.observaciones && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Observaciones
                  </Typography>
                  <Typography variant="body1">
                    {muestra.observaciones}
                  </Typography>
                </Grid>
              )}
            </Grid>
          </Grid>
        </Grid>        <Box sx={{ 
          mt: 3, 
          p: 2, 
          bgcolor: '#fff3cd', 
          borderRadius: 2, 
          border: '1px solid #ffeaa7' 
        }}>
          <Typography variant="body2" sx={{ color: '#856404', fontWeight: 'bold' }}>
            💡 Esta muestra requiere cotización y está esperando su decisión.
          </Typography>
          <Typography variant="body2" sx={{ color: '#856404', mt: 1 }}>
            Puede aceptar la muestra para continuar con el proceso de análisis, o rechazarla si no desea proceder.
          </Typography>
        </Box>
      </DialogContent>      <DialogActions sx={{ p: 3, bgcolor: '#f8f9fa', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            onClick={handleAceptarMuestra}
            variant="contained"
            color="success"
            disabled={isProcessing}
            startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />}
            sx={{ 
              bgcolor: '#4caf50', 
              '&:hover': { bgcolor: '#45a049' },
              '&:disabled': { bgcolor: '#cccccc' }
            }}
          >
            {isProcessing ? 'Procesando...' : 'Aceptar Muestra'}
          </Button>
          
          <Button 
            onClick={handleRechazarMuestra}
            variant="contained"
            color="error"
            disabled={isProcessing}
            startIcon={isProcessing ? <CircularProgress size={20} color="inherit" /> : <CancelIcon />}
            sx={{ 
              bgcolor: '#f44336', 
              '&:hover': { bgcolor: '#d32f2f' },
              '&:disabled': { bgcolor: '#cccccc' }
            }}
          >
            {isProcessing ? 'Procesando...' : 'Rechazar Muestra'}
          </Button>
        </Box>
        
        <Button 
          onClick={onClose}
          variant="outlined"
          disabled={isProcessing}
          sx={{ 
            color: '#39A900',
            borderColor: '#39A900',
            '&:hover': { 
              bgcolor: '#39A900', 
              color: 'white',
              borderColor: '#39A900'
            },
            '&:disabled': { 
              color: '#cccccc',
              borderColor: '#cccccc' 
            }
          }}
        >
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NotificationDetailModal;
