import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@txnlab/use-wallet-react";
import { useXGovSDK } from "./XGovSDKProvider";
import { useTransactionState, wrapTransactionSigner } from "@/hooks/useTransactionState";
import type { TransactionState } from "@/api/types/transaction_state";
import type { OpenProposalInput, UpdateMetadataInput } from "@algorandfoundation/xgov";

// ============================================================================
// Query Keys
// ============================================================================

export const proposalQueryKeys = {
  all: ["proposals"] as const,
  list: () => [...proposalQueryKeys.all, "list"] as const,
  detail: (appId: string) => [...proposalQueryKeys.all, "detail", appId] as const,
  summary: (appId: string) => [...proposalQueryKeys.all, "summary", appId] as const,
  metadata: (appId: string) => [...proposalQueryKeys.all, "metadata", appId] as const,
  votes: (appId: string) => [...proposalQueryKeys.all, "votes", appId] as const,
  voterStatus: (appId: string, address: string) => [...proposalQueryKeys.all, "voter", appId, address] as const,
};

// ============================================================================
// Types
// ============================================================================

export interface MutationCallbacks {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  onStatusChange?: (status: TransactionState) => void;
}

// ============================================================================
// Create Empty Proposal Mutation (Registry)
// ============================================================================

export interface CreateProposalParams {
  /** Fee for creating a proposal */
  proposalFee: bigint;
}

/**
 * Mutation hook for creating a new empty proposal via the registry.
 * Returns the new proposal app ID on success.
 * 
 * @example
 * ```tsx
 * const { mutate: createProposal, data: proposalAppId } = useCreateProposal();
 * 
 * createProposal({ proposalFee: PROPOSAL_FEE });
 * ```
 */
export function useCreateProposal(callbacks?: MutationCallbacks) {
  const queryClient = useQueryClient();
  const { registry } = useXGovSDK();
  const { activeAddress, transactionSigner } = useWallet();
  const txState = useTransactionState();

  const mutation = useMutation({
    mutationFn: async ({ proposalFee }: CreateProposalParams) => {
      if (!activeAddress || !transactionSigner) {
        throw new Error("Wallet not connected");
      }

      const wrappedSigner = wrapTransactionSigner(
        transactionSigner,
        (status: TransactionState) => {
          txState.setStatus(status);
          callbacks?.onStatusChange?.(status);
        }
      );

      txState.setStatus("loading");

      return registry.createEmptyProposal({
        sender: activeAddress,
        signer: wrappedSigner,
        proposalFee,
        onStatusChange: (status: TransactionState) => {
          txState.setStatus(status);
          callbacks?.onStatusChange?.(status);
        },
      });
    },
    onSuccess: () => {
      txState.setStatus("confirmed");
      queryClient.invalidateQueries({ queryKey: proposalQueryKeys.list() });
      // Also invalidate proposer query since they now have an active proposal
      if (activeAddress) {
        queryClient.invalidateQueries({ queryKey: ["registry", "proposer", activeAddress] });
      }
      callbacks?.onSuccess?.();
      setTimeout(() => txState.reset(), 800);
    },
    onError: (error: Error) => {
      txState.setStatus(new Error(error.message));
      callbacks?.onError?.(error);
    },
  });

  return {
    ...mutation,
    ...txState,
  };
}

// ============================================================================
// Open Proposal Mutation (Submit proposal details)
// ============================================================================

export interface OpenProposalParams {
  appId: bigint;
  data: OpenProposalInput;
  /** Basis points for submission fee calculation */
  publishingBps: bigint;
}

/**
 * Mutation hook for opening/submitting a proposal with details.
 * This calls proposal.open() with title, metadata, funding info.
 * 
 * @example
 * ```tsx
 * const { mutate: openProposal } = useOpenProposal();
 * 
 * openProposal({
 *   appId: 123n,
 *   data: {
 *     title: "My Proposal",
 *     description: "...",
 *     team: "...",
 *     openSource: true,
 *     fundingType: ProposalFundingType.Proactive,
 *     requestedAmount: 50000n,
 *     focus: ProposalFocus.Development,
 *     forumLink: "https://...",
 *   },
 *   publishingBps: 100n,
 * });
 * ```
 */
export function useOpenProposal(callbacks?: MutationCallbacks) {
  const queryClient = useQueryClient();
  const { getProposalSDK } = useXGovSDK();
  const { activeAddress, transactionSigner } = useWallet();
  const txState = useTransactionState();

  const mutation = useMutation({
    mutationFn: async ({ appId, data, publishingBps }: OpenProposalParams) => {
      if (!activeAddress || !transactionSigner) {
        throw new Error("Wallet not connected");
      }

      const wrappedSigner = wrapTransactionSigner(
        transactionSigner,
        (status: TransactionState) => {
          txState.setStatus(status);
          callbacks?.onStatusChange?.(status);
        }
      );

      txState.setStatus("loading");

      const proposalSDK = getProposalSDK(appId);

      return proposalSDK.open({
        sender: activeAddress,
        signer: wrappedSigner,
        data,
        publishingBps,
        onStatusChange: (status: TransactionState) => {
          txState.setStatus(status);
          callbacks?.onStatusChange?.(status);
        },
      });
    },
    onSuccess: (_, { appId }) => {
      txState.setStatus("confirmed");
      const appIdStr = appId.toString();
      queryClient.invalidateQueries({ queryKey: proposalQueryKeys.detail(appIdStr) });
      queryClient.invalidateQueries({ queryKey: proposalQueryKeys.summary(appIdStr) });
      queryClient.invalidateQueries({ queryKey: proposalQueryKeys.metadata(appIdStr) });
      queryClient.invalidateQueries({ queryKey: proposalQueryKeys.list() });
      callbacks?.onSuccess?.();
      setTimeout(() => txState.reset(), 800);
    },
    onError: (error: Error) => {
      txState.setStatus(new Error(error.message));
      callbacks?.onError?.(error);
    },
  });

  return {
    ...mutation,
    ...txState,
  };
}

