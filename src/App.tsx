import React, { useEffect } from "react";
import { WalletId, WalletManager, WalletProvider, type SupportedWallet } from "@txnlab/use-wallet-react";
import {createBrowserRouter, createMemoryRouter, RouterProvider} from "react-router-dom";
import {HomePage} from "@/pages/_HomePage";
import {ProposalPage} from "@/pages/proposal/_ProposalPage";
import { DocsPage } from "@/pages/_DocsPage";
import { CohortsPage } from "@/pages/_CohortPage";
import { ProfilePage } from "./pages/profile/_ProfilePage";

import { initAddressRegistryContractStore, initRegistryContractStore } from "./stores/registryStore";

let walletProviders: SupportedWallet[] = [
    WalletId.KMD,
    WalletId.DEFLY,
    WalletId.PERA,
    WalletId.EXODUS,
    WalletId.KIBISIS,
    { id: WalletId.LUTE, options: { siteName: "XGov Beta" }},
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
    { path: '/', element: <HomePage />},
    { path: '/docs', element: <DocsPage />},
    { path: '/cohort', element: <CohortsPage />},
    { path: '/proposal', element: <HomePage />},
    { path: '/proposal/:proposal', element: <ProposalPage />},
    { path: '/profile/:address', element: <ProfilePage />},
]

const router = typeof window !== 'undefined'
    ? createBrowserRouter(routes)
    : createMemoryRouter(routes);

export function App({ path = "/" }) {
    router.state.location.pathname = path;

    useEffect(() => {
        initRegistryContractStore();
    }, [])

    useEffect(() => {
        if (!walletManager.activeAddress) return;
        initAddressRegistryContractStore(walletManager.activeAddress);
    }, [walletManager.activeAddress])

    return (
        <React.StrictMode>
            <WalletProvider manager={walletManager}>
                <RouterProvider router={router} />
            </WalletProvider>
        </React.StrictMode>
    );
}