/**
 * VisBets Typography System
 * Font styles and text presets
 */

import { TextStyle } from 'react-native';

export const typography = {
  // Font sizes
  fontSize: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 14,        // Alias for base
    lg: 16,
    xl: 18,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },

  // Font weights
  fontWeight: {
    regular: '400' as TextStyle['fontWeight'],
    medium: '500' as TextStyle['fontWeight'],
    semibold: '600' as TextStyle['fontWeight'],
    bold: '700' as TextStyle['fontWeight'],
    extrabold: '800' as TextStyle['fontWeight'],
  },

  // Line heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Preset text styles
  presets: {
    // Headers
    h1: {
      fontSize: 36,
      fontWeight: '800' as TextStyle['fontWeight'],
      lineHeight: 42,
      letterSpacing: -0.5,
    },
    h2: {
      fontSize: 30,
      fontWeight: '700' as TextStyle['fontWeight'],
      lineHeight: 36,
      letterSpacing: -0.3,
    },
    h3: {
      fontSize: 24,
      fontWeight: '700' as TextStyle['fontWeight'],
      lineHeight: 30,
      letterSpacing: -0.2,
    },
    h4: {
      fontSize: 18,
      fontWeight: '600' as TextStyle['fontWeight'],
      lineHeight: 24,
    },

    // Body text
    body: {
      fontSize: 14,
      fontWeight: '400' as TextStyle['fontWeight'],
      lineHeight: 21,
    },
    bodyLarge: {
      fontSize: 16,
      fontWeight: '400' as TextStyle['fontWeight'],
      lineHeight: 24,
    },
    bodySmall: {
      fontSize: 12,
      fontWeight: '400' as TextStyle['fontWeight'],
      lineHeight: 18,
    },

    // Labels & UI
    label: {
      fontSize: 12,
      fontWeight: '500' as TextStyle['fontWeight'],
      lineHeight: 16,
      textTransform: 'uppercase' as TextStyle['textTransform'],
      letterSpacing: 0.5,
    },
    caption: {
      fontSize: 10,
      fontWeight: '400' as TextStyle['fontWeight'],
      lineHeight: 14,
    },

    // Special
    button: {
      fontSize: 14,
      fontWeight: '600' as TextStyle['fontWeight'],
      lineHeight: 20,
      letterSpacing: 0.3,
    },
    stat: {
      fontSize: 48,
      fontWeight: '800' as TextStyle['fontWeight'],
      lineHeight: 56,
      letterSpacing: -1,
    },
  },
} as const;

export type Typography = typeof typography;
