import {
  type SupportedWallet,
  WalletId,
  WalletManager,
} from "@txnlab/use-wallet-react";

let walletProviders: SupportedWallet[] = [
  WalletId.PERA,
  WalletId.DEFLY,
  { id: WalletId.LUTE, options: { siteName: "xGov Beta" } },
  WalletId.EXODUS,
  WalletId.KIBISIS,
  /* {
      id: WalletId.WALLETCONNECT,
      options: { projectId: '<TBD>' }
  }, */
];

if (import.meta.env.PUBLIC_NETWORK === "localnet") {
  walletProviders = [WalletId.KMD, ...walletProviders];
}

export const walletManager = new WalletManager({
  wallets: walletProviders,
  defaultNetwork: import.meta.env.PUBLIC_NETWORK,
});
