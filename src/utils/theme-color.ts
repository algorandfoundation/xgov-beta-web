import { THEME_COLORS } from "./manifest";

export function updatePWAThemeColor(isDark: boolean) {
  // Update theme-color meta tag
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  if (themeColorMeta) {
    themeColorMeta.setAttribute('content', isDark ? THEME_COLORS.dark : THEME_COLORS.light);
  }
}