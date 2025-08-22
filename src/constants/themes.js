export const THEME_COLORS = {
  light: {
    // 主色调
    primary: '#667eea',
    primaryHover: '#5a67d8',
    secondary: '#6c757d',
    secondaryHover: '#5a6268',
    success: '#28a745',
    successHover: '#218838',
    warning: '#ffc107',
    warningHover: '#e0a800',
    danger: '#dc3545',
    dangerHover: '#c82333',
    info: '#17a2b8',
    infoHover: '#138496',

    // 背景色
    bodyBackground: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    containerBackground: '#ffffff',
    sectionBackground: '#f8f9fa',
    cardBackground: '#ffffff',
    inputBackground: '#ffffff',

    // 文字颜色
    textPrimary: '#495057',
    textSecondary: '#6c757d',
    textMuted: '#6c757d',
    textOnPrimary: '#ffffff',

    // 边框颜色
    borderPrimary: '#dee2e6',
    borderSecondary: '#e9ecef',
    borderFocus: '#667eea',

    // 状态颜色
    statusValid: '#28a745',
    statusInvalid: '#dc3545',
    statusRateLimit: '#ffc107',
    statusTesting: '#6f42c1',
    statusRetrying: '#fd7e14',

    // 阴影
    shadowLight: '0 2px 4px rgba(0, 0, 0, 0.1)',
    shadowMedium: '0 4px 12px rgba(0, 0, 0, 0.15)',
    shadowHeavy: '0 20px 60px rgba(0, 0, 0, 0.1)'
  },
  dark: {
    // 主色调
    primary: '#4c63d2',
    primaryHover: '#3c52d2',
    secondary: '#3c4269',
    secondaryHover: '#4a5079',
    success: '#28a745',
    successHover: '#218838',
    warning: '#d68910',
    warningHover: '#b7791f',
    danger: '#dc3545',
    dangerHover: '#c82333',
    info: '#17a2b8',
    infoHover: '#138496',

    // 背景色
    bodyBackground: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    containerBackground: 'linear-gradient(135deg, #232741 0%, #1e1e2e 100%)',
    sectionBackground: 'linear-gradient(135deg, #2a2d47 0%, #232741 100%)',
    cardBackground: 'linear-gradient(135deg, #1e1e2e 0%, #232741 100%)',
    inputBackground: 'linear-gradient(135deg, #1e1e2e 0%, #232741 100%)',

    // 文字颜色
    textPrimary: '#e8eaed',
    textSecondary: '#b0b3c1',
    textMuted: '#b0b3c1',
    textOnPrimary: '#ffffff',

    // 边框颜色
    borderPrimary: '#3c4269',
    borderSecondary: '#3c4269',
    borderFocus: '#4c63d2',

    // 状态颜色
    statusValid: '#28a745',
    statusInvalid: '#dc3545',
    statusRateLimit: '#d68910',
    statusTesting: '#6f42c1',
    statusRetrying: '#fd7e14',

    // 阴影
    shadowLight: '0 2px 4px rgba(0, 0, 0, 0.3)',
    shadowMedium: '0 4px 12px rgba(0, 0, 0, 0.2)',
    shadowHeavy: '0 20px 60px rgba(0, 0, 0, 0.3)'
  }
};

export const THEME_TRANSITIONS = {
  fast: '0.15s ease',
  normal: '0.3s ease',
  slow: '0.5s ease'
};

export const THEME_BREAKPOINTS = {
  mobile: '768px',
  tablet: '1024px',
  desktop: '1200px'
};

export const THEME_FONT_SIZES = {
  xs: 'clamp(10px, 1.8vw, 12px)',
  sm: 'clamp(12px, 2vw, 14px)',
  base: 'clamp(14px, 2.5vw, 16px)',
  lg: 'clamp(16px, 3vw, 18px)',
  xl: 'clamp(1.2rem, 4vw, 1.5rem)',
  '2xl': 'clamp(1.5rem, 4vw, 2rem)',
  '3xl': 'clamp(1.8rem, 5vw, 2.5rem)'
};

export const THEME_SPACING = {
  xs: '4px',
  sm: '8px',
  base: '12px',
  md: '16px',
  lg: '20px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '48px'
};

export const THEME_BORDER_RADIUS = {
  sm: '4px',
  base: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  full: '50%'
};

export const THEME_Z_INDEX = {
  dropdown: 1000,
  modal: 1050,
  tooltip: 1070,
  toast: 1080
};
