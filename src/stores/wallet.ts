import {
  type SupportedWallet,
  type WalletAccount,
  WalletId,
  WalletManager,
} from "@txnlab/use-wallet-react";
import {
  LiquidAuthClient,
  ICON as LiquidIcon,
} from "@algorandfoundation/liquid-auth-use-wallet-client";
import type { Transaction } from "algosdk";

const liquidOrigin = import.meta.env.PUBLIC_LIQUID_AUTH_ORIGIN;
const liquidRtcUsername = import.meta.env.PUBLIC_LIQUID_RTC_USERNAME;
const liquidRtcCredential = import.meta.env.PUBLIC_LIQUID_RTC_CREDENTIAL;

function createLiquidProvider() {
  const client = new LiquidAuthClient({
    origin: liquidOrigin,
    RTC_config_username: liquidRtcUsername,
    RTC_config_credential: liquidRtcCredential,
  });

  return {
    async connect(): Promise<WalletAccount[]> {
      await client.connect();
      const session = await client.checkSession();
      if (!session?.user?.wallet) {
        throw new Error("Liquid Auth: no wallet address in session");
      }
      return [
        {
          name: "Liquid Auth",
          address: session.user.wallet,
        },
      ];
    },
    async disconnect(): Promise<void> {
      await client.disconnect();
    },
    async resumeSession(): Promise<WalletAccount[] | void> {
      const session = await client.checkSession();
      if (session?.user?.wallet) {
        return [
          {
            name: "Liquid Auth",
            address: session.user.wallet,
          },
        ];
      }
    },
    async signTransactions<T extends Transaction[] | Uint8Array[]>(
      txnGroup: T | T[],
      indexesToSign?: number[],
    ): Promise<(Uint8Array | null)[]> {
      const session = await client.checkSession();
      if (!session?.user?.wallet) {
        throw new Error("Liquid Auth: not connected");
      }
      return client.signTransactions(
        txnGroup as any,
        session.user.wallet,
        indexesToSign,
      );
    },
  };
}

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

if (liquidOrigin && liquidRtcUsername && liquidRtcCredential) {
  walletProviders.push({
    id: WalletId.CUSTOM,
    options: {
      provider: createLiquidProvider(),
    },
    metadata: {
      name: "Liquid",
      icon: LiquidIcon,
    },
  });
}

if (import.meta.env.PUBLIC_NETWORK === "localnet") {
  walletProviders = [WalletId.KMD, ...walletProviders];
}

export const walletManager = new WalletManager({
  wallets: walletProviders,
  defaultNetwork: import.meta.env.PUBLIC_NETWORK,
});
