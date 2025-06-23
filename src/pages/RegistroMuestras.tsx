import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  FormControl,
  FormControlLabel,
  Checkbox,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  MenuItem,
  Select,
  InputLabel,
  Modal,
  Backdrop,
  Fade,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Pagination,
  PaginationItem,
  FormHelperText,
  Divider,
  Card,
  CardContent,
  IconButton,
  Switch,
  Fab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  InputAdornment,
  Chip,
} from '@mui/material';
// Iconos básicos
import PersonIcon from '@mui/icons-material/Person';
import BadgeIcon from '@mui/icons-material/Badge';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import BusinessIcon from '@mui/icons-material/Business';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
// Iconos para el header modernizado
import ScienceIcon from '@mui/icons-material/Science';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import AssignmentIcon from '@mui/icons-material/Assignment';
import SearchIcon from '@mui/icons-material/Search';
// Iconos para campos del formulario
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import OpacityIcon from '@mui/icons-material/Opacity';
import NatureIcon from '@mui/icons-material/Nature';
import DescriptionIcon from '@mui/icons-material/Description';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import InventoryIcon from '@mui/icons-material/Inventory';
// Iconos para alertas personalizadas
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import CelebrationIcon from '@mui/icons-material/Celebration';
// Iconos para botones modernos
import SendIcon from '@mui/icons-material/Send';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import RequestQuoteIcon from '@mui/icons-material/RequestQuote';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
// Iconos para sección de análisis modernizada
import SelectAllIcon from '@mui/icons-material/SelectAll';
import ClearIcon from '@mui/icons-material/Clear';
import CheckIcon from '@mui/icons-material/Check';
import StraightenIcon from '@mui/icons-material/Straighten';
import SettingsIcon from '@mui/icons-material/Settings';
import TuneIcon from '@mui/icons-material/Tune';
import CalculateIcon from '@mui/icons-material/Calculate';
// Componentes externos
import SignatureCanvas from 'react-signature-canvas';
import SignaturePad from '../components/SignaturePad';
import FirmasDigitales from '../components/FirmasDigitales';
import { muestrasService } from '../services/muestras.service';
import { SelectChangeEvent } from '@mui/material/Select';
import { Theme } from '@mui/material/styles';
// URLs base actualizadas
const BASE_URLS = {
  USUARIOS: 'https://backend-sena-lab-1-qpzp.onrender.com/api',
  MUESTRAS: 'https://backend-registro-muestras.onrender.com/api',
};

// URLs específicas actualizadas
const API_URLS = {
  USUARIOS: `${BASE_URLS.USUARIOS}/usuarios`,
  MUESTRAS: `${BASE_URLS.MUESTRAS}/muestras`,
  ANALISIS: `${BASE_URLS.MUESTRAS}/analisis`,
  ANALISIS_FISICOQUIMICOS: `${BASE_URLS.MUESTRAS}/analisis/fisicoquimico`,
  ANALISIS_MICROBIOLOGICOS: `${BASE_URLS.MUESTRAS}/analisis/microbiologico`,
};

// Helper function to remove accents and normalize text
const normalizeText = (text: string): string => {
  return text
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
    .toLowerCase(); // Convert to lowercase
};

const TIPOS_PRESERVACION = ['Refrigeración', 'Congelación', 'Acidificación', 'Otro'] as const;
type TipoPreservacion = typeof TIPOS_PRESERVACION[number];

const TIPOS_MUESTREO = ['Simple', 'Compuesto'] as const;
type TipoMuestreo = typeof TIPOS_MUESTREO[number];

const TIPOS_AGUA = ['potable', 'natural', 'residual', 'otra'] as const;
type TipoAgua = typeof TIPOS_AGUA[number];

const TIPOS_AGUA_RESIDUAL = ['Doméstica', 'No Doméstica'] as const;
type TipoAguaResidual = typeof TIPOS_AGUA_RESIDUAL[number];

const SUBTIPOS_RESIDUAL = {
  DOMESTICA: 'Doméstica',
  NO_DOMESTICA: 'No Doméstica',
} as const;

const TIPOS_ANALISIS = ['Fisicoquímico', 'Microbiológico'] as const;
type TipoAnalisis = typeof TIPOS_ANALISIS[number];

const ESTADOS_VALIDOS = ['Recibida', 'En análisis', 'Pendiente de resultados', 'Finalizada', 'Rechazada'] as const;
type EstadoMuestra = typeof ESTADOS_VALIDOS[number];

interface TipoDeAgua {
  tipo: string;
  codigo: string;
  descripcion: string;
  subtipo?: string;
}

interface AnalisisSeleccionado {
  nombre: string;
  precio?: number;
  unidad?: string;
  metodo?: string;
  rango?: string;
}

interface MuestraFormData {
  documento: string;
  tipoDeAgua: TipoDeAgua;
  tipoMuestreo: TipoMuestreo;
  lugarMuestreo: string;
  fechaHoraMuestreo: string;
  tipoAnalisis: TipoAnalisis | '';
  identificacionMuestra: string;
  planMuestreo: string;
  condicionesAmbientales: string;
  preservacionMuestra: TipoPreservacion | '';
  preservacionMuestraOtra?: string;
  analisisSeleccionados: string[];
  firmas: {
    firmaAdministrador: {
      nombre?: string;
      documento?: string;
      firma: string;
    };
    firmaCliente: {
      nombre?: string;
      documento?: string;
      firma: string;
    };
  };
  observaciones?: string;
}

interface Cliente {
  documento: string;
  nombre?: string;
  razonSocial?: string;
  telefono: string;
  email: string;
  direccion: string;
}

interface ClienteData {
  nombre: string;
  documento: string;
  telefono: string;
  direccion: string;
  email: string;
  tipo_cliente: string;
  razonSocial: string;
}

interface AdminData {
  id: string;
  nombre: string;
  documento: string;
  rol: string;
  email: string;
}

interface Firma {
  cedula: string;
  firma: string;
  timestamp: string;
  tamaño: number;
}

interface FirmasState {
  administrador: Firma | null;
  cliente: Firma | null;
}

interface AnalisisCategoria {
  _id?: string;
  nombre: string;
  unidad: string;
  metodo?: string;
  precio?: number;
  rango?: string;
  matriz?: string[];
  tipo: string;
  activo: boolean;
}

interface AnalisisDisponibles {
  fisicoquimico: AnalisisCategoria[];
  microbiologico: AnalisisCategoria[];
}

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface AnalisisCache {
  [key: string]: AnalisisCategoria[];
}

interface NewAnalisisData {
  nombre: string;
  metodo: string;
  unidad: string;
  rango: string;
  precio: string;
  matriz: string[];
  tipo: TipoAnalisis | '';
  activo: boolean;
}

const initialFormData: MuestraFormData = {
  documento: '',
  tipoDeAgua: { tipo: '', codigo: '', descripcion: '' },
  tipoMuestreo: 'Simple',
  lugarMuestreo: '',
  fechaHoraMuestreo: '',
  tipoAnalisis: '',
  identificacionMuestra: '',
  planMuestreo: '',
  condicionesAmbientales: '',
  preservacionMuestra: '',
  preservacionMuestraOtra: '',
  analisisSeleccionados: [],
  firmas: {
    firmaAdministrador: { firma: '' },
    firmaCliente: { firma: '' },
  },
  observaciones: '',
};

const initialClienteData: ClienteData = {
  nombre: '',
  documento: '',
  telefono: '',
  direccion: '',
  email: '',
  tipo_cliente: '',
  razonSocial: '',
};

const initialNewAnalisisData: NewAnalisisData = {
  nombre: '',
  metodo: '',
  unidad: '',
  rango: '',
  precio: '',
  matriz: ['AP', 'AS'],
  tipo: '',
  activo: true,
};

const initialFirmasState: FirmasState = {
  administrador: null,
  cliente: null,
};

const initialPaginationState: PaginationState = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
};

const axiosInstance = axios.create({
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
  withCredentials: false,
});

const getTipoAguaCodigo = (tipo: string): string => {
  switch (tipo) {
    case 'potable':
      return 'P';
    case 'natural':
      return 'N';
    case 'residual':
      return 'R';
    case 'otra':
      return 'O';
    default:
      return '';
  }
};

const TIPOS_ANALISIS_ENUM = {
  FISICOQUIMICO: 'Fisicoquímico',
  MICROBIOLOGICO: 'Microbiológico',
} as const;

function useDebouncedValue<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
}

