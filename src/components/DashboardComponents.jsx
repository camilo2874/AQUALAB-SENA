// Componentes optimizados para el Dashboard
import React, { memo } from 'react';
import { Paper, Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { Doughnut } from 'react-chartjs-2';

// Tarjeta de estadística optimizada con memo
export const MemoizedStatCard = memo(({ title, value, icon, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <Paper
      elevation={3}
      sx={{
        p: 2,
        textAlign: 'center',
        borderRadius: 2,
        background: `linear-gradient(45deg, ${color}20, #ffffff)`,
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        transition: 'transform 0.3s',
        '&:hover': { transform: 'scale(1.05)' },
        height: '100%', // Asegurar altura consistente
      }}
    >
      <Box sx={{ mb: 1, color, display: 'flex', justifyContent: 'center' }}>
        {icon}
      </Box>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        {title}
      </Typography>
      <Typography variant="h5" color={color} fontWeight="bold">
        <CountUp end={value} duration={2} enableScrollSpy />
      </Typography>
    </Paper>
  </motion.div>
));

// Componente gráfico optimizado con memo
export const MemoizedChartComponent = memo(({ data, options }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
  >
    <Paper
      elevation={3}
      sx={{
        p: 2,
        borderRadius: 2,
        height: '100%',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      }}
    >
      <Doughnut data={data} options={options} />
    </Paper>
  </motion.div>
));

// Componente para mostrar un esqueleto durante la carga
export const StatCardSkeleton = () => (
  <Paper
    elevation={3}
    sx={{
      p: 2,
      height: '100%',
      borderRadius: 2,
      background: 'transparent',
    }}
  >
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Box 
        className="content-placeholder" 
        sx={{ height: '30px', width: '30px', mx: 'auto', borderRadius: '50%' }}
      />
      <Box 
        className="content-placeholder" 
        sx={{ height: '20px', width: '80%', mx: 'auto' }}
      />
      <Box 
        className="content-placeholder" 
        sx={{ height: '30px', width: '50%', mx: 'auto' }}
      />
    </Box>
  </Paper>
);

// Componente optimizado para títulos de secciones
export const SectionTitle = memo(({ title, icon }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
    {icon && <Box sx={{ mr: 1 }}>{icon}</Box>}
    <Typography variant="h5" component="h2" color="primary" fontWeight="500">
      {title}
    </Typography>
  </Box>
));
