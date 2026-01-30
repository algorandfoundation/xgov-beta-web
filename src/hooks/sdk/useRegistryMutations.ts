import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@txnlab/use-wallet-react";
import { useRegistrySDK } from "./XGovSDKProvider";
import { useTransactionState, wrapTransactionSigner } from "@/hooks/useTransactionState";
import type { TransactionState } from "@/api/types/transaction_state";

// ============================================================================
// Query Keys
// ============================================================================

export const registryQueryKeys = {
  all: ["registry"] as const,
  xgov: (address: string) => [...registryQueryKeys.all, "xgov", address] as const,
  proposer: (address: string) => [...registryQueryKeys.all, "proposer", address] as const,
  state: () => [...registryQueryKeys.all, "state"] as const,
  allXGovs: () => [...registryQueryKeys.all, "allXGovs"] as const,
  delegations: (address: string) => [...registryQueryKeys.all, "delegations", address] as const,
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
// Subscribe xGov Mutation
// ============================================================================

export interface SubscribeXGovParams {
  xgovFee: bigint;
  votingAddress?: string;
}

/**
 * Mutation hook for subscribing as an xGov.
 * 
 * @example
 * ```tsx
 * const { mutate: subscribeXGov, isPending } = useSubscribeXGov();
 * 
 * subscribeXGov({ xgovFee: registryState.xgovFee });
 * ```
 */
export function useSubscribeXGov(callbacks?: MutationCallbacks) {
  const queryClient = useQueryClient();
  const registry = useRegistrySDK();
  const { activeAddress, transactionSigner } = useWallet();
  const txState = useTransactionState();

  const mutation = useMutation({
    mutationFn: async ({ xgovFee, votingAddress }: SubscribeXGovParams) => {
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

      return registry.subscribeXGov({
        sender: activeAddress,
        signer: wrappedSigner,
        xgovFee,
        votingAddress: votingAddress ?? activeAddress,
        onStatusChange: (status: TransactionState) => {
          txState.setStatus(status);
          callbacks?.onStatusChange?.(status);
        },
      });
    },
    onSuccess: () => {
      txState.setStatus("confirmed");
      // Invalidate relevant queries
      if (activeAddress) {
        queryClient.invalidateQueries({ queryKey: registryQueryKeys.xgov(activeAddress) });
      }
      queryClient.invalidateQueries({ queryKey: registryQueryKeys.allXGovs() });
      callbacks?.onSuccess?.();
      // Reset state after brief confirmation display
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
// Unsubscribe xGov Mutation
// ============================================================================

/**
 * Mutation hook for unsubscribing from xGov.
 * 
 * @example
 * ```tsx
 * const { mutate: unsubscribeXGov, isPending } = useUnsubscribeXGov();
 * 
 * unsubscribeXGov();
 * ```
 */
export function useUnsubscribeXGov(callbacks?: MutationCallbacks) {
  const queryClient = useQueryClient();
  const registry = useRegistrySDK();
  const { activeAddress, transactionSigner } = useWallet();
  const txState = useTransactionState();

  const mutation = useMutation({
    mutationFn: async () => {
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

      return registry.unsubscribeXGov({
        sender: activeAddress,
        signer: wrappedSigner,
        onStatusChange: (status: TransactionState) => {
          txState.setStatus(status);
          callbacks?.onStatusChange?.(status);
        },
      });
    },
    onSuccess: () => {
      txState.setStatus("confirmed");
      if (activeAddress) {
        queryClient.invalidateQueries({ queryKey: registryQueryKeys.xgov(activeAddress) });
      }
      queryClient.invalidateQueries({ queryKey: registryQueryKeys.allXGovs() });
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
// Subscribe Proposer Mutation
// ============================================================================

export interface SubscribeProposerParams {
  proposerFee: bigint;
}

/**
 * Mutation hook for subscribing as a proposer.
 * 
 * @example
 * ```tsx
 * const { mutate: subscribeProposer, isPending } = useSubscribeProposer();
 * 
 * subscribeProposer({ proposerFee: registryState.proposerFee });
 * ```
 */
export function useSubscribeProposer(callbacks?: MutationCallbacks) {
  const queryClient = useQueryClient();
  const registry = useRegistrySDK();
  const { activeAddress, transactionSigner } = useWallet();
  const txState = useTransactionState();

  const mutation = useMutation({
    mutationFn: async ({ proposerFee }: SubscribeProposerParams) => {
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

      return registry.subscribeProposer({
        sender: activeAddress,
        signer: wrappedSigner,
        proposerFee,
        onStatusChange: (status: TransactionState) => {
          txState.setStatus(status);
          callbacks?.onStatusChange?.(status);
        },
      });
    },
    onSuccess: () => {
      txState.setStatus("confirmed");
      if (activeAddress) {
        queryClient.invalidateQueries({ queryKey: registryQueryKeys.proposer(activeAddress) });
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
// Set Voting Address Mutation
// ============================================================================

export interface SetVotingAddressParams {
  newVotingAddress: string;
  /** If setting for a different xgov address (admin/delegate scenario) */
  xgovAddress?: string;
}

/**
 * Mutation hook for setting the voting address.
 * 
 * @example
 * ```tsx
 * const { mutate: setVotingAddress, isPending } = useSetVotingAddress();
 * 
 * setVotingAddress({ newVotingAddress: "NEWADDR..." });
 * ```
 */
export function useSetVotingAddress(callbacks?: MutationCallbacks) {
  const queryClient = useQueryClient();
  const registry = useRegistrySDK();
  const { activeAddress, transactionSigner } = useWallet();
  const txState = useTransactionState();

  const mutation = useMutation({
    mutationFn: async ({ newVotingAddress, xgovAddress }: SetVotingAddressParams) => {
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

      return registry.setVotingAddress({
        sender: activeAddress,
        signer: wrappedSigner,
        xgovAddress: xgovAddress ?? activeAddress,
        newVotingAddress,
        onStatusChange: (status: TransactionState) => {
          txState.setStatus(status);
          callbacks?.onStatusChange?.(status);
        },
      });
    },
    onSuccess: (_, { xgovAddress }) => {
      txState.setStatus("confirmed");
      const targetAddress = xgovAddress ?? activeAddress;
      if (targetAddress) {
        queryClient.invalidateQueries({ queryKey: registryQueryKeys.xgov(targetAddress) });
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
// Set Proposer KYC Mutation (Admin)
// ============================================================================

export interface SetProposerKYCParams {
  proposerAddress: string;
  kycStatus: boolean;
  kycExpiration: number;
}

/**
 * Mutation hook for setting a proposer's KYC status (admin only).
 * 
 * @example
 * ```tsx
 * const { mutate: setKYC } = useSetProposerKYC();
 * 
 * setKYC({ proposerAddress: "...", kycStatus: true, kycExpiration: 1735689600 });
 * ```
 */
export function useSetProposerKYC(callbacks?: MutationCallbacks) {
  const queryClient = useQueryClient();
  const registry = useRegistrySDK();
  const { activeAddress, transactionSigner } = useWallet();
  const txState = useTransactionState();

  const mutation = useMutation({
    mutationFn: async ({ proposerAddress, kycStatus, kycExpiration }: SetProposerKYCParams) => {
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

      return registry.setProposerKYC({
        sender: activeAddress,
        signer: wrappedSigner,
        proposerAddress,
        kycStatus,
        expiration: kycExpiration,
        onStatusChange: (status: TransactionState) => {
          txState.setStatus(status);
          callbacks?.onStatusChange?.(status);
        },
      });
    },
    onSuccess: (_, { proposerAddress }) => {
      txState.setStatus("confirmed");
      queryClient.invalidateQueries({ queryKey: registryQueryKeys.proposer(proposerAddress) });
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
// Vote on Proposal Mutation
// ============================================================================

export interface VoteProposalParams {
  proposalId: bigint;
  xgovAddress: string;
  approvalVotes: number;
  rejectionVotes: number;
}

/**
 * Mutation hook for voting on a proposal.
 * 
 * @example
 * ```tsx
 * const { mutate: vote, isPending } = useVoteProposal();
 * 
 * vote({ proposalId: 123n, xgovAddress: activeAddress, approvalVotes: 1, rejectionVotes: 0 });
 * ```
 */
export function useVoteProposal(callbacks?: MutationCallbacks) {
  const queryClient = useQueryClient();
  const registry = useRegistrySDK();
  const { activeAddress, transactionSigner } = useWallet();
  const txState = useTransactionState();

  const mutation = useMutation({
    mutationFn: async ({ proposalId, xgovAddress, approvalVotes, rejectionVotes }: VoteProposalParams) => {
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

      return registry.voteProposal({
        sender: activeAddress,
        signer: wrappedSigner,
        proposalId,
        xgovAddress,
        approvalVotes,
        rejectionVotes,
        onStatusChange: (status: TransactionState) => {
          txState.setStatus(status);
          callbacks?.onStatusChange?.(status);
        },
      });
    },
    onSuccess: (_, { proposalId, xgovAddress }) => {
      txState.setStatus("confirmed");
      // Invalidate xgov query for the voter
      queryClient.invalidateQueries({ queryKey: registryQueryKeys.xgov(xgovAddress) });
      // Invalidate proposal-related queries
      queryClient.invalidateQueries({ queryKey: ["proposal", proposalId.toString()] });
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
// Approve Subscribe Request Mutation (Subscriber Admin)
// ============================================================================

export interface ApproveSubscribeRequestParams {
  requestId: bigint;
  xgovAddress: string;
}

/**
 * Mutation hook for approving a subscribe request.
 */
export function useApproveSubscribeRequest(callbacks?: MutationCallbacks) {
  const queryClient = useQueryClient();
  const registry = useRegistrySDK();
  const { activeAddress, transactionSigner } = useWallet();
  const txState = useTransactionState();

  const mutation = useMutation({
    mutationFn: async ({ requestId, xgovAddress }: ApproveSubscribeRequestParams) => {
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

      return registry.approveSubscribeRequest({
        sender: activeAddress,
        signer: wrappedSigner,
        requestId,
        xgovAddress,
        onStatusChange: (status: TransactionState) => {
          txState.setStatus(status);
          callbacks?.onStatusChange?.(status);
        },
      });
    },
    onSuccess: (_, { xgovAddress }) => {
      txState.setStatus("confirmed");
      queryClient.invalidateQueries({ queryKey: registryQueryKeys.xgov(xgovAddress) });
      queryClient.invalidateQueries({ queryKey: ["subscribeRequests"] });
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
// Reject Subscribe Request Mutation (Subscriber Admin)
// ============================================================================

export interface RejectSubscribeRequestParams {
  requestId: bigint;
}

/**
 * Mutation hook for rejecting a subscribe request.
 */
export function useRejectSubscribeRequest(callbacks?: MutationCallbacks) {
  const queryClient = useQueryClient();
  const registry = useRegistrySDK();
  const { activeAddress, transactionSigner } = useWallet();
  const txState = useTransactionState();

  const mutation = useMutation({
    mutationFn: async ({ requestId }: RejectSubscribeRequestParams) => {
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

      return registry.rejectSubscribeRequest({
        sender: activeAddress,
        signer: wrappedSigner,
        requestId,
        onStatusChange: (status: TransactionState) => {
          txState.setStatus(status);
          callbacks?.onStatusChange?.(status);
        },
      });
    },
    onSuccess: () => {
      txState.setStatus("confirmed");
      queryClient.invalidateQueries({ queryKey: ["subscribeRequests"] });
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
