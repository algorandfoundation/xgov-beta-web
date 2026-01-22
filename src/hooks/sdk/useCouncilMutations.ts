import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@txnlab/use-wallet-react";
import { useCouncilSDK } from "./XGovSDKProvider";
import { useTransactionState, wrapTransactionSigner } from "@/hooks/useTransactionState";
import type { TransactionState } from "@/api/types/transaction_state";

// ============================================================================
// Query Keys
// ============================================================================

export const councilQueryKeys = {
  all: ["council"] as const,
  members: () => [...councilQueryKeys.all, "members"] as const,
  member: (address: string) => [...councilQueryKeys.all, "member", address] as const,
  state: () => [...councilQueryKeys.all, "state"] as const,
  votes: (proposalId: string) => [...councilQueryKeys.all, "votes", proposalId] as const,
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
// Council Vote Mutation
// ============================================================================

export interface CouncilVoteParams {
  proposalId: bigint;
  /** true = block, false = approve */
  block: boolean;
  /** Address of the proposal's proposer */
  proposerAddress: string;
  /** Whether this is the last voter (affects fee calculation) */
  isLastVoter?: boolean;
}

/**
 * Mutation hook for a council member to vote on a proposal.
 * 
 * @example
 * ```tsx
 * const { mutate: vote, isPending } = useCouncilVote();
 * 
 * vote({
 *   proposalId: 123n,
 *   block: false,
 *   proposerAddress: "ABC...",
 * });
 * ```
 */
export function useCouncilVote(callbacks?: MutationCallbacks) {
  const queryClient = useQueryClient();
  const council = useCouncilSDK();
  const { activeAddress, transactionSigner } = useWallet();
  const txState = useTransactionState();

  const mutation = useMutation({
    mutationFn: async ({ proposalId, block, proposerAddress, isLastVoter }: CouncilVoteParams) => {
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

      return council.vote({
        sender: activeAddress,
        signer: wrappedSigner,
        proposalId,
        block,
        proposerAddress,
        isLastVoter,
        onStatusChange: (status: TransactionState) => {
          txState.setStatus(status);
          callbacks?.onStatusChange?.(status);
        },
      });
    },
    onSuccess: (_, { proposalId }) => {
      txState.setStatus("confirmed");
      queryClient.invalidateQueries({ queryKey: councilQueryKeys.votes(proposalId.toString()) });
      // Also invalidate proposal since vote counts change
      queryClient.invalidateQueries({ queryKey: ["proposals", "detail", proposalId.toString()] });
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
// Add Council Member Mutation (Admin)
// ============================================================================

export interface AddCouncilMemberParams {
  memberAddress: string;
}

/**
 * Mutation hook for adding a council member (admin only).
 * 
 * @example
 * ```tsx
 * const { mutate: addMember } = useAddCouncilMember();
 * 
 * addMember({ memberAddress: "ABC..." });
 * ```
 */
export function useAddCouncilMember(callbacks?: MutationCallbacks) {
  const queryClient = useQueryClient();
  const council = useCouncilSDK();
  const { activeAddress, transactionSigner } = useWallet();
  const txState = useTransactionState();

  const mutation = useMutation({
    mutationFn: async ({ memberAddress }: AddCouncilMemberParams) => {
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

      return council.addMember({
        sender: activeAddress,
        signer: wrappedSigner,
        memberAddress,
        onStatusChange: (status: TransactionState) => {
          txState.setStatus(status);
          callbacks?.onStatusChange?.(status);
        },
      });
    },
    onSuccess: (_, { memberAddress }) => {
      txState.setStatus("confirmed");
      queryClient.invalidateQueries({ queryKey: councilQueryKeys.members() });
      queryClient.invalidateQueries({ queryKey: councilQueryKeys.member(memberAddress) });
      queryClient.invalidateQueries({ queryKey: councilQueryKeys.state() });
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
// Remove Council Member Mutation (Admin)
// ============================================================================

export interface RemoveCouncilMemberParams {
  memberAddress: string;
}

/**
 * Mutation hook for removing a council member (admin only).
 * 
 * @example
 * ```tsx
 * const { mutate: removeMember } = useRemoveCouncilMember();
 * 
 * removeMember({ memberAddress: "ABC..." });
 * ```
 */
export function useRemoveCouncilMember(callbacks?: MutationCallbacks) {
  const queryClient = useQueryClient();
  const council = useCouncilSDK();
  const { activeAddress, transactionSigner } = useWallet();
  const txState = useTransactionState();

  const mutation = useMutation({
    mutationFn: async ({ memberAddress }: RemoveCouncilMemberParams) => {
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

      return council.removeMember({
        sender: activeAddress,
        signer: wrappedSigner,
        memberAddress,
        onStatusChange: (status: TransactionState) => {
          txState.setStatus(status);
          callbacks?.onStatusChange?.(status);
        },
      });
    },
    onSuccess: (_, { memberAddress }) => {
      txState.setStatus("confirmed");
      queryClient.invalidateQueries({ queryKey: councilQueryKeys.members() });
      queryClient.invalidateQueries({ queryKey: councilQueryKeys.member(memberAddress) });
      queryClient.invalidateQueries({ queryKey: councilQueryKeys.state() });
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
