import { persistentAtom } from "@nanostores/persistent";

export const $themeStore = persistentAtom<"light" | "dark" | "default">(
  "theme",
  "light",
);

export function toggleTheme() {
  $themeStore.set($themeStore.get() === "light" ? "dark" : "light");
}
