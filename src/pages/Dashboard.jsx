import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import {
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import PeopleIcon from "@mui/icons-material/People";
import PersonIcon from "@mui/icons-material/Person";
import AssignmentIcon from "@mui/icons-material/Assignment";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Button from "@mui/material/Button";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import logoSena from "../assets/logo-sena.png";
import { Chart } from "chart.js/auto";

// Registrar los elementos de Chart.js
ChartJS.register(ArcElement, Tooltip, Legend);

// Estilo para el fondo del dashboard
const dashboardStyle = {
  background: "linear-gradient(135deg, #f5f7fa 0%, #d7f7dd 100%)",
  minHeight: "100vh",
  padding: { xs: 2, md: 4 },
};

// Componente para tarjeta de estadística
const StatCard = ({ title, value, icon, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <Paper
      elevation={3}
      sx={{
        p: 2,
        textAlign: "center",
        borderRadius: 2,
        background: `linear-gradient(45deg, ${color}20, #ffffff)`,
        boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
        transition: "transform 0.3s",
        "&:hover": { transform: "scale(1.05)" },
      }}
    >
      <Box sx={{ mb: 1, color }}>{icon}</Box>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="h5" color={color}>
        <CountUp end={value} duration={2.5} />
      </Typography>
    </Paper>
  </motion.div>
);

// Componente para los gráficos
const SampleCharts = ({ sampleStats, waterTypeStats, userTypeStats }) => {
  // Gráfico de Dona 1: Distribución de Muestras (Recibidas, En Análisis, Por Verificar, Finalizadas)
  const distributionData = {
    labels: [
      "Muestras Recibidas",
      "Muestras en Análisis",
      "Muestras por Verificar",
      "Finalizadas"
    ],
    datasets: [
      {
        data: [
          sampleStats.totalAllSamples, // Recibidas
          sampleStats.totalSamples,    // En Análisis
          sampleStats.pendingSamples,  // Por Verificar
          sampleStats.verifiedSamples  // Finalizadas
        ],
        backgroundColor: [
          "#39A900", // Recibidas
          "#2196F3", // En Análisis
          "#FF9800", // Por Verificar
          "#2E7D32"  // Finalizadas
        ],
        hoverBackgroundColor: [
          "#2D8A00",
          "#1976D2",
          "#F57C00",
          "#1B5E20"
        ],
        borderWidth: 1,
      },
    ],
  };

  // Gráfico de Dona 2: Total de Muestras por Tipo de Análisis (Microbiológicos, Fisicoquímicos)
  const analysisTypeData = {
    labels: ["Microbiológicos", "Fisicoquímicos"],
    datasets: [
      {
        data: [
          sampleStats.microbiologicalSamples,
          sampleStats.physicochemicalSamples,
        ],
        backgroundColor: ["#2196F3", "#FF6384"],
        hoverBackgroundColor: ["#1976D2", "#FF4069"],
        borderWidth: 1,
      },
    ],
  };

  // Gráfico de Dona 3: Muestras por Tipo de Agua
  const waterTypeData = {
    labels: ["Potable", "Natural", "Residual", "Otra"],
    datasets: [
      {
        data: [
          waterTypeStats.potable,
          waterTypeStats.natural,
          waterTypeStats.residual,
          waterTypeStats.otra,
        ],
        backgroundColor: ["#00B8D4", "#43A047", "#FFD600", "#8E24AA"],
        hoverBackgroundColor: ["#0097A7", "#2E7D32", "#FFC400", "#6A1B9A"],
        borderWidth: 1,
      },
    ],
  };

  // Gráfico de Dona 4: Usuarios por Tipo
  const userTypeData = {
    labels: [
      "Empresas",
      "Emprendedor",
      "Persona natural",
      "Institución educativa",
      "Aprendiz/Instructor Sena"
    ],
    datasets: [
      {
        data: [
          userTypeStats.empresas,
          userTypeStats.emprendedor,
          userTypeStats["persona natural"],
          userTypeStats["institucion educativa"],
          userTypeStats["aprendiz/instructor Sena"],
        ],
        backgroundColor: ["#1976D2", "#00B8D4", "#43A047", "#FFD600", "#8E24AA"],
        hoverBackgroundColor: ["#1565C0", "#00838F", "#2E7D32", "#FFC400", "#6A1B9A"],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false, // Ocultamos la leyenda nativa
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.label}: ${context.raw}`,
        },
      },
    },
    cutout: "60%", // Estilo de dona
  };

  // Utilidad para renderizar especificaciones debajo de cada gráfico en dos columnas y altura fija
  const renderSpecs = (labels, data, colors) => {
    // Agrupar de dos en dos
    const rows = [];
    for (let i = 0; i < labels.length; i += 2) {
      rows.push([
        { label: labels[i], value: data[i], color: colors[i] },
        labels[i + 1] !== undefined
          ? { label: labels[i + 1], value: data[i + 1], color: colors[i + 1] }
          : null,
      ]);
    }
    return (
      <Box sx={{ mt: 2, width: '100%', minHeight: 90, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {rows.map((pair, idx) => (
          <Box key={idx} sx={{ display: 'flex', justifyContent: 'center', width: '100%', mb: 0.5 }}>
            {pair.map((item, j) =>
              item ? (
                <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', minWidth: 160, mx: 2 }}>
                  <Box sx={{ width: 16, height: 16, borderRadius: '50%', bgcolor: item.color, mr: 1, border: '1px solid #ccc' }} />
                  <Typography variant="body2" sx={{ flex: 1 }}>{item.label}</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: item.color, ml: 1 }}>{item.value}</Typography>
                </Box>
              ) : (
                <Box key={j} sx={{ minWidth: 160, mx: 2 }} />
              )
            )}
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6}>
          <Paper elevation={3} sx={{ p: 2, borderRadius: 2, background: "linear-gradient(45deg, #ffffff, #d7f7dd)", minHeight: 520, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center' }}>
            <Typography variant="h6" align="center" sx={{ mb: 2, color: "#39A900", fontWeight: 'bold' }}>Distribución de Muestras</Typography>
            <Box sx={{ width: 320, height: 320, mx: "auto", display: 'flex', alignItems: 'center', justifyContent: 'center' }} id="dashboard-chart-distribucion">
              <Doughnut data={distributionData} options={chartOptions} width={300} height={300} />
            </Box>
            {renderSpecs(
              distributionData.labels,
              distributionData.datasets[0].data,
              distributionData.datasets[0].backgroundColor
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Paper elevation={3} sx={{ p: 2, borderRadius: 2, background: "linear-gradient(45deg, #ffffff, #d7f7dd)", minHeight: 520, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center' }}>
            <Typography variant="h6" align="center" sx={{ mb: 2, color: "#39A900", fontWeight: 'bold' }}>Muestras por Tipo de Análisis</Typography>
            <Box sx={{ width: 320, height: 320, mx: "auto", display: 'flex', alignItems: 'center', justifyContent: 'center' }} id="dashboard-chart-tipo">
              <Doughnut data={analysisTypeData} options={chartOptions} width={300} height={300} />
            </Box>
            {renderSpecs(
              analysisTypeData.labels,
              analysisTypeData.datasets[0].data,
              analysisTypeData.datasets[0].backgroundColor
            )}
          </Paper>
        </Grid>
      </Grid>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6}>
          <Paper elevation={3} sx={{ p: 2, borderRadius: 2, background: "linear-gradient(45deg, #ffffff, #d7f7dd)", minHeight: 520, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center' }}>
            <Typography variant="h6" align="center" sx={{ mb: 2, color: "#39A900", fontWeight: 'bold' }}>Muestras por Tipo de Agua</Typography>
            <Box sx={{ width: 320, height: 320, mx: "auto", display: 'flex', alignItems: 'center', justifyContent: 'center' }} id="dashboard-chart-agua">
              <Doughnut data={waterTypeData} options={chartOptions} width={300} height={300} />
            </Box>
            {renderSpecs(
              waterTypeData.labels,
              waterTypeData.datasets[0].data,
              waterTypeData.datasets[0].backgroundColor
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6}>
          <Paper elevation={3} sx={{ p: 2, borderRadius: 2, background: "linear-gradient(45deg, #ffffff, #d7f7dd)", minHeight: 520, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center' }}>
            <Typography variant="h6" align="center" sx={{ mb: 2, color: "#39A900", fontWeight: 'bold' }}>Clientes por Tipo</Typography>
            <Box sx={{ width: 320, height: 320, mx: "auto", display: 'flex', alignItems: 'center', justifyContent: 'center' }} id="dashboard-chart-usuarios">
              <Doughnut data={userTypeData} options={chartOptions} width={300} height={300} />
            </Box>
            {renderSpecs(
              userTypeData.labels,
              userTypeData.datasets[0].data,
              userTypeData.datasets[0].backgroundColor
            )}
          </Paper>
        </Grid>
      </Grid>
    </>
  );
};

const Dashboard = () => {
  // Estados para estadísticas de muestras
  const [sampleStats, setSampleStats] = useState({
    totalAllSamples: 0,
    totalSamples: 0,
    pendingSamples: 0,
    verifiedSamples: 0,
    quotationSamples: [],
    microbiologicalSamples: 0,
    physicochemicalSamples: 0,
  });
  const [waterTypeStats, setWaterTypeStats] = useState({
    potable: 0,
    natural: 0,
    residual: 0,
    otra: 0,
  });
  const [loadingSamples, setLoadingSamples] = useState(true);
  const [sampleError, setSampleError] = useState(null);

  // Estados para la información de usuarios
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    clientCount: 0,
    clientsByType: {
      empresas: 0,
      emprendedor: 0,
      'persona natural': 0,
      'institucion educativa': 0,
      'aprendiz/instructor Sena': 0,
    },
  });
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userError, setUserError] = useState(null);

  // Memoizar datos de tarjetas y clientes para evitar renders innecesarios y conflictos de nombres
  const statCardData = useMemo(() => [
    {
      title: "Muestras Recibidas",
      value: sampleStats.totalAllSamples,
      icon: <AssignmentIcon sx={{ fontSize: 30 }} />,
      color: "#2196F3"
    },
    {
      title: "Muestras en Análisis",
      value: sampleStats.totalSamples,
      icon: <AssignmentIcon sx={{ fontSize: 30 }} />,
      color: "#39A900"
    },
    {
      title: "Muestras por Verificar",
      value: sampleStats.pendingSamples,
      icon: <TrendingUpIcon sx={{ fontSize: 30 }} />,
      color: "#FF9800"
    },
    {
      title: "Finalizadas",
      value: sampleStats.verifiedSamples,
      icon: <DoneAllIcon sx={{ fontSize: 30 }} />,
      color: "#2E7D32"
    }
  ], [sampleStats]);

  const clientTypeCardData = useMemo(() => [
    {
      title: "Empresas",
      value: userStats.clientsByType.empresas,
      icon: <PeopleIcon sx={{ fontSize: 28 }} />,
      color: "#1976D2"
    },
    {
      title: "Emprendedor",
      value: userStats.clientsByType.emprendedor,
      icon: <PersonIcon sx={{ fontSize: 28 }} />,
      color: "#00B8D4"
    },
    {
      title: "Persona natural",
      value: userStats.clientsByType['persona natural'],
      icon: <PersonIcon sx={{ fontSize: 28 }} />,
      color: "#43A047"
    },
    {
      title: "Institución educativa",
      value: userStats.clientsByType['institucion educativa'],
      icon: <PeopleIcon sx={{ fontSize: 28 }} />,
      color: "#FF9800"
    },
    {
      title: "Aprendiz/Instructor",
      value: userStats.clientsByType['aprendiz/instructor Sena'],
      icon: <PersonIcon sx={{ fontSize: 28 }} />,
      color: "#8E24AA"
    }
  ], [userStats]);

  // Carga de datos de muestras (para estadísticas)
  useEffect(() => {
    const fetchSamplesStats = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setSampleError("No tienes permiso para acceder a las muestras. Inicia sesión.");
        setLoadingSamples(false);
        return;
      }

      try {
        // Obtener Total de Muestras desde /api/muestras
        let allMuestras = [];
        let pageMuestras = 1;
        let hasMoreMuestras = true;
        const limit = 100;

        while (hasMoreMuestras) {
          const response = await axios.get(
            `https://backend-registro-muestras.onrender.com/api/muestras?page=${pageMuestras}&limit=${limit}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          let muestras = [];
          // Eliminar logs innecesarios y robustecer manejo de estructura inesperada
          if (!(response.data && response.data.data && Array.isArray(response.data.data.data)) &&
              !(response.data && Array.isArray(response.data.data)) &&
              !(Array.isArray(response.data))) {
            // Si la estructura es inesperada, simplemente dejar muestras vacío
            muestras = [];
          } else if (response.data && response.data.data && Array.isArray(response.data.data.data)) {
            muestras = response.data.data.data;
          } else if (response.data && Array.isArray(response.data.data)) {
            muestras = response.data.data;
          } else if (Array.isArray(response.data)) {
            muestras = response.data;
          } else {
            muestras = [];
          }

          allMuestras = [...allMuestras, ...muestras];

          const totalPagesMuestras = response.data.data?.pagination?.totalPages || 1;
          hasMoreMuestras = pageMuestras < totalPagesMuestras;
          pageMuestras += 1;
        }

        const totalAllSamples = allMuestras.length;

        // Calcular muestras por tipo de análisis
        const microbiologicalSamples = allMuestras.filter(
          (sample) => (sample.tipoAnalisis || "").toLowerCase() === "microbiológico"
        ).length;
        const physicochemicalSamples = allMuestras.filter(
          (sample) => (sample.tipoAnalisis || "").toLowerCase() === "fisicoquímico"
        ).length;

        // Calcular muestras por tipo de agua
        const waterTypeStatsCalc = { potable: 0, natural: 0, residual: 0, otra: 0 };
        allMuestras.forEach((sample) => {
          const tipo = sample.tipoDeAgua?.tipo?.toLowerCase();
          if (tipo === "potable") waterTypeStatsCalc.potable++;
          else if (tipo === "natural") waterTypeStatsCalc.natural++;
          else if (tipo === "residual") waterTypeStatsCalc.residual++;
          else if (tipo === "otra") waterTypeStatsCalc.otra++;
        });
        setWaterTypeStats(waterTypeStatsCalc);

        // Obtener estadísticas desde /api/ingreso-resultados/resultados
        let allSamples = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
          const response = await axios.get(
            `https://backend-registro-muestras.onrender.com/api/ingreso-resultados/resultados?page=${page}&limit=${limit}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );

          let samples = [];
          if (response.data && response.data.data && Array.isArray(response.data.data.data)) {
            samples = response.data.data.data;
          } else if (response.data && Array.isArray(response.data.data)) {
            samples = response.data.data;
          } else if (Array.isArray(response.data)) {
            samples = response.data;
          } else {
            samples = [];
          }

          allSamples = [...allSamples, ...samples];

          const totalPages = response.data.data?.pagination?.totalPages || 1;
          hasMore = page < totalPages;
          page += 1;
        }

        const totalSamples = allSamples.length;
        const pendingSamples = allSamples.filter(
          (s) => !s.verificado
        ).length;
        const verifiedSamples = allSamples.filter(
          (s) => s.verificado
        ).length;

        // Obtener muestras en cotización desde /api/muestras
        let quotationSamples = allMuestras
          .filter((s) => s.estado && s.estado.toLowerCase() === "en cotizacion")
          .sort((a, b) => new Date(b.fechaHoraMuestreo) - new Date(a.fechaHoraMuestreo))
          .slice(0, 10);

        setSampleStats({
          totalAllSamples,
          totalSamples,
          pendingSamples,
          verifiedSamples,
          quotationSamples,
          microbiologicalSamples,
          physicochemicalSamples,
        });
      } catch (err) {
        console.error("Error al cargar estadísticas de muestras:", err);
        setSampleError("Error al cargar las estadísticas de muestras. Verifica la conexión o el token.");
      } finally {
        setLoadingSamples(false);
      }
    };
    fetchSamplesStats();
  }, []);

  // Carga de datos de usuarios
  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setUserError("No tienes permiso para acceder a los usuarios. Inicia sesión.");
        setLoadingUsers(false);
        return;
      }
      try {
        const response = await axios.get(
          "https://backend-sena-lab-1-qpzp.onrender.com/api/usuarios",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        let users = [];
        // Eliminar logs innecesarios de la carga de usuarios
        if (!(response.data && response.data.data && Array.isArray(response.data.data.data)) &&
            !(response.data && Array.isArray(response.data.data)) &&
            !(response.data && Array.isArray(response.data.usuarios)) &&
            !(Array.isArray(response.data))) {
          // Si la estructura es inesperada, dejar users vacío
          users = [];
        } else if (response.data && response.data.data && Array.isArray(response.data.data.data)) {
          users = response.data.data.data;
        } else if (response.data && Array.isArray(response.data.data)) {
          users = response.data.data;
        } else if (response.data && Array.isArray(response.data.usuarios)) {
          users = response.data.usuarios;
        } else if (Array.isArray(response.data)) {
          users = response.data;
        } else {
          console.warn("Estructura inesperada en la respuesta de usuarios:", response.data);
          users = [];
        }

        if (users.length === 0) {
          setUserError("No se encontraron usuarios en la respuesta de la API.");
          setUserStats({ totalUsers: 0, clientCount: 0, clientsByType: {
            empresas: 0,
            emprendedor: 0,
            'persona natural': 0,
            'institucion educativa': 0,
            'aprendiz/instructor Sena': 0,
          }});
          setLoadingUsers(false);
          return;
        }

        const totalUsers = users.length;

        const rolesUnicos = [...new Set(users.map(user => {
          if (typeof user.rol === 'object' && user.rol !== null) {
            return user.rol.nombre || user.rol.name || JSON.stringify(user.rol);
          }
          return user.rol || "Sin Rol";
        }))];
        // console.log("Roles únicos encontrados:", rolesUnicos);

        const clientCount = users.filter(user => {
          const roleValue = user.rol?.nombre || user.rol?.name || user.rol || "";
          return String(roleValue).toLowerCase() === "cliente";
        }).length;

        // Contar clientes por tipo_cliente
        const clientsByType = {
          empresas: 0,
          emprendedor: 0,
          'persona natural': 0,
          'institucion educativa': 0,
          'aprendiz/instructor Sena': 0,
        };
        users.forEach(user => {
          const roleValue = user.rol?.nombre || user.rol?.name || user.rol || "";
          if (String(roleValue).toLowerCase() === "cliente") {
            // El tipo_cliente puede estar en user.detalles.tipo_cliente o user.tipo_cliente
            const tipo = (user.detalles?.tipo_cliente || user.tipo_cliente || "").toLowerCase();
            if (tipo === "empresas") clientsByType.empresas++;
            else if (tipo === "emprendedor") clientsByType.emprendedor++;
            else if (tipo === "persona natural") clientsByType["persona natural"]++;
            else if (tipo === "institucion educativa") clientsByType["institucion educativa"]++;
            else if (tipo === "aprendiz/instructor sena") clientsByType["aprendiz/instructor Sena"]++;
          }
        });

        // console.log("Estadísticas de usuarios:", { totalUsers, clientCount, clientsByType });

        setUserStats({ totalUsers, clientCount, clientsByType });
      } catch (err) {
        console.error("Error al cargar usuarios:", err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          setUserError("Sesión expirada o no autorizada. Por favor, inicia sesión nuevamente.");
        } else {
          setUserError("Error al cargar la información de usuarios: " + (err.response?.data?.message || err.message));
        }
        setUserStats({ totalUsers: 0, clientCount: 0, clientsByType: {
          empresas: 0,
          emprendedor: 0,
          'persona natural': 0,
          'institucion educativa': 0,
          'aprendiz/instructor Sena': 0,
        }});
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  // --- FUNCIÓN PARA CARGAR IMAGEN Y GENERAR PDF ---
  const generateDashboardPDF = async () => {
    // Utilidad para convertir imagen importada a base64
    const getBase64FromImportedImage = (imgPath) => {
      return new Promise((resolve, reject) => {
        const img = new window.Image();
        img.crossOrigin = "Anonymous";
        img.src = imgPath;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = reject;
      });
    };

    // Definir los datos de los gráficos igual que en SampleCharts
    // (Mover esto antes de usar getChartBase64)
    const distributionData = {
      labels: [
        "Muestras Recibidas",
        "Muestras en Análisis",
        "Muestras por Verificar",
        "Finalizadas"
      ],
      datasets: [
        {
          data: [
            sampleStats.totalAllSamples,
            sampleStats.totalSamples,
            sampleStats.pendingSamples,
            sampleStats.verifiedSamples
          ],
          backgroundColor: ["#39A900", "#2196F3", "#FF9800", "#2E7D32"],
          borderWidth: 1,
        },
      ],
    };
    const analysisTypeData = {
      labels: ["Microbiológicos", "Fisicoquímicos"],
      datasets: [
        {
          data: [sampleStats.microbiologicalSamples, sampleStats.physicochemicalSamples],
          backgroundColor: ["#2196F3", "#FF6384"],
          borderWidth: 1,
        },
      ],
    };
    const waterTypeData = {
      labels: ["Potable", "Natural", "Residual", "Otra"],
      datasets: [
        {
          data: [waterTypeStats.potable, waterTypeStats.natural, waterTypeStats.residual, waterTypeStats.otra],
          backgroundColor: ["#00B8D4", "#43A047", "#FFD600", "#8E24AA"],
          borderWidth: 1,
        },
      ],
    };
    const userTypeData = {
      labels: [
        "Empresas",
        "Emprendedor",
        "Persona natural",
        "Institución educativa",
        "Aprendiz/Instructor Sena"
      ],
      datasets: [
        {
          data: [
            userStats.clientsByType.empresas,
            userStats.clientsByType.emprendedor,
            userStats.clientsByType["persona natural"],
            userStats.clientsByType["institucion educativa"],
            userStats.clientsByType["aprendiz/instructor Sena"]
          ],
          backgroundColor: ["#1976D2", "#00B8D4", "#43A047", "#FFD600", "#8E24AA"],
          borderWidth: 1,
        },
      ],
    };
    const chartOptions = {
      plugins: { legend: { display: false } },
      cutout: '60%',
      responsive: false,
      animation: false,
    };

    // --- Agregar gráficos de dona al PDF ---
    // Utilidad para crear un gráfico de Chart.js en un canvas oculto y devolver base64
    const getChartBase64 = (chartData, chartOptions) => {
      return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = 180;
        canvas.height = 180;
        // Crear instancia Chart.js manualmente
        const chart = new Chart(canvas.getContext('2d'), {
          type: 'doughnut',
          data: chartData,
          options: {
            ...chartOptions,
            plugins: { ...chartOptions.plugins, legend: { display: false } },
            responsive: false,
            animation: false,
            cutout: '60%',
          },
        });
        setTimeout(() => {
          resolve(canvas.toDataURL('image/png'));
          chart.destroy();
        }, 400); // Espera breve para renderizar
      });
    };

    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 40;

    // Logo SENA en la parte superior izquierda, tamaño mediano
    try {
      const logoBase64 = await getBase64FromImportedImage(logoSena);
      doc.addImage(logoBase64, "PNG", 40, 10, 70, 70); // x, y, width, height (más arriba)
      // Línea decorativa de lado a lado debajo del logo
      doc.setDrawColor(57,169,0); // Verde institucional
      doc.setLineWidth(2);
      doc.line(30, 85, pageWidth - 30, 85); // Línea de lado a lado
      y = 60; // Menos espacio después del logo
    } catch (e) {
      y = 40;
    }

    // Título principal más abajo
    y += 60; // Espacio extra antes del título
    doc.setFontSize(22);
    doc.setTextColor("#39A900");
    doc.text("INFORME DE PANEL DE CONTROL", pageWidth / 2, y, { align: "center" });
    y += 36;

    // Fecha
    doc.setFontSize(11);
    doc.setTextColor("#333");
    doc.text(`Fecha de generación: ${new Date().toLocaleString()}`, pageWidth - 40, y, { align: "right" });
    y += 18;

    // --- Gráficos de dona centrados ---
    const [distImg, analImg, aguaImg, userImg] = await Promise.all([
      getChartBase64(distributionData, chartOptions),
      getChartBase64(analysisTypeData, chartOptions),
      getChartBase64(waterTypeData, chartOptions),
      getChartBase64(userTypeData, chartOptions),
    ]);
    const chartW = 120, chartH = 120, chartGapX = 40, chartGapY = 30;
    // Calcular centrado
    const totalWidth = (chartW * 2) + chartGapX;
    const centerX = (pageWidth - totalWidth) / 2;
    let chartX1 = centerX, chartX2 = centerX + chartW + chartGapX;
    let chartY = y + 20; // Más espacio después de la fecha
    doc.setFontSize(12);
    doc.setTextColor("#1976D2");
    doc.text("Distribución de Muestras", chartX1 + chartW/2, chartY - 8, { align: "center" });
    doc.text("Muestras por Tipo de Análisis", chartX2 + chartW/2, chartY - 8, { align: "center" });
    doc.addImage(distImg, 'PNG', chartX1, chartY, chartW, chartH);
    doc.addImage(analImg, 'PNG', chartX2, chartY, chartW, chartH);
    chartY += chartH + chartGapY;
    doc.setTextColor("#43A047");
    doc.text("Muestras por Tipo de Agua", chartX1 + chartW/2, chartY - 8, { align: "center" });
    doc.setTextColor("#8E24AA");
    doc.text("Clientes por Tipo", chartX2 + chartW/2, chartY - 8, { align: "center" });
    doc.addImage(aguaImg, 'PNG', chartX1, chartY, chartW, chartH);
    doc.addImage(userImg, 'PNG', chartX2, chartY, chartW, chartH);
    y = chartY + chartH + 30; // Más espacio antes de las tablas

    // 1. Distribución de Muestras
    doc.setFontSize(15);
    doc.setTextColor("#1976D2");
    doc.text("Distribución de Muestras", 40, y);
    y += 16;
    autoTable(doc, {
      startY: y,
      head: [["Muestras Recibidas", "En Análisis", "Por Verificar", "Finalizadas"]],
      body: [[
        sampleStats.totalAllSamples,
        sampleStats.totalSamples,
        sampleStats.pendingSamples,
        sampleStats.verifiedSamples
      ]],
      theme: "grid",
      headStyles: { fillColor: [57,169,0] },
      styles: { fontSize: 10, cellPadding: 5 },
      margin: { left: 40, right: 40 },
      tableWidth: 'auto',
    });
    y = doc.lastAutoTable.finalY + 18;

    // 2. Muestras por Tipo de Análisis
    doc.setFontSize(15);
    doc.setTextColor("#2196F3");
    doc.text("Muestras por Tipo de Análisis", 40, y);
    y += 16;
    autoTable(doc, {
      startY: y,
      head: [["Microbiológicos", "Fisicoquímicos"]],
      body: [[
        sampleStats.microbiologicalSamples,
        sampleStats.physicochemicalSamples
      ]],
      theme: "grid",
      headStyles: { fillColor: [33, 150, 243] },
      styles: { fontSize: 10, cellPadding: 5 },
      margin: { left: 40, right: 40 },
      tableWidth: 'auto',
    });
    y = doc.lastAutoTable.finalY + 18;

    // 3. Muestras por Tipo de Agua
    doc.setFontSize(15);
    doc.setTextColor("#43A047");
    doc.text("Muestras por Tipo de Agua", 40, y);
    y += 16;
    autoTable(doc, {
      startY: y,
      head: [["Potable", "Natural", "Residual", "Otra"]],
      body: [[
        waterTypeStats.potable,
        waterTypeStats.natural,
        waterTypeStats.residual,
        waterTypeStats.otra
      ]],
      theme: "grid",
      headStyles: { fillColor: [0, 184, 212] },
      styles: { fontSize: 10, cellPadding: 5 },
      margin: { left: 40, right: 40 },
      tableWidth: 'auto',
    });
    y = doc.lastAutoTable.finalY + 18;

    // 4. Clientes por Tipo
    doc.setFontSize(15);
    doc.setTextColor("#8E24AA");
    doc.text("Clientes por Tipo", 40, y);
    y += 16;
    autoTable(doc, {
      startY: y,
      head: [["Empresas", "Emprendedor", "Persona natural", "Institución educativa", "Aprendiz/Instructor Sena"]],
      body: [[
        userStats.clientsByType.empresas,
        userStats.clientsByType.emprendedor,
        userStats.clientsByType["persona natural"],
        userStats.clientsByType["institucion educativa"],
        userStats.clientsByType["aprendiz/instructor Sena"]
      ]],
      theme: "grid",
      headStyles: { fillColor: [142, 36, 170] },
      styles: { fontSize: 10, cellPadding: 5 },
      margin: { left: 40, right: 40 },
      tableWidth: 'auto',
    });
    y = doc.lastAutoTable.finalY + 24;

    doc.setFontSize(9);
    doc.setTextColor("#888");
    doc.text("Generado automáticamente por SENA-LAB Dashboard", pageWidth / 2, doc.internal.pageSize.getHeight() - 20, { align: "center" });

    doc.save("informe-dashboard-sena-lab.pdf");
  };

  // Limpiar logs de consola en producción
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      // eslint-disable-next-line no-console
      console.log = () => {};
      // eslint-disable-next-line no-console
      console.warn = () => {};
    }
  }, []);

  // Mejor feedback visual para errores
  const renderError = useCallback(() => (
    <Grid item xs={12}>
      <Alert severity="error" sx={{ mb: 2, fontWeight: 'bold', fontSize: 16 }}>
        {sampleError || userError}
      </Alert>
    </Grid>
  ), [sampleError, userError]);

  if (loadingSamples || loadingUsers) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress sx={{ color: "#39A900" }} />
      </Box>
    );
  }

  return (
    <Box sx={dashboardStyle}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <Typography
          variant="h3"
          align="center"
          sx={{
            mb: 4,
            fontWeight: "bold",
            color: "#39A900",
            textShadow: "1px 1px 2px rgba(0,0,0,0.2)",
          }}
        >
          PANEL DE CONTROL
        </Typography>

        {(sampleError || userError) && renderError()}

        <Grid container spacing={2} sx={{ mb: 4 }}>
          {statCardData.map((card, idx) => (
            <Grid item xs={12} sm={3} key={card.title}>
              <StatCard {...card} />
            </Grid>
          ))}
        </Grid>

        <SampleCharts sampleStats={sampleStats} waterTypeStats={waterTypeStats} userTypeStats={userStats.clientsByType} />

        <Paper
          elevation={3}
          sx={{
            p: 3,
            borderRadius: 4,
            background: "linear-gradient(120deg, #e3f2fd 0%, #d7f7dd 100%)",
            boxShadow: '0 6px 24px rgba(57,169,0,0.08)',
            mb: 4,
          }}
        >
          <Typography variant="h4" sx={{ mb: 3, color: "#1976D2", fontWeight: 'bold', textAlign: 'center', letterSpacing: 1 }}>
            USUARIOS REGISTRADOS
          </Typography>
          <Grid container spacing={2} justifyContent="center">
            <Grid item xs={12}>
              <StatCard
                title="Total Usuarios"
                value={userStats.totalUsers}
                icon={<PeopleIcon sx={{ fontSize: 44 }} />}
                color="#2196F3"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography 
                variant="h5"
                align="center"
                sx={{
                  fontWeight: 'bold',
                  letterSpacing: 1,
                  mt: 3,
                  mb: 2,
                  color: '#43A047',
                  textShadow: '0 2px 8px #b2dfdb',
                  textTransform: 'uppercase',
                  fontSize: { xs: 20, md: 24 },
                  borderRadius: 2,
                  py: 1
                }}
              >
                Clientes por tipo
              </Typography>
              <Grid container spacing={2} justifyContent="center">
                {clientTypeCardData.map((card, idx) => (
                  <Grid item xs={12} sm={6} md={2.4} key={card.title}>
                    <StatCard {...card} />
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </Paper>
      </motion.div>
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4, mb: 2 }}>
        <Button
          variant="contained"
          color="success"
          startIcon={<PictureAsPdfIcon />}
          size="large"
          sx={{ borderRadius: 3, fontWeight: "bold", fontSize: 18, px: 4, boxShadow: "0 2px 12px #b2dfdb" }}
          onClick={generateDashboardPDF}
        >
          Generar informe PDF
        </Button>
      </Box>
    </Box>
  );
};

export default Dashboard;