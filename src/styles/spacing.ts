export const SPACING = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
} as const;

export const SPACE_UNIT = 4;
export const space = (multiplier: number) => `${multiplier * SPACE_UNIT}px`;
