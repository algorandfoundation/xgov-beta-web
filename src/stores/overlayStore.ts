import { map } from 'nanostores';

export enum OverlayTypes {
  Empty = '',
  MobileNav = 'mobile-nav',
  Connect = 'connect',
  Disconnect = 'disconnect',
}

export const $overlayStore = map<{ open: boolean, name: OverlayTypes }>({ open: false, name: OverlayTypes.Empty });

export function toggleOverlay(name: OverlayTypes) {
  $overlayStore.get().open
    ? closeOverlay()
    : openOverlay(name);
}

export function openOverlay(name: OverlayTypes) {
  // set overlay search param
  const searchParams = new URLSearchParams(window.location.search);
  searchParams.set('overlay', name);
  window.history.replaceState(null, '', `?${searchParams.toString()}`);

  $overlayStore.set({ open: true, name })
}

export function closeOverlay() {
  // remove overlay search param
  const searchParams = new URLSearchParams(window.location.search);
  searchParams.delete('overlay');
  window.history.replaceState(null, '', `?${searchParams.toString()}`);

  $overlayStore.set({ open: false, name: OverlayTypes.Empty });
}