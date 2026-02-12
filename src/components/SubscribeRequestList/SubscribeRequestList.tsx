import { approveSubscribeRequest, rejectSubscribeRequest, type XGovSubscribeRequestBoxValue } from "@/api";
import { SubscribeRequestCard } from "../SubscribeRequestCard/SubscribeRequestCard";
import { useTransactionState } from "@/hooks/useTransactionState";
import { useAllRequestBoxes } from "@/hooks/useRequestBoxes";
import { useWallet } from "@txnlab/use-wallet-react";

export interface SubscribeRequestListProps {
  requests?: (XGovSubscribeRequestBoxValue & { id: bigint })[]
}

export function SubscribeRequestList({ requests }: SubscribeRequestListProps) {
  const { activeAddress, transactionSigner } = useWallet();
  const _requests = useAllRequestBoxes();

  const {
    status: approveStatus,
    setStatus: setApproveStatus,
    errorMessage: approveErrorMessage,
  } = useTransactionState();

  const {
    status: rejectStatus,
    setStatus: setRejectStatus,
    errorMessage: rejectErrorMessage,
  } = useTransactionState();


  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {!requests || requests.length === 0 ? (
        <div>No Requests.</div>
      ) : (
        requests.map((request) => (
          <SubscribeRequestCard
            key={request.id}
            request={request}
            onApprove={() => approveSubscribeRequest({
              activeAddress,
              innerSigner: transactionSigner,
              setStatus: setApproveStatus,
              refetch: [_requests.refetch],
              requestId: request.id,
              xgovAddress: request.xgovAddr,
            })}
            onReject={() => rejectSubscribeRequest({
              activeAddress,
              innerSigner: transactionSigner,
              setStatus: setRejectStatus,
              refetch: [_requests.refetch],
              requestId: request.id,
            })}
            approveStatus={approveStatus}
            rejectStatus={rejectStatus}
            errorMessage={approveErrorMessage || rejectErrorMessage}
          />
        ))
      )}
    </div>
  );
}