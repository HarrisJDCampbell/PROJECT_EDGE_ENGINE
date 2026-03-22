/**
 * VisBets Color System
 * Neon-futuristic dark theme palette
 */

export const colors = {
  // Background
  background: {
    primary: '#0A0A0B',    // Near black
    secondary: '#1A1A1C',  // Card background
    tertiary: '#2A2A2C',   // Elevated surfaces
    card: '#1A1A1C',       // Alias for secondary
    elevated: '#2A2A2C',   // Alias for tertiary
  },

  // Primary (Neon Green)
  primary: {
    main: '#00FF88',       // Neon cash green
    light: '#33FFA3',
    dark: '#00CC6D',
    glow: 'rgba(0, 255, 136, 0.4)',
  },

  // Semantic colors (top-level)
  success: '#00FF88',      // Same as primary
  warning: '#FFB800',      // Amber/gold
  danger: '#FF0055',       // Hot pink/red
  info: '#00D4FF',         // Electric blue

  // Semantic colors (grouped)
  semantic: {
    success: '#00FF88',
    warning: '#FFB800',
    danger: '#FF0055',
    info: '#00D4FF',
  },

  // Text
  text: {
    primary: '#FFFFFF',
    secondary: '#B3B3B3',
    tertiary: '#666666',     // Alias for muted
    muted: '#666666',
    disabled: '#404040',
  },

  // Borders & Dividers
  border: {
    default: '#2A2A2C',
    light: '#333333',
    focus: '#00FF88',
  },

  // Overlay & Modals
  overlay: 'rgba(10, 10, 11, 0.85)',
  modalBackground: '#1A1A1C',

  // Status indicators
  status: {
    online: '#00FF88',
    offline: '#666666',
    pending: '#FFB800',
    error: '#FF0055',
  },

  // Chart colors
  chart: {
    line: '#00FF88',
    area: 'rgba(0, 255, 136, 0.2)',
    grid: '#2A2A2C',
    axis: '#666666',
  },

  // Risk level colors
  risk: {
    low: '#00FF88',
    medium: '#FFB800',
    high: '#FF0055',
  },

  // Edge colors (positive vs negative)
  edge: {
    positive: '#00FF88',
    negative: '#FF0055',
    neutral: '#666666',
  },
} as const;

export type Colors = typeof colors;
