import React from 'react';
import { Box, Chip, Tooltip } from '@mui/material';
import { 
  Wifi as WifiIcon,
  WifiOff as WifiOffIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Sync as SyncIcon
} from '@mui/icons-material';
import { useNotifications } from '../context/NotificationContext';

const ConnectionStatus = () => {
  const { loading, connectionStatus } = useNotifications();

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case 'error':
        return <ErrorIcon fontSize="small" />;
      case 'connecting':
        return <SyncIcon fontSize="small" sx={{ animation: 'spin 1s linear infinite' }} />;
      case 'connected':
        return loading ? 
          <WifiIcon fontSize="small" sx={{ animation: 'pulse 1.5s infinite' }} /> :
          <CheckCircleIcon fontSize="small" />;
      default:
        return <WifiOffIcon fontSize="small" />;
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'error':
        return 'error';
      case 'connecting':
        return 'warning';
      case 'connected':
        return 'success';
      default:
        return 'default';
    }
  };
  const getStatusText = () => {
    switch (connectionStatus) {
      case 'error':
        return 'Error';
      case 'connecting':
        return 'Conectando...';
      case 'connected':
        return loading ? 'Sincronizando...' : ''; // Solo ícono cuando está conectado
      default:
        return 'Desconectado';
    }
  };

  const getTooltipText = () => {
    switch (connectionStatus) {
      case 'error':
        return 'Error de conexión. Verificando conexión al servidor...';
      case 'connecting':
        return 'Conectando al servidor para sincronizar notificaciones...';
      case 'connected':
        return loading ? 
          'Sincronizando notificaciones con el servidor...' :
          'Conectado. Las notificaciones se actualizan automáticamente.';
      default:
        return 'Sin conexión. Las notificaciones no se actualizarán.';
    }
  };
  return (
    <Tooltip title={getTooltipText()} placement="bottom" arrow>
      <Box sx={{ mr: 1 }}>
        {getStatusText() === '' ? (
          // Solo ícono cuando está conectado sin carga
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            color: 'white',
            fontSize: '1.2rem'
          }}>
            {getStatusIcon()}
          </Box>
        ) : (
          // Chip con texto para otros estados
          <Chip
            icon={getStatusIcon()}
            label={getStatusText()}
            color={getStatusColor()}
            size="small"
            variant="outlined"
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              borderColor: 'rgba(255, 255, 255, 0.3)',
              '& .MuiChip-icon': {
                color: 'white'
              },
              '& .MuiChip-label': {
                fontSize: '0.75rem',
                fontWeight: 'bold'
              },
              height: 24,
              '@keyframes pulse': {
                '0%': { opacity: 1 },
                '50%': { opacity: 0.5 },
                '100%': { opacity: 1 }
              },
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' }
              }
            }}
          />
        )}
      </Box>
    </Tooltip>
  );
};

export default ConnectionStatus;
