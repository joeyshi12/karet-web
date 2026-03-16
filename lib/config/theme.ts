export const THEME_COLORS = {
  carrotOrange: '#FF6B35',
  leafyGreen: '#4CAF50',
  softCream: '#FFF8E7',
  chartColors: [
    '#FF6B35', // carrot orange
    '#4CAF50', // leafy green
    '#FF8C5A', // light orange
    '#66BB6A', // light green
    '#FFB088', // peach
    '#81C784', // mint
    '#E65100', // dark orange
    '#388E3C', // dark green
  ]
} as const;

export type ThemeColors = typeof THEME_COLORS;
