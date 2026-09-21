import {
  type WalletAdapterConfig,
  WalletManager,
} from "@txnlab/use-wallet-react";
import { defly } from "@txnlab/use-wallet-defly";
import { exodus } from "@txnlab/use-wallet-exodus";
import { kibisis } from "@txnlab/use-wallet-kibisis";
import { kmd } from "@txnlab/use-wallet-kmd";
import { lute } from "@txnlab/use-wallet-lute";
import { pera } from "@txnlab/use-wallet-pera";

let walletProviders: WalletAdapterConfig[] = [
  pera(),
  defly(),
  lute({ siteName: "xGov Beta" }),
  exodus(),
  kibisis(),
  /* walletConnect({ projectId: '<TBD>' }), */
];

if (import.meta.env.PUBLIC_NETWORK === "localnet") {
  walletProviders = [kmd(), ...walletProviders];
}

export const walletManager = new WalletManager({
  wallets: walletProviders,
  defaultNetwork: import.meta.env.PUBLIC_NETWORK,
});
