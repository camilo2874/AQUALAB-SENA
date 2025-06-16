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
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import BadgeIcon from '@mui/icons-material/Badge';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import SignatureCanvas from 'react-signature-canvas';
import SignaturePad from '../components/SignaturePad';
import FirmasDigitales from '../components/FirmasDigitales';
import { muestrasService } from '../services/muestras.service';
import { SelectChangeEvent } from '@mui/material/Select';
import { Theme } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
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
  password: string;
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
  password: '',
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
  const [observacionRechazo, setObservacionRechazo] = useState<string>('');
  const [openClienteModal, setOpenClienteModal] = useState<boolean>(false);
  const [openAnalisisModal, setOpenAnalisisModal] = useState<boolean>(false);
  const [clienteData, setClienteData] = useState<ClienteData>(initialClienteData);
  const [newAnalisisData, setNewAnalisisData] = useState<NewAnalisisData>(initialNewAnalisisData);
  const [registroError, setRegistroError] = useState<string | null>(null);
  const [registroExito, setRegistroExito] = useState<string | null>(null);
  const [registrando, setRegistrando] = useState<boolean>(false);
  const [analisisDisponibles, setAnalisisDisponibles] = useState<AnalisisDisponibles | null>(null);
  const [allAnalisis, setAllAnalisis] = useState<AnalisisCategoria[]>([]);
  const [pagination, setPagination] = useState<PaginationState>(initialPaginationState);
  const [analisisCache, setAnalisisCache] = useState<AnalisisCache>({});
  const [loadingAnalisis, setLoadingAnalisis] = useState(false);
  const [analisisError, setAnalisisError] = useState<string | null>(null);
  const [analisisSuccess, setAnalisisSuccess] = useState<string | null>(null);
  const [editingAnalisis, setEditingAnalisis] = useState<AnalisisCategoria | null>(null);  const [showAnalisisForm, setShowAnalisisForm] = useState<boolean>(false);  const firmaAdministradorRef = useRef<SignatureCanvas | null>(null);
  const firmaClienteRef = useRef<SignatureCanvas | null>(null);
  const analisisFormRef = useRef<HTMLDivElement | null>(null);
  const analisisModalRef = useRef<HTMLDivElement | null>(null);
  const debouncedDocumento = useDebouncedValue(formData.documento, 400);

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
  }, [openAnalisisModal]);

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
  };

  const handleChange = useCallback(
    (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent,
    ) => {
      const { name, value } = e.target as HTMLInputElement;
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
          tipoDeAgua: { ...prev.tipoDeAgua, descripcion: value },
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
        setFormData(prev => ({ ...prev, [name]: value }));
      }
      setError(null);
    },
    [],
  );

  const handleValidateUser = useCallback(async () => {
    if (!formData.documento) {
      setUserValidationError('Por favor ingrese el documento.');
      return;
    }
    setValidatingUser(true);
    setUserValidationError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await axiosInstance.get(`${API_URLS.USUARIOS}/buscar`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { documento: formData.documento },
      });
      if (response.data && response.data.documento) {
        setClienteEncontrado(response.data);
        setSuccess('Cliente encontrado exitosamente');
      } else {
        setUserValidationError('Usuario no encontrado.');
        setClienteEncontrado(null);
      }
    } catch (err: any) {
      console.error('Error al validar usuario:', err);
      setUserValidationError('Usuario no encontrado.');
      setClienteEncontrado(null);
    } finally {
      setValidatingUser(false);
    }
  }, [formData.documento]);

  const handlePageChange = useCallback((_: React.ChangeEvent<unknown>, value: number) => {
    setPagination(prev => ({ ...prev, page: value }));
  }, []);
  // Eliminar logs innecesarios en producción
  useEffect(() => {
    if (import.meta.env.MODE === 'production') {
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
      });
  
      // Mostrar mensaje de éxito y redirigir
      setSuccess('Muestra enviada a cotización exitosamente');
      setTimeout(() => navigate('/muestras'), 2000);
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
  };const handleShowCreateForm = () => {
    setShowAnalisisForm(true);
    setEditingAnalisis(null);
    setNewAnalisisData(initialNewAnalisisData);
    setAnalisisError(null);
    setAnalisisSuccess(null);
    // Scroll automático al formulario después de que termine la animación
    setTimeout(() => {
      analisisFormRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }, 500);
  };
  const handleShowEditForm = (analisis: AnalisisCategoria) => {
    setEditingAnalisis(analisis);    setNewAnalisisData({
      nombre: analisis.nombre,
      metodo: analisis.metodo || '',
      unidad: analisis.unidad,
      rango: analisis.rango || '',
      precio: analisis.precio?.toString().replace(/[,.]/g, '') || '',
      matriz: analisis.matriz || ['AP', 'AS'],
      tipo: (analisis.tipo === 'Fisicoquímico' || analisis.tipo === 'Microbiológico') ? analisis.tipo : '',
      activo: analisis.activo,
    });setShowAnalisisForm(true);
    setAnalisisError(null);
    setAnalisisSuccess(null);
    // Scroll automático al formulario después de que termine la animación
    setTimeout(() => {
      analisisFormRef.current?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }, 500);
  };

  const handleCancelForm = () => {
    setShowAnalisisForm(false);
    setEditingAnalisis(null);
    setNewAnalisisData(initialNewAnalisisData);
    setAnalisisError(null);
    setAnalisisSuccess(null);
  };

  const handleNewAnalisisChange = (
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
        });
        setSuccess('Muestra rechazada exitosamente');
        setTimeout(() => navigate('/muestras'), 2000);
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
        });
        setSuccess('Muestra actualizada exitosamente');
      } else {
        await axios.post(API_URLS.MUESTRAS, muestraData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
        });
        setSuccess('Muestra registrada exitosamente');
      }
      if (!isUpdating) limpiarEstado();
      setTimeout(() => navigate('/muestras'), 2000);
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

  const volverAlFormulario = () => setMostrarFirmas(false);

  const handleAnalisisChange = (analisis: string) => {
    setFormData(prev => {
      const nuevos = prev.analisisSeleccionados.includes(analisis)
        ? prev.analisisSeleccionados.filter(a => a !== analisis)
        : [...prev.analisisSeleccionados, analisis];
      return { ...prev, analisisSeleccionados: nuevos };
    });
  };

  const handleOpenClienteModal = () => setOpenClienteModal(true);
  const handleCloseClienteModal = () => {
    setOpenClienteModal(false);
    setClienteData(initialClienteData);
    setRegistroError(null);
    setRegistroExito(null);
  };

  const handleClienteChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setClienteData(prev => ({ ...prev, [name]: value }));
    setRegistroError(null);
  };

  const handleRegistrarCliente = async () => {
    const camposReq: Record<string, string> = {
      nombre: 'Nombre',
      documento: 'Documento',
      email: 'Email',
      password: 'Contraseña',
    };
    const faltantes = Object.entries(camposReq)
      .filter(([k]) => !clienteData[k as keyof ClienteData])
      .map(([, v]) => v);
    if (faltantes.length) {
      setRegistroError(`Faltan: ${faltantes.join(', ')}`);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clienteData.email)) {
      setRegistroError('Email inválido');
      return;
    }
    setRegistrando(true);
    try {
      const token = localStorage.getItem('token');
      const newData = {
        ...clienteData,
        tipo: 'cliente',
        telefono: clienteData.telefono || '',
        direccion: clienteData.direccion || '',
        razonSocial: clienteData.razonSocial || '',
      };
      const response = await axios.post(
        `${API_URLS.USUARIOS}/registro`,
        newData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } },
      );
      setRegistroExito('Cliente registrado correctamente');
      setFormData(prev => ({ ...prev, documento: newData.documento }));
      setTimeout(() => {
        handleCloseClienteModal();
        handleValidateUser();
      }, 2000);
    } catch (err: any) {
      console.error('Error registrar cliente:', err);
      setRegistroError(err.response?.data?.message || err.message);
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
  }, [formData.analisisSeleccionados, analisisDisponibles, formData.tipoAnalisis]);

  const renderAnalisisDisponibles = () => {
    if (!formData.tipoAnalisis) {
      return <Alert severity="info" sx={{ borderRadius: 2, boxShadow: 1 }}>Seleccione un tipo de análisis</Alert>;
    }
    if (loadingAnalisis) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4, gap: 2, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 1 }}>
          <CircularProgress />
          <Typography variant="body2">Cargando análisis disponibles...</Typography>
        </Box>
      );
    }
    if (error) {
      return <Alert severity="error" sx={{ borderRadius: 2, boxShadow: 1 }}>{error}</Alert>;
    }
    const arr = formData.tipoAnalisis === TIPOS_ANALISIS_ENUM.FISICOQUIMICO
      ? analisisDisponibles?.fisicoquimico || []
      : analisisDisponibles?.microbiologico || [];
    if (!arr.length) {
      return <Alert severity="info" sx={{ borderRadius: 2, boxShadow: 1 }}>No hay análisis disponibles para {formData.tipoAnalisis}</Alert>;
    }
    return (
      <Accordion defaultExpanded sx={{ borderRadius: 2, boxShadow: 2, '&:before': { display: 'none' } }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: '#39A900', color: 'white', borderRadius: '8px 8px 0 0' }}>
          <Typography variant="h6">
            {formData.tipoAnalisis} ({formData.analisisSeleccionados.length} seleccionados)
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {arr.map(a => (
              <Grid item xs={12} sm={6} key={a._id || a.nombre}>
                <Card sx={{ p: 2, borderRadius: 2, boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.analisisSeleccionados.includes(a.nombre)}
                        onChange={() => handleAnalisisChange(a.nombre)}
                        color="primary"
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold" color="#39A900">{a.nombre}</Typography>
                        <Typography variant="body2" color="text.secondary">Unidad: {a.unidad || 'N/A'}</Typography>
                        {a.metodo && <Typography variant="body2" color="text.secondary">Método: {a.metodo}</Typography>}
                        {a.rango && <Typography variant="body2" color="text.secondary">Rango: {a.rango}</Typography>}
                        {a.precio != null && (
                          <Typography variant="body2" fontWeight="bold" color="success.main">
                            Precio: ${a.precio}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </Card>
              </Grid>
            ))}
          </Grid>
          {formData.analisisSeleccionados.length > 0 && (
            <Card sx={{ mt: 3, p: 3, bgcolor: '#d7f7dd', color: '#39A900', borderRadius: 2, boxShadow: 2 }}>
              <Typography variant="h6" fontWeight="bold">Resumen de Análisis</Typography>
              <Typography variant="body1">Cantidad: {formData.analisisSeleccionados.length}</Typography>
              <Typography variant="h5" fontWeight="bold">
                Total: ${totalSeleccionados.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
              </Typography>
            </Card>
          )}
        </AccordionDetails>
      </Accordion>
    );
  };

  return (
    <Box sx={{ position: 'relative' }}>
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
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#39A900', mb: 3 }}>
          {isUpdating ? 'Actualizar Muestra' : 'Registro de Muestra'}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2, boxShadow: 1, transition: 'all 0.3s' }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 3, borderRadius: 2, boxShadow: 1, transition: 'all 0.3s' }}>
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit} autoComplete="off">
          {/* Sección: Validación de Cliente */}
          <Box sx={{ mb: 3}}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'medium', color: 'text.primary' }}>
              Validación de Cliente
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <TextField
                fullWidth
                label="Número de Documento"
                name="documento"
                value={formData.documento}
                onChange={handleChange}
                required
                variant="outlined"
                sx={{ bgcolor: 'white', borderRadius: 2 }}
              />
              <Button
                variant="contained"
                onClick={handleValidateUser}
                sx={{
                  height: '56px',
                  borderRadius: 2,
                  px: 3,
                  bgcolor: '#39A900',
                  '&:hover': { bgcolor: '#2d8600', transform: 'translateY(-2px)', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' },
                }}
                disabled={validatingUser || !formData.documento}
              >
                {validatingUser ? <CircularProgress size={24} /> : 'Validar'}
              </Button>
              {userValidationError && (
                <Button
                  variant="outlined"
                  onClick={handleOpenClienteModal}
                  sx={{
                    height: '56px',
                    borderRadius: 2,
                    px: 3,
                    borderColor: '#39A900',
                    color: '#39A900',
                    '&:hover': { borderColor: '#2d8600', color: '#2d8600', transform: 'translateY(-2px)', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' },
                  }}
                >
                  Registrar Cliente
                </Button>
              )}
            </Box>

            {userValidationError && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: 2, boxShadow: 1 }}>
                {userValidationError}
              </Alert>
            )}
            {clienteEncontrado && (
              <Card sx={{ p: 3, mb: 2, borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', bgcolor: '#d7f7dd' }}>
                <CardContent>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, color: '#39A900' }}>
                    Cliente Validado
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PersonIcon sx={{ mr: 1, color: '#39A900' }} />
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      Nombre: {clienteEncontrado.nombre || clienteEncontrado.razonSocial}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <BadgeIcon sx={{ mr: 1, color: '#39A900' }} />
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      Documento: {clienteEncontrado.documento}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <EmailIcon sx={{ mr: 1, color: '#39A900' }} />
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      Correo: {clienteEncontrado.email}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            )}
          </Box>

          <Divider sx={{ my: 1, borderColor: 'grey.300' }} />

          {/* Sección: Detalles de la Muestra */}
          <Box sx={{ mb: 3}}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 'medium', color: 'text.primary' }}>
              Detalles de la Muestra
            </Typography>

            <Grid container spacing={2} sx={{ mb: 2 }}>
  <Grid item xs={12} sm={6}>
    {/* Tipo de Agua */}
    <FormControl fullWidth sx={{ mb: 2 }}>
      <InputLabel>Tipo de Agua</InputLabel>
      <Select
        name="tipoAgua"
        value={formData.tipoDeAgua.tipo}
        onChange={handleChange}
        label="Tipo de Agua"
        variant="outlined"
        size="small"
        sx={{ bgcolor: 'white', borderRadius: 2 }}
      >
        {TIPOS_AGUA.map(tipo => (
          <MenuItem key={tipo} value={tipo}>
            {tipo === 'residual' ? 'Residual' : tipo.charAt(0).toUpperCase() + tipo.slice(1)} ({getTipoAguaCodigo(tipo)})
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  </Grid>
  <Grid item xs={12} sm={6}>
    {/* Tipo de Muestreo */}
    <FormControl fullWidth sx={{ mb: 2 }}>
      <InputLabel>Tipo de Muestreo</InputLabel>
      <Select
        name="tipoMuestreo"
        value={formData.tipoMuestreo}
        onChange={handleChange}
        label="Tipo de Muestreo"
        required
        size="small"
        sx={{ bgcolor: 'white', borderRadius: 2 }}
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
              sx={{ mb: 3, bgcolor: 'white', borderRadius: 2 }}
              multiline
              rows={3}
            />
          </Box>
          <Divider sx={{ my: 1, borderColor: 'grey.300' }} />

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
      color="error"
      onClick={handleOpenRechazoModal}
      sx={{
        borderRadius: 2,
        px: 3,
        transition: 'all 0.2s',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' },
      }}
    >
      Rechazar Muestra
    </Button>
    <Button
      variant="contained"
      color="primary"
      onClick={() => handleCotizacion()} // Función que crearemos en el siguiente paso
      sx={{
        borderRadius: 2,
        px: 3,
        transition: 'all 0.2s',
        bgcolor: '#39A900',
        '&:hover': { bgcolor: '#2d8600', transform: 'translateY(-2px)', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' },
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
              </Card>
              <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  onClick={volverAlFormulario}
                  sx={{
                    flex: 1,
                    borderRadius: 2,
                    borderColor: '#39A900',
                    color: '#39A900',
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: '#2d8600', color: '#2d8600', transform: 'translateY(-2px)', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' },
                  }}
                >
                  Volver al Formulario
                </Button>
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleRegistrarOtra}
                  sx={{
                    flex: 1,
                    borderRadius: 2,
                    bgcolor: '#39A900',
                    '&:hover': { bgcolor: '#2d8600', transform: 'translateY(-2px)', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' },
                  }}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Registrar y Agregar Otra'}
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  sx={{
                    flex: 1,


                    borderRadius: 2,
                    bgcolor: '#39A900',
                    '&:hover': { bgcolor: '#2d8600', transform: 'translateY(-2px)', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' },
                  }}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Registrar Muestra Final'}
                </Button>
              </Box>
            </Box>
          ) : (
            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                mt: 3,
                py: 1.5,
                borderRadius: 2,
                bgcolor: '#39A900',
                '&:hover': { bgcolor: '#2d8600', transform: 'translateY(-2px)', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' },
              }}
            >
              {isRejected ? 'Registrar Muestra Rechazada' : 'Continuar con Firmas'}
            </Button>
          )}
        </form>
      </Paper>      {/* Botón para Gestionar Análisis */}
      <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>        <Fab
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
          }}
        >
          <AddIcon sx={{ fontSize: 32 }} />
        </Fab>
      </Box>

      {/* Modal Registrar Cliente */}
      <Modal
        open={openClienteModal}
        onClose={handleCloseClienteModal}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{ backdrop: { timeout: 500 } }}
      >
        <Fade in={openClienteModal}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 400,
              bgcolor: 'background.paper',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              p: 4,
              borderRadius: 3,
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#39A900', mb: 3 }}>
              Registrar Cliente
            </Typography>
            <TextField
              fullWidth
              label="Nombre Completo"
              name="nombre"
              value={clienteData.nombre}
              onChange={handleClienteChange}
              required
              sx={{ mb: 3, bgcolor: 'white', borderRadius: 2 }}
            />
            <TextField
              fullWidth
              label="Documento"
              name="documento"
              value={clienteData.documento}
              onChange={handleClienteChange}
              required
              sx={{ mb: 3, bgcolor: 'white', borderRadius: 2 }}
            />
            <TextField
              fullWidth
              label="Teléfono"
              name="telefono"
              value={clienteData.telefono}
              onChange={handleClienteChange}
              sx={{ mb: 3, bgcolor: 'white', borderRadius: 2 }}
            />
            <TextField
              fullWidth
              label="Email"
              name="email"
              value={clienteData.email}
              onChange={handleClienteChange}
              required
              sx={{ mb: 3, bgcolor: 'white', borderRadius: 2 }}
            />
            <TextField
              fullWidth
              label="Contraseña"
              name="password"
              type="password"
              value={clienteData.password}
              onChange={handleClienteChange}
              required
              sx={{ mb: 3, bgcolor: 'white', borderRadius: 2 }}
            />
            <TextField
              fullWidth
              label="Razón Social"
              name="razonSocial"
              value={clienteData.razonSocial}
              onChange={handleClienteChange}
              sx={{ mb: 3, bgcolor: 'white', borderRadius: 2 }}
            />
            <Button
              variant="contained"
              fullWidth
              onClick={handleRegistrarCliente}
              disabled={registrando}
              sx={{
                py: 1.5,
                borderRadius: 2,
                bgcolor: '#39A900',
                '&:hover': { bgcolor: '#2d8600', transform: 'translateY(-2px)', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' },
              }}
            >
              {registrando ? <CircularProgress size={24} /> : 'Registrar Cliente'}
            </Button>
            {registroError && (
              <Alert severity="error" sx={{ mt: 2, borderRadius: 2, boxShadow: 1 }}>
                {registroError}
              </Alert>
            )}
            {registroExito && (
              <Alert severity="success" sx={{ mt: 2, borderRadius: 2, boxShadow: 1 }}>
                {registroExito}
              </Alert>
            )}
          </Box>
        </Fade>
      </Modal>

      {/* Modal Rechazo */}
      <Modal
        open={openRechazoModal}
        onClose={() => setOpenRechazoModal(false)}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{ backdrop: { timeout: 500 } }}
      >
        <Fade in={openRechazoModal}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 400,
              bgcolor: 'background.paper',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              p: 4,
              borderRadius: 3,
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', color: '#39A900', mb: 3 }}>
              Rechazar Muestra
            </Typography>
            <TextField
              fullWidth
              label="Observación de rechazo"
              name="observacionRechazo"
              value={observacionRechazo}
              onChange={e => setObservacionRechazo(e.target.value)}
              multiline
              rows={4}
              required
              sx={{ mb: 3, bgcolor: 'white', borderRadius: 2 }}
            />
            <Button
              variant="contained"
              color="error"
              fullWidth
              onClick={handleConfirmarRechazo}
              sx={{
                py: 1.5,
                borderRadius: 2,
                transition: 'all 0.2s',
                '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' },
              }}
            >
              Confirmar Rechazo
            </Button>
          </Box>
        </Fade>
      </Modal>      {/* Modal Gestionar Análisis */}
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
        slotProps={{ backdrop: { timeout: 500 } }}
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
        maxWidth: 1200,
        bgcolor: 'background.paper',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        p: 4,
        borderRadius: 3,
        maxHeight: '90vh',
        overflowY: 'auto',
        outline: 'none',
      }}
    >
      {/* Header con título y botón cerrar */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 'bold', color: '#39A900' }}
        >
          Gestionar Análisis
        </Typography>
        <IconButton
          onClick={handleCloseAnalisisModal}
          sx={{
            color: '#666',
            '&:hover': {
              color: '#e74c3c',
              bgcolor: 'rgba(231, 76, 60, 0.1)',
              transform: 'scale(1.1)',
            },
            transition: 'all 0.2s',
          }}
        >
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Lista de Análisis */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" sx={{ color: '#39A900' }}>
          Lista de Análisis
        </Typography>
        {!showAnalisisForm && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleShowCreateForm}
            sx={{
              bgcolor: '#39A900',
              '&:hover': { bgcolor: '#2d8600' },
              borderRadius: 2,
            }}
          >
            Nuevo Análisis
          </Button>
        )}
      </Box>
      
      {allAnalisis.length > 0 ? (        <TableContainer
          component={Paper}
          sx={{ mb: showAnalisisForm ? 2 : 4, borderRadius: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        >
          <Table sx={{ minWidth: 800 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: '#39A900' }}>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', minWidth: 200 }}>Nombre</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', minWidth: 120 }}>Tipo</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', minWidth: 120 }}>Unidad</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', minWidth: 100 }}>Precio</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', minWidth: 80, textAlign: 'center' }}>Activo</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 'bold', minWidth: 100, textAlign: 'center' }}>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {allAnalisis.map(analisis => {
                return (
                  <TableRow
                    key={analisis._id || analisis.nombre}
                    sx={{ '&:hover': { bgcolor: '#d7f7dd' } }}
                  >                    <TableCell sx={{ fontWeight: 500 }}>{analisis.nombre || 'N/A'}</TableCell>
                    <TableCell>
                      {analisis.tipo
                        ? analisis.tipo.charAt(0).toUpperCase() + analisis.tipo.slice(1)
                        : 'N/A'}
                    </TableCell>
                    <TableCell>{analisis.unidad || 'N/A'}</TableCell>
                    <TableCell sx={{ fontWeight: 500, color: '#39A900' }}>
                      {analisis.precio != null ? `$${analisis.precio.toLocaleString()}` : 'N/A'}
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <Switch
                        checked={analisis.activo || false}
                        onChange={() =>
                          analisis._id
                            ? handleToggleAnalisisStatus(analisis._id, analisis.activo)
                            : console.log('No _id for analysis:', analisis)
                        }
                        color="primary"
                      />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <IconButton
                        onClick={() => handleEditAnalisis(analisis)}
                        sx={{ 
                          color: '#39A900',
                          '&:hover': { 
                            bgcolor: 'rgba(57, 169, 0, 0.1)',
                            transform: 'scale(1.1)'
                          }
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        <Alert severity="info" sx={{ mb: showAnalisisForm ? 2 : 4, borderRadius: 2, boxShadow: 1 }}>
          No hay análisis disponibles
        </Alert>
      )}      {/* Formulario para Nuevo/Editar Análisis - Solo se muestra cuando es necesario */}
      {showAnalisisForm && (
        <Fade in={showAnalisisForm}>
          <Paper 
            ref={analisisFormRef}
            elevation={3} 
            sx={{ 
              p: 3, 
              borderRadius: 3, 
              bgcolor: '#f8f9fa',
              border: '2px solid #39A900',
              mb: 2
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ color: '#39A900', fontWeight: 'bold' }}>
                {editingAnalisis ? 'Editar Análisis' : 'Nuevo Análisis'}
              </Typography>
              <Button
                variant="outlined"
                onClick={handleCancelForm}
                sx={{
                  borderColor: '#39A900',
                  color: '#39A900',
                  '&:hover': { borderColor: '#2d8600', color: '#2d8600' },
                }}
              >
                Cancelar
              </Button>
            </Box>
      <TextField
        fullWidth
        label="Nombre"
        name="nombre"
        value={newAnalisisData.nombre}
        onChange={handleNewAnalisisChange}
        required
        sx={{ mb: 3, bgcolor: 'white', borderRadius: 2 }}
      />
      <TextField
        fullWidth
        label="Método"
        name="metodo"
        value={newAnalisisData.metodo}
        onChange={handleNewAnalisisChange}
        required
        sx={{ mb: 3, bgcolor: 'white', borderRadius: 2 }}
      />
      <TextField
        fullWidth
        label="Unidad"
        name="unidad"
        value={newAnalisisData.unidad}
        onChange={handleNewAnalisisChange}
        required
        sx={{ mb: 3, bgcolor: 'white', borderRadius: 2 }}
      />
      <TextField
        fullWidth
        label="Rango"
        name="rango"
        value={newAnalisisData.rango}
        onChange={handleNewAnalisisChange}
        required
        sx={{ mb: 3, bgcolor: 'white', borderRadius: 2 }}
      />      <TextField
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
        sx={{ mb: 3, bgcolor: 'white', borderRadius: 2 }}
      />
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Tipo de Análisis</InputLabel>
        <Select
          name="tipo"
          value={newAnalisisData.tipo}
          onChange={handleNewAnalisisChange}
          label="Tipo de Análisis"
          required
          sx={{ bgcolor: 'white', borderRadius: 2 }}
        >
          {TIPOS_ANALISIS.map(opt => (
            <MenuItem key={opt} value={opt}>
              {opt}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControlLabel
        control={
          <Checkbox
            checked={newAnalisisData.activo}
            onChange={e =>
              setNewAnalisisData(prev => ({ ...prev, activo: e.target.checked }))
            }
            color="primary"
          />
        }
        label="Activo"
        sx={{ mb: 3 }}
      />
      {analisisError && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2, boxShadow: 1 }}>
          {analisisError}
        </Alert>
      )}
      {analisisSuccess && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: 2, boxShadow: 1 }}>
          {analisisSuccess}
        </Alert>
      )}      <Button
        variant="contained"
        fullWidth
        onClick={editingAnalisis ? handleUpdateAnalisis : handleCreateAnalisis}
        disabled={registrando}
        sx={{
          py: 1.5,
          borderRadius: 2,
          bgcolor: '#39A900',
          '&:hover': {
            bgcolor: '#2d8600',
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          },
        }}
      >
        {registrando ? (
          <CircularProgress size={24} />
        ) : editingAnalisis ? (
          'Actualizar Análisis'
        ) : (
          'Crear Análisis'
        )}
      </Button>
      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Button
          variant="outlined"
          fullWidth
          onClick={handleCancelForm}
          sx={{
            borderRadius: 2,
            borderColor: '#39A900',
            color: '#39A900',
            '&:hover': {
              borderColor: '#2d8600',
              color: '#2d8600',
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            },
          }}
        >
          Cancelar
        </Button>
      </Box>          </Paper>
        </Fade>
      )}
      
      {/* Botón de cerrar del modal */}
      {!showAnalisisForm && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <Button
            variant="outlined"
            onClick={handleCloseAnalisisModal}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 2,
              borderColor: '#39A900',
              color: '#39A900',
              '&:hover': {
                borderColor: '#2d8600',
                color: '#2d8600',
                bgcolor: 'rgba(57, 169, 0, 0.05)',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
              },
              transition: 'all 0.2s',
            }}
          >
            Cerrar
          </Button>        </Box>
      )}        </Box>
        </Fade>
      </Modal>
    </Box>
  );
};

export default RegistroMuestras;