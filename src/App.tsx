import React from "react";
import { NetworkId, WalletId, WalletManager, WalletProvider } from "@txnlab/use-wallet-react";
import {createBrowserRouter, createMemoryRouter, RouterProvider} from "react-router-dom";
import {HomePage} from "@pages/_HomePage";
import {ProposalPage} from "@pages/proposal/_ProposalPage";
import { DocsPage } from "@pages/_DocsPage";
import { CohortsPage } from "@pages/_CohortPage";

const walletManager = new WalletManager({
    wallets: [
        WalletId.DEFLY,
        WalletId.PERA,
        WalletId.EXODUS,
        WalletId.KIBISIS,
        { id: WalletId.LUTE, options: { siteName: "XGov Beta" }},
    ],
    network: NetworkId.LOCALNET,
});

const routes = [
    { path: '/', element: <HomePage />},
    { path: '/docs', element: <DocsPage />},
    { path: '/cohort', element: <CohortsPage />},
    { path: '/proposal', element: <HomePage />},
    { path: '/proposal/:proposalId', element: <ProposalPage />}
]

const router = typeof window !== 'undefined'
    ? createBrowserRouter(routes)
    : createMemoryRouter(routes);

export function App({ path = "/" }) {
    router.state.location.pathname = path;

    return (
        <React.StrictMode>
            <WalletProvider manager={walletManager}>
                <RouterProvider router={router} />
            </WalletProvider>
        </React.StrictMode>
    );
}