import './polyfills';
import React from "react";
import { WalletId, WalletManager, WalletProvider, type SupportedWallet } from "@txnlab/use-wallet-react";
import { createBrowserRouter, createMemoryRouter, RouterProvider } from "react-router-dom";
import {
    QueryClient,
    QueryClientProvider,
} from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AdminPage } from "@/pages/admin/_AdminPage";
import { BecomeProposerPage } from './pages/_BecomePage';
import { CohortsPage } from "@/pages/_CohortPage";
import { DocsPage } from "@/pages/_DocsPage";
import { HomePage } from "@/pages/_HomePage";
import { ProfilePage } from "./pages/profile/_ProfilePage";
import { ProposalPage } from "@/pages/proposal/_ProposalPage";

let walletProviders: SupportedWallet[] = [
    WalletId.KMD,
    WalletId.DEFLY,
    WalletId.PERA,
    WalletId.EXODUS,
    WalletId.KIBISIS,
    { id: WalletId.LUTE, options: { siteName: "XGov Beta" } },
];

if (import.meta.env.PUBLIC_KMD_SERVER) {
    walletProviders = [
        WalletId.KMD,
        ...walletProviders,
    ]
}

const walletManager = new WalletManager({
    wallets: walletProviders,
    network: import.meta.env.PUBLIC_NETWORK,
});

const routes = [
    { path: '/', element: <HomePage /> },
    { path: '/admin', element: <AdminPage />},
    { path: '/become-proposer', element: <BecomeProposerPage />},
    { path: '/docs', element: <DocsPage /> },
    { path: '/cohort', element: <CohortsPage /> },
    { path: '/proposal', element: <HomePage /> },
    { path: '/proposal/:proposal', element: <ProposalPage /> },
    { path: '/profile/:address', element: <ProfilePage /> },
]

const router = typeof window !== 'undefined'
    ? createBrowserRouter(routes)
    : createMemoryRouter(routes);

const queryClient = new QueryClient();

export function App({ path = "/" }) {
    router.state.location.pathname = path;

    return (
        <React.StrictMode>
            <QueryClientProvider client={queryClient}>
                <ReactQueryDevtools />
                <WalletProvider manager={walletManager}>
                    <RouterProvider router={router} />
                </WalletProvider>
            </QueryClientProvider>
        </React.StrictMode>
    );
}