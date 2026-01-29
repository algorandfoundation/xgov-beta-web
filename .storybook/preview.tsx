import {
  WalletId,
  WalletManager,
  WalletProvider,
  type SupportedWallet,
} from "@txnlab/use-wallet-react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "../src/components/ui/tooltip";
import "tailwindcss/tailwind.css";
import type { Preview } from "@storybook/react";

declare global {
  interface BigIntConstructor {
    toJSON: () => string;
  }
}

// @ts-expect-error
BigInt.prototype.toJSON = function () {
  return this.toString();
};

const queryCache = new QueryClient();

let walletProviders: SupportedWallet[] = [
  WalletId.PERA,
  WalletId.DEFLY,
  { id: WalletId.LUTE, options: { siteName: "XGov Beta" } },
  WalletId.EXODUS,
  WalletId.KIBISIS,
];

if (import.meta.env.PUBLIC_KMD_SERVER) {
  walletProviders = [WalletId.KMD, ...walletProviders];
}

const walletManager = new WalletManager({
  wallets: walletProviders,
  defaultNetwork: import.meta.env.PUBLIC_NETWORK || "localnet",
});

// Decorate the stories with context
export const decorators = [
  (Story: any) => (
    <QueryClientProvider client={queryCache}>
      <Story />
    </QueryClientProvider>
  ),
  (Story: any) => (
    <WalletProvider manager={walletManager}>
      <Story />
    </WalletProvider>
  ),
  (Story: any) => (
    <MemoryRouter initialEntries={["/"]}>
      <Story />
    </MemoryRouter>
  ),
  (Story: any) => (
    <TooltipProvider>
      <Story />
    </TooltipProvider>
  ),
];

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
