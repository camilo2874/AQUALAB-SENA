# Sistema de Notificaciones AQUALAB

## 📋 Descripción

El sistema de notificaciones de AQUALAB está diseñado para alertar a los usuarios sobre muestras que llegan en estado de **"En Cotización"**. Cada notificación proporciona un resumen de la información de la muestra y permite al usuario ver detalles completos o eliminar la notificación.

## 🚀 Funcionalidades Implementadas

### ✅ Funcionalidades Principales

1. **Detección Automática de Muestras en Cotización**
   - Monitoreo automático cada 30 segundos
   - Filtrado inteligente por estado de muestra
   - Actualización en tiempo real

2. **Sistema de Notificaciones Completo**
   - Contador de notificaciones no leídas con animación
   - Badge visual en el icono de notificaciones
   - Lista detallada de todas las notificaciones

3. **Modal de Detalle de Muestra**
   - Información completa de la muestra
   - Datos del cliente y análisis solicitados
   - Diseño profesional y responsive

4. **Gestión de Notificaciones**
   - Marcar como leída automáticamente al ver detalle
   - Eliminar notificación específica
   - Eliminar todas las notificaciones de una vez
   - Auto-eliminación cuando la muestra cambia de estado

5. **Persistencia de Datos**
   - Almacenamiento local (localStorage)
   - Recuperación automática al recargar la página
   - Limpieza automática de notificaciones antiguas (24 horas)

6. **Indicadores de Estado**
   - Indicador de conexión de red
   - Estados de carga y procesamiento
   - Manejo de errores de conectividad

## 🏗️ Arquitectura del Sistema

### Componentes Principales

```
src/
├── components/
│   ├── Navbar.jsx                      # Barra de navegación con notificaciones
│   └── NotificationDetailModal.jsx     # Modal de detalle de muestra
├── context/
│   └── NotificationContext.jsx         # Contexto global de notificaciones
├── hooks/
│   └── useNotificationHooks.js         # Hooks personalizados
└── config/
    └── constants.js                    # Configuración centralizada
```

### Flujo de Datos

1. **NotificationContext** -> Obtiene muestras de la API cada 30 segundos
2. **Filtrado** -> Solo muestras con estado "En Cotización"
3. **Almacenamiento** -> Guarda en localStorage para persistencia
4. **Navbar** -> Muestra contador y lista de notificaciones
5. **Modal** -> Presenta detalles completos de la muestra

## 🎨 Características de UI/UX

### Diseño Visual
- **Colores**: Verde corporativo (#39A900) como color principal
- **Animaciones**: Pulso sutil en notificaciones no leídas
- **Iconografía**: Íconos Material-UI coherentes
- **Responsive**: Adaptable a diferentes tamaños de pantalla

### Interacciones
- **Hover Effects**: Elementos interactivos con feedback visual
- **Loading States**: Indicadores de carga durante procesos
- **Error Handling**: Mensajes claros para errores de conectividad
- **Accessibility**: Tooltips y labels para accesibilidad

## ⚙️ Configuración

### Variables de Configuración (constants.js)

```javascript
API_CONFIG: {
  NOTIFICATIONS: {
    REFRESH_INTERVAL: 30000,    // 30 segundos
    MAX_AGE_HOURS: 24,          // 24 horas
    DEBOUNCE_DELAY: 1000,       // 1 segundo
  }
}
```

### Estados de Muestra Monitoreados

- `"En Cotización"`
- `"En Cotizacion"` (variante de escritura)

## 🔧 Funcionalidades Técnicas

### Optimizaciones de Rendimiento

1. **Debouncing**: Evita llamadas excesivas a la API
2. **Memoización**: Components memoizados para evitar re-renders
3. **Lazy Loading**: Carga diferida de componentes
4. **Cleanup**: Limpieza automática de intervalos y timeouts

### Manejo de Errores

1. **Network Errors**: Detección de pérdida de conexión
2. **API Timeouts**: Timeout de 10 segundos en requests
3. **Fallback States**: Estados de respaldo para errores
4. **User Feedback**: Mensajes informativos para el usuario

### Persistencia de Datos

1. **localStorage**: Almacenamiento local de notificaciones
2. **Auto-cleanup**: Eliminación de datos antiguos
3. **Data Integrity**: Validación de datos al cargar

## 📱 Uso del Sistema

### Para el Usuario Final

1. **Ver Notificaciones**
   - Clic en el ícono de campana en la barra superior
   - El badge muestra el número de notificaciones no leídas

2. **Ver Detalle de Muestra**
   - Clic en "Ver Detalle" en cualquier notificación
   - Se abre un modal con información completa
   - La notificación se marca automáticamente como leída

3. **Gestionar Notificaciones**
   - Eliminar una notificación: Clic en el ícono de basura
   - Eliminar todas: Clic en el ícono de "Limpiar todo"
   - Las notificaciones se eliminan automáticamente cuando la muestra cambia de estado

4. **Indicadores Visuales**
   - 🟢 **WiFi Verde**: Conexión activa
   - 🔴 **WiFi Rojo**: Sin conexión
   - 🔵 **Badge Azul**: Notificaciones no leídas

## 🔄 Estados del Sistema

### Estados de Notificación

- **Nueva**: Recién creada, no leída
- **Leída**: Vista por el usuario
- **Obsoleta**: Muestra ya no está en cotización (auto-eliminada)

### Estados de Conexión

- **Online**: Sistema actualizado en tiempo real
- **Offline**: Notificaciones congeladas hasta restaurar conexión

## 🚀 Mejoras Futuras Posibles

1. **Push Notifications**: Notificaciones del navegador
2. **Email Alerts**: Alertas por correo electrónico  
3. **Sound Notifications**: Alertas sonoras
4. **Categorización**: Diferentes tipos de notificaciones
5. **Filtros Avanzados**: Filtrado por cliente, tipo de análisis, etc.

## 🐛 Solución de Problemas

### Problemas Comunes

1. **Notificaciones no aparecen**
   - Verificar conexión a internet
   - Revisar que haya muestras en estado "En Cotización"
   - Limpiar localStorage si es necesario

2. **Contador incorrecto**
   - Refrescar la página
   - Las notificaciones se sincronizan automáticamente

3. **Modal no abre**
   - Verificar que la muestra aún existe en el servidor
   - Revisar errores en la consola del navegador

### Logs de Debug

El sistema registra información útil en la consola:
- `console.log`: Estados normales del sistema
- `console.error`: Errores de conectividad o API
- `console.warn`: Advertencias sobre datos inconsistentes

---

## 📞 Soporte

Para reportar bugs o solicitar nuevas funcionalidades, contactar al equipo de desarrollo de AQUALAB.

**Última actualización**: 19 de junio de 2025
