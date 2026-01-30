import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import {
  XGovRegistrySDK,
  XGovProposalSDK,
  XGovCouncilSDK,
} from "@algorandfoundation/xgov";
import { algorand } from "@/api/algorand/algo-client";
import { RegistryAppID, CouncilAppID } from "@/api/algorand/contract-clients";

// ============================================================================
// Context Types
// ============================================================================

export interface XGovSDKContextValue {
  /** SDK for interacting with the xGov registry contract */
  registry: XGovRegistrySDK;
  /** SDK for interacting with the council contract */
  council: XGovCouncilSDK;
  /** Get a proposal SDK instance for a specific proposal app ID */
  getProposalSDK: (appId: bigint) => XGovProposalSDK;
  /** Registry app ID */
  registryAppId: bigint;
  /** Council app ID */
  councilAppId: bigint;
}

// ============================================================================
// Context
// ============================================================================

const XGovSDKContext = createContext<XGovSDKContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

export interface XGovSDKProviderProps {
  children: ReactNode;
  /** Optional override for registry app ID (defaults to env config) */
  registryAppId?: bigint;
  /** Optional override for council app ID (defaults to env config) */
  councilAppId?: bigint;
}

/**
 * Provider component that initializes and provides xGov SDK instances.
 * 
 * @example
 * ```tsx
 * <XGovSDKProvider>
 *   <App />
 * </XGovSDKProvider>
 * ```
 */
export function XGovSDKProvider({
  children,
  registryAppId = RegistryAppID,
  councilAppId = CouncilAppID,
}: XGovSDKProviderProps) {
  // Memoize SDK instances to avoid recreating on every render
  const value = useMemo<XGovSDKContextValue>(() => {
    // Create singleton SDK instances
    const registry = new XGovRegistrySDK({ algorand, appId: registryAppId });
    const council = new XGovCouncilSDK({ algorand, appId: councilAppId, registryAppId });

    // Factory function for proposal SDKs (cached by appId)
    const proposalCache = new Map<string, XGovProposalSDK>();
    const getProposalSDK = (appId: bigint): XGovProposalSDK => {
      const key = appId.toString();
      if (!proposalCache.has(key)) {
        proposalCache.set(key, new XGovProposalSDK({ algorand, appId, registryAppId }));
      }
      return proposalCache.get(key)!;
    };

    return {
      registry,
      council,
      getProposalSDK,
      registryAppId,
      councilAppId,
    };
  }, [registryAppId, councilAppId]);

  return (
    <XGovSDKContext.Provider value={value}>
      {children}
    </XGovSDKContext.Provider>
  );
}

// ============================================================================
// Hooks
// ============================================================================

/**
 * Hook to access the xGov SDK context.
 * Must be used within a XGovSDKProvider.
 * 
 * @throws Error if used outside of XGovSDKProvider
 */
export function useXGovSDK(): XGovSDKContextValue {
  const context = useContext(XGovSDKContext);
  if (!context) {
    throw new Error("useXGovSDK must be used within a XGovSDKProvider");
  }
  return context;
}

/**
 * Hook to access just the registry SDK.
 */
export function useRegistrySDK(): XGovRegistrySDK {
  return useXGovSDK().registry;
}

/**
 * Hook to access just the council SDK.
 */
export function useCouncilSDK(): XGovCouncilSDK {
  return useXGovSDK().council;
}

/**
 * Hook to get a proposal SDK for a specific app ID.
 * 
 * @param appId - The proposal application ID
 */
export function useProposalSDK(appId: bigint): XGovProposalSDK {
  const { getProposalSDK } = useXGovSDK();
  return useMemo(() => getProposalSDK(appId), [getProposalSDK, appId]);
}