// ============================================================================
// Update Metadata Mutation
// ============================================================================

export interface UpdateMetadataParams {
  appId: bigint;
  data: UpdateMetadataInput;
}

/**
 * Mutation hook for updating proposal metadata.
 * 
 * @example
 * ```tsx
 * const { mutate: updateMetadata } = useUpdateMetadata();
 * 
 * updateMetadata({
 *   appId: 123n,
 *   data: {
 *     description: "Updated description...",
 *     team: "...",
 *     openSource: true,
 *     forumLink: "https://...",
 *   },
 * });
 * ```
 */
export function useUpdateMetadata(callbacks?: MutationCallbacks) {
  const queryClient = useQueryClient();
  const { getProposalSDK } = useXGovSDK();
  const { activeAddress, transactionSigner } = useWallet();
  const txState = useTransactionState();

  const mutation = useMutation({
    mutationFn: async ({ appId, data }: UpdateMetadataParams) => {
      if (!activeAddress || !transactionSigner) {
        throw new Error("Wallet not connected");
      }

      const wrappedSigner = wrapTransactionSigner(
        transactionSigner,
        (status: TransactionState) => {
          txState.setStatus(status);
          callbacks?.onStatusChange?.(status);
        }
      );

      txState.setStatus("loading");

      const proposalSDK = getProposalSDK(appId);

      return proposalSDK.updateMetadata({
        sender: activeAddress,
        signer: wrappedSigner,
        data,
        onStatusChange: (status: TransactionState) => {
          txState.setStatus(status);
          callbacks?.onStatusChange?.(status);
        },
      });
    },
    onSuccess: (_, { appId }) => {
      txState.setStatus("confirmed");
      const appIdStr = appId.toString();
      queryClient.invalidateQueries({ queryKey: proposalQueryKeys.detail(appIdStr) });
      queryClient.invalidateQueries({ queryKey: proposalQueryKeys.metadata(appIdStr) });
      callbacks?.onSuccess?.();
      setTimeout(() => txState.reset(), 800);
    },
    onError: (error: Error) => {
      txState.setStatus(new Error(error.message));
      callbacks?.onError?.(error);
    },
  });

  return {
    ...mutation,
    ...txState,
  };
}

// ============================================================================
// Finalize Proposal Mutation (Registry)
// ============================================================================

export interface FinalizeProposalParams {
  proposalId: bigint;
}

/**
 * Mutation hook for finalizing a proposal after voting ends.
 * 
 * @example
 * ```tsx
 * const { mutate: finalize } = useFinalizeProposal();
 * 
 * finalize({ proposalId: 123n });
 * ```
 */
export function useFinalizeProposal(callbacks?: MutationCallbacks) {
  const queryClient = useQueryClient();
  const { registry } = useXGovSDK();
  const { activeAddress, transactionSigner } = useWallet();
  const txState = useTransactionState();

  const mutation = useMutation({
    mutationFn: async ({ proposalId }: FinalizeProposalParams) => {
      if (!activeAddress || !transactionSigner) {
        throw new Error("Wallet not connected");
      }

      const wrappedSigner = wrapTransactionSigner(
        transactionSigner,
        (status: TransactionState) => {
          txState.setStatus(status);
          callbacks?.onStatusChange?.(status);
        }
      );

      txState.setStatus("loading");

      return registry.finalizeProposal({
        sender: activeAddress,
        signer: wrappedSigner,
        proposalId,
        onStatusChange: (status: TransactionState) => {
          txState.setStatus(status);
          callbacks?.onStatusChange?.(status);
        },
      });
    },
    onSuccess: (_, { proposalId }) => {
      txState.setStatus("confirmed");
      const appIdStr = proposalId.toString();
      queryClient.invalidateQueries({ queryKey: proposalQueryKeys.detail(appIdStr) });
      queryClient.invalidateQueries({ queryKey: proposalQueryKeys.summary(appIdStr) });
      queryClient.invalidateQueries({ queryKey: proposalQueryKeys.list() });
      callbacks?.onSuccess?.();
      setTimeout(() => txState.reset(), 800);
    },
    onError: (error: Error) => {
      txState.setStatus(new Error(error.message));
      callbacks?.onError?.(error);
    },
  });

  return {
    ...mutation,
    ...txState,
  };
}
