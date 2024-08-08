import { persistentAtom } from '@nanostores/persistent';

export const $themeStore = persistentAtom<'light' | 'dark' | 'default'>('theme', 'default');
console.log('setup theme store');

export function toggleTheme() {
  $themeStore.set($themeStore.get() === 'light' ? 'dark' : 'light');
}