# Guía de Despliegue a Vercel - AQUALAB-SENA

## Solución al error "Command pnpm run build exited with 1"

Si estás viendo el error `Command "pnpm run build" exited with 1` al intentar desplegar con Vercel, sigue estos pasos para solucionarlo:

## Opción 1: Despliegue desde la interfaz web de Vercel

1. Inicia sesión en [Vercel](https://vercel.com)
2. Crea un nuevo proyecto e importa tu repositorio
3. En la configuración del proyecto:
   - Framework Preset: Vite
   - Build Command: `pnpm install && pnpm run build`
   - Output Directory: `dist`
   - Install Command: `pnpm install`

## Opción 2: Solución desde la línea de comandos

1. Asegúrate de que tu proyecto contiene un archivo `vercel.json` actualizado:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ],
  "framework": "vite",
  "buildCommand": "pnpm install && pnpm run build",
  "installCommand": "pnpm install", 
  "outputDirectory": "dist"
}
```

2. Luego ejecuta:

```bash
vercel --prod
```

## Opción 3: Verificar errores de compilación

Si el problema persiste, ejecuta:

```bash
pnpm run build
```

Esto mostrará errores específicos que pueden estar impidiendo la compilación.

## Nota importante para Vercel

Si estás usando React Router y tienes rutas anidadas o navegación profunda, asegúrate de que tu configuración de `rewrites` en `vercel.json` esté correcta para manejar SPA (Single Page Applications).

---

## Estructura de build optimizada para Vercel

La configuración actual está optimizada para Vercel con:

- Chunks separados para las librerías principales
- Configuración de SPA para React Router
- Optimizaciones de rendimiento compatibles con Vercel
