import {WalletId, WalletManager, WalletProvider, type SupportedWallet} from "@txnlab/use-wallet-react";
import {MemoryRouter} from "react-router-dom";
import {
    QueryClient,
    QueryClientProvider,
} from '@tanstack/react-query'
import 'tailwindcss/tailwind.css'
import type { Preview } from "@storybook/react";

declare global {
  interface BigIntConstructor {
    toJSON:() => string;
  }
}

// @ts-expect-error
BigInt.prototype.toJSON = function() {
  return this.toString();
};


const queryCache = new QueryClient();

let walletProviders: SupportedWallet[] = [
    WalletId.KMD,
    WalletId.DEFLY,
    WalletId.PERA,
    WalletId.EXODUS,
    WalletId.KIBISIS,
    {id: WalletId.LUTE, options: {siteName: "XGov Beta"}},
];

if (import.meta.env.PUBLIC_KMD_SERVER) {
    walletProviders = [
        WalletId.KMD,
        ...walletProviders,
    ]
}

const walletManager = new WalletManager({
    wallets: walletProviders,
    network: import.meta.env.PUBLIC_NETWORK || 'localnet',
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
        <MemoryRouter initialEntries={['/']}>
            <Story />
        </MemoryRouter>
    ),

]

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
