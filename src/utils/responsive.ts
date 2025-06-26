import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions for design (using iPhone 12 Pro as base)
const baseWidth = 390;
const baseHeight = 844;

// Screen size breakpoints
export const BREAKPOINTS = {
  SMALL: 320,    // iPhone SE, older Androids
  MEDIUM: 375,   // Most modern phones
  LARGE: 414,    // Plus models, larger Androids
  XLARGE: 480,   // Very large phones
};

// Get current screen size category
export const getScreenSize = () => {
  if (SCREEN_WIDTH <= BREAKPOINTS.SMALL) return 'small';
  if (SCREEN_WIDTH <= BREAKPOINTS.MEDIUM) return 'medium';
  if (SCREEN_WIDTH <= BREAKPOINTS.LARGE) return 'large';
  return 'xlarge';
};

// Responsive scaling functions
export const scale = (size: number) => {
  const newSize = size * (SCREEN_WIDTH / baseWidth);
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

export const verticalScale = (size: number) => {
  const newSize = size * (SCREEN_HEIGHT / baseHeight);
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

export const moderateScale = (size: number, factor = 0.5) => {
  const newSize = size + (scale(size) - size) * factor;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

// Responsive font sizes
export const fontSize = {
  xs: moderateScale(10),
  sm: moderateScale(12),
  base: moderateScale(14),
  lg: moderateScale(16),
  xl: moderateScale(18),
  '2xl': moderateScale(20),
  '3xl': moderateScale(24),
  '4xl': moderateScale(28),
  '5xl': moderateScale(32),
  '6xl': moderateScale(36),
};

// Responsive spacing
export const spacing = {
  xs: moderateScale(4),
  sm: moderateScale(8),
  md: moderateScale(12),
  lg: moderateScale(16),
  xl: moderateScale(20),
  '2xl': moderateScale(24),
  '3xl': moderateScale(32),
  '4xl': moderateScale(40),
  '5xl': moderateScale(48),
  '6xl': moderateScale(56),
};

// Responsive padding/margin
export const padding = {
  xs: moderateScale(4),
  sm: moderateScale(8),
  md: moderateScale(12),
  lg: moderateScale(16),
  xl: moderateScale(20),
  '2xl': moderateScale(24),
  '3xl': moderateScale(32),
};

// Responsive border radius
export const borderRadius = {
  none: 0,
  sm: moderateScale(4),
  md: moderateScale(8),
  lg: moderateScale(12),
  xl: moderateScale(16),
  '2xl': moderateScale(20),
  full: 9999,
};

// Responsive icon sizes
export const iconSize = {
  xs: moderateScale(12),
  sm: moderateScale(16),
  md: moderateScale(20),
  lg: moderateScale(24),
  xl: moderateScale(28),
  '2xl': moderateScale(32),
  '3xl': moderateScale(40),
};

// Responsive button sizes
export const buttonSize = {
  sm: {
    height: moderateScale(32),
    paddingHorizontal: moderateScale(12),
    fontSize: fontSize.sm,
  },
  md: {
    height: moderateScale(44), // Minimum touchable area
    paddingHorizontal: moderateScale(16),
    fontSize: fontSize.base,
  },
  lg: {
    height: moderateScale(48),
    paddingHorizontal: moderateScale(20),
    fontSize: fontSize.lg,
  },
  xl: {
    height: moderateScale(56),
    paddingHorizontal: moderateScale(24),
    fontSize: fontSize.xl,
  },
};

// Responsive card dimensions
export const cardDimensions = {
  padding: moderateScale(16),
  borderRadius: borderRadius.lg,
  marginHorizontal: moderateScale(16),
  marginVertical: moderateScale(8),
};

// Responsive input dimensions
export const inputDimensions = {
  height: moderateScale(48),
  paddingHorizontal: moderateScale(16),
  fontSize: fontSize.base,
  borderRadius: borderRadius.md,
};

// Responsive header dimensions
export const headerDimensions = {
  height: moderateScale(56),
  paddingHorizontal: moderateScale(16),
  fontSize: fontSize.lg,
};

// Responsive tab bar dimensions
export const tabBarDimensions = {
  height: moderateScale(60),
  paddingBottom: moderateScale(8),
  paddingTop: moderateScale(8),
};

// Responsive list item dimensions
export const listItemDimensions = {
  paddingVertical: moderateScale(12),
  paddingHorizontal: moderateScale(16),
  minHeight: moderateScale(56),
};

// Screen-specific responsive values
export const getResponsiveValue = (values: {
  small?: number;
  medium?: number;
  large?: number;
  xlarge?: number;
}) => {
  const screenSize = getScreenSize();
  return values[screenSize] || values.medium || values.large || values.small || values.xlarge || 0;
};

// Responsive width percentages
export const widthPercentage = (percentage: number) => {
  return (SCREEN_WIDTH * percentage) / 100;
};

// Responsive height percentages
export const heightPercentage = (percentage: number) => {
  return (SCREEN_HEIGHT * percentage) / 100;
};

// Platform-specific adjustments
export const platformSpecific = {
  ios: {
    headerHeight: moderateScale(44),
    tabBarHeight: moderateScale(83),
    safeAreaTop: moderateScale(47),
    safeAreaBottom: moderateScale(34),
  },
  android: {
    headerHeight: moderateScale(56),
    tabBarHeight: moderateScale(60),
    safeAreaTop: moderateScale(24),
    safeAreaBottom: moderateScale(0),
  },
};

// Get platform-specific values
export const getPlatformValue = (iosValue: number, androidValue: number) => {
  return Platform.OS === 'ios' ? iosValue : androidValue;
};

// Responsive grid columns
export const getGridColumns = () => {
  const screenSize = getScreenSize();
  switch (screenSize) {
    case 'small':
      return 1;
    case 'medium':
      return 1;
    case 'large':
      return 2;
    case 'xlarge':
      return 2;
    default:
      return 1;
  }
};

// Responsive aspect ratios
export const aspectRatio = {
  square: 1,
  portrait: 3 / 4,
  landscape: 16 / 9,
  wide: 21 / 9,
};

// Responsive shadow
export const shadow = {
  sm: {
    shadowOffset: { width: 0, height: moderateScale(1) },
    shadowOpacity: 0.05,
    shadowRadius: moderateScale(2),
    elevation: moderateScale(1),
  },
  md: {
    shadowOffset: { width: 0, height: moderateScale(2) },
    shadowOpacity: 0.1,
    shadowRadius: moderateScale(4),
    elevation: moderateScale(3),
  },
  lg: {
    shadowOffset: { width: 0, height: moderateScale(4) },
    shadowOpacity: 0.15,
    shadowRadius: moderateScale(8),
    elevation: moderateScale(6),
  },
  xl: {
    shadowOffset: { width: 0, height: moderateScale(6) },
    shadowOpacity: 0.2,
    shadowRadius: moderateScale(12),
    elevation: moderateScale(9),
  },
};

// Export screen dimensions for convenience
export const screenDimensions = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmall: SCREEN_WIDTH <= BREAKPOINTS.SMALL,
  isMedium: SCREEN_WIDTH > BREAKPOINTS.SMALL && SCREEN_WIDTH <= BREAKPOINTS.MEDIUM,
  isLarge: SCREEN_WIDTH > BREAKPOINTS.MEDIUM && SCREEN_WIDTH <= BREAKPOINTS.LARGE,
  isXLarge: SCREEN_WIDTH > BREAKPOINTS.LARGE,
}; 