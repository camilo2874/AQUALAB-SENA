import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { splitVendorChunkPlugin } from 'vite';

export default defineConfig(({ mode }) => {
  // Carga las variables de entorno según el modo (development, production, etc.)
  // eslint-disable-next-line no-undef
  const env = loadEnv(mode, process.cwd(), '');
  
  // Configuraciones específicas según el modo
  const isProd = mode === 'production';

  return {
    plugins: [
      react(),
      splitVendorChunkPlugin() // Separar código de dependencias
    ],
    base: "./", // Corrige rutas en producción
    build: {
      outDir: "dist", // Archivos en `dist/`
      assetsDir: "assets", // Archivos JS/CSS en `dist/assets/`
      // Optimizaciones específicas para producción
      target: 'esnext', // Target moderno para mejores optimizaciones
      minify: 'terser', // Mejor minificación
      terserOptions: {
        compress: {
          drop_console: isProd, // Elimina console.log en producción
          drop_debugger: isProd
        }
      },
      rollupOptions: {
        output: {
          manualChunks: {
            // Separate chunks for big libraries
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'mui-vendor': ['@mui/material', '@mui/icons-material'],
            'chart-vendor': ['chart.js', 'react-chartjs-2'],
            'utils-vendor': ['axios', 'jspdf', 'framer-motion']
          }
        }
      },
      // Compresión para reducir tamaño de archivos
      reportCompressedSize: true,
      chunkSizeWarningLimit: 1000, // Advertencia si un chunk supera 1MB
    },
    server: {
      proxy: {
        "/api": {
          target: env.VITE_BACKEND_MUESTRAS_URL || "https://back-usuarios-f.onrender.com",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, "")
        }
      }
    },
    // Optimization for development
    optimizeDeps: {
      include: [
        'react', 
        'react-dom', 
        'react-router-dom', 
        '@mui/material', 
        'axios',
        'chart.js'
      ]
    },
    // Mejorar la cache en desarrollo
    cacheDir: '.vite_cache'
  };
});
