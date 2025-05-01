import { type ReactNode, useState } from "react";
import { navigate } from "astro:transitions/client";
import { useWallet } from "@txnlab/use-wallet-react";
import { SquarePenIcon } from "lucide-react";

import { ProposalFactory } from "@algorandfoundation/xgov";
import { UserPill } from "@/components/UserPill/UserPill";
import { BracketedPhaseDetail } from "@/components/BracketedPhaseDetail/BracketedPhaseDetail";
import { BlockIcon } from "@/components/icons/BlockIcon";
import {
  algorand,
  registryClient,
  ProposalStatus,
  ProposalStatusMap,
  type ProposalBrief,
  type ProposalMainCardDetails,
  getXGovQuorum,
  getVoteQuorum,
  getVotingDuration,
} from "@/api";
import { cn } from "@/functions/utils";
import { ChatBubbleLeftIcon } from "@/components/icons/ChatBubbleLeftIcon";
import { InfinityMirrorButton } from "@/components/button/InfinityMirrorButton/InfinityMirrorButton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTimeLeft } from "@/hooks/useTimeLeft";
import { Link } from "@/components/Link";
import VoteCounter from "@/components/VoteCounter/VoteCounter";
import XGovQuorumMetPill from "@/components/XGovQuorumMetPill/XGovQuorumMetPill";
import VoteQuorumMetPill from "@/components/VoteQuorumMetPill/VoteQuorumMetPill";
import MajorityApprovedPill from "@/components/MajorityApprovedPill/MajorityApprovedPill";
import VoteBar from "@/components/VoteBar/VoteBar";
import algosdk from "algosdk";
import { useProposal, useVoterBox } from "@/hooks";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export const defaultsStatusCardMap = {
  [ProposalStatus.ProposalStatusEmpty]: {
    header: 'This proposal is empty',
    subHeader: '',
    sideHeader: '',
    icon: '',
    action: '',
  },
  [ProposalStatus.ProposalStatusDraft]: {
    header: 'Proposal is being discussed',
    subHeader: 'Take part in the discussion and help shape public sentiment on this proposal.',
    sideHeader: '',
    icon: <ChatBubbleLeftIcon aria-hidden="true" className="size-24 stroke-[2] text-algo-blue dark:text-algo-teal group-hover:text-white" />,
    action: 'View the discussion',
  },
  [ProposalStatus.ProposalStatusFinal]: {
    header: 'Proposal is being discussed',
    subHeader: 'Take part in the discussion and help shape public sentiment on this proposal.',
    sideHeader: '',
    icon: <ChatBubbleLeftIcon aria-hidden="true" className="size-24 stroke-[2] text-algo-blue dark:text-algo-teal group-hover:text-white" />,
    action: 'View the discussion',
  },
  [ProposalStatus.ProposalStatusVoting]: {
    header: 'Vote on this proposal',
    subHeader: 'Vote on this proposal.',
    sideHeader: '',
    icon: '',
    action: 'You\'re not eligible to vote',
  },
  [ProposalStatus.ProposalStatusApproved]: {
    header: 'Proposal Approved!',
    subHeader: '',
    sideHeader: '',
    icon: '',
    action: '',
  },
  [ProposalStatus.ProposalStatusRejected]: {
    header: 'Proposal has been rejected',
    subHeader: '',
    sideHeader: '',
    icon: '',
    action: '',
  },
  [ProposalStatus.ProposalStatusReviewed]: {
    header: 'Proposal has been approved and deemed to conform with the xGov T&C.',
    subHeader: '',
    sideHeader: '',
    icon: '',
    action: '',
  },
  [ProposalStatus.ProposalStatusFunded]: {
    header: 'Proposal Funded!',
    subHeader: '',
    sideHeader: '',
    icon: '',
    action: '',
  },
  [ProposalStatus.ProposalStatusBlocked]: {
    header: 'Proposal has been Blocked by xGov Reviewer.',
    subHeader: '',
    sideHeader: '',
    icon: '',
    action: '',
  },
  [ProposalStatus.ProposalStatusDelete]: {
    header: 'Proposal has been deleted',
    subHeader: '',
    sideHeader: '',
    icon: '',
    action: '',
  },
}

