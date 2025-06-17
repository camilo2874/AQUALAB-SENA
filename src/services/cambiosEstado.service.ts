import axios from 'axios';
import { API_CONFIG } from '../config/api';

export type EstadoMuestra = "Recibida" | "En análisis" | "Pendiente de resultados" | "Finalizada" | "Rechazada" | "Aceptada";

export interface CambioEstado {
  id_muestra: string;
  estado: EstadoMuestra;
  cedulaLaboratorista: string;
  nombreLaboratorista: string;
  observaciones?: string;
  fechaCambio?: string;
}

class CambiosEstadoService {
  private baseUrl = `${API_CONFIG.MUESTRAS_BASE_URL}${API_CONFIG.ENDPOINTS.CAMBIOS_ESTADO}`;

  async cambiarEstado(cambioEstado: CambioEstado): Promise<any> {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${this.baseUrl}/cambiar-estado`,
        cambioEstado,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      return response.data;
    } catch (error: any) {
      console.error('Error al cambiar estado:', error);
      throw new Error(error.response?.data?.message || 'Error al cambiar el estado de la muestra');
    }
  }

  async aceptarCotizacion(idMuestra: string): Promise<any> {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${this.baseUrl}/${idMuestra}/aceptar-cotizacion`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.message);
      }

      return response.data;
    } catch (error: any) {
      console.error('Error al aceptar cotización:', error);
      throw new Error(error.response?.data?.message || 'Error al aceptar la cotización');
    }
  }

  async getHistorialCambios(idMuestra: string): Promise<CambioEstado[]> {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${this.baseUrl}/historial/${idMuestra}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error al obtener historial:', error);
      throw error;
    }
  }
}

export const cambiosEstadoService = new CambiosEstadoService();
