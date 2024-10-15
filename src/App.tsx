import './polyfills';
import React, { useEffect } from "react";
import { NetworkId, WalletId, WalletManager, WalletProvider } from "@txnlab/use-wallet-react";
import { createBrowserRouter, createMemoryRouter, RouterProvider } from "react-router-dom";
import { HomePage } from "@/pages/_HomePage";
import { AdminPage } from "@/pages/admin/_AdminPage";
import { ProposalPage } from "@/pages/proposal/_ProposalPage";
import { DocsPage } from "@/pages/_DocsPage";
import { CohortsPage } from "@/pages/_CohortPage";
import { InitializationPage } from "@/pages/_InitializationPage";
import { RegistryClientProvider, useRegistryClient } from "@/contexts/RegistryClientContext";
import { BecomeProposerPage } from './pages/_BecomePage';

const walletManager = new WalletManager({
    wallets: [
        WalletId.DEFLY,
        WalletId.PERA,
        WalletId.EXODUS,
        WalletId.KIBISIS,
        WalletId.KMD,
        { id: WalletId.LUTE, options: { siteName: "XGov Beta" }},
    ],
    network: NetworkId.LOCALNET,
});

const routes = [
    { path: '/', element: <HomePage />},
    { path: '/admin', element: <AdminPage />},
    { path: '/become-proposer', element: <BecomeProposerPage />},
    { path: '/docs', element: <DocsPage />},
    { path: '/cohort', element: <CohortsPage />},
    { path: '/proposal', element: <HomePage />},
    { path: '/proposal/:proposalId', element: <ProposalPage />},
    { path: '/initialize', element: <InitializationPage />},
]

const router = typeof window !== 'undefined'
    ? createBrowserRouter(routes)
    : createMemoryRouter(routes);

const AppContent = () => {
  /*
  * If there is no deployed XGovRegistry contract we consider the app uninitialized and visitors are redirected to the initialization page.
  * In the future we might require other contracts to be deployed as well before the app is considered initialized.
  */
  const { isInitialized, loading } = useRegistryClient();

  useEffect(() => {
    if (!loading && !isInitialized && window.location.pathname !== '/initialize') {
      window.location.href = '/initialize';
    }
  }, [loading, isInitialized]);

  if (loading) {
    return <div></div>;
  }

  if (!isInitialized && window.location.pathname !== '/initialize') {
    return null; // Prevent rendering the RouterProvider until redirection is complete
  }

  return <RouterProvider router={router} />;
};

export function App({ path = "/" }) {
    router.state.location.pathname = path;

    return (
        <React.StrictMode>
            <WalletProvider manager={walletManager}>
                <RegistryClientProvider>
                    <AppContent />
                </RegistryClientProvider>
            </WalletProvider>
        </React.StrictMode>
    );
}