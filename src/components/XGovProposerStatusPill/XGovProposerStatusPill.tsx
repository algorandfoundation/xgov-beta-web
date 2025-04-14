import type { ProposerBoxState } from "@/api";
import {
  CheckIcon,
  CircleDashedIcon,
  ClockAlertIcon,
  XIcon,
} from "lucide-react";

export interface XGovProposerStatusPill {
  proposer?: { isProposer: boolean } & ProposerBoxState;
}

export function XGovProposerStatusPill({ proposer }: XGovProposerStatusPill) {
  const validKYC =
    (proposer &&
      proposer.kycStatus &&
      proposer.kycExpiring > Date.now() / 1000) ||
    false;

  return (
    <div className="flex items-center gap-2 bg-algo-blue/10 dark:bg-algo-teal/10 py-1 pl-1 pr-3 rounded-full">
      {!proposer?.isProposer ? (
        <div className="p-0.5 bg-red-500/10 rounded-full">
          <XIcon className="p-1 text-red-500" />
        </div>
      ) : proposer?.isProposer && !proposer.kycStatus ? (
        <div className="p-0.5 bg-algo-blue/10 dark:bg-algo-blue/20 rounded-full">
          <CircleDashedIcon className="p-1 text-algo-blue animate-spin-slow" />
        </div>
      ) : proposer?.isProposer &&
        proposer.kycStatus &&
        proposer.kycExpiring < Date.now() / 1000 ? (
        <div className="p-0.5 bg-algo-blue/10 rounded-full">
          <ClockAlertIcon className="p-1 text-red-500" />
        </div>
      ) : validKYC ? (
        <div className="p-0.5 bg-algo-teal-10 dark:bg-algo-teal/10 rounded-full">
          <CheckIcon className="p-1 text-algo-teal" />
        </div>
      ) : null}
      <h2 className="text-xl dark:text-white font-bold">xGov Proposer</h2>
    </div>
  );
}
