// Design tokens — ultra-luxury, high-editorial beauty-app feel.
export const colors = {
  background: '#150d07',
  surface: '#21150c',
  surfaceLight: '#2c1e12',
  surfaceGlass: 'rgba(33, 21, 12, 0.78)',
  surfaceGlassBorder: 'rgba(212, 162, 78, 0.22)',
  gold: '#d4a24e',
  goldSoft: '#edd08f',
  goldDim: '#9e793e',
  goldDeep: '#b88435',
  goldGlow: 'rgba(212, 162, 78, 0.35)',
  cream: '#fcf8f2',
  creamSoft: '#eee3d2',
  muted: '#b8a691',
  green: '#74c988',
  red: '#e56b5a',
};

export const fonts = {
  // Editorial display serif
  display: 'PlayfairDisplay_700Bold',
  displaySemi: 'PlayfairDisplay_600SemiBold',
  displayExtra: 'PlayfairDisplay_800ExtraBold',

  // Modern geometric sans-serif for UI, numbers & body
  body: 'PlusJakartaSans_400Regular',
  bodyMedium: 'PlusJakartaSans_500Medium',
  bodySemi: 'PlusJakartaSans_600SemiBold',
  bodyBold: 'PlusJakartaSans_700Bold',
  bodyExtra: 'PlusJakartaSans_800ExtraBold',
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  full: 9999,
};

export const shadows = {
  glowGold: {
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
  },
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
};
