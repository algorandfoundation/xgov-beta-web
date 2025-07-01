import {
  type SupportedWallet,
  WalletId,
  WalletManager,
} from "@txnlab/use-wallet-react";

let walletProviders: SupportedWallet[] = [
  WalletId.DEFLY,
  WalletId.PERA,
  WalletId.EXODUS,
  WalletId.KIBISIS,
  { id: WalletId.LUTE, options: { siteName: "XGov Beta" } },
];

if (!!import.meta.env.PUBLIC_KMD_SERVER) {
  walletProviders = [WalletId.KMD, ...walletProviders];
}

export const walletManager = new WalletManager({
  wallets: walletProviders,
  network: import.meta.env.PUBLIC_NETWORK,
});
