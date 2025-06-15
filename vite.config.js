import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Carga las variables de entorno según el modo (development, production, etc.)
  // eslint-disable-next-line no-undef
  const env = loadEnv(mode, process.cwd(), '');
  
  // Configuraciones específicas según el modo
  const isProd = mode === 'production';
  return {
    plugins: [
      react()
    ],
    base: "/", // Importante para Vercel
    define: {
      // Define process.env para compatibilidad con librerías que lo usan
      'process.env': {},
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    build: {
      outDir: "dist",
      assetsDir: "assets",
      // Optimización compatible con Vercel
      minify: isProd,
      sourcemap: !isProd,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Chunks simples para mejorar compatibilidad
            if (id.includes('node_modules')) {
              if (id.includes('react')) return 'vendor-react';
              if (id.includes('@mui')) return 'vendor-mui';
              if (id.includes('chart') || id.includes('recharts')) return 'vendor-chart';
              return 'vendor'; // el resto de node_modules
            }
          }
        }
      }
    },
    server: {
      proxy: {
        "/api": {
          target: env.VITE_BACKEND_MUESTRAS_URL || "https://back-usuarios-f.onrender.com",
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, "")
        }
      }
    }
  };
});
