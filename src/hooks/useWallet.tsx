import type { ReactNode } from "react";
import { WalletProvider } from "@txnlab/use-wallet-react";
import { walletManager } from "@/stores/wallet";

export function UseWallet({ children }: { children: ReactNode }) {
  return <WalletProvider manager={walletManager}>{children}</WalletProvider>;
}
