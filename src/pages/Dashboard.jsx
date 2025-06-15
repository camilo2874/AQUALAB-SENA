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
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import ScienceIcon from "@mui/icons-material/Science";
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
  background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 50%, #d7f7dd 100%)",
  minHeight: "100vh",
  padding: { xs: 2, md: 4, lg: 6 },
  position: "relative",
  "&::before": {
    content: '""',
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "radial-gradient(circle at 20% 80%, rgba(57, 169, 0, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(33, 150, 243, 0.1) 0%, transparent 50%)",
    pointerEvents: "none",
    zIndex: 1
  }
};

// Componente para tarjeta de estadística
const StatCard = ({ title, value, icon, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 30, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.6, ease: "easeOut" }}
    whileHover={{ y: -8, scale: 1.02 }}
  >
    <Paper
      elevation={6}
      sx={{
        p: 3,
        textAlign: "center",
        borderRadius: 4,
        background: `linear-gradient(135deg, ${color}15 0%, #ffffff 50%, ${color}08 100%)`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.12), 0 2px 16px ${color}25`,
        transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        border: `1px solid ${color}20`,
        position: "relative",
        overflow: "hidden",
        "&:hover": { 
          transform: "translateY(-8px) scale(1.02)",
          boxShadow: `0 16px 48px rgba(0,0,0,0.18), 0 8px 24px ${color}35`,
          "& .stat-icon": {
            transform: "scale(1.2) rotate(5deg)",
            filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.2))"
          },
          "& .stat-value": {
            transform: "scale(1.1)"
          }
        },
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: "-100%",
          width: "100%",
          height: "100%",
          background: `linear-gradient(90deg, transparent, ${color}10, transparent)`,
          transition: "left 0.5s",
        },
        "&:hover::before": {
          left: "100%"
        }
      }}
    >
      <Box 
        className="stat-icon"
        sx={{ 
          mb: 2, 
          color, 
          transition: "all 0.3s ease",
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))"
        }}
      >
        {icon}
      </Box>
      <Typography 
        variant="subtitle1" 
        color="text.secondary" 
        gutterBottom
        sx={{ 
          fontWeight: 600,
          fontSize: { xs: '0.9rem', md: '1rem' },
          letterSpacing: 0.5
        }}
      >
        {title}
      </Typography>
      <Typography 
        variant="h4" 
        className="stat-value"
        sx={{ 
          color, 
          fontWeight: 700,
          fontSize: { xs: '1.8rem', md: '2.2rem' },
          transition: "all 0.3s ease",
          textShadow: `0 2px 4px ${color}20`
        }}
      >
        <CountUp end={value} duration={2.5} separator="," />
      </Typography>
    </Paper>
  </motion.div>
);

// Componente para los gráficos
const SampleCharts = ({ sampleStats, waterTypeStats, userTypeStats, allMuestras }) => {
  // Gráfico de Dona 1: Distribución de Muestras (Recibidas, En Cotización, En análisis, Rechazada, Finalizadas)
  const distributionData = {
    labels: [
      "Muestras Recibidas",
      "Muestras en Cotización",
      "Muestras en Análisis",
      "Muestras Rechazadas",
      "Finalizadas"
    ],
    datasets: [
      {
        data: [
          allMuestras.filter(s => s.estado === "Recibida").length, // Recibidas
          allMuestras.filter(s => s.estado === "En Cotizacion").length, // En Cotización
          allMuestras.filter(s => s.estado === "En análisis").length, // En Análisis
          allMuestras.filter(s => s.estado === "Rechazada").length, // Rechazadas
          allMuestras.filter(s => s.estado === "Finalizada").length // Finalizadas
        ],
        backgroundColor: [
          "#2196F3", // Recibidas
          "#00B8D4", // En Cotización
          "#39A900", // En Análisis
          "#D32F2F", // Rechazadas
          "#2E7D32"  // Finalizadas
        ],
        hoverBackgroundColor: [
          "#1976D2",
          "#00838F",
          "#2D8A00",
          "#C62828",
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
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <Grid container spacing={4} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6}>
            <Paper 
              elevation={8}
              sx={{ 
                p: 3, 
                borderRadius: 4, 
                background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 50%, #e3f2fd 100%)", 
                minHeight: 580, 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'flex-start', 
                alignItems: 'center',
                position: "relative",
                overflow: "hidden",
                boxShadow: '0 12px 40px rgba(33,150,243,0.15)',
                border: '1px solid rgba(33,150,243,0.1)',
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: "linear-gradient(90deg, #2196F3, #00B8D4)",
                },
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: '0 20px 60px rgba(33,150,243,0.25)',
                },
                transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
              }}
            >
              <Typography 
                variant="h6" 
                align="center" 
                sx={{ 
                  mb: 3, 
                  background: "linear-gradient(135deg, #2196F3 0%, #1976D2 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontWeight: 800,
                  fontSize: { xs: '1.1rem', md: '1.3rem' },
                  letterSpacing: 1
                }}
              >
                Distribución de Muestras
              </Typography>
              <Box sx={{ width: 350, height: 350, mx: "auto", display: 'flex', alignItems: 'center', justifyContent: 'center' }} id="dashboard-chart-distribucion">
                <Doughnut data={distributionData} options={chartOptions} width={330} height={330} />
              </Box>
              {renderSpecs(
                distributionData.labels,
                distributionData.datasets[0].data,
                distributionData.datasets[0].backgroundColor
              )}
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Paper 
              elevation={8}
              sx={{ 
                p: 3, 
                borderRadius: 4, 
                background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 50%, #fce4ec 100%)", 
                minHeight: 580, 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'flex-start', 
                alignItems: 'center',
                position: "relative",
                overflow: "hidden",
                boxShadow: '0 12px 40px rgba(255,99,132,0.15)',
                border: '1px solid rgba(255,99,132,0.1)',
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: "linear-gradient(90deg, #FF6384, #FF4069)",
                },
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: '0 20px 60px rgba(255,99,132,0.25)',
                },
                transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
              }}
            >
              <Typography 
                variant="h6" 
                align="center" 
                sx={{ 
                  mb: 3, 
                  background: "linear-gradient(135deg, #FF6384 0%, #FF4069 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontWeight: 800,
                  fontSize: { xs: '1.1rem', md: '1.3rem' },
                  letterSpacing: 1
                }}
              >
                Muestras por Tipo de Análisis
              </Typography>
              <Box sx={{ width: 350, height: 350, mx: "auto", display: 'flex', alignItems: 'center', justifyContent: 'center' }} id="dashboard-chart-tipo">
                <Doughnut data={analysisTypeData} options={chartOptions} width={330} height={330} />
              </Box>
              {renderSpecs(
                analysisTypeData.labels,
                analysisTypeData.datasets[0].data,
                analysisTypeData.datasets[0].backgroundColor
              )}
            </Paper>
          </Grid>
        </Grid>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      >
        <Grid container spacing={4} sx={{ mb: 6 }}>
          <Grid item xs={12} sm={6}>
            <Paper 
              elevation={8}
              sx={{ 
                p: 3, 
                borderRadius: 4, 
                background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 50%, #e8f5e8 100%)", 
                minHeight: 580, 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'flex-start', 
                alignItems: 'center',
                position: "relative",
                overflow: "hidden",
                boxShadow: '0 12px 40px rgba(0,184,212,0.15)',
                border: '1px solid rgba(0,184,212,0.1)',
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: "linear-gradient(90deg, #00B8D4, #0097A7)",
                },
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: '0 20px 60px rgba(0,184,212,0.25)',
                },
                transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
              }}
            >
              <Typography 
                variant="h6" 
                align="center" 
                sx={{ 
                  mb: 3, 
                  background: "linear-gradient(135deg, #00B8D4 0%, #0097A7 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontWeight: 800,
                  fontSize: { xs: '1.1rem', md: '1.3rem' },
                  letterSpacing: 1
                }}
              >
                Muestras por Tipo de Agua
              </Typography>
              <Box sx={{ width: 350, height: 350, mx: "auto", display: 'flex', alignItems: 'center', justifyContent: 'center' }} id="dashboard-chart-agua">
                <Doughnut data={waterTypeData} options={chartOptions} width={330} height={330} />
              </Box>
              {renderSpecs(
                waterTypeData.labels,
                waterTypeData.datasets[0].data,
                waterTypeData.datasets[0].backgroundColor
              )}
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Paper 
              elevation={8}
              sx={{ 
                p: 3, 
                borderRadius: 4, 
                background: "linear-gradient(135deg, #ffffff 0%, #f8f9fa 50%, #f3e5f5 100%)", 
                minHeight: 580, 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'flex-start', 
                alignItems: 'center',
                position: "relative",
                overflow: "hidden",
                boxShadow: '0 12px 40px rgba(142,36,170,0.15)',
                border: '1px solid rgba(142,36,170,0.1)',
                "&::before": {
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 3,
                  background: "linear-gradient(90deg, #8E24AA, #6A1B9A)",
                },
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: '0 20px 60px rgba(142,36,170,0.25)',
                },
                transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
              }}
            >
              <Typography 
                variant="h6" 
                align="center" 
                sx={{ 
                  mb: 3, 
                  background: "linear-gradient(135deg, #8E24AA 0%, #6A1B9A 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontWeight: 800,
                  fontSize: { xs: '1.1rem', md: '1.3rem' },
                  letterSpacing: 1
                }}
              >
                Clientes por Tipo
              </Typography>
              <Box sx={{ width: 350, height: 350, mx: "auto", display: 'flex', alignItems: 'center', justifyContent: 'center' }} id="dashboard-chart-usuarios">
                <Doughnut data={userTypeData} options={chartOptions} width={330} height={330} />
              </Box>
              {renderSpecs(
                userTypeData.labels,
                userTypeData.datasets[0].data,
                userTypeData.datasets[0].backgroundColor
              )}
            </Paper>
          </Grid>
        </Grid>
      </motion.div>
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
    adminCount: 0,
    laboratoristCount: 0,
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

  // Nuevo estado para todas las muestras
  const [allMuestras, setAllMuestras] = useState([]);
  // Memoizar datos de tarjetas y clientes para evitar renders innecesarios y conflictos de nombres
  const statCardData = useMemo(() => [
    {
      title: "Muestras Recibidas",
      value: allMuestras.filter(s => s.estado === "Recibida").length,
      icon: <AssignmentIcon sx={{ fontSize: 40 }} />,
      color: "#2196F3"
    },
    {
      title: "Muestras en Cotización",
      value: allMuestras.filter(s => s.estado === "En Cotizacion").length,
      icon: <AssignmentIcon sx={{ fontSize: 40 }} />,
      color: "#00B8D4"
    },
    {
      title: "Muestras en Análisis",
      value: allMuestras.filter(s => s.estado === "En análisis").length,
      icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
      color: "#39A900"
    },
    {
      title: "Muestras Rechazadas",
      value: allMuestras.filter(s => s.estado === "Rechazada").length,
      icon: <AssignmentIcon sx={{ fontSize: 40 }} />,
      color: "#D32F2F"
    },
    {
      title: "Finalizadas",
      value: allMuestras.filter(s => s.estado === "Finalizada").length,
      icon: <DoneAllIcon sx={{ fontSize: 40 }} />,
      color: "#2E7D32"
    },
    {
      title: "Total de Muestras",
      value: allMuestras.length,
      icon: <AssignmentIcon sx={{ fontSize: 40 }} />,
      color: "#6C63FF"
    }
  ], [allMuestras]);

  const clientTypeCardData = useMemo(() => [
    {
      title: "Empresas",
      value: userStats.clientsByType.empresas,
      icon: <PeopleIcon sx={{ fontSize: 36 }} />,
      color: "#1976D2"
    },
    {
      title: "Emprendedor",
      value: userStats.clientsByType.emprendedor,
      icon: <PersonIcon sx={{ fontSize: 36 }} />,
      color: "#00B8D4"
    },
    {
      title: "Persona natural",
      value: userStats.clientsByType['persona natural'],
      icon: <PersonIcon sx={{ fontSize: 36 }} />,
      color: "#43A047"
    },
    {
      title: "Institución educativa",
      value: userStats.clientsByType['institucion educativa'],
      icon: <PeopleIcon sx={{ fontSize: 36 }} />,
      color: "#FF9800"
    },
    {
      title: "Aprendiz/Instructor",
      value: userStats.clientsByType['aprendiz/instructor Sena'],
      icon: <PersonIcon sx={{ fontSize: 36 }} />,
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

        setAllMuestras(allMuestras); // Guardar todas las muestras en el estado

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

        const totalUsers = users.length;        const rolesUnicos = [...new Set(users.map(user => {
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

        const adminCount = users.filter(user => {
          const roleValue = user.rol?.nombre || user.rol?.name || user.rol || "";
          return String(roleValue).toLowerCase() === "administrador" || String(roleValue).toLowerCase() === "admin";
        }).length;

        const laboratoristCount = users.filter(user => {
          const roleValue = user.rol?.nombre || user.rol?.name || user.rol || "";
          return String(roleValue).toLowerCase() === "laboratorista";
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
        });        // console.log("Estadísticas de usuarios:", { totalUsers, clientCount, adminCount, laboratoristCount, clientsByType });

        setUserStats({ totalUsers, clientCount, adminCount, laboratoristCount, clientsByType });
      } catch (err) {
        console.error("Error al cargar usuarios:", err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          setUserError("Sesión expirada o no autorizada. Por favor, inicia sesión nuevamente.");
        } else {
          setUserError("Error al cargar la información de usuarios: " + (err.response?.data?.message || err.message));
        }
        setUserStats({ totalUsers: 0, clientCount: 0, adminCount: 0, laboratoristCount: 0, clientsByType: {
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
    };    // Definir los datos de los gráficos igual que en SampleCharts
    // (Usar los datos correctos del dashboard actual)
    const distributionData = {
      labels: [
        "Muestras Recibidas",
        "Muestras en Cotización",
        "Muestras en Análisis",
        "Muestras Rechazadas",
        "Finalizadas"
      ],
      datasets: [
        {
          data: [
            allMuestras.filter(s => s.estado === "Recibida").length,
            allMuestras.filter(s => s.estado === "En Cotizacion").length,
            allMuestras.filter(s => s.estado === "En análisis").length,
            allMuestras.filter(s => s.estado === "Rechazada").length,
            allMuestras.filter(s => s.estado === "Finalizada").length
          ],
          backgroundColor: [
            "#2196F3", // Recibidas
            "#00B8D4", // En Cotización
            "#39A900", // En Análisis
            "#D32F2F", // Rechazadas
            "#2E7D32"  // Finalizadas
          ],
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
    };    const userTypeData = {
      labels: [
        "Administradores",
        "Laboratoristas", 
        "Clientes",
        "Total Usuarios"
      ],
      datasets: [
        {
          data: [
            userStats.adminCount || 0,
            userStats.laboratoristCount || 0,
            userStats.clientCount || 0,
            userStats.totalUsers
          ],
          backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"],
          borderWidth: 1,
        },
      ],
    };
    const chartOptions = {
      plugins: { legend: { display: false } },
      cutout: '60%',
      responsive: false,
      animation: false,
    };    // --- Agregar gráficos de dona al PDF ---
    // Utilidad para crear un gráfico de Chart.js en un canvas oculto y devolver base64
    const getChartBase64 = (chartData, chartOptions) => {
      return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = 280; // Aumentado para mejor calidad
        canvas.height = 280;
        // Crear instancia Chart.js manualmente
        const chart = new Chart(canvas.getContext('2d'), {
          type: 'doughnut',
          data: chartData,
          options: {
            ...chartOptions,
            plugins: { 
              ...chartOptions.plugins, 
              legend: { display: false },
              tooltip: { enabled: false } // Desactivar tooltips para PDF
            },
            responsive: false,
            animation: false,
            cutout: '60%',
            elements: {
              arc: {
                borderWidth: 2,
                borderColor: '#ffffff'
              }
            }
          },
        });
        setTimeout(() => {
          resolve(canvas.toDataURL('image/png', 0.9)); // Mayor calidad
          chart.destroy();
        }, 500); // Más tiempo para renderizar completamente
      });
    };const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();    let y = 20; // Reducir margen superior

    // Header más compacto
    doc.setFillColor(57, 169, 0, 0.1);
    doc.rect(0, 0, pageWidth, 70, 'F'); // Reducir altura del header

    // Logo SENA más pequeño
    try {
      const logoBase64 = await getBase64FromImportedImage(logoSena);
      doc.addImage(logoBase64, "PNG", 30, 10, 60, 60); // Logo más pequeño
      
      // Información institucional más compacta
      doc.setFontSize(14); // Reducir tamaño de fuente
      doc.setTextColor(57, 169, 0);
      doc.setFont(undefined, 'bold');
      doc.text("SERVICIO NACIONAL DE APRENDIZAJE - SENA", 110, 25);
      doc.setFontSize(10); // Reducir tamaño
      doc.setTextColor(40, 40, 40);
      doc.setFont(undefined, 'normal');
      doc.text("Laboratorio AQUALAB", 110, 40);
      
      // Línea decorativa más delgada
      doc.setDrawColor(57, 169, 0);
      doc.setLineWidth(2);
      doc.line(20, 75, pageWidth - 20, 75);
      y = 90; // Reducir espacio después del header
    } catch (e) {
      console.error("Error cargando logo:", e);
      y = 30;
    }

    // Título principal más compacto
    doc.setFontSize(18); // Reducir tamaño
    doc.setTextColor(57, 169, 0);
    doc.setFont(undefined, 'bold');
    doc.text("INFORME DE PANEL DE CONTROL", pageWidth / 2, y, { align: "center" });
    y += 20; // Reducir espacio    // Subtítulo y fecha más compacto
    doc.setFillColor(240, 248, 255);
    doc.rect(30, y - 3, pageWidth - 60, 25, 'F'); // Más pequeño
    doc.setDrawColor(200, 200, 200);
    doc.rect(30, y - 3, pageWidth - 60, 25, 'S');
    
    doc.setFontSize(10); // Reducir tamaño
    doc.setTextColor(100, 100, 100);
    doc.setFont(undefined, 'normal');
    doc.text("Resumen Ejecutivo del Sistema de Gestión de Muestras", pageWidth / 2, y + 7, { align: "center" });
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-CO')}`, pageWidth / 2, y + 17, { align: "center" }); // Fecha más corta
    y += 50; // Aumentar considerablemente el espacio después del recuadro// --- Gráficos con mejor espaciado ---
    const [distImg, analImg, aguaImg, userImg] = await Promise.all([
      getChartBase64(distributionData, chartOptions),
      getChartBase64(analysisTypeData, chartOptions),
      getChartBase64(waterTypeData, chartOptions),
      getChartBase64(userTypeData, chartOptions),
    ]);
      const chartW = 120, chartH = 120, chartGapX = 45, chartGapY = 35; // Aumentar espaciado
    const totalWidth = (chartW * 2) + chartGapX;
    const centerX = (pageWidth - totalWidth) / 2;
    let chartX1 = centerX, chartX2 = centerX + chartW + chartGapX;
    let chartY = y + 25; // Aumentar más el espacio entre el inicio y los gráficos
    
    // Sección de gráficos con mejor espaciado
    doc.setFontSize(15); // Aumentar ligeramente
    doc.setTextColor(57, 169, 0);
    doc.setFont(undefined, 'bold');
    doc.text("ANÁLISIS VISUAL DE DATOS", pageWidth / 2, chartY - 25, { align: "center" }); // Más espacio antes del título
    
    // Primera fila de gráficos con más espacio
    doc.setFontSize(10); // Aumentar legibilidad
    doc.setTextColor(25, 118, 210);
    doc.setFont(undefined, 'bold');
    doc.text("Distribución de Muestras", chartX1 + chartW/2, chartY - 12, { align: "center" }); // Más espacio entre título y gráfico
    doc.text("Análisis por Tipo", chartX2 + chartW/2, chartY - 12, { align: "center" });
    
    // Marcos con mejor espaciado
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.5);
    doc.rect(chartX1 - 5, chartY - 5, chartW + 10, chartH + 10, 'S');
    doc.rect(chartX2 - 5, chartY - 5, chartW + 10, chartH + 10, 'S');
    
    doc.addImage(distImg, 'PNG', chartX1, chartY, chartW, chartH);
    doc.addImage(analImg, 'PNG', chartX2, chartY, chartW, chartH);
      chartY += chartH + chartGapY;    // Segunda fila de gráficos con mejor espaciado
    doc.setTextColor(67, 160, 71);
    doc.text("Tipo de Agua", chartX1 + chartW/2, chartY - 12, { align: "center" }); // Consistente con la primera fila
    doc.setTextColor(255, 99, 132);
    doc.text("Usuarios por Rol", chartX2 + chartW/2, chartY - 12, { align: "center" });
    
    // Marcos con mejor espaciado
    doc.rect(chartX1 - 5, chartY - 5, chartW + 10, chartH + 10, 'S');
    doc.rect(chartX2 - 5, chartY - 5, chartW + 10, chartH + 10, 'S');
    
    doc.addImage(aguaImg, 'PNG', chartX1, chartY, chartW, chartH);
    doc.addImage(userImg, 'PNG', chartX2, chartY, chartW, chartH);
    y = chartY + chartH + 30; // Más espacio después de gráficos    // Verificar si necesitamos una nueva página - más flexible
    if (y > pageHeight - 280) {
      doc.addPage();
      y = 40; // Más espacio en nueva página
    }
    
    // Sección de datos detallados con mejor espaciado
    doc.setFontSize(15);
    doc.setTextColor(57, 169, 0);
    doc.setFont(undefined, 'bold');
    doc.text("DATOS DETALLADOS DEL SISTEMA", pageWidth / 2, y, { align: "center" });
    y += 25; // Más espacio

    // 1. Distribución de Muestras con mejor espaciado
    doc.setFontSize(12);
    doc.setTextColor(25, 118, 210);
    doc.setFont(undefined, 'bold');
    doc.text("Distribución de Muestras por Estado", 40, y);
    y += 18;
    
    const muestrasRecibidas = allMuestras.filter(s => s.estado === "Recibida").length;
    const muestrasCotizacion = allMuestras.filter(s => s.estado === "En Cotizacion").length;
    const muestrasAnalisis = allMuestras.filter(s => s.estado === "En análisis").length;
    const muestrasRechazadas = allMuestras.filter(s => s.estado === "Rechazada").length;
    const muestrasFinalizadas = allMuestras.filter(s => s.estado === "Finalizada").length;    autoTable(doc, {
      startY: y,
      head: [["Estado de Muestra", "Cantidad", "%"]],
      body: [
        ["Recibidas", muestrasRecibidas, `${((muestrasRecibidas/allMuestras.length)*100).toFixed(1)}%`],
        ["En Cotización", muestrasCotizacion, `${((muestrasCotizacion/allMuestras.length)*100).toFixed(1)}%`],
        ["En Análisis", muestrasAnalisis, `${((muestrasAnalisis/allMuestras.length)*100).toFixed(1)}%`],
        ["Rechazadas", muestrasRechazadas, `${((muestrasRechazadas/allMuestras.length)*100).toFixed(1)}%`],
        ["Finalizadas", muestrasFinalizadas, `${((muestrasFinalizadas/allMuestras.length)*100).toFixed(1)}%`],
        ["TOTAL", allMuestras.length, "100%"]
      ],
      theme: "striped",
      headStyles: { 
        fillColor: [33, 150, 243], 
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      styles: { 
        fontSize: 9,
        cellPadding: 6, // Más padding para mejor legibilidad
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'left', fontStyle: 'bold' },
        1: { halign: 'center' },
        2: { halign: 'center', fontStyle: 'bold' }
      },
      margin: { left: 40, right: 40 },
      tableWidth: 'auto',
    });
    y = doc.lastAutoTable.finalY + 20; // Más espacio entre tablas    // 2. Muestras por Tipo de Análisis con mejor espaciado
    doc.setFontSize(12);
    doc.setTextColor(255, 99, 132);
    doc.setFont(undefined, 'bold');
    doc.text("Análisis por Tipo", 40, y);
    y += 18;
    
    const totalAnalisis = sampleStats.microbiologicalSamples + sampleStats.physicochemicalSamples;    autoTable(doc, {
      startY: y,
      head: [["Tipo de Análisis", "Cantidad", "%"]],
      body: [
        ["Microbiológicos", sampleStats.microbiologicalSamples, `${totalAnalisis > 0 ? ((sampleStats.microbiologicalSamples/totalAnalisis)*100).toFixed(1) : 0}%`],
        ["Fisicoquímicos", sampleStats.physicochemicalSamples, `${totalAnalisis > 0 ? ((sampleStats.physicochemicalSamples/totalAnalisis)*100).toFixed(1) : 0}%`],
        ["TOTAL", totalAnalisis, "100%"]
      ],
      theme: "striped",
      headStyles: { 
        fillColor: [255, 99, 132], 
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      styles: { 
        fontSize: 9, 
        cellPadding: 6,
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'left', fontStyle: 'bold' },
        1: { halign: 'center' },
        2: { halign: 'center', fontStyle: 'bold' }
      },
      margin: { left: 40, right: 40 },
      tableWidth: 'auto',
    });
    y = doc.lastAutoTable.finalY + 20;

    // 3. Muestras por Tipo de Agua con mejor espaciado
    doc.setFontSize(12);
    doc.setTextColor(67, 160, 71);
    doc.setFont(undefined, 'bold');
    doc.text("Tipo de Agua", 40, y);
    y += 18;
    
    const totalAgua = waterTypeStats.potable + waterTypeStats.natural + waterTypeStats.residual + waterTypeStats.otra;    autoTable(doc, {
      startY: y,
      head: [["Tipo de Agua", "Cantidad", "%"]],
      body: [
        ["Potable", waterTypeStats.potable, `${totalAgua > 0 ? ((waterTypeStats.potable/totalAgua)*100).toFixed(1) : 0}%`],
        ["Natural", waterTypeStats.natural, `${totalAgua > 0 ? ((waterTypeStats.natural/totalAgua)*100).toFixed(1) : 0}%`],
        ["Residual", waterTypeStats.residual, `${totalAgua > 0 ? ((waterTypeStats.residual/totalAgua)*100).toFixed(1) : 0}%`],
        ["Otra", waterTypeStats.otra, `${totalAgua > 0 ? ((waterTypeStats.otra/totalAgua)*100).toFixed(1) : 0}%`],
        ["TOTAL", totalAgua, "100%"]
      ],
      theme: "striped",
      headStyles: { 
        fillColor: [0, 184, 212], 
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      styles: { 
        fontSize: 9, 
        cellPadding: 6,
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'left', fontStyle: 'bold' },
        1: { halign: 'center' },
        2: { halign: 'center', fontStyle: 'bold' }
      },
      margin: { left: 40, right: 40 },
      tableWidth: 'auto',
    });
    y = doc.lastAutoTable.finalY + 20;    // Verificar si necesitamos una nueva página - más espacio
    if (y > pageHeight - 180) {
      doc.addPage();
      y = 40;
    }

    // 4. Usuarios por Rol con mejor espaciado
    doc.setFontSize(12);
    doc.setTextColor(33, 150, 243);
    doc.setFont(undefined, 'bold');
    doc.text("Usuarios por Rol", 40, y);
    y += 18;
    
    autoTable(doc, {
      startY: y,
      head: [["Tipo de Usuario", "Cantidad", "%"]],
      body: [
        ["Administradores", userStats.adminCount || 0, `${userStats.totalUsers > 0 ? (((userStats.adminCount || 0)/userStats.totalUsers)*100).toFixed(1) : 0}%`],
        ["Laboratoristas", userStats.laboratoristCount || 0, `${userStats.totalUsers > 0 ? (((userStats.laboratoristCount || 0)/userStats.totalUsers)*100).toFixed(1) : 0}%`],
        ["Clientes", userStats.clientCount || 0, `${userStats.totalUsers > 0 ? (((userStats.clientCount || 0)/userStats.totalUsers)*100).toFixed(1) : 0}%`],
        ["TOTAL", userStats.totalUsers, "100%"]
      ],
      theme: "striped",
      headStyles: { 
        fillColor: [33, 150, 243], 
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      styles: { 
        fontSize: 9, 
        cellPadding: 6,
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'left', fontStyle: 'bold' },
        1: { halign: 'center' },
        2: { halign: 'center', fontStyle: 'bold' }
      },
      margin: { left: 40, right: 40 },
      tableWidth: 'auto',
    });
    y = doc.lastAutoTable.finalY + 20;

    // 5. Clientes por Tipo con mejor espaciado
    doc.setFontSize(12);
    doc.setTextColor(142, 36, 170);
    doc.setFont(undefined, 'bold');
    doc.text("Clientes por Tipo", 40, y);
    y += 18;
    
    const totalClientes = Object.values(userStats.clientsByType).reduce((sum, val) => sum + val, 0);    autoTable(doc, {
      startY: y,
      head: [["Tipo de Cliente", "Cantidad", "%"]],
      body: [
        ["Empresas", userStats.clientsByType.empresas, `${totalClientes > 0 ? ((userStats.clientsByType.empresas/totalClientes)*100).toFixed(1) : 0}%`],
        ["Emprendedor", userStats.clientsByType.emprendedor, `${totalClientes > 0 ? ((userStats.clientsByType.emprendedor/totalClientes)*100).toFixed(1) : 0}%`],
        ["Persona Natural", userStats.clientsByType["persona natural"], `${totalClientes > 0 ? ((userStats.clientsByType["persona natural"]/totalClientes)*100).toFixed(1) : 0}%`],
        ["Inst. Educativa", userStats.clientsByType["institucion educativa"], `${totalClientes > 0 ? ((userStats.clientsByType["institucion educativa"]/totalClientes)*100).toFixed(1) : 0}%`],
        ["SENA", userStats.clientsByType["aprendiz/instructor Sena"], `${totalClientes > 0 ? ((userStats.clientsByType["aprendiz/instructor Sena"]/totalClientes)*100).toFixed(1) : 0}%`],
        ["TOTAL", totalClientes, "100%"]
      ],
      theme: "striped",
      headStyles: { 
        fillColor: [142, 36, 170], 
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10
      },
      styles: { 
        fontSize: 9, 
        cellPadding: 6,
        halign: 'center'
      },
      columnStyles: {
        0: { halign: 'left', fontStyle: 'bold' },
        1: { halign: 'center' },
        2: { halign: 'center', fontStyle: 'bold' }
      },
      margin: { left: 40, right: 40 },
      tableWidth: 'auto',
    });
    y = doc.lastAutoTable.finalY + 25; // Más espacio para el footer    // Footer con mejor espaciado
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.setFont(undefined, 'italic');
    const footerY = pageHeight - 30;
    doc.text("Generado por SENA-LAB Dashboard", pageWidth / 2, footerY, { align: "center" });
    doc.text(`© ${new Date().getFullYear()} SENA`, pageWidth / 2, footerY + 10, { align: "center" });

    // Guardar con nombre más descriptivo
    const fecha = new Date().toISOString().split('T')[0];
    doc.save(`Informe-Dashboard-AQUALAB-${fecha}.pdf`);
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

  // Mostrar estados únicos y su cantidad para depuración
  const estadosUnicos = allMuestras.reduce((acc, muestra) => {
    const estado = muestra.estado || 'Sin estado';
    acc[estado] = (acc[estado] || 0) + 1;
    return acc;
  }, {});
  console.log('Estados únicos de muestras:', estadosUnicos);
  if (loadingSamples || loadingUsers) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress sx={{ color: "#39A900" }} />
      </Box>
    );
  }

  return (
    <Box sx={{...dashboardStyle, position: "relative", zIndex: 2}}>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        <Box sx={{ textAlign: "center", mb: 6 }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 900,
              background: "linear-gradient(135deg, #39A900 0%, #2E7D32 50%, #1B5E20 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: "0 4px 20px rgba(57,169,0,0.3)",
              fontSize: { xs: '2.5rem', md: '3.5rem', lg: '4rem' },
              letterSpacing: 2,
              mb: 2,
              position: "relative",
              "&::after": {
                content: '""',
                position: "absolute",
                bottom: -10,
                left: "50%",
                transform: "translateX(-50%)",
                width: 100,
                height: 4,
                background: "linear-gradient(90deg, #39A900, #2E7D32)",
                borderRadius: 2,
              }
            }}
          >
            PANEL DE CONTROL
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: "text.secondary",
              fontWeight: 400,
              fontSize: { xs: '1rem', md: '1.2rem' },
              letterSpacing: 1,
              opacity: 0.8
            }}
          >
            Sistema de Gestión AQUALAB - SENA
          </Typography>
        </Box>
      </motion.div>

      {(sampleError || userError) && renderError()}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <Grid container spacing={3} sx={{ mb: 5 }}>
          {statCardData.map((card, idx) => (
            <Grid item xs={12} sm={6} lg={4} key={idx}>
              <StatCard
                title={card.title}
                value={card.value}
                icon={card.icon}
                color={card.color}
              />
            </Grid>
          ))}
        </Grid>
      </motion.div>

      <SampleCharts 
        sampleStats={sampleStats} 
        waterTypeStats={waterTypeStats} 
        userTypeStats={userStats.clientsByType} 
        allMuestras={allMuestras} 
      />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <Paper
          elevation={6}
          sx={{
            p: 4,
            borderRadius: 4,
            background: "linear-gradient(135deg, #e3f2fd 0%, #d7f7dd 50%, #f3e5f5 100%)",
            boxShadow: '0 12px 40px rgba(57,169,0,0.15)',
            mb: 4,
            position: "relative",
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: "linear-gradient(90deg, #1976D2, #39A900, #8E24AA)",
            }
          }}
        >
          <Typography 
            variant="h4" 
            sx={{ 
              mb: 4, 
              background: "linear-gradient(135deg, #1976D2 0%, #39A900 50%, #8E24AA 100%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontWeight: 900, 
              textAlign: 'center', 
              letterSpacing: 2,
              fontSize: { xs: '1.8rem', md: '2.5rem' }
            }}
          >
            USUARIOS REGISTRADOS
          </Typography>          <Grid container spacing={3} justifyContent="center">
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Administradores"
                value={userStats.adminCount}
                icon={<AdminPanelSettingsIcon sx={{ fontSize: 48 }} />}
                color="#FF5722"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Laboratoristas"
                value={userStats.laboratoristCount}
                icon={<ScienceIcon sx={{ fontSize: 48 }} />}
                color="#9C27B0"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Clientes"
                value={userStats.clientCount}
                icon={<PersonIcon sx={{ fontSize: 48 }} />}
                color="#4CAF50"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Usuarios"
                value={userStats.totalUsers}
                icon={<PeopleIcon sx={{ fontSize: 48 }} />}
                color="#2196F3"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography 
                variant="h5"
                align="center"
                sx={{
                  fontWeight: 700,
                  letterSpacing: 1.5,
                  mt: 4,
                  mb: 3,
                  background: "linear-gradient(135deg, #43A047 0%, #2E7D32 100%)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  textTransform: 'uppercase',
                  fontSize: { xs: '1.2rem', md: '1.5rem' },
                }}
              >
                Clientes por tipo
              </Typography>
              <Grid container spacing={3} justifyContent="center">
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

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4, mb: 2 }}>
          <Button
            variant="contained"
            color="success"
            startIcon={<PictureAsPdfIcon />}
            size="large"
            sx={{ 
              borderRadius: 3, 
              fontWeight: "bold", 
              fontSize: 16, 
              px: 4, 
              py: 1.5,
              boxShadow: "0 4px 20px rgba(57,169,0,0.3)",
              background: "linear-gradient(45deg, #39A900 30%, #2E7D32 90%)",
              '&:hover': {
                background: "linear-gradient(45deg, #2E7D32 30%, #1B5E20 90%)",
                boxShadow: "0 6px 25px rgba(57,169,0,0.4)",
                transform: "translateY(-2px)"
              },
              transition: "all 0.3s ease"
            }}
            onClick={generateDashboardPDF}
          >
            Descargar Informe PDF
          </Button>
        </Box>
      </motion.div>
    </Box>
  );
};

export default Dashboard;