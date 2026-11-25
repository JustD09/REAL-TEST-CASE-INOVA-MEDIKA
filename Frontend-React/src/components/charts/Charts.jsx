import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine
} from 'recharts';
import { MotionCard } from '../motion/MotionWrapper';
import { formatNumber } from '../../utils/format';

// Color palette for charts - professional medical theme
const CHART_COLORS = [
  '#0d6efd', '#14b8a6', '#10b981', '#f59e0b',
  '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899',
  '#6366f1', '#f97316', '#22c55e', '#eab308'
];

// Gradient definitions for charts
const Gradients = ({ colors = CHART_COLORS }) => (
  <defs>
    {colors.map((color, i) => (
      <linearGradient key={i} id={`gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity="0.25" />
        <stop offset="100%" stopColor={color} stopOpacity="0" />
      </linearGradient>
    ))}
    <pattern id="gridPattern" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#e8ecf1" strokeWidth="0.5" />
    </pattern>
  </defs>
);

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Box sx={{
        bg: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 12,
        p: 2,
        boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
        minWidth: 200,
        zIndex: 999
      }}>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>{label}</Typography>
        {payload.map((entry, index) => (
          <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: entry.color }} />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>{entry.name}</Typography>
            <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
              {typeof entry.value === 'number' ? formatNumber(entry.value) : entry.value}
            </Typography>
          </Box>
        ))}
      </Box>
    );
  }
  return null;
};

// Line Chart Card - SVG based with smooth curves
export function LineChartCard({ title, subtitle, data, xKey, series, height = 350, animate = true }) {
  return (
    <MotionCard hover={false} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" fontWeight={600} color="text.primary" gutterBottom>{title}</Typography>
          {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
        </Box>
        <Box sx={{ flex: 1, position: 'relative', height: height - 80 }}>
          <ResponsiveContainer width="100%" height="100%">
            <Gradients colors={series.map(s => s.color).filter(Boolean)} />
            <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="0" vertical={false} stroke="#e8ecf1" />
              <XAxis
                dataKey={xKey}
                tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'Inter, system-ui', fontWeight: 400 }}
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'Inter, system-ui', fontWeight: 400 }}
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tickFormatter={(value) => formatNumber(value)}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                layout="horizontal"
                align="center"
                verticalAlign="bottom"
                wrapperStyle={{ paddingTop: 10 }}
                iconType="circle"
                iconSize={8}
                payload={series.map(s => ({ id: s.key, value: s.label, color: s.color || CHART_COLORS[0] }))}
                formatter={(value) => value}
              />
              {series.map((s, i) => (
                <Line
                  key={s.key}
                  type="natural"
                  dataKey={s.key}
                  name={s.label}
                  stroke={s.color || CHART_COLORS[i % CHART_COLORS.length]}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 2, fill: '#fff' }}
                  isAnimationActive={animate}
                  animationDuration={1000}
                  animationEasing="easeOut"
                  connectNulls={true}
                />
              ))}
              {series.map((s, i) => (
                <Area
                  key={`area-${s.key}`}
                  type="natural"
                  dataKey={s.key}
                  fill={`url(#gradient-${(s.color || CHART_COLORS[i % CHART_COLORS.length]).replace('#', '')})`}
                  isAnimationActive={animate}
                  animationDuration={1200}
                  animationEasing="easeOut"
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </MotionCard>
  );
}

// Area Chart Card - SVG based with gradient fill
export function AreaChartCard({ title, subtitle, data, xKey, series, height = 300, animate = true }) {
  return (
    <MotionCard hover={false} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" fontWeight={600} color="text.primary" gutterBottom>{title}</Typography>
          {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
        </Box>
        <Box sx={{ flex: 1, position: 'relative', height: height - 80 }}>
          <ResponsiveContainer width="100%" height="100%">
            <Gradients colors={series.map(s => s.color).filter(Boolean)} />
            <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="0" vertical={false} stroke="#e8ecf1" />
              <XAxis
                dataKey={xKey}
                tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'Inter, system-ui', fontWeight: 400 }}
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'Inter, system-ui', fontWeight: 400 }}
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                tickFormatter={(value) => formatNumber(value)}
                width={40}
              />
              <Tooltip content={<CustomTooltip />} />
              {series.map((s, i) => (
                <Area
                  key={s.key}
                  type="natural"
                  dataKey={s.key}
                  name={s.label}
                  stroke={s.color || CHART_COLORS[i % CHART_COLORS.length]}
                  fill={`url(#gradient-${(s.color || CHART_COLORS[i % CHART_COLORS.length]).replace('#', '')})`}
                  strokeWidth={2.5}
                  isAnimationActive={animate}
                  animationDuration={1000}
                  animationEasing="easeOut"
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </MotionCard>
  );
}

// Bar Chart Card - SVG based with rounded bars
export function BarChartCard({ title, subtitle, data, xKey, series, height = 300, animate = true }) {
  return (
    <MotionCard hover={false} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" fontWeight={600} color="text.primary" gutterBottom>{title}</Typography>
          {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
        </Box>
        <Box sx={{ flex: 1, position: 'relative', height: height - 80 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }} layout="vertical">
              <CartesianGrid strokeDasharray="0" horizontal={false} stroke="#e8ecf1" />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'Inter, system-ui', fontWeight: 400 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatNumber(value)}
                width={40}
              />
              <YAxis
                type="category"
                dataKey={xKey}
                tick={{ fontSize: 11, fill: '#64748b', fontFamily: 'Inter, system-ui', fontWeight: 400 }}
                tickLine={false}
                axisLine={false}
                tickMargin={10}
                width={120}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                layout="horizontal"
                align="center"
                verticalAlign="bottom"
                wrapperStyle={{ paddingTop: 10 }}
                iconType="circle"
                iconSize={8}
                payload={series.map(s => ({ id: s.key, value: s.label, color: s.color || CHART_COLORS[0] }))}
              />
              {series.map((s, i) => (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  name={s.label}
                  fill={s.color || CHART_COLORS[i % CHART_COLORS.length]}
                  radius={[0, 6, 6, 0]}
                  maxBarSize={48}
                  isAnimationActive={animate}
                  animationDuration={1000}
                  animationEasing="easeOut"
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </MotionCard>
  );
}

// Pie Chart Card - SVG based with donut style
export function PieChartCard({ title, subtitle, data, dataKey, nameKey, colors, height = 300, animate = true }) {
  const chartColors = colors || CHART_COLORS;
  const total = data.reduce((sum, item) => sum + (item[dataKey] || 0), 0);

  return (
    <MotionCard hover={false} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" fontWeight={600} color="text.primary" gutterBottom>{title}</Typography>
          {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
        </Box>
        <Box sx={{ flex: 1, position: 'relative', height: height - 80, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={115}
                paddingAngle={3}
                dataKey={dataKey}
                nameKey={nameKey}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                labelLine={false}
                isAnimationActive={animate}
                animationDuration={1200}
                animationEasing="easeOut"
                labelProps={{
                  fontSize: 12,
                  fontFamily: 'Inter, system-ui',
                  fontWeight: 500,
                  fill: '#334155'
                }}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {total > 0 && (
            <Box sx={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' }}>
              <Typography variant="h4" fontWeight={700} color="text.primary" sx={{ lineHeight: 1.2 }}>
                {formatNumber(total)}
              </Typography>
              <Typography variant="caption" color="text.secondary">Total</Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </MotionCard>
  );
}

// Sparkline - Pure SVG for inline trends
export function Sparkline({ data, color = '#0d6efd', height = 40, width = 120, animate = true }) {
  if (!data || data.length === 0) {
    return <Box width={width} height={height} />;
  }

  const minValue = Math.min(...data);
  const maxValue = Math.max(...data);
  const range = maxValue - minValue || 1;

  const points = data.map((value, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((value - minValue) / range) * height,
  }));

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
  const pathArea = `${path} L ${width} ${height} L 0 ${height} Z`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible', display: 'block' }}>
      <defs>
        <linearGradient id={`spark-gradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <style>
        {`
          @keyframes dash {
            to { stroke-dashoffset: 0; }
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}
      </style>
      <path
        d={pathArea}
        fill={`url(#spark-gradient-${color.replace('#', '')})`}
        style={{ opacity: 0.5, animation: animate ? 'fadeIn 0.8s ease-out' : 'none' }}
      />
      <path
        d={path}
        stroke={color}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
          ...(animate && {
            animation: 'dash 1.2s ease-out forwards, fadeIn 0.8s ease-out',
            strokeDasharray: width * 2,
            strokeDashoffset: width * 2,
          })
        }}
      />
      {/* End dot */}
      {points.length > 0 && (
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r={4}
          fill={color}
          stroke="#fff"
          strokeWidth="2"
          style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))', animation: animate ? 'fadeIn 0.8s ease-out 0.8s both' : 'none' }}
        />
      )}
    </svg>
  );
}