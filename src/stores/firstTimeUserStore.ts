import { persistentAtom } from '@nanostores/persistent';

export const hasSeenTutorialStore = persistentAtom<boolean>(
  'has-seen-tutorial',
  false,
  {
    encode: JSON.stringify,
    decode: JSON.parse,
  }
);

// Utility functions
export function markTutorialSeen() {
  hasSeenTutorialStore.set(true);
}

export function shouldShowTutorial(isWalletConnected: boolean): boolean {
  // Show tutorial if wallet is connected and user hasn't seen it yet
  return isWalletConnected && !hasSeenTutorialStore.get();
}