const RegistroMuestras: React.FC = () => {
  const navigate = useNavigate();
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [firmas, setFirmas] = useState<FirmasState>(initialFirmasState);
  const [formData, setFormData] = useState<MuestraFormData>(initialFormData);
  const [clienteEncontrado, setClienteEncontrado] = useState<Cliente | null>(null);
  const [validatingUser, setValidatingUser] = useState<boolean>(false);
  const [userValidationError, setUserValidationError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mostrarFirmas, setMostrarFirmas] = useState(false);
  const [firmasCompletas, setFirmasCompletas] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [muestraId, setMuestraId] = useState<string | null>(null);
  const [isRejected, setIsRejected] = useState<boolean>(false);
  const [openRechazoModal, setOpenRechazoModal] = useState<boolean>(false);
  const [observacionRechazo, setObservacionRechazo] = useState<string>('');  const [openClienteModal, setOpenClienteModal] = useState<boolean>(false);
  const [clienteModalClosing, setClienteModalClosing] = useState<boolean>(false);
  const [openAnalisisModal, setOpenAnalisisModal] = useState<boolean>(false);const [clienteData, setClienteData] = useState<ClienteData>(initialClienteData);
  const [newAnalisisData, setNewAnalisisData] = useState<NewAnalisisData>(initialNewAnalisisData);
  const [registroError, setRegistroError] = useState<string | null>(null);
  const [registroExito, setRegistroExito] = useState<string | null>(null);  const [registrando, setRegistrando] = useState<boolean>(false);
  const [analisisDisponibles, setAnalisisDisponibles] = useState<AnalisisDisponibles | null>(null);
  const [allAnalisis, setAllAnalisis] = useState<AnalisisCategoria[]>([]);
  const [pagination, setPagination] = useState<PaginationState>(initialPaginationState);
  const [analisisCache, setAnalisisCache] = useState<AnalisisCache>({});
  const [loadingAnalisis, setLoadingAnalisis] = useState(false);
  const [analisisError, setAnalisisError] = useState<string | null>(null);
  const [analisisSuccess, setAnalisisSuccess] = useState<string | null>(null);
  const [editingAnalisis, setEditingAnalisis] = useState<AnalisisCategoria | null>(null);  const [showAnalisisForm, setShowAnalisisForm] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  const firmaAdministradorRef = useRef<SignatureCanvas | null>(null);
  const firmaClienteRef = useRef<SignatureCanvas | null>(null);
  const analisisFormRef = useRef<HTMLDivElement | null>(null);
  const analisisModalRef = useRef<HTMLDivElement | null>(null);
  const clienteModalRef = useRef<HTMLDivElement | null>(null);
  const debouncedDocumento = useDebouncedValue(formData.documento, 400);
  const debouncedSearchTerm = useDebouncedValue(searchTerm, 300);

  // Limpia solo campos de muestra
  const clearUniqueFields = () => {
    setFormData(prev => ({ ...prev, observaciones: '' }));
    setMostrarFirmas(false);
  };

  useEffect(() => {
    const verificarAdmin = async () => {
      try {
        const { userData, token } = obtenerDatosUsuario();
        const rol = typeof userData.rol === 'string' ? userData.rol : userData.rol?.name;
        if (!token || !rol || rol !== 'administrador') {
          setError('Acceso denegado. Se requieren permisos de administrador.');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        setAdminData({
          id: userData._id,
          nombre: userData.nombre,
          documento: userData.documento,
          rol,
          email: userData.email,
        });
      } catch (err) {
        console.error('Error al verificar administrador:', err);
        setError('Error al verificar credenciales. Por favor, inicie sesión nuevamente.');
        setTimeout(() => navigate('/login'), 2000);
      }
    };
    verificarAdmin();
  }, [navigate]);

  useEffect(() => {
    setFirmasCompletas(!!(firmas.administrador && firmas.cliente));
  }, [firmas]);

  useEffect(() => {
    const cargarAnalisis = async (signal: AbortSignal) => {
      try {
        if (!formData.tipoAnalisis) return;
        setLoadingAnalisis(true);
        setError(null);
        const endpoint = formData.tipoAnalisis === TIPOS_ANALISIS_ENUM.FISICOQUIMICO
          ? API_URLS.ANALISIS_FISICOQUIMICOS
          : API_URLS.ANALISIS_MICROBIOLOGICOS;
        const response = await axios.get(endpoint, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
          signal,
        });
        if (response.data && response.data.success && Array.isArray(response.data.data)) {
          setAnalisisDisponibles(prev => ({
            fisicoquimico: formData.tipoAnalisis === TIPOS_ANALISIS_ENUM.FISICOQUIMICO
              ? response.data.data.filter((a: AnalisisCategoria) => a.activo)
              : (prev?.fisicoquimico || []),
            microbiologico: formData.tipoAnalisis === TIPOS_ANALISIS_ENUM.MICROBIOLOGICO
              ? response.data.data.filter((a: AnalisisCategoria) => a.activo)
              : (prev?.microbiologico || []),
          }));
        } else if (Array.isArray(response.data)) {
          setAnalisisDisponibles(prev => ({
            fisicoquimico: formData.tipoAnalisis === TIPOS_ANALISIS_ENUM.FISICOQUIMICO
              ? response.data.filter((a: AnalisisCategoria) => a.activo)
              : (prev?.fisicoquimico || []),
            microbiologico: formData.tipoAnalisis === TIPOS_ANALISIS_ENUM.MICROBIOLOGICO
              ? response.data.filter((a: AnalisisCategoria) => a.activo)
              : (prev?.microbiologico || []),
          }));
        } else {
          throw new Error('Formato de respuesta inválido. Contacte al administrador.');
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Error al cargar análisis:', err);
          setError(`Error al cargar análisis: ${err.message}`);
          setAnalisisDisponibles(null);
        }
      } finally {
        setLoadingAnalisis(false);
      }
    };
    const controller = new AbortController();
    if (formData.tipoAnalisis) cargarAnalisis(controller.signal);
    return () => controller.abort();
  }, [formData.tipoAnalisis]);

  useEffect(() => {
    const cargarTodosAnalisis = async () => {
      try {
        const response = await axios.get(`${API_URLS.ANALISIS}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });
        if (Array.isArray(response.data)) {
          setAllAnalisis(response.data);
        } else if (response.data && response.data.success && Array.isArray(response.data.data)) {
          setAllAnalisis(response.data.data);
        } else {
          throw new Error('Formato de respuesta inválido.');
        }
      } catch (err: any) {
        console.error('Error al cargar todos los análisis:', err);
        setAnalisisError(`Error al cargar análisis: ${err.message}`);
      }
    };
    if (openAnalisisModal) cargarTodosAnalisis();
  }, [openAnalisisModal]);
  // Maneja el foco del modal de análisis para evitar errores de accesibilidad
  useEffect(() => {
    if (openAnalisisModal && analisisModalRef.current) {
      // Pequeño delay para asegurar que el modal se haya renderizado completamente
      const timer = setTimeout(() => {
        if (analisisModalRef.current) {
          analisisModalRef.current.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [openAnalisisModal]);  // Maneja el foco del modal de cliente para evitar errores de accesibilidad
  useEffect(() => {
    if (openClienteModal && !clienteModalClosing) {
      // Asegurar que el modal esté completamente renderizado antes de manejar el foco
      const timer = setTimeout(() => {
        if (clienteModalRef.current && !clienteModalClosing) {
          // Verificar que no hay elementos del contenido principal con foco
          const activeElement = document.activeElement;
          if (activeElement && activeElement !== document.body && activeElement !== clienteModalRef.current) {
            (activeElement as HTMLElement).blur();
          }
          
          // Buscar el primer campo de entrada focusable en el modal
          const firstInput = clienteModalRef.current.querySelector(
            'input[name="nombre"]'
          ) as HTMLInputElement;
          
          if (firstInput && !firstInput.disabled) {
            // Forzar el foco al primer campo del modal
            firstInput.focus();
            // Verificar que efectivamente recibió el foco
            if (document.activeElement !== firstInput) {
              // Si no funcionó, intentar de nuevo después de un pequeño delay
              setTimeout(() => firstInput.focus(), 50);
            }
          } else {
            // Fallback: enfocar el contenedor del modal
            clienteModalRef.current.focus();
          }
        }
      }, 250); // Incrementar el delay para asegurar renderizado completo
      
      return () => clearTimeout(timer);
    }
  }, [openClienteModal, clienteModalClosing]);

  // Debounce para validación de usuario por documento
  const validarFormulario = (data: MuestraFormData): Record<string, string> => {
    const errores: Record<string, string> = {};
    if (!data.documento) errores.documento = 'El documento es requerido';
    if (!data.tipoDeAgua.tipo) errores.tipoDeAgua = 'El tipo de agua es requerido';
    if (data.tipoDeAgua.tipo === 'residual' && !data.tipoDeAgua.subtipo) {
      errores.tipoAguaResidual = 'Debe especificar tipo de agua residual';
    }
    if (data.tipoDeAgua.tipo === 'otra' && !data.tipoDeAgua.descripcion) {
      errores.descripcion = 'Descripción del tipo de agua es requerida';
    }
    if (!data.tipoMuestreo) errores.tipoMuestreo = 'El tipo de muestreo es requerido';
    if (!data.lugarMuestreo) errores.lugarMuestreo = 'El lugar de muestreo es requerido';
    if (!data.fechaHoraMuestreo) errores.fechaHoraMuestreo = 'La fecha y hora de muestreo son requeridas';
    if (!data.tipoAnalisis) errores.tipoAnalisis = 'El tipo de análisis es requerido';
    if (!data.identificacionMuestra) errores.identificacionMuestra = 'Identificación de la muestra es requerida';
    if (!data.planMuestreo) errores.planMuestreo = 'El plan de muestreo es requerido';
    if (!data.condicionesAmbientales) errores.condicionesAmbientales = 'Condiciones ambientales requeridas';
    if (!data.preservacionMuestra) errores.preservacionMuestra = 'Preservación de la muestra es requerida';
    if (data.preservacionMuestra === 'Otro' && !data.preservacionMuestraOtra) {
      errores.preservacionMuestraOtra = 'Debe especificar preservación "Otro"';
    }
    if (!data.analisisSeleccionados.length) {
      errores.analisisSeleccionados = 'Debe seleccionar al menos un análisis';
    }
    if (!isRejected) {
      if (!data.firmas.firmaAdministrador.firma) errores.firmaAdministrador = 'Firma administrador requerida';
      if (!data.firmas.firmaCliente.firma) errores.firmaCliente = 'Firma cliente requerida';
    }
    return errores;
  };  // Campos que deben convertirse automáticamente a mayúsculas
  const camposEnMayusculas = [
    'lugarMuestreo',
    'identificacionMuestra', 
    'planMuestreo',
    'condicionesAmbientales',
    'preservacionMuestraOtra',
    'observaciones'
  ];

  // Función para manejar solo números en documento del formulario principal
  const handleDocumentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    // Solo permitir números y máximo 15 caracteres
    const soloNumeros = /^[0-9]*$/;
    
    if ((soloNumeros.test(value) || value === "") && value.length <= 15) {
      setFormData(prev => ({ ...prev, documento: value }));
      setError(null);
    }
    // Si no cumple la validación, simplemente no actualiza el estado
  };

  const handleChange = useCallback(
    (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent,
    ) => {
      const { name, value } = e.target as HTMLInputElement;
      
      // Convertir a mayúsculas si el campo está en la lista
      const valorFinal = camposEnMayusculas.includes(name) ? value.toUpperCase() : value;
      
      if (name === 'tipoAgua') {
        const codigo = getTipoAguaCodigo(value);
        setFormData(prev => ({
          ...prev,
          tipoDeAgua: {
            ...prev.tipoDeAgua,
            tipo: value,
            codigo,
            descripcion: value === 'otra'
              ? ''
              : value === 'potable'
                ? 'Agua potable'
                : value === 'natural'
                  ? 'Agua natural'
                  : prev.tipoDeAgua.descripcion,
            subtipo: value === 'residual' ? prev.tipoDeAgua.subtipo : undefined,
          },
        }));
      } else if (name === 'descripcion') {
        setFormData(prev => ({
          ...prev,
          tipoDeAgua: { ...prev.tipoDeAgua, descripcion: valorFinal },
        }));
      } else if (name === 'tipoAguaResidual') {
        setFormData(prev => ({
          ...prev,
          tipoDeAgua: {
            ...prev.tipoDeAgua,
            subtipo: value,
            descripcion: `Agua residual ${value}`,
          },
        }));
      } else if (name === 'preservacionMuestra') {
        setFormData(prev => ({ ...prev, preservacionMuestra: value as TipoPreservacion }));
      } else if (name === 'tipoMuestreo') {
        setFormData(prev => ({ ...prev, tipoMuestreo: value as TipoMuestreo }));
      } else {
        setFormData(prev => ({ ...prev, [name]: valorFinal }));
      }
      setError(null);
    },
    [],
  );const handleValidateUser = useCallback(async () => {
    if (!formData.documento) {
      setUserValidationError('Por favor ingrese el documento.');
      return;
    }
    setValidatingUser(true);
    setUserValidationError(null);
    setSuccess(null);
    
    try {
      const token = localStorage.getItem('token');
      
      // Usar directamente el endpoint principal con filtro por documento
      // Esto es más confiable que depender de un endpoint /buscar que puede no existir
      const backendUrl = (import.meta as any).env?.VITE_BACKEND_URL || BASE_URLS.USUARIOS;
      const response = await axiosInstance.get(`${backendUrl}/usuarios`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { documento: formData.documento },
      });

      // Verificar la respuesta
      const userData = response.data?.data || response.data;
      
      if (userData && Array.isArray(userData) && userData.length > 0) {
        // Buscar el cliente específico por documento
        const cliente = userData.find(u => u.documento === formData.documento);
        
        if (cliente) {
          setClienteEncontrado(cliente);
          setSuccess('Cliente encontrado exitosamente');
          setUserValidationError(null);
        } else {
          setUserValidationError('Usuario no encontrado. Puede registrar un nuevo cliente.');
          setClienteEncontrado(null);
        }
      } else if (userData && userData.documento === formData.documento) {
        // Respuesta directa del usuario
        setClienteEncontrado(userData);
        setSuccess('Cliente encontrado exitosamente');
        setUserValidationError(null);
      } else {
        setUserValidationError('Usuario no encontrado. Puede registrar un nuevo cliente.');
        setClienteEncontrado(null);
      }
    } catch (err: any) {
      console.error('Error al validar usuario:', err);
      const errorMessage = err.response?.status === 404 
        ? 'Usuario no encontrado. Puede registrar un nuevo cliente.'
        : err.response?.status === 401
          ? 'Sesión expirada. Por favor, inicie sesión nuevamente.'
          : 'Error al consultar usuario. Intente nuevamente.';
      setUserValidationError(errorMessage);
      setClienteEncontrado(null);
    } finally {
      setValidatingUser(false);
    }
  }, [formData.documento]);

  const handlePageChange = useCallback((_: React.ChangeEvent<unknown>, value: number) => {
    setPagination(prev => ({ ...prev, page: value }));
  }, []);  // Eliminar logs innecesarios en producción
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      // eslint-disable-next-line no-console
      console.log = () => {};
      // eslint-disable-next-line no-console
      console.error = () => {};
    }
  }, []);

  useEffect(() => {
    const cargarAnalisis = async (signal: AbortSignal) => {
      try {
        if (!formData.tipoAnalisis) return;
        setLoadingAnalisis(true);
        setError(null);
        const endpoint = formData.tipoAnalisis === TIPOS_ANALISIS_ENUM.FISICOQUIMICO
          ? API_URLS.ANALISIS_FISICOQUIMICOS
          : API_URLS.ANALISIS_MICROBIOLOGICOS;
        const response = await axios.get(endpoint, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
          signal,
        });
        if (response.data && response.data.success && Array.isArray(response.data.data)) {
          setAnalisisDisponibles(prev => ({
            fisicoquimico: formData.tipoAnalisis === TIPOS_ANALISIS_ENUM.FISICOQUIMICO
              ? response.data.data.filter((a: AnalisisCategoria) => a.activo)
              : (prev?.fisicoquimico || []),
            microbiologico: formData.tipoAnalisis === TIPOS_ANALISIS_ENUM.MICROBIOLOGICO
              ? response.data.data.filter((a: AnalisisCategoria) => a.activo)
              : (prev?.microbiologico || []),
          }));
        } else if (Array.isArray(response.data)) {
          setAnalisisDisponibles(prev => ({
            fisicoquimico: formData.tipoAnalisis === TIPOS_ANALISIS_ENUM.FISICOQUIMICO
              ? response.data.filter((a: AnalisisCategoria) => a.activo)
              : (prev?.fisicoquimico || []),
            microbiologico: formData.tipoAnalisis === TIPOS_ANALISIS_ENUM.MICROBIOLOGICO
              ? response.data.filter((a: AnalisisCategoria) => a.activo)
              : (prev?.microbiologico || []),
          }));
        } else {
          throw new Error('Formato de respuesta inválido. Contacte al administrador.');
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Error al cargar análisis:', err);
          setError(`Error al cargar análisis: ${err.message}`);
          setAnalisisDisponibles(null);
        }
      } finally {
        setLoadingAnalisis(false);
      }
    };
    const controller = new AbortController();
    if (formData.tipoAnalisis) cargarAnalisis(controller.signal);
    return () => controller.abort();
  }, [formData.tipoAnalisis]);

  useEffect(() => {
    const cargarTodosAnalisis = async () => {
      try {
        const response = await axios.get(`${API_URLS.ANALISIS}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });
        if (Array.isArray(response.data)) {
          setAllAnalisis(response.data);
        } else if (response.data && response.data.success && Array.isArray(response.data.data)) {
          setAllAnalisis(response.data.data);
        } else {
          throw new Error('Formato de respuesta inválido.');
        }
      } catch (err: any) {
        console.error('Error al cargar todos los análisis:', err);
        setAnalisisError(`Error al cargar análisis: ${err.message}`);
      }
    };
    if (openAnalisisModal) cargarTodosAnalisis();
  }, [openAnalisisModal]);

  // Feedback visual si no hay análisis disponibles
  const noAnalisisMsg = useMemo(() => {
    if (formData.tipoAnalisis && analisisDisponibles) {
      const arr = formData.tipoAnalisis === TIPOS_ANALISIS_ENUM.FISICOQUIMICO
        ? analisisDisponibles.fisicoquimico
        : analisisDisponibles.microbiologico;
      if (arr.length === 0) return 'No hay análisis disponibles para este tipo.';
    }
    return '';
  }, [formData.tipoAnalisis, analisisDisponibles]);

  // Foco automático en el primer campo con error
  const firstErrorRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (error && firstErrorRef.current) {
      firstErrorRef.current.focus();
    }
  }, [error]);

  const handleCotizacion = async () => {
    // Validar formulario (sin firmas)
    const errores = validarFormulario(formData);
    const erroresSinFirmas = Object.keys(errores).reduce((acc, key) => {
      if (key !== 'firmaAdministrador' && key !== 'firmaCliente') {
        acc[key] = errores[key];
      }
      return acc;
    }, {} as Record<string, string>);
  
    if (Object.keys(erroresSinFirmas).length > 0) {
      setError(Object.values(erroresSinFirmas).join(' – '));
      return;
    }
  
    setLoading(true);
    try {
      // Preparar datos de análisis seleccionados
      const analisisSeleccionadosCompletos = formData.analisisSeleccionados.map(nombre => {
        const arr = formData.tipoAnalisis === TIPOS_ANALISIS_ENUM.FISICOQUIMICO
          ? analisisDisponibles?.fisicoquimico || []
          : analisisDisponibles?.microbiologico || [];
        const obj = arr.find(a => a.nombre === nombre);
        if (!obj) throw new Error(`Análisis no encontrado: ${nombre}`);
        return {
          nombre: obj.nombre,
          precio: Number(obj.precio?.toString().replace(/[^0-9]/g, '')) || 0,
          unidad: obj.unidad || '',
          metodo: obj.metodo || '',
          rango: obj.rango || '',
        };
      });
  
      // Preparar datos de la muestra
      const muestraData = {
        documento: formData.documento,
        tipoDeAgua: {
          tipo: formData.tipoDeAgua.tipo,
          codigo: formData.tipoDeAgua.codigo,
          descripcion: formData.tipoDeAgua.descripcion,
          subtipoResidual: formData.tipoDeAgua.subtipo,
        },
        tipoMuestreo: formData.tipoMuestreo,
        lugarMuestreo: formData.lugarMuestreo,
        fechaHoraMuestreo: formData.fechaHoraMuestreo,
        tipoAnalisis: formData.tipoAnalisis as string,
        identificacionMuestra: formData.identificacionMuestra,
        planMuestreo: formData.planMuestreo,
        condicionesAmbientales: formData.condicionesAmbientales,
        preservacionMuestra: formData.preservacionMuestra,
        preservacionMuestraOtra: formData.preservacionMuestraOtra,
        analisisSeleccionados: analisisSeleccionadosCompletos,
        estado: 'En Cotizacion', // Estado específico para cotización
        observaciones: formData.observaciones || '',
        // No incluimos firmas, ya que no son necesarias
      };
  
      console.log("Datos enviados al backend para Cotización:", muestraData); // Agregamos este log
  
      // Enviar solicitud al backend
      await axios.post(API_URLS.MUESTRAS, muestraData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });      // Mostrar mensaje de éxito y redirigir
      setSuccess('Muestra enviada a cotización exitosamente');
      setShowSuccessModal(true);
    } catch (err: any) {
      console.error('Error al enviar a cotización:', err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }  };  const handleOpenAnalisisModal = () => {
    // Remover el foco del elemento activo para evitar conflictos con aria-hidden
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement.blur) {
      activeElement.blur();
    }
    
    // Forzar que el foco se mueva al body temporalmente
    document.body.focus();
    
    // Usar doble requestAnimationFrame para asegurar que todos los cambios de foco se procesen
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setOpenAnalisisModal(true);
      });
    });
  };  const handleCloseAnalisisModal = () => {
    setOpenAnalisisModal(false);
    setNewAnalisisData(initialNewAnalisisData);
    setAnalisisError(null);
    setAnalisisSuccess(null);
    setEditingAnalisis(null);
    setShowAnalisisForm(false);
    
    // Restaurar el foco al elemento principal después de cerrar el modal
    setTimeout(() => {
      // Enfocar al elemento principal de la página o al primer elemento focusable
      const mainContent = document.querySelector('main') || document.querySelector('[role="main"]') || document.body;
      if (mainContent instanceof HTMLElement) {
        mainContent.focus();
      }
    }, 100);
  };  const handleShowCreateForm = () => {
    setShowAnalisisForm(true);
    setEditingAnalisis(null);
    setNewAnalisisData(initialNewAnalisisData);
    setAnalisisError(null);
    setAnalisisSuccess(null);
    
    // Scroll automático mejorado al formulario después de que termine la animación
    setTimeout(() => {
      if (analisisFormRef.current) {
        // Primero intentar scroll suave
        analisisFormRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
        
        // Verificar si el scroll funcionó, si no, usar alternativa
        setTimeout(() => {
          if (analisisFormRef.current) {
            const rect = analisisFormRef.current.getBoundingClientRect();
            const isVisible = rect.top >= 0 && rect.top <= window.innerHeight;
            
            if (!isVisible) {
              // Scroll alternativo usando el modal container
              const modalContainer = analisisModalRef.current;
              if (modalContainer) {
                const formTop = analisisFormRef.current.offsetTop;
                modalContainer.scrollTo({
                  top: formTop - 100, // Offset para mejor visibilidad
                  behavior: 'smooth'
                });
              }
            }
          }
        }, 100);
      }
    }, 600); // Tiempo suficiente para que termine la animación del formulario
  };  const handleShowEditForm = (analisis: AnalisisCategoria) => {
    setEditingAnalisis(analisis);
    setNewAnalisisData({
      nombre: analisis.nombre,
      metodo: analisis.metodo || '',
      unidad: analisis.unidad,
      rango: analisis.rango || '',
      precio: analisis.precio?.toString().replace(/[,.]/g, '') || '',
      matriz: analisis.matriz || ['AP', 'AS'],
      tipo: (analisis.tipo === 'Fisicoquímico' || analisis.tipo === 'Microbiológico') ? analisis.tipo : '',
      activo: analisis.activo,
    });
    setShowAnalisisForm(true);
    setAnalisisError(null);
    setAnalisisSuccess(null);
    
    // Scroll automático mejorado al formulario después de que termine la animación
    setTimeout(() => {
      if (analisisFormRef.current) {
        // Primero intentar scroll suave
        analisisFormRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start',
          inline: 'nearest'
        });
        
        // Verificar si el scroll funcionó, si no, usar alternativa
        setTimeout(() => {
          if (analisisFormRef.current) {
            const rect = analisisFormRef.current.getBoundingClientRect();
            const isVisible = rect.top >= 0 && rect.top <= window.innerHeight;
            
            if (!isVisible) {
              // Scroll alternativo usando el modal container
              const modalContainer = analisisModalRef.current;
              if (modalContainer) {
                const formTop = analisisFormRef.current.offsetTop;
                modalContainer.scrollTo({
                  top: formTop - 100, // Offset para mejor visibilidad
                  behavior: 'smooth'
                });
              }
            }
          }
        }, 100);
      }
    }, 600); // Tiempo suficiente para que termine la animación del formulario
  };

  const handleCancelForm = () => {
    setShowAnalisisForm(false);
    setEditingAnalisis(null);
    setNewAnalisisData(initialNewAnalisisData);
    setAnalisisError(null);
    setAnalisisSuccess(null);
  };  const handleNewAnalisisChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent,
  ) => {
    const { name, value } = e.target;
    setNewAnalisisData(prev => ({ ...prev, [name]: value }));
    setAnalisisError(null);
  };

  const handleToggleAnalisisStatus = async (id: string, activo: boolean) => {
    try {
      await axios.put(
        `${API_URLS.ANALISIS}/${id}/estado`,
        { activo: !activo },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        },
      );
      setAllAnalisis(prev =>
        prev.map(a => (a._id === id ? { ...a, activo: !activo } : a)),
      );
      setAnalisisDisponibles(prev => ({
        fisicoquimico: prev?.fisicoquimico.filter(a => a._id !== id || !activo) || [],
        microbiologico: prev?.microbiologico.filter(a => a._id !== id || !activo) || [],
      }));
      setAnalisisSuccess(`Análisis ${activo ? 'desactivado' : 'activado'} exitosamente`);
    } catch (err: any) {
      console.error('Error al cambiar estado del análisis:', err);
      setAnalisisError(err.response?.data?.message || err.message);
    }
  };

  const handleCreateAnalisis = async () => {
    const camposReq: Record<string, string> = {
      nombre: 'Nombre',
      metodo: 'Método',
      unidad: 'Unidad',
      rango: 'Rango',
      precio: 'Precio',
      tipo: 'Tipo',
    };
    
    const faltantes = Object.entries(camposReq)
      .filter(([k]) => !newAnalisisData[k as keyof NewAnalisisData])
      .map(([, v]) => v);
    if (faltantes.length) {
      setAnalisisError(`Faltan: ${faltantes.join(', ')}`);
      return;
    }
    setRegistrando(true);
    try {      const analisisData = {
        nombre: newAnalisisData.nombre,
        metodo: newAnalisisData.metodo,
        unidad: newAnalisisData.unidad,
        rango: newAnalisisData.rango,
        precio: Number(newAnalisisData.precio.replace(/[,.]/g, '')),
        matriz: newAnalisisData.matriz,
        tipo: normalizeText(newAnalisisData.tipo), // Normalize tipo (e.g., "Fisicoquímico" -> "fisicoquimico")
        activo: newAnalisisData.activo,
      };
      console.log('Datos enviados al backend para crear análisis:', analisisData);
      const response = await axios.post(`${API_URLS.ANALISIS}`, analisisData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      setAllAnalisis(prev => [...prev, response.data]);
      if (analisisData.activo) {
        setAnalisisDisponibles(prev => ({
          fisicoquimico:
            analisisData.tipo === 'fisicoquimico'
              ? [...(prev?.fisicoquimico || []), response.data]
              : prev?.fisicoquimico || [],
          microbiologico:
            analisisData.tipo === 'microbiologico'
              ? [...(prev?.microbiologico || []), response.data]
              : prev?.microbiologico || [],
        }));
      }
      setAnalisisSuccess('Análisis creado exitosamente');
      setNewAnalisisData(initialNewAnalisisData);
    } catch (err: any) {
      console.error('Error al crear análisis:', err);
      setAnalisisError(
        err.response?.data?.message ||
          err.message ||
          'Error desconocido al crear el análisis'
      );
    } finally {
      setRegistrando(false);
    }
  };  const handleEditAnalisis = (analisis: AnalisisCategoria) => {
    handleShowEditForm(analisis);
  };
  
  const handleUpdateAnalisis = async () => {
    if (!editingAnalisis || !editingAnalisis._id) {
      setAnalisisError('No se ha seleccionado un análisis para editar');
      return;
    }
    const camposReq: Record<string, string> = {
      nombre: 'Nombre',
      metodo: 'Método',
      unidad: 'Unidad',
      rango: 'Rango',
      precio: 'Precio',
      tipo: 'Tipo',
    };
    const faltantes = Object.entries(camposReq)
      .filter(([k]) => !newAnalisisData[k as keyof NewAnalisisData])
      .map(([, v]) => v);
    if (faltantes.length) {
      setAnalisisError(`Faltan: ${faltantes.join(', ')}`);
      return;
    }
    setRegistrando(true);
    try {      const analisisData = {
        nombre: newAnalisisData.nombre,
        metodo: newAnalisisData.metodo,
        unidad: newAnalisisData.unidad,
        rango: newAnalisisData.rango,
        precio: Number(newAnalisisData.precio.replace(/[,.]/g, '')),
        matriz: newAnalisisData.matriz,
        tipo: normalizeText(newAnalisisData.tipo),
        activo: newAnalisisData.activo,
      };
      console.log('Datos enviados al backend para actualizar análisis:', analisisData);
      const response = await axios.put(
        `${API_URLS.ANALISIS}/${editingAnalisis._id}`,
        analisisData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        }
      );
      setAllAnalisis(prev =>
        prev.map(a =>
          a._id === editingAnalisis._id ? { ...a, ...response.data } : a
        )
      );
      if (analisisData.activo) {
        setAnalisisDisponibles(prev => ({
          fisicoquimico:
            analisisData.tipo === 'fisicoquimico'
              ? prev?.fisicoquimico.map(a =>
                  a._id === editingAnalisis._id ? { ...a, ...response.data } : a
                ) || []
              : prev?.fisicoquimico || [],
          microbiologico:
            analisisData.tipo === 'microbiologico'
              ? prev?.microbiologico.map(a =>
                  a._id === editingAnalisis._id ? { ...a, ...response.data } : a
                ) || []
              : prev?.microbiologico || [],
        }));
      } else {
        setAnalisisDisponibles(prev => ({
          fisicoquimico:
            prev?.fisicoquimico.filter(a => a._id !== editingAnalisis._id) || [],
          microbiologico:
            prev?.microbiologico.filter(a => a._id !== editingAnalisis._id) || [],
        }));
      }
      setAnalisisSuccess('Análisis actualizado exitosamente');
      setNewAnalisisData(initialNewAnalisisData);
      setEditingAnalisis(null);
    } catch (err: any) {
      console.error('Error al actualizar análisis:', err);
      setAnalisisError(
        err.response?.data?.message ||
          err.message ||
          'Error desconocido al actualizar el análisis'
      );
    } finally {
      setRegistrando(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRejected) {
      const errores = validarFormulario(formData);
      if (Object.keys(errores).length > 0) {
        setError(Object.values(errores).join(' – '));
        return;
      }
      setLoading(true);
      try {
        const analisisSeleccionadosCompletos = formData.analisisSeleccionados.map(nombre => {
          const arr = formData.tipoAnalisis === TIPOS_ANALISIS_ENUM.FISICOQUIMICO
            ? analisisDisponibles?.fisicoquimico || []
            : analisisDisponibles?.microbiologico || [];
          const obj = arr.find(a => a.nombre === nombre);
          if (!obj) throw new Error(`Análisis no encontrado: ${nombre}`);
          return {
            nombre: obj.nombre,
            precio: Number(obj.precio?.toString().replace(/[^0-9]/g, '')) || 0,
            unidad: obj.unidad || '',
            metodo: obj.metodo || '',
            rango: obj.rango || '',
          };
        });
        const muestraData = {
          documento: formData.documento,
          tipoDeAgua: {
            tipo: formData.tipoDeAgua.tipo,
            codigo: formData.tipoDeAgua.codigo,
            descripcion: formData.tipoDeAgua.descripcion,
            subtipoResidual: formData.tipoDeAgua.subtipo,
          },
          tipoMuestreo: formData.tipoMuestreo,
          lugarMuestreo: formData.lugarMuestreo,
          fechaHoraMuestreo: formData.fechaHoraMuestreo,
          tipoAnalisis: formData.tipoAnalisis as string,
          identificacionMuestra: formData.identificacionMuestra,
          planMuestreo: formData.planMuestreo,
          condicionesAmbientales: formData.condicionesAmbientales,
          preservacionMuestra: formData.preservacionMuestra,
          preservacionMuestraOtra: formData.preservacionMuestraOtra,
          analisisSeleccionados: analisisSeleccionadosCompletos,
          estado: 'Rechazada',
          observaciones: observacionRechazo,
        };
        await axios.post(API_URLS.MUESTRAS, muestraData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });        setSuccess('Muestra rechazada exitosamente');
        setShowSuccessModal(true);
      } catch (err: any) {
        console.error('Error al registrar rechazo:', err);
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!mostrarFirmas) {
      const erroresBasicos = Object.entries(validarFormulario(formData))
        .filter(([k]) => !['firmaAdministrador', 'firmaCliente'].includes(k))
        .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
      if (Object.keys(erroresBasicos).length) {
        setError(Object.values(erroresBasicos).join(' – '));
        return;
      }
      setMostrarFirmas(true);
      return;
    }

    const errores = validarFormulario(formData);
    if (Object.keys(errores).length) {
      setError(Object.values(errores).join(' – '));
      return;
    }
    setLoading(true);
    try {
      const analisisSeleccionadosCompletos = formData.analisisSeleccionados.map(nombre => {
        const arr = formData.tipoAnalisis === TIPOS_ANALISIS_ENUM.FISICOQUIMICO
          ? analisisDisponibles?.fisicoquimico || []
          : analisisDisponibles?.microbiologico || [];
        const obj = arr.find(a => a.nombre === nombre);
        if (!obj) throw new Error(`Análisis no encontrado: ${nombre}`);
        return {
          nombre: obj.nombre,
          precio: Number(obj.precio?.toString().replace(/[^0-9]/g, '')) || 0,
          unidad: obj.unidad || '',
          metodo: obj.metodo || '',
          rango: obj.rango || '',
        };
      });
      const muestraData = {
        documento: formData.documento,
        tipoDeAgua: {
          tipo: formData.tipoDeAgua.tipo,
          codigo: formData.tipoDeAgua.codigo,
          descripcion: formData.tipoDeAgua.descripcion,
          subtipoResidual: formData.tipoDeAgua.subtipo,
        },
        tipoMuestreo: formData.tipoMuestreo,
        lugarMuestreo: formData.lugarMuestreo,
        fechaHoraMuestreo: formData.fechaHoraMuestreo,
        tipoAnalisis: formData.tipoAnalisis as string,
        identificacionMuestra: formData.identificacionMuestra,
        planMuestreo: formData.planMuestreo,
        condicionesAmbientales: formData.condicionesAmbientales,
        preservacionMuestra: formData.preservacionMuestra,
        preservacionMuestraOtra: formData.preservacionMuestraOtra,
        analisisSeleccionados: analisisSeleccionadosCompletos,
        estado: isRejected ? 'Rechazada' : 'Recibida',
        observaciones: isRejected ? observacionRechazo : formData.observaciones || '',
        firmas: isRejected
          ? undefined
          : {
              firmaAdministrador: {
                nombre: adminData?.nombre || '',
                documento: adminData?.documento || '',
                firma: formData.firmas.firmaAdministrador.firma,
              },
              firmaCliente: {
                nombre: clienteEncontrado?.nombre || clienteEncontrado?.razonSocial || '',
                documento: clienteEncontrado?.documento || '',
                firma: formData.firmas.firmaCliente.firma,
              },
            },
      };
      if (isUpdating && muestraId) {
        await axios.put(`${API_URLS.MUESTRAS}/${muestraId}`, muestraData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });        setSuccess('Muestra actualizada exitosamente');
        setShowSuccessModal(true);
      } else {
        await axios.post(API_URLS.MUESTRAS, muestraData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });
        setSuccess('Muestra registrada exitosamente');
        setShowSuccessModal(true);
      }
      if (!isUpdating) limpiarEstado();
    } catch (err: any) {
      console.error('Error al registrar muestra:', err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrarOtra = async () => {
    setError(null);
    if (!validarFirmas()) return;
    setLoading(true);
    try {
      const analisisSeleccionadosCompletos = formData.analisisSeleccionados.map(nombre => {
        const arr = formData.tipoAnalisis === TIPOS_ANALISIS_ENUM.FISICOQUIMICO
          ? analisisDisponibles?.fisicoquimico || []
          : analisisDisponibles?.microbiologico || [];
        const obj = arr.find(a => a.nombre === nombre);
        if (!obj) throw new Error(`Análisis no encontrado: ${nombre}`);
        return {
          nombre: obj.nombre,
          precio: Number(obj.precio?.toString().replace(/[^0-9]/g, '')) || 0,
          unidad: obj.unidad || '',
          metodo: obj.metodo || '',
          rango: obj.rango || '',
        };
      });
      const muestraData = {
        documento: formData.documento,
        tipoDeAgua: {
          tipo: formData.tipoDeAgua.tipo,
          codigo: formData.tipoDeAgua.codigo,
          descripcion: formData.tipoDeAgua.descripcion,
          subtipoResidual: formData.tipoDeAgua.subtipo,
        },
        tipoMuestreo: formData.tipoMuestreo,
        lugarMuestreo: formData.lugarMuestreo,
        fechaHoraMuestreo: formData.fechaHoraMuestreo,
        tipoAnalisis: formData.tipoAnalisis as string,
        identificacionMuestra: formData.identificacionMuestra,
        planMuestreo: formData.planMuestreo,
        condicionesAmbientales: formData.condicionesAmbientales,
        preservacionMuestra: formData.preservacionMuestra,
        preservacionMuestraOtra: formData.preservacionMuestraOtra,
        analisisSeleccionados: analisisSeleccionadosCompletos,
        estado: isRejected ? 'Rechazada' : 'Recibida',
        observaciones: isRejected ? observacionRechazo : formData.observaciones,
        firmas: {
          firmaAdministrador: formData.firmas.firmaAdministrador,
          firmaCliente: formData.firmas.firmaCliente,
        },
      };
      await axios.post(API_URLS.MUESTRAS, muestraData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      setSuccess('Muestra registrada. Ahora puedes agregar otra.');
      clearUniqueFields();
    } catch (err: any) {
      console.error('Error handleRegistrarOtra:', err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const volverAlFormulario = () => setMostrarFirmas(false);  const handleAnalisisChange = (analisis: string) => {
    setFormData(prev => {
      const nuevos = prev.analisisSeleccionados.includes(analisis)
        ? prev.analisisSeleccionados.filter(a => a !== analisis)
        : [...prev.analisisSeleccionados, analisis];
      return { ...prev, analisisSeleccionados: nuevos };
    });
  };

  // Función para filtrar análisis basándose en el término de búsqueda
  const filterAnalisisBySearch = (analisisList: AnalisisCategoria[]): AnalisisCategoria[] => {
    if (!debouncedSearchTerm.trim()) {
      return analisisList;
    }
    
    const searchTermNormalized = normalizeText(debouncedSearchTerm.trim());
    
    return analisisList.filter(analisis => {
      const nombreNormalized = normalizeText(analisis.nombre);
      const metodoNormalized = analisis.metodo ? normalizeText(analisis.metodo) : '';
      const unidadNormalized = normalizeText(analisis.unidad);
      
      return nombreNormalized.includes(searchTermNormalized) ||
             metodoNormalized.includes(searchTermNormalized) ||
             unidadNormalized.includes(searchTermNormalized);
    });
  };

  // Función helper para limpiar todos los focos y evitar problemas de accesibilidad
  const clearAllFocus = () => {
    // Quitar el foco de todos los elementos activos en el documento
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && activeElement.blur) {
      activeElement.blur();
    }
    
    // Quitar el foco de cualquier input que pueda estar activo
    const focusableElements = document.querySelectorAll(
      'input, textarea, select, button, [tabindex]:not([tabindex="-1"])'
    );
    focusableElements.forEach(element => {
      if (element instanceof HTMLElement && element.blur) {
        element.blur();
      }
    });
    
    // Enfocar explícitamente el body
    document.body.focus();
  };  const handleOpenClienteModal = () => {
    // Limpiar todos los focos para evitar conflictos con aria-hidden
    clearAllFocus();
    
    // Limpiar datos previos y copiar el documento del formulario principal
    setClienteData({
      ...initialClienteData,
      documento: formData.documento // Copiar automáticamente el documento
    });
    setRegistroError(null);
    setRegistroExito(null);
    setClienteModalClosing(false);
    
    // Esperar un poco más para asegurar que todos los cambios de foco se procesen
    setTimeout(() => {
      // Verificar nuevamente que no hay elementos con foco antes de abrir el modal
      clearAllFocus();
      setOpenClienteModal(true);
    }, 200);
  };  const handleCloseClienteModal = () => {
    // Marcar que el modal se está cerrando
    setClienteModalClosing(true);
    
    // Quitar el foco de cualquier elemento del modal antes de cerrarlo
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && clienteModalRef.current?.contains(activeElement)) {
      activeElement.blur();
      document.body.focus();
    }
    
    setOpenClienteModal(false);
    setClienteData(initialClienteData);
    setRegistroError(null);
    setRegistroExito(null);
    
    // Esperar a que termine la transición antes de permitir cambios de foco
    setTimeout(() => {
      setClienteModalClosing(false);
    }, 600); // Tiempo suficiente para que termine la transición del modal
  };// Función para manejar solo letras en campos de texto (nombre, razón social)
  const handleClienteChangeNombre = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    // Solo permitir letras, espacios y caracteres acentuados
    const soloLetras = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]*$/;
    
    if (soloLetras.test(value) || value === "") {
      // Convertir automáticamente a mayúsculas
      setClienteData(prev => ({ ...prev, [name]: value.toUpperCase() }));
      setRegistroError(null);
    }
    // Si no cumple la validación, simplemente no actualiza el estado
  };

  // Función para manejar solo números en documento (máximo 15 dígitos)
  const handleClienteChangeDocumento = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    // Solo permitir números y máximo 15 caracteres
    const soloNumeros = /^[0-9]*$/;
    
    if ((soloNumeros.test(value) || value === "") && value.length <= 15) {
      setClienteData(prev => ({ ...prev, documento: value }));
      setRegistroError(null);
    }
    // Si no cumple la validación, simplemente no actualiza el estado
  };  // Función para manejar solo números en teléfono (exactamente 10 dígitos)
  const handleClienteChangeTelefono = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    // Solo permitir números y máximo 10 caracteres
    const soloNumeros = /^[0-9]*$/;
    
    if ((soloNumeros.test(value) || value === "") && value.length <= 10) {
      setClienteData(prev => ({ ...prev, telefono: value }));
      setRegistroError(null);
    }
    // Si no cumple la validación, simplemente no actualiza el estado
  };

  // Función para manejar razón social (letras, números, espacios y caracteres especiales de empresa)
  const handleClienteChangeRazonSocial = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    // Permitir letras, números, espacios y algunos caracteres especiales comunes en nombres de empresa
    const caracteresPermitidos = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s&.-]*$/;
    
    if (caracteresPermitidos.test(value) || value === "") {
      // Convertir automáticamente a mayúsculas
      setClienteData(prev => ({ ...prev, razonSocial: value.toUpperCase() }));
      setRegistroError(null);
    }
    // Si no cumple la validación, simplemente no actualiza el estado
  };

  const handleClienteChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => {
    const { name, value } = e.target;
    
    // Campos que deben convertirse automáticamente a mayúsculas en el registro de cliente
    const camposClienteEnMayusculas = ['direccion'];
    
    // Si se selecciona "persona natural" como tipo de cliente, limpiar razón social
    if (name === "tipo_cliente" && value === "persona natural") {
      setClienteData(prev => ({ ...prev, [name]: value, razonSocial: "" }));
    } else {
      // Convertir a mayúsculas si el campo está en la lista
      const valorFinal = camposClienteEnMayusculas.includes(name) ? value.toUpperCase() : value;
      setClienteData(prev => ({ ...prev, [name]: valorFinal }));
    }
    
    setRegistroError(null);
  };
  const handleRegistrarCliente = async () => {    const camposReq: Record<string, string> = {
      nombre: 'Nombre',
      documento: 'Documento',
      email: 'Email',
      tipo_cliente: 'Tipo de Cliente',
    };
    const faltantes = Object.entries(camposReq)
      .filter(([k]) => !clienteData[k as keyof ClienteData])
      .map(([, v]) => v);
    if (faltantes.length) {
      setRegistroError(`Faltan campos requeridos: ${faltantes.join(', ')}`);
      return;
    }
      // Validar razón social si no es persona natural
    if (clienteData.tipo_cliente !== "persona natural" && !clienteData.razonSocial) {
      setRegistroError('La razón social es requerida para este tipo de cliente');
      return;
    }
    
    // Validar teléfono (exactamente 10 dígitos)
    if (clienteData.telefono && clienteData.telefono.length !== 10) {
      setRegistroError('El teléfono debe tener exactamente 10 dígitos');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clienteData.email)) {
      setRegistroError('Por favor ingrese un email válido');
      return;
    }
    
    setRegistrando(true);
    setRegistroError(null);
    
    try {
      const token = localStorage.getItem('token');
      
      // Usar la estructura de datos que espera el backend, similar a RegistroUsuario.jsx
      // Para clientes NO se envía password - es automática
      const datosRegistro = {
        tipo: 'cliente',
        nombre: clienteData.nombre,        documento: clienteData.documento,
        telefono: clienteData.telefono || '',
        direccion: clienteData.direccion || '',
        email: clienteData.email,        detalles: {
          tipo_cliente: clienteData.tipo_cliente,
          razonSocial: clienteData.razonSocial || ''
        }
      };

      console.log('Datos que se envían al backend para registro de cliente:', datosRegistro);      // Usar la URL del ambiente o la URL base que ya tenemos
      const backendUrl = (import.meta as any).env?.VITE_BACKEND_URL || BASE_URLS.USUARIOS;
      const response = await axios.post(
        `${backendUrl}/usuarios/registro`,
        datosRegistro,
        { 
          headers: { 
            Authorization: `Bearer ${token}`, 
            'Content-Type': 'application/json' 
          } 
        },
      );      console.log('✔ Cliente registrado exitosamente:', response.data);
      setRegistroExito('Cliente registrado correctamente');
      
      // Actualizar el documento en el formulario principal y validar automáticamente
      setFormData(prev => ({ ...prev, documento: datosRegistro.documento }));
      
      setTimeout(() => {
        handleCloseClienteModal();
        // Esperar a que termine la transición del modal antes de validar
        setTimeout(() => {
          handleValidateUser();
        }, 700); // Delay adicional para que termine completamente la transición
      }, 2000);
      
    } catch (err: any) {
      console.error('Error al registrar cliente:', err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error ||
                          err.message ||
                          'Error desconocido al registrar cliente';
      setRegistroError(errorMessage);
    } finally {
      setRegistrando(false);
    }
  };

  // Obtener datos del usuario autenticado desde localStorage
  function obtenerDatosUsuario() {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!userStr || !token) throw new Error('No autenticado');
    const userData = JSON.parse(userStr);
    return { userData, token };
  }

  // Validar que ambas firmas estén presentes antes de registrar
  function validarFirmas() {
    if (!formData.firmas.firmaAdministrador.firma) {
      setError('La firma del administrador es obligatoria.');
      return false;
    }
    if (!formData.firmas.firmaCliente.firma) {
      setError('La firma del cliente es obligatoria.');
      return false;
    }
    setError(null);
    return true;
  }

  // Abrir modal de rechazo y limpiar observación
  const handleOpenRechazoModal = useCallback(() => {
    setOpenRechazoModal(true);
    setObservacionRechazo('');
  }, []);

  // Confirmar rechazo de muestra desde el modal
  const handleConfirmarRechazo = useCallback(async () => {
    if (!observacionRechazo.trim()) {
      setError('Debe ingresar una observación para el rechazo.');
      return;
    }
    setIsRejected(true);
    setOpenRechazoModal(false);
    // El submit se encarga de registrar la muestra rechazada
    setTimeout(() => {
      // Disparar el submit del formulario
      const form = document.querySelector('form');
      if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    }, 100);
  }, [observacionRechazo]);
  const limpiarEstado = () => {
    setFormData(initialFormData);
    setFirmas(initialFirmasState);
    setClienteEncontrado(null);
    setMostrarFirmas(false);
    setError(null);
    setSuccess(null);
    setIsUpdating(false);
    setMuestraId(null);
    setIsRejected(false);
    setObservacionRechazo('');
  };

  // Manejar el modal de éxito y redireccionar
  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    setSuccess(null);
    navigate('/muestras');
  };

  const totalSeleccionados = useMemo(() => {
    if (!analisisDisponibles || !formData.tipoAnalisis) return 0;
    const arr = formData.tipoAnalisis === TIPOS_ANALISIS_ENUM.FISICOQUIMICO
      ? analisisDisponibles.fisicoquimico
      : analisisDisponibles.microbiologico;
    return formData.analisisSeleccionados.reduce((sum, nombre) => {
      const a = arr.find(x => x.nombre === nombre);
      if (!a?.precio) return sum;
      return sum + parseFloat(a.precio.toString().replace(/,/g, ''));
    }, 0);
  }, [formData.analisisSeleccionados, analisisDisponibles, formData.tipoAnalisis]);  const renderAnalisisDisponibles = () => {
    if (!formData.tipoAnalisis) {
      return (
        <Alert 
          severity="info" 
          sx={{ 
            borderRadius: 3, 
            border: '2px solid #2196f3',
            bgcolor: 'rgba(33, 150, 243, 0.1)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 6px 20px rgba(33, 150, 243, 0.2)',
            animation: 'fadeInScale 0.5s ease-out',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '4px',
              height: '100%',
              bgcolor: '#2196f3',
              borderRadius: '2px 0 0 2px'
            },
            '& .MuiAlert-icon': {
              fontSize: '1.6rem',
              color: '#2196f3'
            },
            '& .MuiAlert-message': {
              fontWeight: 500,
              fontSize: '0.95rem',
              color: '#1565c0'
            }
          }}
          icon={<InfoIcon sx={{ fontSize: '1.6rem' }} />}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1565c0' }}>
            📋 Seleccione un tipo de análisis para ver las opciones disponibles
          </Typography>
        </Alert>
      );
    }
    if (loadingAnalisis) {
      return (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          p: 4, 
          gap: 2, 
          bgcolor: 'rgba(33, 150, 243, 0.05)', 
          borderRadius: 3, 
          boxShadow: '0 4px 15px rgba(33, 150, 243, 0.1)',
          border: '1px solid rgba(33, 150, 243, 0.2)'
        }}>
          <CircularProgress sx={{ color: '#2196f3' }} />
          <Typography variant="body2" sx={{ color: '#1565c0', fontWeight: 500 }}>
            🔄 Cargando análisis disponibles...
          </Typography>
        </Box>
      );
    }
    if (error) {
      return (
        <Alert 
          severity="error" 
          sx={{ 
            borderRadius: 3, 
            border: '2px solid #f44336',
            bgcolor: 'rgba(244, 67, 54, 0.1)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 6px 20px rgba(244, 67, 54, 0.2)',
            animation: 'shake 0.5s ease-in-out',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '4px',
              height: '100%',
              bgcolor: '#f44336',
              borderRadius: '2px 0 0 2px'
            },
            '& .MuiAlert-icon': {
              fontSize: '1.6rem',
              color: '#f44336'
            },
            '& .MuiAlert-message': {
              fontWeight: 500,
              fontSize: '0.95rem',
              color: '#d32f2f'
            }
          }}
          icon={<ErrorIcon sx={{ fontSize: '1.6rem' }} />}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#d32f2f' }}>
            ⚠️ {error}
          </Typography>        </Alert>
      );
    }
    const baseArr = formData.tipoAnalisis === TIPOS_ANALISIS_ENUM.FISICOQUIMICO
      ? analisisDisponibles?.fisicoquimico || []
      : analisisDisponibles?.microbiologico || [];
      const arr = filterAnalisisBySearch(baseArr);
    
    if (!baseArr.length) {
      return (
        <Alert 
          severity="info" 
          sx={{ 
            borderRadius: 3, 
            border: '2px solid #ff9800',
            bgcolor: 'rgba(255, 152, 0, 0.1)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 6px 20px rgba(255, 152, 0, 0.2)',
            animation: 'fadeInScale 0.5s ease-out',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '4px',
              height: '100%',
              bgcolor: '#ff9800',
              borderRadius: '2px 0 0 2px'
            },
            '& .MuiAlert-icon': {
              fontSize: '1.6rem',
              color: '#ff9800'
            },
            '& .MuiAlert-message': {
              fontWeight: 500,
              fontSize: '0.95rem',
              color: '#e65100'
            }
          }}
          icon={<InfoIcon sx={{ fontSize: '1.6rem' }} />}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#e65100' }}>
            📊 No hay análisis disponibles para {formData.tipoAnalisis}
          </Typography>
        </Alert>
      );
    }
    
    if (!arr.length && debouncedSearchTerm.trim()) {
      return (
        <Alert 
          severity="warning" 
          sx={{ 
            borderRadius: 3, 
            border: '2px solid #ff9800',
            bgcolor: 'rgba(255, 152, 0, 0.1)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 6px 20px rgba(255, 152, 0, 0.2)',
            animation: 'fadeInScale 0.5s ease-out',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '4px',
              height: '100%',
              bgcolor: '#ff9800',
              borderRadius: '2px 0 0 2px'
            },
            '& .MuiAlert-icon': {
              fontSize: '1.6rem',
              color: '#ff9800'
            },
            '& .MuiAlert-message': {
              fontWeight: 500,
              fontSize: '0.95rem',
              color: '#e65100'
            }
          }}
          icon={<InfoIcon sx={{ fontSize: '1.6rem' }} />}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#e65100' }}>
            🔍 No se encontraron análisis que coincidan con "{debouncedSearchTerm}". 
            <br />Intenta con otros términos de búsqueda.
          </Typography>
        </Alert>
      );
    }
    
    return (
      <Card sx={{ 
        borderRadius: 4, 
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        background: 'linear-gradient(135deg, rgba(57, 169, 0, 0.02) 0%, rgba(33, 150, 243, 0.02) 100%)',
        border: '1px solid rgba(57, 169, 0, 0.1)',
        backdropFilter: 'blur(20px)',
        animation: 'slideInLeft 0.6s ease-out'
      }}>
        {/* Header moderno con estadísticas */}
        <Box sx={{ 
          background: 'linear-gradient(135deg, #39A900 0%, #2e7d32 100%)',
          color: 'white',
          p: 3,
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url("data:image/svg+xml,%3Csvg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23ffffff" fill-opacity="0.05"%3E%3Ccircle cx="3" cy="3" r="3"/%3E%3C/g%3E%3C/svg%3E")',
            opacity: 0.3
          }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ 
                p: 1.5, 
                borderRadius: 2, 
                bgcolor: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ScienceIcon sx={{ fontSize: '2rem', color: '#fff' }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, color: '#fff' }}>
                  Análisis {formData.tipoAnalisis}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Seleccione los análisis que desea realizar
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>              <Chip 
                label={debouncedSearchTerm.trim() 
                  ? `${arr.length} de ${baseArr.length} encontrados`
                  : `${arr.length} Disponibles`
                }
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  color: 'white',
                  fontWeight: 600,
                  '& .MuiChip-icon': { color: 'white' }
                }}
                icon={<InventoryIcon />}
              />
              <Chip 
                label={`${formData.analisisSeleccionados.length} Seleccionados`}
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.9)', 
                  color: '#2e7d32',
                  fontWeight: 600,
                  '& .MuiChip-icon': { color: '#2e7d32' }
                }}
                icon={<CheckCircleIcon />}
              />
            </Box>
          </Box>
        </Box>

        {/* Contenido de análisis */}
        <Box sx={{ p: 3 }}>
          {/* Barra de búsqueda y filtros */}          <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              placeholder="🔍 Buscar análisis..."
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ 
                flexGrow: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  bgcolor: 'rgba(57, 169, 0, 0.05)',
                  border: '2px solid transparent',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: 'rgba(57, 169, 0, 0.08)',
                    border: '2px solid rgba(57, 169, 0, 0.2)'
                  },
                  '&.Mui-focused': {
                    bgcolor: 'white',
                    border: '2px solid #39A900',
                    boxShadow: '0 4px 12px rgba(57, 169, 0, 0.15)'
                  }
                }
              }}
              InputProps={{
                endAdornment: searchTerm && (
                  <IconButton
                    size="small"
                    onClick={() => setSearchTerm('')}
                    sx={{ 
                      color: '#666',
                      '&:hover': { 
                        color: '#39A900',
                        bgcolor: 'rgba(57, 169, 0, 0.05)' 
                      }
                    }}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                )
              }}
            /><Button
              variant="outlined"
              size="small"
              startIcon={<SelectAllIcon />}
              onClick={() => {
                baseArr.forEach(a => {
                  if (!formData.analisisSeleccionados.includes(a.nombre)) {
                    handleAnalisisChange(a.nombre);
                  }
                });
              }}
              sx={{
                borderRadius: 3,
                borderColor: '#39A900',
                color: '#39A900',
                px: 2,
                '&:hover': {
                  bgcolor: 'rgba(57, 169, 0, 0.05)',
                  borderColor: '#2e7d32'
                }
              }}
            >
              Seleccionar Todo
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ClearIcon />}
              onClick={() => {
                baseArr.forEach(a => {
                  if (formData.analisisSeleccionados.includes(a.nombre)) {
                    handleAnalisisChange(a.nombre);
                  }
                });
              }}
              sx={{
                borderRadius: 3,
                borderColor: '#ff5722',
                color: '#ff5722',
                px: 2,
                '&:hover': {
                  bgcolor: 'rgba(255, 87, 34, 0.05)',
                  borderColor: '#d84315'
                }
              }}
            >
              Limpiar
            </Button>
          </Box>

          {/* Grid de análisis mejorado */}
          <Grid container spacing={2}>
            {arr.map((a, index) => (
              <Grid item xs={12} sm={6} md={4} key={a._id || a.nombre}>
                <Card sx={{ 
                  height: '100%',
                  borderRadius: 3,
                  overflow: 'hidden',
                  border: formData.analisisSeleccionados.includes(a.nombre) 
                    ? '2px solid #39A900' 
                    : '1px solid rgba(0,0,0,0.08)',
                  bgcolor: formData.analisisSeleccionados.includes(a.nombre) 
                    ? 'rgba(57, 169, 0, 0.05)' 
                    : 'white',
                  boxShadow: formData.analisisSeleccionados.includes(a.nombre)
                    ? '0 6px 20px rgba(57, 169, 0, 0.2)'
                    : '0 2px 8px rgba(0,0,0,0.06)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: formData.analisisSeleccionados.includes(a.nombre) ? 'translateY(-2px)' : 'none',
                  cursor: 'pointer',
                  animation: `slideInUp 0.4s ease-out ${index * 0.1}s both`,
                  '&:hover': { 
                    transform: 'translateY(-4px) scale(1.02)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.12)',
                    borderColor: formData.analisisSeleccionados.includes(a.nombre) ? '#2e7d32' : 'rgba(57, 169, 0, 0.3)'
                  }
                }}>
                  {/* Header de la card */}
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: formData.analisisSeleccionados.includes(a.nombre) 
                      ? 'linear-gradient(135deg, rgba(57, 169, 0, 0.1) 0%, rgba(46, 125, 50, 0.1) 100%)'
                      : 'rgba(250, 250, 250, 0.8)',
                    borderBottom: '1px solid rgba(0,0,0,0.05)',
                    position: 'relative'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <Box sx={{ flexGrow: 1 }}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 700, 
                            color: formData.analisisSeleccionados.includes(a.nombre) ? '#2e7d32' : '#1a1a1a',
                            fontSize: '1rem',
                            lineHeight: 1.3,
                            mb: 0.5
                          }}
                        >
                          {a.nombre}
                        </Typography>
                        {a.precio != null && (
                          <Chip 
                            label={`$${a.precio.toLocaleString()}`}
                            size="small"
                            sx={{ 
                              bgcolor: formData.analisisSeleccionados.includes(a.nombre) ? '#39A900' : '#e8f5e8',
                              color: formData.analisisSeleccionados.includes(a.nombre) ? 'white' : '#2e7d32',
                              fontWeight: 600,
                              fontSize: '0.75rem'
                            }}
                          />
                        )}
                      </Box>
                      <Checkbox
                        checked={formData.analisisSeleccionados.includes(a.nombre)}
                        onChange={() => handleAnalisisChange(a.nombre)}
                        sx={{
                          color: '#39A900',
                          '&.Mui-checked': {
                            color: '#39A900',
                            animation: 'pulse 0.6s ease-in-out'
                          },
                          '& .MuiSvgIcon-root': {
                            fontSize: '1.4rem'
                          }
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Contenido de la card */}
                  <CardContent sx={{ p: 2, pt: 1.5 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <StraightenIcon sx={{ fontSize: '1rem', color: '#666' }} />
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                          <strong>Unidad:</strong> {a.unidad || 'N/A'}
                        </Typography>
                      </Box>
                      {a.metodo && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <SettingsIcon sx={{ fontSize: '1rem', color: '#666' }} />
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                            <strong>Método:</strong> {a.metodo}
                          </Typography>
                        </Box>
                      )}
                      {a.rango && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TuneIcon sx={{ fontSize: '1rem', color: '#666' }} />
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                            <strong>Rango:</strong> {a.rango}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>

                  {/* Indicador de selección */}
                  {formData.analisisSeleccionados.includes(a.nombre) && (
                    <Box sx={{ 
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      bgcolor: '#39A900',
                      borderRadius: '50%',
                      p: 0.5,
                      boxShadow: '0 2px 8px rgba(57, 169, 0, 0.4)',
                      animation: 'bounceIn 0.6s ease-out'
                    }}>
                      <CheckIcon sx={{ fontSize: '0.9rem', color: 'white' }} />
                    </Box>
                  )}
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Resumen mejorado */}
          {formData.analisisSeleccionados.length > 0 && (
            <Card sx={{ 
              mt: 4, 
              borderRadius: 4,
              overflow: 'hidden',
              background: 'linear-gradient(135deg, rgba(57, 169, 0, 0.08) 0%, rgba(46, 125, 50, 0.12) 100%)',
              border: '2px solid rgba(57, 169, 0, 0.2)',
              boxShadow: '0 8px 32px rgba(57, 169, 0, 0.15)',
              animation: 'celebrateSuccess 1s ease-in-out'
            }}>
              <Box sx={{ 
                background: 'linear-gradient(135deg, #39A900 0%, #2e7d32 100%)',
                color: 'white',
                p: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}>
                <CalculateIcon sx={{ fontSize: '1.5rem' }} />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Resumen de Selección
                </Typography>
              </Box>
              <CardContent sx={{ p: 3 }}>
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h3" sx={{ fontWeight: 800, color: '#39A900', mb: 1 }}>
                        {formData.analisisSeleccionados.length}
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Análisis Seleccionados
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h3" sx={{ fontWeight: 800, color: '#2e7d32', mb: 1 }}>
                        ${totalSeleccionados.toLocaleString()}
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Costo Total
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" sx={{ fontWeight: 800, color: '#1565c0', mb: 1 }}>
                        {Math.round((formData.analisisSeleccionados.length / arr.length) * 100)}%
                      </Typography>
                      <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Completado
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                
                {/* Lista de análisis seleccionados */}
                <Divider sx={{ my: 3 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#2e7d32' }}>
                  Análisis Seleccionados:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {formData.analisisSeleccionados.map((nombre, index) => (
                    <Chip
                      key={nombre}
                      label={nombre}
                      onDelete={() => handleAnalisisChange(nombre)}
                      deleteIcon={<ClearIcon />}
                      sx={{
                        bgcolor: 'rgba(57, 169, 0, 0.1)',
                        color: '#2e7d32',
                        fontWeight: 600,
                        '& .MuiChip-deleteIcon': {
                          color: '#d32f2f',
                          '&:hover': {
                            color: '#b71c1c'
                          }
                        },
                        animation: `slideInUp 0.3s ease-out ${index * 0.05}s both`
                      }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          )}
        </Box>
      </Card>
    );
  };
  return (
    <Box sx={{ position: 'relative' }}>
      {/* CSS Global para animaciones de alertas */}
      <style>
        {`
          @keyframes slideInDown {
            0% { 
              opacity: 0; 
              transform: translateY(-30px) scale(0.95); 
            }
            100% { 
              opacity: 1; 
              transform: translateY(0) scale(1); 
            }
          }
          @keyframes slideInLeft {
            0% { 
              opacity: 0; 
              transform: translateX(-20px) scale(0.95); 
            }
            100% { 
              opacity: 1; 
              transform: translateX(0) scale(1); 
            }
          }
          @keyframes fadeInScale {
            0% { 
              opacity: 0; 
              transform: scale(0.95) translateY(10px); 
            }
            100% { 
              opacity: 1; 
              transform: scale(1) translateY(0); 
            }
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
            20%, 40%, 60%, 80% { transform: translateX(2px); }
          }
          @keyframes celebrateSuccess {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.02); }
          }
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-8px); }
            60% { transform: translateY(-4px); }
          }          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.5; }
            50% { transform: scale(1.2); opacity: 0.8; }
          }
          @keyframes slideInUp {
            0% { 
              opacity: 0; 
              transform: translateY(20px) scale(0.95); 
            }
            100% { 
              opacity: 1; 
              transform: translateY(0) scale(1); 
            }
          }
          @keyframes bounceIn {
            0% { 
              opacity: 0; 
              transform: scale(0.3); 
            }
            50% { 
              opacity: 1; 
              transform: scale(1.05); 
            }
            100% { 
              opacity: 1; 
              transform: scale(1); 
            }
          }
        `}
      </style>
      
      <Paper
  sx={{
    padding: 3, // Reducir padding
    maxWidth: 1000,
    margin: 'auto',
    marginTop: 3,
    borderRadius: 4,
    boxShadow: '0 4px 16px rgba(0,0,0,0.1)', // Sombra más suave
    bgcolor: '#fafafa', // Fondo más claro
  }}
>
        {/* Header modernizado con gradiente */}
        <Box 
          sx={{ 
            background: 'linear-gradient(135deg, #39A900 0%, #2d8600 50%, #1e5e00 100%)',
            borderRadius: 3,
            padding: 3,
            mb: 4,
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
          {/* Decoración de fondo */}
          <Box
            sx={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 100,
              height: 100,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.1)',
              animation: 'float 6s ease-in-out infinite'
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: -30,
              left: -30,
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.05)',
              animation: 'float 8s ease-in-out infinite reverse'
            }}
          />

          {/* CSS para animaciones */}
          <style>
            {`
              @keyframes float {
                0%, 100% { transform: translateY(0px) rotate(0deg); }
                50% { transform: translateY(-20px) rotate(180deg); }
              }
              @keyframes slideInFromLeft {
                0% { opacity: 0; transform: translateX(-50px); }
                100% { opacity: 1; transform: translateX(0); }
              }
              @keyframes slideInFromRight {
                0% { opacity: 0; transform: translateX(50px); }
                100% { opacity: 1; transform: translateX(0); }
              }
              @keyframes bounceIn {
                0% { opacity: 0; transform: scale(0.3); }
                50% { opacity: 1; transform: scale(1.1); }
                100% { opacity: 1; transform: scale(1); }
              }
            `}
          </style>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, position: 'relative', zIndex: 1 }}>
            {/* Icono animado */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 70,
                height: 70,
                borderRadius: '50%',
                bgcolor: 'rgba(255,255,255,0.2)',
                border: '2px solid rgba(255,255,255,0.3)',
                animation: 'bounceIn 1s ease-out',
                backdropFilter: 'blur(10px)',
                '&:hover': {
                  transform: 'scale(1.1)',
                  transition: 'transform 0.3s ease'
                }
              }}
            >
              <ScienceIcon sx={{ fontSize: 36, color: 'white' }} />
            </Box>

            {/* Contenido del título */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography 
                variant="h3" 
                sx={{ 
                  color: 'white',
                  fontWeight: 800,
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  animation: 'slideInFromLeft 0.8s ease-out',
                  letterSpacing: 1,
                  mb: 0.5
                }}
              >
                {isUpdating ? 'Actualizar Muestra' : 'Registro de Muestra'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, animation: 'slideInFromRight 1s ease-out' }}>
                <WaterDropIcon sx={{ color: 'rgba(255,255,255,0.9)', fontSize: 20 }} />
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: 'rgba(255,255,255,0.95)',
                    fontWeight: 300,
                    textShadow: '0 1px 2px rgba(0,0,0,0.2)',
                    letterSpacing: 0.5
                  }}
                >
                  Sistema de Gestión AQUALAB
                </Typography>
                <AssignmentIcon sx={{ color: 'rgba(255,255,255,0.9)', fontSize: 20 }} />
              </Box>
            </Box>
          </Box>
        </Box>        {error && (
          <Box sx={{ mb: 3 }}>
            <Alert 
              severity="error" 
              sx={{ 
                borderRadius: 3, 
                border: '2px solid #f44336',
                bgcolor: 'rgba(244, 67, 54, 0.1)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 25px rgba(244, 67, 54, 0.2)',
                animation: 'slideInDown 0.5s ease-out',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '4px',
                  height: '100%',
                  bgcolor: '#f44336',
                  borderRadius: '2px 0 0 2px'
                },
                '& .MuiAlert-icon': {
                  fontSize: '1.8rem',
                  color: '#f44336'
                },
                '& .MuiAlert-message': {
                  fontWeight: 500,
                  fontSize: '1rem',
                  color: '#d32f2f'
                }
              }}
              icon={<ErrorIcon sx={{ fontSize: '1.8rem' }} />}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 600, color: '#d32f2f' }}>
                  {error}
                </Typography>
              </Box>
            </Alert>
            
            {/* CSS para animaciones */}
            <style>
              {`
                @keyframes slideInDown {
                  0% { 
                    opacity: 0; 
                    transform: translateY(-30px) scale(0.95); 
                  }
                  100% { 
                    opacity: 1; 
                    transform: translateY(0) scale(1); 
                  }
                }
              `}
            </style>
          </Box>
        )}
        
        {success && (
          <Box sx={{ mb: 3 }}>
            <Alert 
              severity="success" 
              sx={{ 
                borderRadius: 3, 
                border: '2px solid #4caf50',
                bgcolor: 'rgba(76, 175, 80, 0.1)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 8px 25px rgba(76, 175, 80, 0.2)',
                animation: 'slideInDown 0.5s ease-out, celebrateSuccess 1s ease-in-out 0.3s',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '4px',
                  height: '100%',
                  bgcolor: '#4caf50',
                  borderRadius: '2px 0 0 2px'
                },
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  right: -50,
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  bgcolor: 'rgba(76, 175, 80, 0.1)',
                  animation: 'float 3s ease-in-out infinite'
                },
                '& .MuiAlert-icon': {
                  fontSize: '1.8rem',
                  color: '#4caf50'
                },
                '& .MuiAlert-message': {
                  fontWeight: 500,
                  fontSize: '1rem',
                  color: '#2e7d32'
                }
              }}
              icon={<CheckCircleIcon sx={{ fontSize: '1.8rem' }} />}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, position: 'relative', zIndex: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                  {success}
                </Typography>
                <CelebrationIcon 
                  sx={{ 
                    color: '#4caf50', 
                    fontSize: 20,
                    animation: 'bounce 0.8s ease-in-out 0.5s' 
                  }} 
                />
              </Box>
            </Alert>
            
            {/* CSS para animaciones de éxito */}
            <style>
              {`
                @keyframes celebrateSuccess {
                  0%, 100% { transform: scale(1); }
                  50% { transform: scale(1.02); }
                }
                @keyframes bounce {
                  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                  40% { transform: translateY(-8px); }
                  60% { transform: translateY(-4px); }
                }
              `}
            </style>
          </Box>
        )}<form onSubmit={handleSubmit} autoComplete="off">
          {/* Sección: Validación de Cliente */}
          <Card 
            elevation={3} 
            sx={{ 
              mb: 4, 
              borderRadius: 3, 
              border: '1px solid rgba(57,169,0,0.2)',
              overflow: 'hidden'
            }}
          >
            <Box 
              sx={{ 
                background: 'linear-gradient(135deg, rgba(57,169,0,0.1) 0%, rgba(57,169,0,0.05) 100%)',
                p: 3,
                borderBottom: '1px solid rgba(57,169,0,0.1)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: 'rgba(57,169,0,0.1)',
                    border: '2px solid rgba(57,169,0,0.2)'
                  }}
                >
                  <PersonIcon sx={{ color: '#39A900', fontSize: 20 }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#39A900' }}>
                  Validación de Cliente
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: 'text.secondary', ml: 6 }}>
                Ingrese el documento del cliente para validar o registrar
              </Typography>
            </Box>
            
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>              
                <TextField
                  fullWidth
                  label="Número de Documento"
                  name="documento"
                  value={formData.documento}
                  onChange={handleDocumentoChange}
                  required
                  variant="outlined"
                  placeholder="Ej: 1234567890"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BadgeIcon sx={{ color: '#39A900' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'white',
                      borderRadius: 2,
                      transition: 'all 0.2s ease',
                      '& fieldset': {
                        borderColor: 'rgba(57,169,0,0.3)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(57,169,0,0.5)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#39A900',
                        borderWidth: '2px'
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: '#666',
                      '&.Mui-focused': {
                        color: '#39A900',
                      },
                    },
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleValidateUser}
                  startIcon={validatingUser ? null : <SearchIcon />}
                  sx={{
                    height: '56px',
                    borderRadius: 2,
                    px: 3,
                    minWidth: '140px',
                    background: 'linear-gradient(135deg, #39A900 0%, #4caf50 100%)',
                    fontWeight: 600,
                    boxShadow: '0 3px 10px rgba(57,169,0,0.3)',
                    '&:hover': { 
                      background: 'linear-gradient(135deg, #2e7d32 0%, #388e3c 100%)',
                      transform: 'translateY(-2px)', 
                      boxShadow: '0 4px 15px rgba(57,169,0,0.4)' 
                    },
                    '&:active': {
                      transform: 'translateY(0px)'
                    },
                    transition: 'all 0.2s ease'
                  }}
                  disabled={validatingUser || !formData.documento}
                >
                  {validatingUser ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={20} sx={{ color: 'white' }} />
                      <span>Validando...</span>
                    </Box>
                  ) : (
                    'Validar'
                  )}
                </Button>              
                {userValidationError && (
                  <Button
                    variant="outlined"
                    onClick={handleOpenClienteModal}
                    data-testid="register-client-button"
                    aria-label="Registrar nuevo cliente"
                    startIcon={<AddIcon />}
                    sx={{
                      height: '56px',
                      borderRadius: 2,
                      px: 3,
                      minWidth: '160px',
                      borderColor: '#39A900',
                      color: '#39A900',
                      fontWeight: 600,
                      borderWidth: '2px',
                      '&:hover': { 
                        borderColor: '#2d8600', 
                        color: '#2d8600', 
                        bgcolor: 'rgba(57,169,0,0.05)',
                        transform: 'translateY(-2px)', 
                        boxShadow: '0 4px 12px rgba(57,169,0,0.2)' 
                      },
                      '&:active': {
                        transform: 'translateY(0px)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Registrar Cliente
                  </Button>
                )}
              </Box>              {userValidationError && (
                <Alert 
                  severity="warning" 
                  sx={{ 
                    mb: 2, 
                    borderRadius: 3, 
                    border: '2px solid #ff9800',
                    bgcolor: 'rgba(255, 152, 0, 0.1)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 6px 20px rgba(255, 152, 0, 0.2)',
                    animation: 'slideInLeft 0.5s ease-out',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '4px',
                      height: '100%',
                      bgcolor: '#ff9800',
                      borderRadius: '2px 0 0 2px'
                    },
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      top: -10,
                      right: -10,
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      bgcolor: 'rgba(255, 152, 0, 0.1)',
                      animation: 'pulse 2s ease-in-out infinite'
                    },
                    '& .MuiAlert-icon': {
                      fontSize: '1.6rem',
                      color: '#ff9800'
                    },
                    '& .MuiAlert-message': {
                      fontWeight: 500,
                      fontSize: '0.95rem',
                      color: '#e65100'
                    }
                  }}
                  icon={<WarningIcon sx={{ fontSize: '1.6rem' }} />}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, position: 'relative', zIndex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#e65100' }}>
                      {userValidationError}
                    </Typography>                  </Box>
                </Alert>
              )}
              
              {clienteEncontrado && (
                <Card sx={{ p: 2, borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', bgcolor: '#e8f5e8', border: '1px solid rgba(57,169,0,0.3)' }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          bgcolor: '#39A900',
                          color: 'white'
                        }}
                      >
                        <PersonIcon sx={{ fontSize: 18 }} />
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: '#39A900' }}>
                        Cliente Validado
                      </Typography>
                    </Box>                    <Box sx={{ ml: 5 }}>
                      <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                        <strong>Nombre:</strong> {clienteEncontrado.nombre || clienteEncontrado.razonSocial}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                        <strong>Documento:</strong> {clienteEncontrado.documento}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        <strong>Correo:</strong> {clienteEncontrado.email}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>          <Divider sx={{ my: 4, borderColor: 'rgba(57,169,0,0.2)', borderWidth: '1px' }} />

          {/* Sección: Detalles de la Muestra */}
          <Card 
            elevation={3} 
            sx={{ 
              mb: 4, 
              borderRadius: 3, 
              border: '1px solid rgba(57,169,0,0.2)',
              overflow: 'hidden'
            }}
          >
            <Box 
              sx={{ 
                background: 'linear-gradient(135deg, rgba(57,169,0,0.1) 0%, rgba(57,169,0,0.05) 100%)',
                p: 3,
                borderBottom: '1px solid rgba(57,169,0,0.1)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: 'rgba(57,169,0,0.1)',
                    border: '2px solid rgba(57,169,0,0.2)'
                  }}
                >
                  <WaterDropIcon sx={{ color: '#39A900', fontSize: 20 }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: '#39A900' }}>
                  Detalles de la Muestra
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: 'text.secondary', ml: 6 }}>
                Complete la información técnica de la muestra
              </Typography>
            </Box>
            
            <CardContent sx={{ p: 3 }}>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  {/* Tipo de Agua */}
                  <FormControl fullWidth>
                    <InputLabel>Tipo de Agua</InputLabel>
                    <Select
                      name="tipoAgua"
                      value={formData.tipoDeAgua.tipo}
                      onChange={handleChange}
                      label="Tipo de Agua"
                      variant="outlined"
                      startAdornment={
                        <InputAdornment position="start">
                          <OpacityIcon sx={{ color: '#39A900', ml: 1 }} />
                        </InputAdornment>
                      }
                      sx={{ 
                        bgcolor: 'white',
                        borderRadius: 2,
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: 'rgba(57,169,0,0.3)',
                          },                          '&:hover fieldset': {
                            borderColor: 'rgba(57,169,0,0.5)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#39A900',
                            borderWidth: '2px'
                          },
                        }
                      }}
                    >
                      {TIPOS_AGUA.map(tipo => (
                        <MenuItem key={tipo} value={tipo}>
                          {tipo === 'residual' ? 'Residual' : tipo.charAt(0).toUpperCase() + tipo.slice(1)} ({getTipoAguaCodigo(tipo)})
                        </MenuItem>
                      ))}
                    </Select>                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  {/* Tipo de Muestreo */}
                  <FormControl fullWidth>
                    <InputLabel>Tipo de Muestreo</InputLabel>
                    <Select
                      name="tipoMuestreo"
                      value={formData.tipoMuestreo}
                      onChange={handleChange}
                      label="Tipo de Muestreo"
                      sx={{ 
                        bgcolor: 'white',
                        borderRadius: 2,
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: 'rgba(57,169,0,0.3)',
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(57,169,0,0.5)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#39A900',
                            borderWidth: '2px'
                          },
                        }
                      }}
                    >
                      {TIPOS_MUESTREO.map(tipo => (
                        <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {formData.tipoDeAgua.tipo === 'otra' && (
                <TextField
                  fullWidth
                  label="Descripción del Tipo de Agua"
    name="descripcion"
    value={formData.tipoDeAgua.descripcion}
    onChange={handleChange}
    required
    size="small"
    sx={{ mb: 2, bgcolor: 'white', borderRadius: 2 }}
  />
)}

{formData.tipoDeAgua.tipo === 'residual' && (
  <FormControl fullWidth sx={{ mb: 2 }} error={Boolean(error && error.includes('agua residual'))}>
    <InputLabel>Tipo de Agua Residual</InputLabel>
    <Select
      name="tipoAguaResidual"
      value={formData.tipoDeAgua.subtipo || ''}
      onChange={handleChange}
      label="Tipo de Agua Residual"
      required
      size="small"
      sx={{ bgcolor: 'white', borderRadius: 2 }}
    >
      <MenuItem value={SUBTIPOS_RESIDUAL.DOMESTICA}>Doméstica</MenuItem>
      <MenuItem value={SUBTIPOS_RESIDUAL.NO_DOMESTICA}>No Doméstica</MenuItem>
    </Select>
    {error && error.includes('agua residual') && (
      <FormHelperText error>{error}</FormHelperText>
    )}
  </FormControl>
)}

            {/* Lugar y Fecha de Muestreo */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              
                <TextField
                  fullWidth
                  label="Lugar de Muestreo"
                  name="lugarMuestreo"
                  value={formData.lugarMuestreo}
                  onChange={handleChange}
                  required
                  sx={{ bgcolor: 'white', borderRadius: 2 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Fecha y Hora de Muestreo"
                  name="fechaHoraMuestreo"
                  type="datetime-local"
                  value={formData.fechaHoraMuestreo}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  required
                  sx={{ bgcolor: 'white', borderRadius: 2 }}
                />
              </Grid>
            </Grid>

            {/* Identificación y Plan de Muestreo */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                
                <TextField
                  fullWidth
                  label="Identificación de la Muestra"
                  name="identificacionMuestra"
                  value={formData.identificacionMuestra}
                  onChange={handleChange}
                  helperText="Identificación física/química"
                  sx={{ bgcolor: 'white', borderRadius: 2 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Plan de Muestreo"
                  name="planMuestreo"
                  value={formData.planMuestreo}
                  onChange={handleChange}
                  sx={{ bgcolor: 'white', borderRadius: 2 }}
                />
              </Grid>
            </Grid>

            {/* Condiciones Ambientales */}
            <TextField
              fullWidth
              label="Condiciones Ambientales"
              name="condicionesAmbientales"
              value={formData.condicionesAmbientales}
              onChange={handleChange}
              sx={{ mb: 3, bgcolor: 'white', borderRadius: 2 }}              multiline
              rows={3}
            />
            </CardContent>
          </Card>
          
          <Divider sx={{ my: 4, borderColor: 'rgba(57,169,0,0.2)', borderWidth: '1px' }} />

          {/* Sección: Preservación */}
          <Box sx={{ mb: 2}}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'medium', color: 'text.primary' }}>
              Preservación de la Muestra
            </Typography>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Preservación de la Muestra</InputLabel>
              <Select
                name="preservacionMuestra"
                value={formData.preservacionMuestra}
                onChange={handleChange}
                label="Preservación de la Muestra"
                required
                sx={{ bgcolor: 'white', borderRadius: 2 }}
              >
                {TIPOS_PRESERVACION.map(tipo => (
                  <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {formData.preservacionMuestra === 'Otro' && (
              <TextField
                fullWidth
                label="Descripción de la Preservación"
                name="preservacionMuestraOtra"
                value={formData.preservacionMuestraOtra}
                onChange={handleChange}
                required
                sx={{ mb: 3, bgcolor: 'white', borderRadius: 2 }}
              />
            )}
          </Box>

          <Divider sx={{ my: 1, borderColor: 'grey.300' }} />

          {/* Sección: Análisis */}
          <Box sx={{ mb: 3}}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'medium', color: 'text.primary' }}>
              Análisis
            </Typography>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Tipo de Análisis</InputLabel>
              <Select
                name="tipoAnalisis"
                value={formData.tipoAnalisis}
                onChange={handleChange}
                label="Tipo de Análisis"
                required
                sx={{ bgcolor: 'white', borderRadius: 2 }}
              >
                {TIPOS_ANALISIS.map(opt => (
                  <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {renderAnalisisDisponibles()}
          </Box>

              {!isRejected && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3, gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleOpenRechazoModal}
                startIcon={<ThumbDownIcon />}
                sx={{
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 50%, #b71c1c 100%)',
                  color: 'white',
                  boxShadow: '0 4px 15px rgba(244, 67, 54, 0.3)',
                  border: '2px solid transparent',
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
                  },
                  '&:hover': { 
                    background: 'linear-gradient(135deg, #e53935 0%, #c62828 50%, #ad1457 100%)',
                    transform: 'translateY(-3px) scale(1.02)', 
                    boxShadow: '0 8px 25px rgba(244, 67, 54, 0.4)',
                    '& .MuiSvgIcon-root': {
                      transform: 'rotate(-10deg) scale(1.1)'
                    }
                  },
                  '&:active': {
                    transform: 'translateY(-1px) scale(0.98)'
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '& .MuiSvgIcon-root': {
                    transition: 'transform 0.3s ease'
                  }
                }}
              >
                Rechazar Muestra
              </Button>
              
              <Button
                variant="contained"
                onClick={() => handleCotizacion()}
                startIcon={<RequestQuoteIcon />}
                sx={{
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  background: 'linear-gradient(135deg, #39A900 0%, #4caf50 50%, #2e7d32 100%)',
                  color: 'white',
                  boxShadow: '0 4px 15px rgba(57, 169, 0, 0.3)',
                  border: '2px solid transparent',
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
                  },
                  '&::after': {
                    content: '"💰"',
                    position: 'absolute',
                    top: -5,
                    right: -5,
                    fontSize: '12px',
                    opacity: 0,
                    transition: 'opacity 0.3s ease'
                  },
                  '&:hover': { 
                    background: 'linear-gradient(135deg, #2e7d32 0%, #388e3c 50%, #1b5e20 100%)',
                    transform: 'translateY(-3px) scale(1.02)', 
                    boxShadow: '0 8px 25px rgba(57, 169, 0, 0.4)',
                    '&::after': {
                      opacity: 1
                    },
                    '& .MuiSvgIcon-root': {
                      transform: 'rotate(10deg) scale(1.1)'
                    }
                  },
                  '&:active': {
                    transform: 'translateY(-1px) scale(0.98)'
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '& .MuiSvgIcon-root': {
                    transition: 'transform 0.3s ease'
                  }
                }}
              >
                Cotización
              </Button>
            </Box>
          )}

          {mostrarFirmas ? (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: '#39A900', mb: 3 }}>
                Firmas Digitales
              </Typography>
              {/* Firma Administrador */}
              <Card sx={{ mb: 3, p: 3, borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', bgcolor: '#d7f7dd' }}>
                <Typography variant="subtitle1" color="#39A900" gutterBottom sx={{ fontWeight: 'medium' }}>
                  Firma del Administrador
                </Typography>
                <SignaturePad
                  onSave={firma => {
                    setFormData(prev => ({
                      ...prev,
                      firmas: {
                        ...prev.firmas,
                        firmaAdministrador: { ...prev.firmas.firmaAdministrador, firma },
                      },
                    }));
                  }}
                  titulo="Firma Administrador"
                  disabled={!adminData}
                  firma={formData.firmas.firmaAdministrador.firma}
                />
              </Card>
              {/* Firma Cliente */}
              <Card sx={{ mb: 3, p: 3, borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', bgcolor: '#d7f7dd' }}>
                <Typography variant="subtitle1" color="#39A900" gutterBottom sx={{ fontWeight: 'medium' }}>
                  Firma del Cliente
                </Typography>
                <SignaturePad
                  onSave={firma => {
                    setFormData(prev => ({
                      ...prev,
                      firmas: {
                        ...prev.firmas,
                        firmaCliente: { ...prev.firmas.firmaCliente, firma },
                      },
                    }));
                  }}
                  titulo="Firma Cliente"
                  disabled={!clienteEncontrado}
                  firma={formData.firmas.firmaCliente.firma}
                />
              </Card>              <Box sx={{ mt: 4, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  onClick={volverAlFormulario}
                  startIcon={<ArrowBackIcon />}
                  sx={{
                    flex: 1,
                    minWidth: '200px',
                    borderRadius: 3,
                    py: 1.8,
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    borderColor: '#39A900',
                    color: '#39A900',
                    borderWidth: '2px',
                    background: 'rgba(57, 169, 0, 0.05)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 4px 15px rgba(57, 169, 0, 0.1)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(90deg, transparent, rgba(57, 169, 0, 0.1), transparent)',
                      transition: 'left 0.5s ease'
                    },
                    '&:hover': { 
                      borderColor: '#2d8600', 
                      color: '#2d8600', 
                      bgcolor: 'rgba(57, 169, 0, 0.1)',
                      transform: 'translateY(-3px) scale(1.02)', 
                      boxShadow: '0 8px 25px rgba(57, 169, 0, 0.2)',
                      '&::before': {
                        left: '100%'
                      },
                      '& .MuiSvgIcon-root': {
                        transform: 'translateX(-3px)'
                      }
                    },
                    '&:active': {
                      transform: 'translateY(-1px) scale(0.98)'
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '& .MuiSvgIcon-root': {
                      transition: 'transform 0.3s ease'
                    }
                  }}
                >
                  Volver al Formulario
                </Button>
                
                <Button
                  variant="contained"
                  onClick={handleRegistrarOtra}
                  startIcon={loading ? null : <PlaylistAddIcon />}
                  disabled={loading}
                  sx={{
                    flex: 1,
                    minWidth: '220px',
                    borderRadius: 3,
                    py: 1.8,
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    background: loading 
                      ? 'linear-gradient(135deg, #81c784 0%, #a5d6a7 100%)' 
                      : 'linear-gradient(135deg, #ff9800 0%, #f57c00 50%, #e65100 100%)',
                    color: 'white',
                    boxShadow: loading 
                      ? '0 4px 15px rgba(129, 199, 132, 0.3)' 
                      : '0 4px 15px rgba(255, 152, 0, 0.3)',
                    border: '2px solid transparent',
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
                    },
                    '&::after': {
                      content: '"+"',
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: 'rgba(255,255,255,0.8)',
                      opacity: loading ? 0 : 0,
                      transition: 'opacity 0.3s ease'
                    },
                    '&:hover': !loading ? { 
                      background: 'linear-gradient(135deg, #f57c00 0%, #e65100 50%, #bf360c 100%)',
                      transform: 'translateY(-3px) scale(1.02)', 
                      boxShadow: '0 8px 25px rgba(255, 152, 0, 0.4)',
                      '&::after': {
                        opacity: 1
                      },
                      '& .MuiSvgIcon-root': {
                        transform: 'rotate(180deg) scale(1.1)'
                      }
                    } : {},
                    '&:active': !loading ? {
                      transform: 'translateY(-1px) scale(0.98)'
                    } : {},
                    '&:disabled': {
                      color: 'white',
                      cursor: 'progress'
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '& .MuiSvgIcon-root': {
                      transition: 'transform 0.3s ease'
                    }
                  }}
                >
                  {loading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={20} sx={{ color: 'white' }} />
                      <span>Registrando...</span>
                    </Box>
                  ) : (
                    'Registrar y Agregar Otra'
                  )}
                </Button>
                
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={loading ? null : <SaveIcon />}
                  disabled={loading}
                  sx={{
                    flex: 1,
                    minWidth: '200px',
                    borderRadius: 3,
                    py: 1.8,
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    background: loading 
                      ? 'linear-gradient(135deg, #81c784 0%, #a5d6a7 100%)' 
                      : 'linear-gradient(135deg, #39A900 0%, #4caf50 50%, #2e7d32 100%)',
                    color: 'white',
                    boxShadow: loading 
                      ? '0 4px 15px rgba(129, 199, 132, 0.3)' 
                      : '0 4px 15px rgba(57, 169, 0, 0.3)',
                    border: '2px solid transparent',
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
                    },
                    '&::after': {
                      content: '"✓"',
                      position: 'absolute',
                      top: -8,
                      right: -8,
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: 'rgba(255,255,255,0.8)',
                      opacity: loading ? 0 : 0,
                      transition: 'opacity 0.3s ease'
                    },
                    '&:hover': !loading ? { 
                      background: 'linear-gradient(135deg, #2e7d32 0%, #388e3c 50%, #1b5e20 100%)',
                      transform: 'translateY(-3px) scale(1.02)', 
                      boxShadow: '0 8px 25px rgba(57, 169, 0, 0.4)',
                      '&::after': {
                        opacity: 1
                      },
                      '& .MuiSvgIcon-root': {
                        transform: 'rotate(15deg) scale(1.1)'
                      }
                    } : {},
                    '&:active': !loading ? {
                      transform: 'translateY(-1px) scale(0.98)'
                    } : {},
                    '&:disabled': {
                      color: 'white',
                      cursor: 'progress'
                    },
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '& .MuiSvgIcon-root': {
                      transition: 'transform 0.3s ease'
                    }
                  }}
                >
                  {loading ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={20} sx={{ color: 'white' }} />
                      <span>Registrando...</span>
                    </Box>
                  ) : (
                    'Registrar Muestra Final'
                  )}
                </Button>
              </Box>
            </Box>          ) : (
            <Button
              type="submit"
              variant="contained"
              fullWidth
              startIcon={<SendIcon />}
              sx={{
                mt: 4,
                py: 2,
                borderRadius: 3,
                fontSize: '1.1rem',
                fontWeight: 700,
                textTransform: 'none',
                background: isRejected 
                  ? 'linear-gradient(135deg, #f44336 0%, #d32f2f 50%, #b71c1c 100%)'
                  : 'linear-gradient(135deg, #39A900 0%, #4caf50 50%, #2e7d32 100%)',
                color: 'white',
                boxShadow: isRejected
                  ? '0 6px 20px rgba(244, 67, 54, 0.4)'
                  : '0 6px 20px rgba(57, 169, 0, 0.4)',
                border: '3px solid transparent',
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
                },
                '&::after': {
                  content: isRejected ? '"⚠️"' : '"✨"',
                  position: 'absolute',
                  top: -10,
                  right: -10,
                  fontSize: '20px',
                  opacity: 0,
                  transition: 'opacity 0.3s ease'
                },
                '&:hover': { 
                  background: isRejected
                    ? 'linear-gradient(135deg, #e53935 0%, #c62828 50%, #ad1457 100%)'
                    : 'linear-gradient(135deg, #2e7d32 0%, #388e3c 50%, #1b5e20 100%)',
                  transform: 'translateY(-4px) scale(1.01)', 
                  boxShadow: isRejected
                    ? '0 10px 30px rgba(244, 67, 54, 0.5)'
                    : '0 10px 30px rgba(57, 169, 0, 0.5)',
                  '&::after': {
                    opacity: 1
                  },
                  '& .MuiSvgIcon-root': {
                    transform: 'translateX(5px) scale(1.1)'
                  }
                },
                '&:active': {
                  transform: 'translateY(-2px) scale(0.99)'
                },
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '& .MuiSvgIcon-root': {
                  transition: 'transform 0.3s ease'
                }
              }}
            >
              {isRejected ? 'Registrar Muestra Rechazada' : 'Continuar con Firmas'}
            </Button>
          )}
        </form>
      </Paper>
      
      {/* Botón para Gestionar Análisis */}
      <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
        <Fab
          color="primary"
          onClick={handleOpenAnalisisModal}
          aria-label="Gestionar análisis"
          role="button"
          tabIndex={0}
          sx={{
            bgcolor: '#39A900',
            color: 'white',
            width: 64,
            height: 64,
            boxShadow: '0 4px 12px rgba(57, 169, 0, 0.3)',
            '&:hover': { 
              bgcolor: '#2d8600', 
              transform: 'translateY(-2px) scale(1.05)', 
              boxShadow: '0 6px 16px rgba(57, 169, 0, 0.4)' 
            },
            '&:focus': {
              bgcolor: '#2d8600',
              outline: '3px solid #39A900',
              outlineOffset: 3,
              transform: 'scale(1.05)',
            },
            '&:focus-visible': {
              outline: '3px solid #39A900',
              outlineOffset: 3,
            },
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            // Asegurar que el botón no mantenga estilos de foco después del clic
            '&:active': {
              transform: 'scale(0.95)',
            },
          }}        >
          <AddIcon sx={{ fontSize: 32 }} />        </Fab>
      </Box>        {/* Modal Registrar Cliente - Compacto */}
      <Modal
        open={openClienteModal}
        onClose={handleCloseClienteModal}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{ 
          backdrop: { 
            timeout: 600,
            sx: {
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(8px)',
              animation: openClienteModal ? 'fadeIn 0.3s ease-out' : 'fadeOut 0.3s ease-out'
            }
          } 
        }}
        aria-labelledby="modal-registro-cliente-titulo"
        aria-describedby="modal-registro-cliente-descripcion"
        disableAutoFocus={true}
        disableEnforceFocus={true}
        disableRestoreFocus={false}
        keepMounted={false}
      >
        <Fade in={openClienteModal} timeout={600}>
          <Box 
            ref={clienteModalRef}
            tabIndex={-1}
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '90vw', sm: '75vw', md: '480px', lg: '520px' },
              maxWidth: '520px',
              maxHeight: '90vh',
              overflowY: 'auto',
              outline: 'none',
              // Estilos de scroll personalizados
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'rgba(0,0,0,0.1)',
                borderRadius: '8px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'linear-gradient(135deg, #39A900, #4caf50)',
                borderRadius: '8px',
                '&:hover': {
                  background: 'linear-gradient(135deg, #2e7d32, #388e3c)',
                }
              },
            }}
          >            <Paper 
              elevation={0} 
              sx={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,255,248,0.98) 100%)',
                backdropFilter: 'blur(20px)',
                borderRadius: 3,
                border: '1px solid rgba(57, 169, 0, 0.1)',
                boxShadow: '0 15px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(255,255,255,0.2)',
                position: 'relative',
                overflow: 'hidden',
                animation: 'modalSlideIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                '@keyframes modalSlideIn': {
                  '0%': {
                    opacity: 0,
                    transform: 'translateY(30px) scale(0.95)',
                    filter: 'blur(8px)'
                  },
                  '100%': {
                    opacity: 1,
                    transform: 'translateY(0) scale(1)',
                    filter: 'blur(0px)'
                  }
                },
              }}
            >
              {/* Decoración superior */}
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                background: 'linear-gradient(90deg, #39A900 0%, #4caf50 30%, #66bb6a 60%, #81c784 100%)',
                zIndex: 1
              }} />
              
              {/* Elementos decorativos flotantes reducidos */}
              <Box sx={{
                position: 'absolute',
                top: 15,
                right: 15,
                width: 50,
                height: 50,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(57, 169, 0, 0.03), rgba(76, 175, 80, 0.05))',
                zIndex: 0,
                animation: 'float 6s ease-in-out infinite',
                '@keyframes float': {
                  '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
                  '50%': { transform: 'translateY(-8px) rotate(180deg)' }
                }
              }} />
              
              <Box sx={{
                position: 'absolute',
                bottom: 20,
                left: 20,
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(57, 169, 0, 0.02), rgba(102, 187, 106, 0.04))',
                zIndex: 0,
                animation: 'float 8s ease-in-out infinite reverse',
              }} />

              {/* Botón de cierre compacto */}
              <IconButton
                onClick={handleCloseClienteModal}
                sx={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  color: '#666',
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(0,0,0,0.05)',
                  boxShadow: '0 3px 8px rgba(0,0,0,0.1)',
                  width: 32,
                  height: 32,
                  zIndex: 1000,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    color: '#f44336',
                    transform: 'rotate(90deg) scale(1.1)',
                    boxShadow: '0 4px 12px rgba(244, 67, 54, 0.2)'
                  },
                }}
                aria-label="Cerrar modal"
              >
                <CloseIcon fontSize="small" />
              </IconButton>

              {/* Container principal con padding compacto */}
              <Box sx={{ p: { xs: 2.5, sm: 3 }, position: 'relative', zIndex: 1 }}>
                {/* Encabezado compacto */}
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  mb: 2.5,
                  textAlign: 'center'
                }}>
                  <Box sx={{ 
                    background: 'linear-gradient(135deg, #39A900 0%, #4caf50 50%, #66bb6a 100%)', 
                    borderRadius: 2,
                    p: 1.2,
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    boxShadow: '0 6px 20px rgba(57,169,0,0.25)',
                    mb: 1.5,
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
                      animation: 'shimmer 3s infinite',
                    },
                    '@keyframes shimmer': {
                      '0%': { transform: 'translateX(-100%)' },
                      '100%': { transform: 'translateX(100%)' }
                    }
                  }}>
                    <PersonIcon sx={{ color: 'white', fontSize: 28 }} />
                  </Box>
                  
                  <Typography 
                    id="modal-registro-cliente-titulo"
                    variant="h5" 
                    sx={{
                      fontWeight: 700,
                      background: 'linear-gradient(135deg, #2e7d32 0%, #388e3c 50%, #4caf50 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 0.5,
                      letterSpacing: '0.3px'
                    }}
                  >
                    Registrar Cliente
                  </Typography>
                  
                  <Typography 
                    id="modal-registro-cliente-descripcion"
                    variant="body2" 
                    sx={{ 
                      color: 'text.secondary',
                      opacity: 0.8,
                      maxWidth: '350px',
                      lineHeight: 1.4,
                      fontSize: '0.85rem'
                    }}
                  >
                    Complete la información del nuevo cliente para continuar con el registro
                  </Typography>
                </Box>                {/* Formulario compacto */}
                <Box 
                  component="form"
                  sx={{ 
                    animation: 'fadeInUp 0.6s ease-out',
                    '@keyframes fadeInUp': {
                      '0%': {
                        opacity: 0,
                        transform: 'translateY(20px)',
                      },
                      '100%': {
                        opacity: 1,
                        transform: 'translateY(0)',
                      }
                    }
                  }}
                >
                  {/* Información personal */}
                  <Typography variant="subtitle1" sx={{ 
                    color: '#2e7d32', 
                    fontWeight: 600,
                    mb: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    fontSize: '0.95rem'
                  }}>
                    <PersonIcon sx={{ fontSize: '1rem' }} />
                    Información Personal
                  </Typography>

                  {/* Campos básicos en grid compacto */}
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Nombre Completo"
                        name="nombre"
                        value={clienteData.nombre}
                        onChange={handleClienteChangeNombre}
                        fullWidth
                        required
                        size="small"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PersonIcon sx={{ color: '#39A900', fontSize: '1.1rem' }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{ 
                          '& .MuiOutlinedInput-root': {
                            background: 'rgba(255,255,255,0.8)',
                            borderRadius: 2,
                            transition: 'all 0.3s ease',
                            fontSize: '0.9rem',
                            '& fieldset': {
                              borderColor: 'rgba(57,169,0,0.2)',
                              borderWidth: '1.5px'
                            },
                            '&:hover fieldset': {
                              borderColor: 'rgba(57,169,0,0.4)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#39A900',
                              boxShadow: '0 3px 8px rgba(57,169,0,0.12)'
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: '#666',
                            fontWeight: 500,
                            fontSize: '0.85rem',
                            '&.Mui-focused': {
                              color: '#39A900',
                            },
                          },
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Documento"
                        name="documento"
                        value={clienteData.documento}
                        onChange={handleClienteChangeDocumento}
                        fullWidth
                        required
                        size="small"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <BadgeIcon sx={{ color: '#39A900', fontSize: '1.1rem' }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{ 
                          '& .MuiOutlinedInput-root': {
                            background: 'rgba(255,255,255,0.8)',
                            borderRadius: 2,
                            transition: 'all 0.3s ease',
                            fontSize: '0.9rem',
                            '& fieldset': {
                              borderColor: 'rgba(57,169,0,0.2)',
                              borderWidth: '1.5px'
                            },
                            '&:hover fieldset': {
                              borderColor: 'rgba(57,169,0,0.4)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#39A900',
                              boxShadow: '0 3px 8px rgba(57,169,0,0.12)'
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: '#666',
                            fontWeight: 500,
                            fontSize: '0.85rem',
                            '&.Mui-focused': {
                              color: '#39A900',
                            },
                          },
                        }}
                      />
                    </Grid>
                  </Grid>

                  {/* Información de contacto */}
                  <Typography variant="subtitle1" sx={{ 
                    color: '#2e7d32', 
                    fontWeight: 600,
                    mb: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    fontSize: '0.95rem'
                  }}>
                    <PhoneIcon sx={{ fontSize: '1rem' }} />
                    Información de Contacto
                  </Typography>

                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Teléfono"
                        name="telefono"
                        value={clienteData.telefono}
                        onChange={handleClienteChangeTelefono}
                        fullWidth
                        size="small"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <PhoneIcon sx={{ color: '#39A900', fontSize: '1.1rem' }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{ 
                          '& .MuiOutlinedInput-root': {
                            background: 'rgba(255,255,255,0.8)',
                            borderRadius: 2,
                            transition: 'all 0.3s ease',
                            fontSize: '0.9rem',
                            '& fieldset': {
                              borderColor: 'rgba(57,169,0,0.2)',
                              borderWidth: '1.5px'
                            },
                            '&:hover fieldset': {
                              borderColor: 'rgba(57,169,0,0.4)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#39A900',
                              boxShadow: '0 3px 8px rgba(57,169,0,0.12)'
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: '#666',
                            fontWeight: 500,
                            fontSize: '0.85rem',
                            '&.Mui-focused': {
                              color: '#39A900',
                            },
                          },
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Correo Electrónico"
                        name="email"
                        type="email"
                        value={clienteData.email}
                        onChange={handleClienteChange}
                        fullWidth
                        required
                        size="small"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <EmailIcon sx={{ color: '#39A900', fontSize: '1.1rem' }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{ 
                          '& .MuiOutlinedInput-root': {
                            background: 'rgba(255,255,255,0.8)',
                            borderRadius: 2,
                            transition: 'all 0.3s ease',
                            fontSize: '0.9rem',
                            '& fieldset': {
                              borderColor: 'rgba(57,169,0,0.2)',
                              borderWidth: '1.5px'
                            },
                            '&:hover fieldset': {
                              borderColor: 'rgba(57,169,0,0.4)',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: '#39A900',
                              boxShadow: '0 3px 8px rgba(57,169,0,0.12)'
                            },
                          },
                          '& .MuiInputLabel-root': {
                            color: '#666',
                            fontWeight: 500,
                            fontSize: '0.85rem',
                            '&.Mui-focused': {
                              color: '#39A900',
                            },
                          },
                        }}
                      />
                    </Grid>
                  </Grid>

                  <TextField
                    label="Dirección"
                    name="direccion"
                    value={clienteData.direccion}
                    onChange={handleClienteChange}
                    fullWidth
                    size="small"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LocationOnIcon sx={{ color: '#39A900', fontSize: '1.1rem' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ 
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                        background: 'rgba(255,255,255,0.8)',
                        borderRadius: 2,
                        transition: 'all 0.3s ease',
                        fontSize: '0.9rem',
                        '& fieldset': {
                          borderColor: 'rgba(57,169,0,0.2)',
                          borderWidth: '1.5px'
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(57,169,0,0.4)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#39A900',
                          boxShadow: '0 3px 8px rgba(57,169,0,0.12)'
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: '#666',
                        fontWeight: 500,
                        fontSize: '0.85rem',
                        '&.Mui-focused': {
                          color: '#39A900',
                        },
                      },
                    }}
                  />

                  {/* Información empresarial */}
                  <Typography variant="subtitle1" sx={{ 
                    color: '#2e7d32', 
                    fontWeight: 600,
                    mb: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    fontSize: '0.95rem'
                  }}>
                    <BusinessIcon sx={{ fontSize: '1rem' }} />
                    Información Empresarial
                  </Typography>

                  {/* Campo Tipo de Cliente compacto */}
                  <FormControl 
                    fullWidth 
                    size="small"
                    sx={{ 
                      mb: 2,
                      '& .MuiOutlinedInput-root': {
                        background: 'rgba(255,255,255,0.8)',
                        borderRadius: 2,
                        transition: 'all 0.3s ease',
                        fontSize: '0.9rem',
                        '& fieldset': {
                          borderColor: 'rgba(57,169,0,0.2)',
                          borderWidth: '1.5px'
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(57,169,0,0.4)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#39A900',
                          boxShadow: '0 3px 8px rgba(57,169,0,0.12)'
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: '#666',
                        fontWeight: 500,
                        fontSize: '0.85rem',
                        '&.Mui-focused': {
                          color: '#39A900',
                        },
                      },
                    }}
                  >
                    <InputLabel>Tipo de Cliente</InputLabel>
                    <Select
                      value={clienteData.tipo_cliente}
                      name="tipo_cliente"
                      onChange={handleClienteChange}
                      label="Tipo de Cliente"
                      required
                      startAdornment={
                        <InputAdornment position="start">
                          <BusinessIcon sx={{ color: '#39A900', mr: 1, fontSize: '1.1rem' }} />
                        </InputAdornment>
                      }
                    >
                      <MenuItem value="empresas">Empresas</MenuItem>
                      <MenuItem value="emprendedor">Emprendedor</MenuItem>
                      <MenuItem value="persona natural">Persona Natural</MenuItem>
                      <MenuItem value="institucion educativa">Institución Educativa</MenuItem>
                      <MenuItem value="aprendiz/instructor Sena">Aprendiz/Instructor SENA</MenuItem>
                    </Select>
                  </FormControl>

                  {/* Campo Razón Social (condicional) compacto */}
                  {clienteData.tipo_cliente !== "persona natural" && clienteData.tipo_cliente !== "" && (
                    <TextField
                      label="Razón Social"
                      name="razonSocial"
                      value={clienteData.razonSocial}
                      onChange={handleClienteChangeRazonSocial}
                      fullWidth
                      required
                      size="small"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BusinessIcon sx={{ color: '#39A900', fontSize: '1.1rem' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ 
                        mb: 2,
                        '& .MuiOutlinedInput-root': {
                          background: 'rgba(255,255,255,0.8)',
                          borderRadius: 2,
                          transition: 'all 0.3s ease',
                          fontSize: '0.9rem',
                          '& fieldset': {
                            borderColor: 'rgba(57,169,0,0.2)',
                            borderWidth: '1.5px'
                          },
                          '&:hover fieldset': {
                            borderColor: 'rgba(57,169,0,0.4)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#39A900',
                            boxShadow: '0 3px 8px rgba(57,169,0,0.12)'
                          },
                        },                        '& .MuiInputLabel-root': {
                          color: '#666',
                          fontWeight: 500,
                          fontSize: '0.85rem',
                          '&.Mui-focused': {
                            color: '#39A900',
                          },
                        },
                      }}
                    />
                  )}

                  {/* Alertas compactas */}
                  {registroError && (
                    <Alert 
                      severity="error" 
                      sx={{ 
                        mb: 2,
                        borderRadius: 2,
                        border: '1.5px solid #f44336',
                        bgcolor: 'rgba(244, 67, 54, 0.08)',
                        animation: 'shake 0.5s ease-in-out',
                        fontSize: '0.85rem',
                        '& .MuiAlert-icon': { color: '#f44336', fontSize: '1.1rem' },
                        '& .MuiAlert-message': { fontWeight: 500 }
                      }}
                      icon={<ErrorIcon />}
                    >
                      {registroError}
                    </Alert>
                  )}

                  {registroExito && (
                    <Alert 
                      severity="success" 
                      sx={{ 
                        mb: 2,
                        borderRadius: 2,
                        border: '1.5px solid #4caf50',
                        bgcolor: 'rgba(76, 175, 80, 0.08)',
                        animation: 'celebrateSuccess 1s ease-in-out',
                        fontSize: '0.85rem',
                        '& .MuiAlert-icon': { color: '#4caf50', fontSize: '1.1rem' },
                        '& .MuiAlert-message': { fontWeight: 500 }
                      }}
                      icon={<CheckCircleIcon />}
                    >
                      {registroExito}
                    </Alert>
                  )}

                  {/* Botones de acción compactos */}
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 1.5, 
                    justifyContent: 'flex-end',
                    pt: 1.5,
                    borderTop: '1px solid rgba(0,0,0,0.06)'
                  }}>
                    <Button
                      variant="outlined"
                      onClick={handleCloseClienteModal}
                      startIcon={<CancelIcon />}
                      size="small"
                      sx={{
                        px: 2.5,
                        py: 1,
                        borderRadius: 2,
                        borderColor: '#ff5722',
                        color: '#ff5722',
                        fontWeight: 600,
                        textTransform: 'none',
                        fontSize: '0.85rem',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          borderColor: '#d84315',
                          backgroundColor: 'rgba(255, 87, 34, 0.04)',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 4px 12px rgba(255, 87, 34, 0.15)'
                        }
                      }}
                    >
                      Cancelar
                    </Button>
                    
                    <Button
                      variant="contained"
                      onClick={handleRegistrarCliente}
                      disabled={registrando}
                      startIcon={registrando ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                      size="small"
                      sx={{
                        px: 3,
                        py: 1,
                        borderRadius: 2,
                        background: 'linear-gradient(135deg, #39A900 0%, #4caf50 100%)',
                        fontWeight: 600,
                        textTransform: 'none',
                        fontSize: '0.85rem',
                        boxShadow: '0 3px 8px rgba(57, 169, 0, 0.25)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #2e7d32 0%, #388e3c 100%)',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 6px 16px rgba(57, 169, 0, 0.35)'
                        },
                        '&:disabled': {
                          background: 'rgba(0,0,0,0.12)',
                          transform: 'none',
                          boxShadow: 'none'
                        }
                      }}
                    >
                      {registrando ? 'Registrando...' : 'Registrar Cliente'}
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Box>
        </Fade>
      </Modal>{/* Modal Rechazo - Modernizado */}
      <Modal
        open={openRechazoModal}
        onClose={() => setOpenRechazoModal(false)}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{ 
          backdrop: { 
            timeout: 600,
            sx: {
              background: 'rgba(244, 67, 54, 0.4)',
              backdropFilter: 'blur(8px)',
              animation: openRechazoModal ? 'fadeIn 0.3s ease-out' : 'fadeOut 0.3s ease-out'
            }
          } 
        }}
        aria-labelledby="modal-rechazo-titulo"
        aria-describedby="modal-rechazo-descripcion"
      >
        <Fade in={openRechazoModal} timeout={600}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: { xs: '90vw', sm: '450px', md: '500px' },
              maxWidth: '500px',
              maxHeight: '85vh',
              overflowY: 'auto',
              outline: 'none',
              // Estilos de scroll personalizados
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'rgba(0,0,0,0.1)',
                borderRadius: '10px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: 'linear-gradient(135deg, #f44336, #d32f2f)',
                borderRadius: '10px',
                '&:hover': {
                  background: 'linear-gradient(135deg, #d32f2f, #b71c1c)',
                }
              },
            }}
          >
            <Paper 
              elevation={0} 
              sx={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,245,245,0.98) 100%)',
                backdropFilter: 'blur(20px)',
                borderRadius: 4,
                border: '1px solid rgba(244, 67, 54, 0.1)',
                boxShadow: '0 20px 60px rgba(244, 67, 54, 0.2), 0 0 0 1px rgba(255,255,255,0.2)',
                position: 'relative',
                overflow: 'hidden',
                animation: 'modalSlideIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                '@keyframes modalSlideIn': {
                  '0%': {
                    opacity: 0,
                    transform: 'translateY(40px) scale(0.9)',
                    filter: 'blur(10px)'
                  },
                  '100%': {
                    opacity: 1,
                    transform: 'translateY(0) scale(1)',
                    filter: 'blur(0px)'
                  }
                },              }}
            >
              {/* Decoración superior de advertencia */}
              <Box sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: 'linear-gradient(90deg, #f44336 0%, #e53935 30%, #d32f2f 60%, #c62828 100%)',
                zIndex: 1
              }} />

              {/* Elementos decorativos flotantes */}
              <Box sx={{
                position: 'absolute',
                top: 15,
                right: 15,
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.08), rgba(211, 47, 47, 0.12))',
                zIndex: 0,
                animation: 'float 4s ease-in-out infinite',
                '@keyframes float': {
                  '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
                  '50%': { transform: 'translateY(-8px) rotate(180deg)' }
                }
              }} />

              {/* Botón de cierre mejorado */}
              <IconButton
                onClick={() => setOpenRechazoModal(false)}
                sx={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  color: '#666',
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(0,0,0,0.05)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  width: 40,
                  height: 40,
                  zIndex: 1000,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    color: '#f44336',
                    transform: 'rotate(90deg) scale(1.1)',
                    boxShadow: '0 6px 20px rgba(244, 67, 54, 0.2)'
                  },
                }}
                aria-label="Cerrar modal"
              >
                <CloseIcon fontSize="small" />              </IconButton>

              {/* Container principal con padding responsivo */}
              <Box sx={{ p: { xs: 3, sm: 4, md: 5 }, position: 'relative', zIndex: 1 }}>
                {/* Encabezado modernizado */}
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  mb: 4,
                  textAlign: 'center'
                }}>
                  <Box sx={{ 
                    background: 'linear-gradient(135deg, #f44336 0%, #e53935 50%, #d32f2f 100%)', 
                    borderRadius: 3,
                    p: 2,
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    boxShadow: '0 8px 25px rgba(244, 67, 54, 0.3)',
                    mb: 2,
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
                      animation: 'shimmer 3s infinite',
                    },
                    '@keyframes shimmer': {
                      '0%': { transform: 'translateX(-100%)' },
                      '100%': { transform: 'translateX(100%)' }
                    }
                  }}>
                    <ThumbDownIcon sx={{ color: 'white', fontSize: 36 }} />
                  </Box>
                  
                  <Typography 
                    id="modal-rechazo-titulo"
                    variant="h4" 
                    sx={{
                      fontWeight: 800,
                      background: 'linear-gradient(135deg, #d32f2f 0%, #f44336 50%, #e53935 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      mb: 1,
                      letterSpacing: '0.5px'
                    }}
                  >
                    Rechazar Muestra
                  </Typography>
                  
                  <Typography 
                    id="modal-rechazo-descripcion"
                    variant="body1" 
                    sx={{ 
                      color: 'text.secondary',
                      opacity: 0.8,
                      maxWidth: '350px',
                      lineHeight: 1.6
                    }}
                  >
                    Ingrese la razón por la cual la muestra no puede ser procesada
                  </Typography>                </Box>

                {/* Formulario de rechazo */}
                <Box sx={{
                  animation: 'fadeInUp 0.6s ease-out',
                  '@keyframes fadeInUp': {
                    '0%': {
                      opacity: 0,
                      transform: 'translateY(30px)',
                    },
                    '100%': {
                      opacity: 1,
                      transform: 'translateY(0)',
                    }
                  }
                }}>
                  <Typography variant="h6" sx={{ 
                    color: '#d32f2f', 
                    fontWeight: 600,
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <DescriptionIcon sx={{ fontSize: '1.2rem' }} />
                    Observación de Rechazo
                  </Typography>

                  <TextField
                    fullWidth
                    label="Razón del rechazo"
                    name="observacionRechazo"
                    value={observacionRechazo}
                    onChange={e => setObservacionRechazo(e.target.value.toUpperCase())}
                    multiline
                    rows={4}
                    required
                    placeholder="Ingrese el motivo detallado del rechazo de la muestra..."
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start" sx={{ alignSelf: 'flex-start', pt: 1 }}>
                          <WarningIcon sx={{ color: '#f44336' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ 
                      mb: 3,
                      '& .MuiOutlinedInput-root': {
                        background: 'rgba(255,255,255,0.8)',
                        borderRadius: 3,
                        transition: 'all 0.3s ease',
                        '& fieldset': {
                          borderColor: 'rgba(244, 67, 54, 0.2)',
                          borderWidth: '2px'
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(244, 67, 54, 0.4)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: '#f44336',
                          boxShadow: '0 4px 12px rgba(244, 67, 54, 0.15)'
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: '#666',
                        fontWeight: 500,
                        '&.Mui-focused': {
                          color: '#f44336',
                        },
                      },
                    }}                  />

                  {/* Botones de acción modernizados */}
                  <Box sx={{
                    display: 'flex', 
                    gap: 2, 
                    justifyContent: 'flex-end',
                    pt: 2,
                    borderTop: '1px solid rgba(0,0,0,0.08)'
                  }}>
                    <Button
                      variant="outlined"
                      onClick={() => setOpenRechazoModal(false)}
                      startIcon={<CancelIcon />}
                      sx={{
                        px: 3,
                        py: 1.2,
                        borderRadius: 3,
                        borderColor: '#757575',
                        color: '#757575',
                        fontWeight: 600,
                        textTransform: 'none',
                        fontSize: '0.95rem',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          borderColor: '#424242',
                          backgroundColor: 'rgba(117, 117, 117, 0.05)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 16px rgba(117, 117, 117, 0.2)'
                        }
                      }}
                    >
                      Cancelar
                    </Button>
                    
                    <Button
                      variant="contained"
                      onClick={handleConfirmarRechazo}
                      disabled={!observacionRechazo.trim()}
                      startIcon={<ThumbDownIcon />}
                      sx={{
                        px: 4,
                        py: 1.2,
                        borderRadius: 3,
                        background: 'linear-gradient(135deg, #f44336 0%, #e53935 100%)',
                        fontWeight: 600,
                        textTransform: 'none',
                        fontSize: '0.95rem',
                        boxShadow: '0 4px 12px rgba(244, 67, 54, 0.3)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #d32f2f 0%, #c62828 100%)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 8px 20px rgba(244, 67, 54, 0.4)'
                        },
                        '&:disabled': {
                          background: 'rgba(0,0,0,0.12)',
                          transform: 'none',
                          boxShadow: 'none'
                        }
                      }}
                    >
                      Confirmar Rechazo
                    </Button>
                  </Box>
                </Box>
              </Box>            </Paper>
          </Box>
        </Fade>
      </Modal>

      <Modal
        open={openAnalisisModal}
        onClose={() => {
          setOpenAnalisisModal(false);
          setNewAnalisisData(initialNewAnalisisData);
          setAnalisisError(null);
          setAnalisisSuccess(null);
          setEditingAnalisis(null);
        }}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{ 
          backdrop: { 
            timeout: 500,
            sx: {
              background: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(8px)',
            }
          } 
        }}
      >
        <Fade in={openAnalisisModal}>
          <Box
            ref={analisisModalRef}
            tabIndex={-1}
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '90vw',
              maxWidth: 900,
              background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 15px 35px rgba(0, 0, 0, 0.12), 0 8px 20px rgba(57, 169, 0, 0.08)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              maxHeight: '85vh',
              overflowY: 'auto',
              outline: 'none',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '80px',
                background: 'linear-gradient(135deg, #39A900 0%, #4caf50 50%, #66bb6a 100%)',
                borderRadius: '16px 16px 0 0',
                zIndex: 0
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                top: '15px',
                right: '15px',
                width: '40px',
                height: '40px',
                background: 'radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%)',
                borderRadius: '50%',
                animation: 'float 3s ease-in-out infinite',
                zIndex: 1
              }            }}
          >
            {/* Decoraciones flotantes reducidas */}
            <Box sx={{
              position: 'absolute',
              top: '20px',
              left: '20px',
              width: '6px',
              height: '6px',
              bgcolor: 'rgba(255, 255, 255, 0.6)',
              borderRadius: '50%',
              animation: 'pulse 2s ease-in-out infinite',
              zIndex: 2
            }} />
            <Box sx={{
              position: 'absolute',
              top: '35px',
              left: '40px',
              width: '3px',
              height: '3px',
              bgcolor: 'rgba(255, 255, 255, 0.4)',
              borderRadius: '50%',
              animation: 'pulse 2s ease-in-out infinite 0.5s',
              zIndex: 2            }} />

            {/* Header compacto */}
            <Box sx={{
              position: 'relative',
              zIndex: 3,
              p: 2.5,
              pb: 1.5,
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              color: 'white'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{
                  p: 1,
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  animation: 'float 2s ease-in-out infinite'
                }}>
                  <SettingsIcon sx={{ 
                    fontSize: '1.4rem', 
                    color: 'white',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                  }} />
                </Box>
                <Box>
                  <Typography
                    variant="h5"
                    sx={{ 
                      fontWeight: 700,
                      color: 'white',
                      textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      mb: 0.2
                    }}
                  >
                    Gestionar Análisis
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ 
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontWeight: 500,
                      textShadow: '0 1px 2px rgba(0,0,0,0.1)',
                      fontSize: '0.8rem'
                    }}
                  >
                    🧪 Administra los análisis disponibles
                  </Typography>
                </Box>
              </Box>
              <IconButton
                onClick={handleCloseAnalisisModal}
                sx={{
                  color: 'white',
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  p: 1,
                  '&:hover': {
                    background: 'rgba(231, 76, 60, 0.2)',
                    borderColor: 'rgba(231, 76, 60, 0.3)',
                    transform: 'scale(1.1) rotate(90deg)',
                    color: '#fff'
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <CloseIcon sx={{ fontSize: '1.2rem' }} />
              </IconButton>            </Box>

            {/* Contenido principal compacto */}
            <Box sx={{ 
              position: 'relative',
              zIndex: 2,
              p: 3,
              pt: 1.5
            }}>
              {/* Header de Lista de Análisis con estadísticas */}
              <Card sx={{
                mb: 2,
                background: 'linear-gradient(135deg, rgba(57, 169, 0, 0.05) 0%, rgba(76, 175, 80, 0.03) 100%)',
                border: '2px solid rgba(57, 169, 0, 0.1)',
                borderRadius: '12px',
                overflow: 'hidden',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '3px',
                  background: 'linear-gradient(90deg, #39A900 0%, #4caf50 50%, #66bb6a 100%)'
                }
              }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{
                        p: 1,
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #39A900 0%, #4caf50 100%)',
                        boxShadow: '0 3px 8px rgba(57, 169, 0, 0.25)'
                      }}>
                        <StraightenIcon sx={{ color: 'white', fontSize: '1.2rem' }} />
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" sx={{ color: '#39A900', fontWeight: 700, mb: 0.2 }}>
                          Lista de Análisis
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#666', fontWeight: 500, fontSize: '0.8rem' }}>
                          📊 Administra y configura todos los análisis
                        </Typography>
                      </Box>                    </Box>

                    {/* Estadísticas rápidas */}
                    <Box sx={{display: 'flex', gap: 1.5, alignItems: 'center' }}>
                      <Chip
                        icon={<CheckIcon sx={{ fontSize: '0.7rem !important' }} />}
                        label={`${allAnalisis.filter(a => a.activo).length} Activos`}
                        variant="outlined"
                        size="small"
                        sx={{
                          borderColor: '#4caf50',
                          color: '#4caf50',
                          fontWeight: 600,
                          bgcolor: 'rgba(76, 175, 80, 0.05)',
                          fontSize: '0.75rem',
                          height: '24px'
                        }}
                      />
                      <Chip
                        icon={<CancelIcon sx={{ fontSize: '0.7rem !important' }} />}
                        label={`${allAnalisis.filter(a => !a.activo).length} Inactivos`}
                        variant="outlined"
                        size="small"
                        sx={{
                          borderColor: '#f44336',
                          color: '#f44336',
                          fontWeight: 600,
                          bgcolor: 'rgba(244, 67, 54, 0.05)',
                          fontSize: '0.75rem',
                          height: '24px'
                        }}
                      />
                      
                      {!showAnalisisForm && (
                        <Button
                          variant="contained"
                          startIcon={<PlaylistAddIcon />}
                          onClick={handleShowCreateForm}
                          sx={{
                            background: 'linear-gradient(135deg, #39A900 0%, #4caf50 100%)',
                            color: 'white',
                            fontWeight: 600,
                            borderRadius: '8px',
                            px: 2,
                            py: 0.8,
                            textTransform: 'none',
                            boxShadow: '0 4px 12px rgba(57, 169, 0, 0.25)',
                            border: '2px solid transparent',
                            position: 'relative',
                            overflow: 'hidden',
                            fontSize: '0.85rem',
                            minHeight: '32px',
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: '-100%',
                              width: '100%',
                              height: '100%',
                              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                              transition: 'left 0.5s ease'
                            },
                            '&:hover': {
                              background: 'linear-gradient(135deg, #2e7d32 0%, #388e3c 100%)',
                              transform: 'translateY(-2px) scale(1.05)',
                              boxShadow: '0 10px 30px rgba(57, 169, 0, 0.4)',
                              '&::before': {
                                left: '100%'
                              }
                            },
                            '&:active': {
                              transform: 'translateY(-1px) scale(1.02)'
                            },
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                          }}
                        >
                          Nuevo Análisis
                        </Button>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
                {allAnalisis.length > 0 ? (
                <Paper 
                  elevation={0}
                  sx={{ 
                    mb: showAnalisisForm ? 3 : 4, 
                    borderRadius: '16px',
                    background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(57, 169, 0, 0.1)',
                    overflow: 'hidden',
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: 'linear-gradient(90deg, #39A900 0%, #4caf50 50%, #66bb6a 100%)'
                    }
                  }}
                >
                  <TableContainer>
                    <Table sx={{ minWidth: 800 }}>
                      <TableHead>
                        <TableRow sx={{ 
                          background: 'linear-gradient(135deg, #39A900 0%, #4caf50 100%)',
                          '& .MuiTableCell-head': {
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '0.95rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            borderBottom: 'none',
                            py: 2.5
                          }
                        }}>
                          <TableCell sx={{ minWidth: 200, pl: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <DescriptionIcon sx={{ fontSize: '1.1rem' }} />
                              Nombre
                            </Box>
                          </TableCell>
                          <TableCell sx={{ minWidth: 120 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <TuneIcon sx={{ fontSize: '1.1rem' }} />
                              Tipo
                            </Box>
                          </TableCell>
                          <TableCell sx={{ minWidth: 120 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <StraightenIcon sx={{ fontSize: '1.1rem' }} />
                              Unidad
                            </Box>
                          </TableCell>
                          <TableCell sx={{ minWidth: 100 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <RequestQuoteIcon sx={{ fontSize: '1.1rem' }} />
                              Precio
                            </Box>
                          </TableCell>
                          <TableCell sx={{ minWidth: 80, textAlign: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                              <CheckIcon sx={{ fontSize: '1.1rem' }} />
                              Estado
                            </Box>
                          </TableCell>
                          <TableCell sx={{ minWidth: 100, textAlign: 'center', pr: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                              <SettingsIcon sx={{ fontSize: '1.1rem' }} />
                              Acciones
                            </Box>
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {allAnalisis.map((analisis, index) => {
                          return (
                            <TableRow
                              key={analisis._id || analisis.nombre}
                              sx={{ 
                                '&:hover': { 
                                  bgcolor: 'rgba(57, 169, 0, 0.05)',
                                  transform: 'scale(1.002)',
                                  boxShadow: '0 2px 8px rgba(57, 169, 0, 0.1)'
                                },
                                '&:nth-of-type(even)': {
                                  bgcolor: 'rgba(248, 250, 252, 0.3)'
                                },
                                borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
                                transition: 'all 0.2s ease',
                                animation: `fadeInScale 0.5s ease-out ${index * 0.1}s backwards`
                              }}
                            >
                              <TableCell sx={{ 
                                fontWeight: 600, 
                                color: '#2c3e50',
                                pl: 3,
                                py: 2
                              }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                  <Box sx={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    bgcolor: analisis.activo ? '#4caf50' : '#f44336',
                                    animation: analisis.activo ? 'pulse 2s ease-in-out infinite' : 'none'
                                  }} />
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    {analisis.nombre || 'N/A'}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell sx={{ py: 2 }}>
                                <Chip
                                  label={analisis.tipo
                                    ? analisis.tipo.charAt(0).toUpperCase() + analisis.tipo.slice(1)
                                    : 'N/A'}
                                  variant="outlined"
                                  size="small"
                                  sx={{
                                    borderColor: analisis.tipo === 'Fisicoquímico' ? '#2196f3' : '#9c27b0',
                                    color: analisis.tipo === 'Fisicoquímico' ? '#2196f3' : '#9c27b0',
                                    fontWeight: 600,
                                    bgcolor: analisis.tipo === 'Fisicoquímico' 
                                      ? 'rgba(33, 150, 243, 0.05)' 
                                      : 'rgba(156, 39, 176, 0.05)'
                                  }}
                                />
                              </TableCell>
                              <TableCell sx={{ py: 2 }}>
                                <Typography variant="body2" sx={{ fontWeight: 500, color: '#555' }}>
                                  {analisis.unidad || 'N/A'}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ py: 2 }}>
                                <Typography variant="body2" sx={{ 
                                  fontWeight: 700, 
                                  color: '#39A900',
                                  fontSize: '0.9rem'
                                }}>
                                  {analisis.precio != null ? `$${analisis.precio.toLocaleString()}` : 'N/A'}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ textAlign: 'center', py: 2 }}>
                                <Switch
                                  checked={analisis.activo || false}
                                  onChange={() =>
                                    analisis._id
                                      ? handleToggleAnalisisStatus(analisis._id, analisis.activo)
                                      : console.log('No _id for analysis:', analisis)
                                  }
                                  sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': {
                                      color: '#4caf50',
                                      '& + .MuiSwitch-track': {
                                        backgroundColor: '#4caf50',
                                      },
                                    },
                                    '& .MuiSwitch-track': {
                                      backgroundColor: '#f44336',
                                    }
                                  }}
                                />
                              </TableCell>
                              <TableCell sx={{ textAlign: 'center', py: 2, pr: 3 }}>
                                <IconButton
                                  onClick={() => handleEditAnalisis(analisis)}
                                  sx={{ 
                                    color: '#39A900',
                                    background: 'rgba(57, 169, 0, 0.1)',
                                    borderRadius: '10px',
                                    p: 1,
                                    '&:hover': { 
                                      bgcolor: 'rgba(57, 169, 0, 0.2)',
                                      transform: 'scale(1.2) rotate(15deg)',
                                      color: '#2e7d32'
                                    },
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                  }}
                                >
                                  <EditIcon sx={{ fontSize: '1.2rem' }} />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>) : (
        <Alert 
          severity="info" 
          sx={{ 
            mb: showAnalisisForm ? 2 : 4, 
            borderRadius: 3, 
            border: '2px solid #2196f3',
            bgcolor: 'rgba(33, 150, 243, 0.1)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 6px 20px rgba(33, 150, 243, 0.2)',
            animation: 'fadeInScale 0.5s ease-out',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '4px',
              height: '100%',
              bgcolor: '#2196f3',
              borderRadius: '2px 0 0 2px'
            },
            '& .MuiAlert-icon': {
              fontSize: '1.6rem',
              color: '#2196f3'
            },
            '& .MuiAlert-message': {
              fontWeight: 500,
              fontSize: '0.95rem',
              color: '#1565c0'
            }
          }}
          icon={<InfoIcon sx={{ fontSize: '1.6rem' }} />}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, color: '#1565c0' }}>
            📋 No hay análisis disponibles
          </Typography>        </Alert>
      )}

              {/* Formulario para Nuevo/Editar Análisis - Completamente Modernizado */}
              {showAnalisisForm && (
                <Fade in={showAnalisisForm}>
                  <Card 
                    ref={analisisFormRef}
                    elevation={0}
                    sx={{ 
                      mb: 3,
                      borderRadius: '20px',
                      background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.8) 100%)',
                      backdropFilter: 'blur(20px)',
                      border: '2px solid rgba(57, 169, 0, 0.2)',
                      boxShadow: '0 15px 35px rgba(57, 169, 0, 0.1)',
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '6px',
                        background: editingAnalisis 
                          ? 'linear-gradient(90deg, #ff9800 0%, #f57c00 50%, #e65100 100%)'
                          : 'linear-gradient(90deg, #39A900 0%, #4caf50 50%, #66bb6a 100%)'
                      }
                    }}                  >
                    {/* Decoraciones flotantes */}
                    <Box sx={{
                      position: 'absolute',
                      top: '20px',
                      right: '20px',
                      width: '40px',
                      height: '40px',
                      background: editingAnalisis 
                        ? 'radial-gradient(circle, rgba(255, 152, 0, 0.1) 0%, transparent 70%)'
                        : 'radial-gradient(circle, rgba(57, 169, 0, 0.1) 0%, transparent 70%)',
                      borderRadius: '50%',
                      animation: 'float 3s ease-in-out infinite'
                    }} />
                    <Box sx={{
                      position: 'absolute',
                      top: '40px',
                      left: '30px',
                      width: '6px',
                      height: '6px',
                      bgcolor: editingAnalisis ? 'rgba(255, 152, 0, 0.4)' : 'rgba(57, 169, 0, 0.4)',
                      borderRadius: '50%',
                      animation: 'pulse 2s ease-in-out infinite'
                    }} />

                    <CardContent sx={{ p: 4 }}>                      {/* Header del formulario */}
                      <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box sx={{
                            p: 1.5,
                            borderRadius: '12px',
                            background: editingAnalisis 
                              ? 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)'
                              : 'linear-gradient(135deg, #39A900 0%, #4caf50 100%)',
                            boxShadow: editingAnalisis
                              ? '0 4px 12px rgba(255, 152, 0, 0.3)'
                              : '0 4px 12px rgba(57, 169, 0, 0.3)',
                            animation: 'float 2s ease-in-out infinite'
                          }}>
                            {editingAnalisis ? (
                              <EditIcon sx={{ color: 'white', fontSize: '1.5rem' }} />
                            ) : (
                              <PlaylistAddIcon sx={{ color: 'white', fontSize: '1.5rem' }} />
                            )}
                          </Box>
                          <Box>
                            <Typography variant="h5" sx={{ 
                              color: editingAnalisis ? '#f57c00' : '#39A900', 
                              fontWeight: 700,
                              mb: 0.5
                            }}>
                              {editingAnalisis ? 'Editar Análisis' : 'Nuevo Análisis'}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#666', fontWeight: 500 }}>
                              {editingAnalisis 
                                ? '📝 Modifica los datos del análisis seleccionado'
                                : '✨ Crea un nuevo análisis para el laboratorio'
                              }
                            </Typography>
                          </Box>
                        </Box>
                        <Button
                          variant="outlined"
                          onClick={handleCancelForm}
                          startIcon={<ArrowBackIcon />}
                          sx={{
                            borderColor: editingAnalisis ? '#ff9800' : '#39A900',
                            color: editingAnalisis ? '#ff9800' : '#39A900',
                            borderWidth: '2px',
                            borderRadius: '12px',
                            px: 3,
                            py: 1,
                            fontWeight: 600,
                            textTransform: 'none',
                            background: editingAnalisis 
                              ? 'rgba(255, 152, 0, 0.05)' 
                              : 'rgba(57, 169, 0, 0.05)',
                            '&:hover': {
                              borderColor: editingAnalisis ? '#f57c00' : '#2d8600',
                              color: editingAnalisis ? '#f57c00' : '#2d8600',
                              bgcolor: editingAnalisis 
                                ? 'rgba(255, 152, 0, 0.1)' 
                                : 'rgba(57, 169, 0, 0.1)',
                              transform: 'translateY(-2px) scale(1.05)',
                              boxShadow: editingAnalisis
                                ? '0 6px 20px rgba(255, 152, 0, 0.2)'
                                : '0 6px 20px rgba(57, 169, 0, 0.2)'
                            },
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                          }}
                        >
                          Cancelar
                        </Button>
                      </Box>

                      {/* Grid de campos del formulario */}
                      <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Nombre del Análisis"
                            name="nombre"
                            value={newAnalisisData.nombre}
                            onChange={handleNewAnalisisChange}
                            required
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <DescriptionIcon sx={{ color: '#39A900' }} />
                                </InputAdornment>
                              ),
                            }}
                            sx={{ 
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                bgcolor: 'white',
                                border: '2px solid transparent',
                                '&:hover': {
                                  borderColor: 'rgba(57, 169, 0, 0.3)',
                                },
                                '&.Mui-focused': {
                                  borderColor: '#39A900',
                                  boxShadow: '0 0 0 3px rgba(57, 169, 0, 0.1)'
                                }
                              }
                            }}
                          />
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Método de Análisis"
                            name="metodo"
                            value={newAnalisisData.metodo}
                            onChange={handleNewAnalisisChange}
                            required
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <TuneIcon sx={{ color: '#39A900' }} />
                                </InputAdornment>
                              ),
                            }}
                            sx={{ 
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                bgcolor: 'white',
                                border: '2px solid transparent',
                                '&:hover': {
                                  borderColor: 'rgba(57, 169, 0, 0.3)',
                                },
                                '&.Mui-focused': {
                                  borderColor: '#39A900',
                                  boxShadow: '0 0 0 3px rgba(57, 169, 0, 0.1)'
                                }
                              }
                            }}
                          />
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Unidad de Medida"
                            name="unidad"
                            value={newAnalisisData.unidad}
                            onChange={handleNewAnalisisChange}
                            required
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <StraightenIcon sx={{ color: '#39A900' }} />
                                </InputAdornment>
                              ),
                            }}
                            sx={{ 
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                bgcolor: 'white',
                                border: '2px solid transparent',
                                '&:hover': {
                                  borderColor: 'rgba(57, 169, 0, 0.3)',
                                },
                                '&.Mui-focused': {
                                  borderColor: '#39A900',
                                  boxShadow: '0 0 0 3px rgba(57, 169, 0, 0.1)'
                                }
                              }
                            }}
                          />
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Rango de Valores"
                            name="rango"
                            value={newAnalisisData.rango}
                            onChange={handleNewAnalisisChange}
                            required
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <CalculateIcon sx={{ color: '#39A900' }} />
                                </InputAdornment>
                              ),
                            }}
                            sx={{ 
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                bgcolor: 'white',
                                border: '2px solid transparent',
                                '&:hover': {
                                  borderColor: 'rgba(57, 169, 0, 0.3)',
                                },
                                '&.Mui-focused': {
                                  borderColor: '#39A900',
                                  boxShadow: '0 0 0 3px rgba(57, 169, 0, 0.1)'
                                }
                              }
                            }}
                          />
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <TextField
                            fullWidth
                            label="Precio (ej: 35500 o 35.500)"
                            name="precio"
                            value={newAnalisisData.precio}
                            onChange={handleNewAnalisisChange}
                            required
                            placeholder="Ejemplo: 35500"
                            inputProps={{
                              inputMode: 'numeric',
                              pattern: '[0-9.]*'
                            }}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  <RequestQuoteIcon sx={{ color: '#39A900' }} />
                                </InputAdornment>
                              ),
                            }}
                            sx={{ 
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                                bgcolor: 'white',
                                border: '2px solid transparent',
                                '&:hover': {
                                  borderColor: 'rgba(57, 169, 0, 0.3)',
                                },
                                '&.Mui-focused': {
                                  borderColor: '#39A900',
                                  boxShadow: '0 0 0 3px rgba(57, 169, 0, 0.1)'
                                }
                              }
                            }}
                          />
                        </Grid>

                        <Grid item xs={12} md={6}>
                          <FormControl fullWidth>
                            <InputLabel>Tipo de Análisis</InputLabel>
                            <Select
                              name="tipo"
                              value={newAnalisisData.tipo}
                              onChange={handleNewAnalisisChange}
                              label="Tipo de Análisis"
                              required
                              startAdornment={
                                <InputAdornment position="start">
                                  <TuneIcon sx={{ color: '#39A900', ml: 1 }} />
                                </InputAdornment>
                              }
                              sx={{ 
                                borderRadius: '12px',
                                bgcolor: 'white',
                                '& .MuiOutlinedInput-notchedOutline': {
                                  border: '2px solid transparent'
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                  borderColor: 'rgba(57, 169, 0, 0.3)'
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                  borderColor: '#39A900',
                                  boxShadow: '0 0 0 3px rgba(57, 169, 0, 0.1)'
                                }
                              }}
                            >
                              {TIPOS_ANALISIS.map(opt => (
                                <MenuItem key={opt} value={opt}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {opt === 'Fisicoquímico' ? (
                                      <OpacityIcon sx={{ color: '#2196f3', fontSize: '1.2rem' }} />
                                    ) : (
                                      <NatureIcon sx={{ color: '#9c27b0', fontSize: '1.2rem' }} />
                                    )}
                                    {opt}
                                  </Box>
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={newAnalisisData.activo}
                                onChange={e =>
                                  setNewAnalisisData(prev => ({ ...prev, activo: e.target.checked }))
                                }
                                sx={{
                                  '& .MuiSwitch-switchBase.Mui-checked': {
                                    color: '#4caf50',
                                    '& + .MuiSwitch-track': {
                                      backgroundColor: '#4caf50',
                                    },
                                  },
                                  '& .MuiSwitch-track': {
                                    backgroundColor: '#f44336',
                                  }
                                }}
                              />
                            }
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CheckIcon sx={{ 
                                  color: newAnalisisData.activo ? '#4caf50' : '#f44336',
                                  fontSize: '1.2rem'
                                }} />
                                <Typography sx={{ 
                                  fontWeight: 600,
                                  color: newAnalisisData.activo ? '#4caf50' : '#f44336'
                                }}>
                                  {newAnalisisData.activo ? 'Análisis Activo' : 'Análisis Inactivo'}
                                </Typography>
                              </Box>
                            }
                            sx={{ 
                              ml: 0,
                              p: 2,
                              borderRadius: '12px',
                              bgcolor: newAnalisisData.activo 
                                ? 'rgba(76, 175, 80, 0.05)' 
                                : 'rgba(244, 67, 54, 0.05)',
                              border: `2px solid ${newAnalisisData.activo ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)'}`,
                              transition: 'all 0.3s ease'
                            }}
                          />
                        </Grid>
                      </Grid>                      {/* Alertas de error/éxito modernizadas */}
                      {analisisError && (
                        <Alert 
                          severity="error" 
                          sx={{ 
                            mb: 3, 
                            borderRadius: '16px', 
                            border: '2px solid #f44336',
                            bgcolor: 'rgba(244, 67, 54, 0.1)',
                            backdropFilter: 'blur(10px)',
                            boxShadow: '0 6px 20px rgba(244, 67, 54, 0.2)',
                            animation: 'shake 0.5s ease-in-out',
                            position: 'relative',
                            overflow: 'hidden',
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '4px',
                              height: '100%',
                              bgcolor: '#f44336',
                              borderRadius: '2px 0 0 2px'
                            },
                            '& .MuiAlert-icon': {
                              fontSize: '1.6rem',
                              color: '#f44336'
                            },
                            '& .MuiAlert-message': {
                              fontWeight: 500,
                              fontSize: '0.95rem',
                              color: '#d32f2f'
                            }
                          }}
                          icon={<ErrorIcon sx={{ fontSize: '1.6rem' }} />}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#d32f2f' }}>
                            ❌ {analisisError}
                          </Typography>
                        </Alert>
                      )}
                      
                      {analisisSuccess && (
                        <Alert 
                          severity="success" 
                          sx={{ 
                            mb: 3, 
                            borderRadius: '16px', 
                            border: '2px solid #4caf50',
                            bgcolor: 'rgba(76, 175, 80, 0.1)',
                            backdropFilter: 'blur(10px)',
                            boxShadow: '0 8px 25px rgba(76, 175, 80, 0.2)',
                            animation: 'celebrateSuccess 1s ease-in-out',
                            position: 'relative',
                            overflow: 'hidden',
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '4px',
                              height: '100%',
                              bgcolor: '#4caf50',
                              borderRadius: '2px 0 0 2px'
                            },
                            '&::after': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              right: -20,
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              bgcolor: 'rgba(76, 175, 80, 0.1)',
                              animation: 'float 2s ease-in-out infinite'
                            },
                            '& .MuiAlert-icon': {
                              fontSize: '1.6rem',
                              color: '#4caf50'
                            },
                            '& .MuiAlert-message': {
                              fontWeight: 500,
                              fontSize: '0.95rem',
                              color: '#2e7d32'
                            }
                          }}
                          icon={<CheckCircleIcon sx={{ fontSize: '1.6rem' }} />}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, position: 'relative', zIndex: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                              ✅ {analisisSuccess}
                            </Typography>
                            <CelebrationIcon 
                              sx={{ 
                                color: '#4caf50', 
                                fontSize: 18,
                                animation: 'bounce 0.8s ease-in-out' 
                              }} 
                            />
                          </Box>
                        </Alert>
                      )}

                      {/* Botones de acción modernizados */}
                      <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                        <Button
                          variant="contained"
                          fullWidth
                          onClick={editingAnalisis ? handleUpdateAnalisis : handleCreateAnalisis}
                          disabled={registrando}
                          startIcon={registrando ? null : editingAnalisis ? <EditIcon /> : <PlaylistAddIcon />}
                          sx={{
                            py: 2,
                            borderRadius: '16px',
                            fontSize: '1rem',
                            fontWeight: 700,
                            textTransform: 'none',
                            background: registrando 
                              ? 'linear-gradient(135deg, #81c784 0%, #a5d6a7 100%)' 
                              : editingAnalisis
                                ? 'linear-gradient(135deg, #ff9800 0%, #f57c00 50%, #e65100 100%)'
                                : 'linear-gradient(135deg, #39A900 0%, #4caf50 50%, #2e7d32 100%)',
                            color: 'white',
                            boxShadow: registrando 
                              ? '0 4px 15px rgba(129, 199, 132, 0.3)' 
                              : editingAnalisis
                                ? '0 6px 20px rgba(255, 152, 0, 0.4)'
                                : '0 6px 20px rgba(57, 169, 0, 0.4)',
                            border: '2px solid transparent',
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
                            },
                            '&::after': {
                              content: editingAnalisis ? '"📝"' : '"✨"',
                              position: 'absolute',
                              top: -8,
                              right: -8,
                              fontSize: '16px',
                              opacity: registrando ? 0 : 0,
                              transition: 'opacity 0.3s ease'
                            },
                            '&:hover': !registrando ? { 
                              background: editingAnalisis
                                ? 'linear-gradient(135deg, #f57c00 0%, #e65100 50%, #bf360c 100%)'
                                : 'linear-gradient(135deg, #2e7d32 0%, #388e3c 50%, #1b5e20 100%)',
                              transform: 'translateY(-3px) scale(1.02)', 
                              boxShadow: editingAnalisis
                                ? '0 10px 30px rgba(255, 152, 0, 0.5)'
                                : '0 10px 30px rgba(57, 169, 0, 0.5)',
                              '&::after': {
                                opacity: 1
                              },
                              '& .MuiSvgIcon-root': {
                                transform: editingAnalisis ? 'rotate(15deg) scale(1.1)' : 'scale(1.2)'
                              }
                            } : {},
                            '&:active': !registrando ? {
                              transform: 'translateY(-1px) scale(0.98)'
                            } : {},
                            '&:disabled': {
                              color: 'white',
                              cursor: 'progress'
                            },
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '& .MuiSvgIcon-root': {
                              transition: 'transform 0.3s ease'
                            }
                          }}
                        >
                          {registrando ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <CircularProgress size={20} sx={{ color: 'white' }} />
                              <span>{editingAnalisis ? 'Actualizando...' : 'Creando...'}</span>
                            </Box>
                          ) : editingAnalisis ? (
                            'Actualizar Análisis'
                          ) : (
                            'Crear Análisis'
                          )}
                        </Button>
                        
                        <Button
                          variant="outlined"
                          fullWidth
                          onClick={handleCancelForm}
                          startIcon={<CancelIcon />}
                          sx={{
                            borderRadius: '16px',
                            py: 2,
                            fontSize: '1rem',
                            fontWeight: 600,
                            textTransform: 'none',
                            borderColor: editingAnalisis ? '#ff9800' : '#39A900',
                            color: editingAnalisis ? '#ff9800' : '#39A900',
                            borderWidth: '2px',
                            background: editingAnalisis 
                              ? 'rgba(255, 152, 0, 0.05)' 
                              : 'rgba(57, 169, 0, 0.05)',
                            backdropFilter: 'blur(10px)',
                            boxShadow: editingAnalisis
                              ? '0 4px 15px rgba(255, 152, 0, 0.1)'
                              : '0 4px 15px rgba(57, 169, 0, 0.1)',
                            position: 'relative',
                            overflow: 'hidden',
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: '-100%',
                              width: '100%',
                              height: '100%',
                              background: editingAnalisis
                                ? 'linear-gradient(90deg, transparent, rgba(255, 152, 0, 0.1), transparent)'
                                : 'linear-gradient(90deg, transparent, rgba(57, 169, 0, 0.1), transparent)',
                              transition: 'left 0.5s ease'
                            },
                            '&:hover': {
                              borderColor: editingAnalisis ? '#f57c00' : '#2d8600',
                              color: editingAnalisis ? '#f57c00' : '#2d8600',
                              bgcolor: editingAnalisis 
                                ? 'rgba(255, 152, 0, 0.1)' 
                                : 'rgba(57, 169, 0, 0.1)',
                              transform: 'translateY(-3px) scale(1.02)',
                              boxShadow: editingAnalisis
                                ? '0 8px 25px rgba(255, 152, 0, 0.2)'
                                : '0 8px 25px rgba(57, 169, 0, 0.2)',
                              '&::before': {
                                left: '100%'
                              },
                              '& .MuiSvgIcon-root': {
                                transform: 'rotate(90deg) scale(1.1)'
                              }
                            },
                            '&:active': {
                              transform: 'translateY(-1px) scale(0.98)'
                            },
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '& .MuiSvgIcon-root': {
                              transition: 'transform 0.3s ease'
                            }
                          }}
                        >
                          Cancelar
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Fade>              )}

              {/* Botón de cerrar del modal cuando no se muestra el formulario */}
              {!showAnalisisForm && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Button
                    variant="outlined"
                    onClick={handleCloseAnalisisModal}
                    startIcon={<ArrowBackIcon />}
                    sx={{
                      px: 4,
                      py: 1.5,
                      borderRadius: '16px',
                      borderColor: '#39A900',
                      color: '#39A900',
                      borderWidth: '2px',
                      fontWeight: 600,
                      textTransform: 'none',
                      background: 'rgba(57, 169, 0, 0.05)',
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 4px 15px rgba(57, 169, 0, 0.1)',
                      '&:hover': {
                        borderColor: '#2d8600',
                        color: '#2d8600',
                        bgcolor: 'rgba(57, 169, 0, 0.1)',
                        transform: 'translateY(-3px) scale(1.05)',
                        boxShadow: '0 8px 25px rgba(57, 169, 0, 0.2)',
                      },
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                  >
                    Cerrar Modal
                  </Button>                </Box>
              )}
            </Box>
          </Box>
        </Fade>
      </Modal>

      {/* Modal de éxito */}
      <Modal
        open={showSuccessModal}
        onClose={handleSuccessModalClose}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 500,
            sx: { 
              bgcolor: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(8px)'
            }
          }
        }}
      >
        <Fade in={showSuccessModal}>
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '90%', sm: 450 },
            bgcolor: 'white',
            borderRadius: 4,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            p: 0,
            overflow: 'hidden',
            border: '1px solid rgba(57, 169, 0, 0.2)'          }}>
            {/* Header del modal */}
            <Box sx={{
              background: 'linear-gradient(135deg, #39A900 0%, #2e7d32 100%)',
              color: 'white',
              p: 3,
              textAlign: 'center',
              position: 'relative',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'url("data:image/svg+xml,%3Csvg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="3" cy="3" r="3"/%3E%3C/g%3E%3C/svg%3E")',
                opacity: 0.3
              }
            }}>
              <Box sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
                animation: 'bounceIn 0.8s ease-out'
              }}>
                <CheckCircleIcon sx={{ fontSize: '3rem', color: 'white' }} />
              </Box>
              <Typography variant="h5" sx={{ 
                fontWeight: 700, 
                mb: 1,
                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
              }}>
                ¡Registro Exitoso!
              </Typography>
              <Typography variant="body2" sx={{ 
                opacity: 0.9,
                fontSize: '1rem'
              }}>
                {success}
              </Typography>            </Box>

            {/* Contenido del modal */}
            <Box sx={{p: 3, textAlign: 'center' }}>
              <Typography variant="body1" sx={{ 
                color: '#2e7d32', 
                mb: 3,
                fontSize: '1.1rem',
                fontWeight: 500
              }}>
                La muestra ha sido procesada correctamente y está disponible en el sistema.
              </Typography>
              
              <Button
                onClick={handleSuccessModalClose}
                variant="contained"
                size="large"
                startIcon={<CheckIcon />}
                sx={{
                  bgcolor: '#39A900',
                  color: 'white',
                  borderRadius: 3,
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: '0 8px 25px rgba(57, 169, 0, 0.3)',
                  '&:hover': {
                    bgcolor: '#2e7d32',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 35px rgba(57, 169, 0, 0.4)',
                  },
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                Ir a Muestras
              </Button>
            </Box>
          </Box>
        </Fade>
      </Modal>
    </Box>
  );
};

export default RegistroMuestras;