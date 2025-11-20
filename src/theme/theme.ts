// theme/theme.ts
export const theme = {
  colors: {
    // Core background layers
    page: "#0A0A0A",         // full-page background
    section: "#0F0F0F",      // hero or major sections
    surface: "#141414",      // cards, panels, tiles

    // Text
    textPrimary: "#F5F5F5",
    textSecondary: "#B4B4B4",
    textMuted: "#7A7A7A",

    // Accent system
    accent: "#FF8A00",       // warm orange highlight
    accentHover: "#FF9F33",
    accentSubtle: "rgba(255,138,0,0.12)",

    // Borders
    borderLight: "rgba(255,255,255,0.08)",
    borderStrong: "rgba(255,255,255,0.18)",

    // Overlays / glass
    glassTint: "rgba(255,255,255,0.06)",
    glassBorder: "rgba(255,255,255,0.12)",
  },

  radius: {
    sm: "6px",
    md: "10px",
    lg: "16px",
    xl: "20px",
  },

  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    xxl: "48px",
  },

  shadow: {
    soft: "0 6px 18px rgba(0,0,0,0.30)",
    medium: "0 10px 32px rgba(0,0,0,0.42)",
    strong: "0 14px 48px rgba(0,0,0,0.55)",
  },

  transitions: {
    default: "0.2s ease",
    fast: "0.15s ease",
  },

  // For persona tabs, chips, labels, etc.
  opacity: {
    disabled: 0.4,
    subtle: 0.7,
  },
} as const;