interface StatusCardTemplateProps {
  className?: string;
  header?: string;
  subHeader?: ReactNode;
  sideHeader?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

function StatusCardTemplate({
  className = '',
  header,
  subHeader,
  sideHeader,
  icon,
  action
}: StatusCardTemplateProps) {
  return (
    <div
      className={cn(
        className,
        "w-full lg:min-w-[30rem] xl:min-w-[40rem] bg-algo-blue-10 dark:bg-algo-black-90 border-l-8 border-b-[6px] border-algo-blue-50 dark:border-algo-teal-50 hover:border-algo-blue dark:hover:border-algo-teal rounded-3xl flex flex-wrap items-center justify-between sm:flex-nowrap relative transition overflow-hidden",
      )}
    >
      <div className="w-full px-4 py-5 sm:px-6">
        <div className="w-full flex items-center justify-between">
          <h3 className="text-base font-semibold text-algo-black dark:text-white">
            {header}
          </h3>

          <p>{sideHeader}</p>
        </div>

        <p className="mt-1 text-wrap text-sm text-algo-black-80 dark:text-algo-black-30">
          {subHeader}
        </p>
        <div className="flex flex-col items-center justify-center gap-10 w-full h-96">
          {icon}
          {action}
        </div>
      </div>
    </div>
  );
}

interface DiscussionStatusCardProps {
  className?: string;
  proposal: ProposalMainCardDetails;
  discussionDuration: number;
  minimumDiscussionDuration: number;
}

function DiscussionStatusCard({
  className = "",
  proposal,
  discussionDuration,
  minimumDiscussionDuration,
}: DiscussionStatusCardProps) {
  const { activeAddress, transactionSigner } = useWallet();
  const proposalQuery = useProposal(proposal.id, proposal);

  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
  const [isDropModalOpen, setIsDropModalOpen] = useState(false);

  const finalizable = discussionDuration > minimumDiscussionDuration;
  const [days, hours, minutes, seconds] = useTimeLeft(
    Date.now() + (Number(minimumDiscussionDuration) - discussionDuration),
  );
  let remainingTime = `${days}d ${hours}h ${minutes}m ${seconds}s remaining`;

  let header = 'Proposal is being discussed';
  let icon = <ChatBubbleLeftIcon aria-hidden="true" className="size-24 stroke-[2] text-algo-blue dark:text-algo-teal group-hover:text-white" />;
  if (!finalizable && proposal.proposer === activeAddress) {
    header = "Your proposal is in the drafting & discussion phase";
    icon = (
      <SquarePenIcon
        aria-hidden="true"
        className="size-24 stroke-[2] text-algo-blue dark:text-algo-teal group-hover:text-white"
      />
    );
  }

  let action = (
    <Link
      to={proposal.forumLink}
      className="mt-2 px-4 py-2 bg-algo-blue dark:bg-algo-teal text-white dark:text-algo-black rounded-md hover:bg-algo-blue-50 dark:hover:bg-algo-teal-50"
    >
      View the discussion
    </Link>
  )

  if (proposal.proposer === activeAddress) {
    action = (
      <div className="flex gap-4 items-center">
        <Button
          onClick={() => setIsDropModalOpen(true)}
          type="button"
          variant="ghost"
        >
          Delete
        </Button>

        <Button
          onClick={() => {
            navigate(`/edit/${proposal.id}`);
          }}
          type="button"
          variant="ghost"
        >
          Edit
        </Button>

        <InfinityMirrorButton
          onClick={() => setIsFinalizeModalOpen(true)}
          type="button"
          variant="secondary"
          disabled={!finalizable}
          disabledMessage={
            finalizable
              ? undefined
              : `Discussion is ongoing. ${remainingTime}`
          }
        >
          Submit
        </InfinityMirrorButton>

        <FinalizeModal
          isOpen={isFinalizeModalOpen}
          onClose={() => setIsFinalizeModalOpen(false)}
          proposalId={proposal.id}
          refetchProposal={() => proposalQuery.refetch()}
          activeAddress={activeAddress}
          transactionSigner={transactionSigner}
        />
        <DropModal
          isOpen={isDropModalOpen}
          onClose={() => setIsDropModalOpen(false)}
          proposalId={proposal.id}
          refetchAllProposals={() => { }}
          refetchProposal={() => proposalQuery.refetch()}
          activeAddress={activeAddress}
          transactionSigner={transactionSigner}
        />
      </div>
    )
  }

  return (
    <StatusCardTemplate
      className={className}
      header={header}
      subHeader="Discussion is ongoing, take part and help shape public sentiment on this proposal."
      sideHeader={remainingTime}
      icon={icon}
      action={action}
    />
  )
}

interface VotingStatusCardProps {
  className?: string;
  proposal: ProposalMainCardDetails;
  quorums: [bigint, bigint, bigint];
  weightedQuorums: [bigint, bigint, bigint];
  votingDurations: [bigint, bigint, bigint, bigint];
}

const votesExceededMessage = "Total votes used exceeds available votes";

function VotingStatusCard({
  className = "",
  proposal,
  quorums,
  weightedQuorums,
  votingDurations,
}: VotingStatusCardProps) {
  const { activeAddress, transactionSigner } = useWallet();
  const proposalQuery = useProposal(proposal.id, proposal);
  const voterInfoQuery = useVoterBox(Number(proposal.id), activeAddress);

  const [mode, setMode] = useState<'simple' | 'advanced'>('simple');
  const [votesExceeded, setVotesExceeded] = useState(false);

  const voterInfo = voterInfoQuery.data || undefined;
  const totalVotes = Number(proposal.approvals) + Number(proposal.rejections) + Number(proposal.nulls);

  const xgovQuorum = getXGovQuorum(proposal.fundingCategory, quorums);
  const voteQuorum = getVoteQuorum(proposal.fundingCategory, weightedQuorums);
  const votingDuration = Date.now() - Number(proposal.voteOpenTs) * 1000;
  const minimumVotingDuration = getVotingDuration(proposal.fundingCategory, votingDurations);

  const [days, hours, minutes, seconds] = useTimeLeft(
    Date.now() + (minimumVotingDuration - votingDuration),
  );
  const remainingTime = `${days}d ${hours}h ${minutes}m ${seconds}s`;

  const votingSchema = z.object({
    approvals: z.number().min(0, { message: "Must be a positive number" }),
    rejections: z.number().min(0, { message: "Must be a positive number" }),
    nulls: z.number().min(0, { message: "Must be a positive number" }),
  }).superRefine((data, ctx) => {
    const totalVotes = data.approvals + data.rejections + data.nulls;
    setVotesExceeded(totalVotes > Number(voterInfo?.votes));
  });

  const form = useForm<z.infer<typeof votingSchema>>({
    resolver: zodResolver(votingSchema),
    defaultValues: {
      approvals: 0,
      rejections: 0,
      nulls: 0,
    },
    mode: "onChange",
  });
  const { errors } = form.formState;

  const usedFormVotes = form.watch("approvals") + form.watch("rejections") + form.watch("nulls");

  const voteProposal = async (approvals: number, rejections: number) => {
    if (!activeAddress || !transactionSigner) {
      console.log('Wallet not connected');
      return false;
    }

    if (!voterInfo) {
      console.log('Voter info not found');
      return false;
    }

    const addr = algosdk.decodeAddress(activeAddress).publicKey;
    const xgovBoxName = new Uint8Array(Buffer.concat([Buffer.from('x'), addr]));
    const voterBoxName = new Uint8Array(Buffer.concat([Buffer.from('V'), addr]));

    const res = await registryClient.send.voteProposal({
      sender: activeAddress,
      signer: transactionSigner,
      args: {
        proposalId: proposal.id,
        xgovAddress: activeAddress,
        approvalVotes: approvals,
        rejectionVotes: rejections,
      },
      appReferences: [proposal.id],
      accountReferences: [activeAddress],
      boxReferences: [
        xgovBoxName,
        { appId: proposal.id, name: voterBoxName }
      ],
      extraFee: (1000).microAlgos(),
    });

    if (res.confirmation.confirmedRound !== undefined && res.confirmation.confirmedRound > 0 && res.confirmation.poolError === '') {
      console.log('Transaction confirmed');
      proposalQuery.refetch();
      voterInfoQuery.refetch();
      return true;
    }

    console.log('Transaction not confirmed');
    return false;
  }

  const onSubmit = async (data: z.infer<typeof votingSchema>) => {
    await voteProposal(data.approvals, data.rejections);
  }

  let subheader = (
    <Button
      className="-ml-4"
      variant='link'
      onClick={() => setMode(mode === 'simple' ? 'advanced' : 'simple')}
    >
      {mode === 'simple' ? 'Advanced' : 'Simple'} Mode
    </Button>
  )

  let baseAction = (
    <div className="w-full flex flex-col items-center justify-center gap-4">
      <VoteCounter
        approvals={Number(proposal.approvals)}
        rejections={Number(proposal.rejections)}
        nulls={Number(proposal.nulls)}
      />
      <div className="flex gap-2">
        <XGovQuorumMetPill
          approved={Number(proposal.votedMembers) > Number(proposal.committeeMembers) * (xgovQuorum / 100)}
          quorumRequirement={xgovQuorum}
          label="xgov quorum met"
        />
        <VoteQuorumMetPill
          approved={totalVotes > Number(proposal.committeeVotes) * (voteQuorum / 100)}
          quorumRequirement={voteQuorum}
          label="vote quorum met"
        />
        <MajorityApprovedPill
          approved={proposal.approvals > proposal.rejections}
          label="majority approved"
        />
      </div>
      <VoteBar
        total={Number(proposal.committeeVotes)}
        approvals={Number(proposal.approvals)}
        rejections={Number(proposal.rejections)}
        nulls={Number(proposal.nulls)}
      />
    </div>
  )

  let action = (
    <>
      {baseAction}
      <p className="h-9 px-4 py-2">You are not eligible to vote</p>
    </>
  )

  if (!!voterInfo && voterInfo.votes > 0n) {
    if (voterInfo.voted) {
      subheader = <></>
      action = (
        <>
          {baseAction}
          <p className="h-9 px-4 py-2">You Voted!</p>
        </>
      )
    } else {
      if (mode === 'simple') {
        action = (
          <>
            {baseAction}
            <div className="flex gap-4 items-center">
              <Button
                type='button'
                onClick={() => voteProposal(Number(voterInfo.votes), 0)}
              >
                Approve
              </Button>

              <Button
                type='button'
                variant='destructive'
                onClick={() => voteProposal(0, Number(voterInfo.votes))}
              >
                Reject
              </Button>
            </div>
          </>
        )
      } else {
        action = (
          <>
            {baseAction}
            <div className="w-full px-4 flex flex-col items-center gap-2">
              <Form {...form}>
                {
                  (votesExceeded || errors.approvals?.message || errors.rejections?.message || errors.nulls?.message)
                    ? <FormMessage>
                      {votesExceeded ? votesExceededMessage : ""}
                      {errors.approvals?.message || errors.rejections?.message || errors.nulls?.message}
                    </FormMessage>
                    : <p className="text-[0.8rem] font-medium">{usedFormVotes}/{voterInfo.votes.toString()} Votes used</p>
                }
                <form onSubmit={form.handleSubmit(onSubmit)} className="w-full  flex items-end justify-around">
                  <FormField
                    control={form.control}
                    name="approvals"
                    render={({ field }) => (
                      <FormItem className="w-16">
                        <FormLabel className="dark:text-white">
                          Approvals
                          <span className="ml-0.5 text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="vote-approvals"
                            className={!!errors.approvals?.message ? "border-red-500" : ""}
                            placeholder="0"
                            type="number"
                            onFocus={(e) => e.target.select()}
                            onChange={(e) =>
                              field.onChange(e.target.valueAsNumber || 0)
                            }
                            value={field.value}
                            onBlur={field.onBlur}
                            name={field.name}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="nulls"
                    render={({ field }) => (
                      <FormItem className="w-16">
                        <FormLabel className="dark:text-white">
                          Abstains
                          <span className="ml-0.5 text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="vote-abstains"
                            className={!!errors.nulls?.message ? "border-red-500" : ""}
                            placeholder="0"
                            type="number"
                            onFocus={(e) => e.target.select()}
                            onChange={(e) =>
                              field.onChange(e.target.valueAsNumber || 0)
                            }
                            value={field.value}
                            onBlur={field.onBlur}
                            name={field.name}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rejections"
                    render={({ field }) => (
                      <FormItem className="w-16">
                        <FormLabel className="dark:text-white">
                          Rejections
                          <span className="ml-0.5 text-red-500">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="vote-rejections"
                            className={!!errors.rejections?.message ? "border-red-500" : ""}
                            placeholder="0"
                            type="number"
                            onFocus={(e) => e.target.select()}
                            onChange={(e) =>
                              field.onChange(e.target.valueAsNumber || 0)
                            }
                            value={field.value}
                            onBlur={field.onBlur}
                            name={field.name}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <Button
                    type='submit'
                    disabled={votesExceeded}
                  >
                    Submit
                  </Button>
                </form>
              </Form>
            </div >
          </>
        )
      }
    }
  }

  return (
    <StatusCardTemplate
      className={className}
      header="Vote on this proposal"
      subHeader={subheader}
      sideHeader={remainingTime}
      icon={<BlockIcon className="size-18 stroke-algo-blue dark:stroke-algo-teal" />}
      action={action}
    />
  )
}

export interface StatusCardProps {
  className?: string;
  proposal: ProposalMainCardDetails;
  discussionDuration: number;
  minimumDiscussionDuration: number;
  quorums: [bigint, bigint, bigint];
  weightedQuorums: [bigint, bigint, bigint];
  votingDurations: [bigint, bigint, bigint, bigint];
}

export function StatusCard({
  className = "",
  proposal,
  discussionDuration,
  minimumDiscussionDuration,
  quorums,
  weightedQuorums,
  votingDurations,
}: StatusCardProps) {

  if (proposal.status === ProposalStatus.ProposalStatusDraft) {
    return <DiscussionStatusCard
      className={className}
      proposal={proposal}
      discussionDuration={discussionDuration}
      minimumDiscussionDuration={minimumDiscussionDuration}
    />
  }

  if (proposal.status === ProposalStatus.ProposalStatusVoting) {
    return <VotingStatusCard
      className={className}
      proposal={proposal}
      quorums={quorums}
      weightedQuorums={weightedQuorums}
      votingDurations={votingDurations}
    />
  }

  const defaults = defaultsStatusCardMap[proposal.status];

  return <StatusCardTemplate
    className={className}
    header={defaults.header}
    subHeader={defaults.subHeader}
    sideHeader={defaults.sideHeader}
    icon={defaults.icon}
    action={defaults.action}
  />
}

export interface ProposalInfoProps {
  proposal: ProposalMainCardDetails;
  pastProposals?: ProposalBrief[];
  children?: ReactNode;
}

export function ProposalInfo({
  proposal,
  pastProposals,
  children,
}: ProposalInfoProps) {
  const phase = ProposalStatusMap[proposal.status];

  return (
    <>
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <svg
          aria-hidden="true"
          className="absolute left-[max(50%,25rem)] top-0 h-[64rem] w-[128rem] -translate-x-1/2 stroke-algo-blue-10 dark:stroke-algo-black-90 [mask-image:radial-gradient(64rem_64rem_at_top,#2D2DF1,transparent)]"
        >
          <defs>
            <pattern
              x="50%"
              y={-1}
              id="e813992c-7d03-4cc4-a2bd-151760b470a0"
              width={200}
              height={200}
              patternUnits="userSpaceOnUse"
              strokeWidth={2}
            >
              <path d="M100 200V.5M.5 .5H200" fill="none" />
            </pattern>
          </defs>
          <svg
            x="50%"
            y={-1}
            className="overflow-visible fill-algo-black/5 dark:fill-white/5"
          >
            <path
              d="M-100.5 0h201v201h-201Z M699.5 0h201v201h-201Z M499.5 400h201v201h-201Z M-300.5 600h201v201h-201Z"
              strokeWidth={0}
            />
          </svg>
          <rect
            fill="url(#e813992c-7d03-4cc4-a2bd-151760b470a0)"
            width="100%"
            height="100%"
            strokeWidth={0}
          />
        </svg>
      </div>
      <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-6 lg:mx-0 lg:max-w-none lg:grid-cols-2 lg:items-start lg:gap-y-10">
        <div className="lg:col-span-2 lg:col-start-1 lg:row-start-1 lg:grid lg:w-full lg:max-w-7xl lg:grid-cols-2 lg:gap-x-8 pt-6">
          <div className="lg:pr-4">
            <div className="sm:max-w-lg md:max-w-[unset]">
              <p className="text-base/7 text-algo-blue">
                <BracketedPhaseDetail phase={phase} />
              </p>
              <h1 className="mt-2 text-pretty text-4xl font-semibold tracking-tight sm:text-5xl">
                {proposal.title}
              </h1>

              <p className="mt-6 text-xl/8 text-algo-black-70 dark:text-algo-black-30">
                {proposal.description}
              </p>
            </div>
          </div>
        </div>
        <div className="lg:flex lg:flex-col lg:items-end lg:fixed lg:right-0 lg:pr-8 lg:pt-14">
          {children}
        </div>
        <div className="lg:col-span-2 lg:col-start-1 lg:row-start-2 lg:grid lg:w-full lg:max-w-7xl lg:grid-cols-2 lg:gap-x-8">
          <div className="lg:pr-4">
            <div className="max-w-xl text-lg/8 text-algo-black-70 dark:text-algo-black-30 sm:max-w-lg md:max-w-[unset]">
              <p className="mb-8">
                <strong className="font-semibold text-algo-black dark:text-white">
                  About the team
                  <br />
                </strong>
                {proposal.team}
              </p>
              <p className="mb-4">
                <strong className="font-semibold text-algo-black dark:text-white">
                  Additional Info
                  <br />
                </strong>
                {proposal.additionalInfo}
              </p>
              {!!proposal.adoptionMetrics && (
                <div className="mb-4">
                  <strong className="font-semibold text-algo-black dark:text-white">
                    Adoption Metrics
                    <br />
                  </strong>
                  <ul className="flex flex-wrap mt-2 gap-4">
                    {proposal.adoptionMetrics.map((metric, index) => (
                      <li
                        key={index}
                        className="bg-algo-blue-10 dark:bg-algo-black-70 dark:text-white rounded-md py-1 px-2"
                      >
                        {metric}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="text-base inline-flex items-center justify-between gap-3 mt-2 mb-6 p-1 pr-4">
                <UserPill variant="secondary" address={proposal.proposer} />
                <span className="text-2xl font-semibold text-algo-blue dark:text-algo-teal">
                  //
                </span>
                <span className="text-algo-black-50 dark:text-white">
                  Proposed 2d ago
                </span>
              </div>
              {!!pastProposals && !!pastProposals.length && (
                <>
                  <h5 className="font-semibold text-algo-black dark:text-algo-black-30 mb-2">
                    Past Proposals
                  </h5>
                  <ul className="text-xl text-algo-black dark:text-white flex flex-col gap-2">
                    {pastProposals.map((pastProposal) => {
                      return (
                        <li
                          key={pastProposal.id}
                          className="bg-algo-blue-10 dark:bg-algo-black-90 border-l-4 border-b-[3px] border-algo-blue-50 dark:border-algo-teal-90 hover:border-algo-blue dark:hover:border-algo-teal rounded-x-xl rounded-2xl flex flex-wrap items-center justify-between gap-x-6 gap-y-4 p-2.5 sm:flex-nowrap relative transition overflow-hidden text-wrap"
                        >
                          <Link
                            className="absolute left-0 top-0 w-full h-full hover:bg-algo-blue/30 dark:hover:bg-algo-teal/30"
                            to={`/proposal/${Number(pastProposal.id)}`}
                          ></Link>
                          {pastProposal.title}
                          <BracketedPhaseDetail phase={phase} />
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

interface FinalizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposalId: bigint;
  activeAddress: string | null;
  transactionSigner: any;
  refetchProposal: () => void;
}

export function FinalizeModal({
  isOpen,
  onClose,
  proposalId,
  activeAddress,
  transactionSigner,
  refetchProposal,
}: FinalizeModalProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      if (!activeAddress || !transactionSigner) {
        setErrorMessage("Wallet not connected.");
        return false;
      }

      const proposalFactory = new ProposalFactory({ algorand });
      const proposalClient = proposalFactory.getAppClientById({
        appId: proposalId,
      });

      const res = await proposalClient.send.finalize({
        sender: activeAddress,
        signer: transactionSigner,
        args: {},
        appReferences: [registryClient.appId],
        accountReferences: [activeAddress],
        boxReferences: [new Uint8Array(Buffer.from("M"))],
        extraFee: (1000).microAlgos(),
      });

      if (
        res.confirmation.confirmedRound !== undefined &&
        res.confirmation.confirmedRound > 0 &&
        res.confirmation.poolError === ""
      ) {
        console.log("Transaction confirmed");
        setErrorMessage(null);
        onClose();
        refetchProposal();
        return true;
      }

      console.log("Transaction not confirmed");
      setErrorMessage("Transaction not confirmed.");
      return false;
    } catch (error) {
      console.error("Error during finalize:", error);
      setErrorMessage("An error occurred calling the proposal contract.");
      return false;
    }
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent
        className="w-full h-full sm:h-auto sm:max-w-[425px] sm:rounded-lg"
        onCloseClick={onClose}
      >
        <DialogHeader className="mt-12 flex flex-col items-start gap-2">
          <DialogTitle className="dark:text-white">
            Submit Proposal?
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to submit this proposal?
          </DialogDescription>
        </DialogHeader>
        {errorMessage && <p className="text-red-500">{errorMessage}</p>}
        <DialogFooter className="mt-8">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Submit</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface DropModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposalId: bigint;
  activeAddress: string | null;
  transactionSigner: any;
  refetchProposal: () => void;
  refetchAllProposals: () => void;
}

export function DropModal({
  isOpen,
  onClose,
  proposalId,
  activeAddress,
  transactionSigner,
  refetchProposal,
  refetchAllProposals,
}: DropModalProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDrop = async () => {
    try {
      if (!activeAddress || !transactionSigner) {
        setErrorMessage("Wallet not connected.");
        return false;
      }

      const proposalFactory = new ProposalFactory({ algorand });
      const proposalClient = proposalFactory.getAppClientById({
        appId: proposalId,
      });

      const res = await proposalClient
        .newGroup()
        .uploadMetadata({
          sender: activeAddress,
          signer: transactionSigner,
          args: {
            payload: new Uint8Array(Buffer.from("M")),
            isFirstInGroup: true
          },
          appReferences: [registryClient.appId],
          boxReferences: [
            new Uint8Array(Buffer.from("M")),
            new Uint8Array(Buffer.from("M")),
            new Uint8Array(Buffer.from("M")),
            new Uint8Array(Buffer.from("M")),
            new Uint8Array(Buffer.from("M")),
            new Uint8Array(Buffer.from("M")),
            new Uint8Array(Buffer.from("M")),
          ]
        })
        .uploadMetadata({
          sender: activeAddress,
          signer: transactionSigner,
          args: {
            payload: new Uint8Array(Buffer.from("M")),
            isFirstInGroup: false
          },
          appReferences: [registryClient.appId],
          boxReferences: [
            new Uint8Array(Buffer.from("M")),
            new Uint8Array(Buffer.from("M")),
            new Uint8Array(Buffer.from("M")),
            new Uint8Array(Buffer.from("M")),
            new Uint8Array(Buffer.from("M")),
            new Uint8Array(Buffer.from("M")),
            new Uint8Array(Buffer.from("M")),
          ],
        })
        .uploadMetadata({
          sender: activeAddress,
          signer: transactionSigner,
          args: {
            payload: new Uint8Array(Buffer.from("M")),
            isFirstInGroup: false
          },
          appReferences: [registryClient.appId],
          boxReferences: [
            new Uint8Array(Buffer.from("M")),
            new Uint8Array(Buffer.from("M")),
            new Uint8Array(Buffer.from("M")),
            new Uint8Array(Buffer.from("M")),
            new Uint8Array(Buffer.from("M")),
            new Uint8Array(Buffer.from("M")),
            new Uint8Array(Buffer.from("M")),
          ],
          note: '1'
        })
        .uploadMetadata({
          sender: activeAddress,
          signer: transactionSigner,
          args: {
            payload: new Uint8Array(Buffer.from("M")),
            isFirstInGroup: false
          },
          appReferences: [registryClient.appId],
          boxReferences: [
            new Uint8Array(Buffer.from("M")),
            new Uint8Array(Buffer.from("M")),
            new Uint8Array(Buffer.from("M")),
            new Uint8Array(Buffer.from("M")),
            new Uint8Array(Buffer.from("M")),
            new Uint8Array(Buffer.from("M")),
            new Uint8Array(Buffer.from("M")),
          ],
          note: '2'
        })
        .drop({
          sender: activeAddress,
          signer: transactionSigner,
          args: {},
          appReferences: [registryClient.appId],
          accountReferences: [activeAddress],
          boxReferences: [
            new Uint8Array(Buffer.from("M")),
            new Uint8Array(Buffer.from("M")),
          ],
          extraFee: (1000).microAlgos(),
        })
        .send()

      if (
        res.confirmations[4].confirmedRound !== undefined &&
        res.confirmations[4].confirmedRound > 0 &&
        res.confirmations[4].poolError === ""
      ) {
        console.log("Transaction confirmed");
        setErrorMessage(null);
        onClose();
        refetchProposal();
        refetchAllProposals();
        navigate("/");
        return true;
      }

      console.log("Transaction not confirmed");
      setErrorMessage("Transaction not confirmed.");
      return false;
    } catch (error) {
      console.error("Error during drop:", error);
      setErrorMessage("An error occurred calling the proposal contract.");
      return false;
    }
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent
        className="w-full h-full sm:h-auto sm:max-w-[425px] sm:rounded-lg"
        onCloseClick={onClose}
      >
        <DialogHeader className="mt-12 flex flex-col items-start gap-2">
          <DialogTitle className="dark:text-white">
            Delete Proposal?
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this proposal? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        {errorMessage && <p className="text-red-500">{errorMessage}</p>}
        <DialogFooter className="mt-8">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDrop}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
