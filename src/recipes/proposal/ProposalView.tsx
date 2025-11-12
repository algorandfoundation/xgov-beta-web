import { type ReactNode, useState } from "react";
import { navigate } from "astro:transitions/client";
import { useWallet } from "@txnlab/use-wallet-react";
import { CoinsIcon, ExternalLinkIcon, HeartCrackIcon, PartyPopperIcon, SquarePenIcon, TrashIcon, VoteIcon } from "lucide-react";

import { ProposalFactory } from "@algorandfoundation/xgov";
import { UserPill } from "@/components/UserPill/UserPill";
import { BracketedPhaseDetail } from "@/components/BracketedPhaseDetail/BracketedPhaseDetail";
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
  getGlobalState,
  callAssignVoters,
  type ProposalMainCardDetailsWithNFDs,
  dropProposal,
  voteProposal,
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
import { ProposalCouncilCard } from "@/components/ProposalCouncilCard/ProposalCouncilCard";
import { VoteCounter } from "@/components/VoteCounter/VoteCounter";
import XGovQuorumMetPill from "@/components/XGovQuorumMetPill/XGovQuorumMetPill";
import VoteQuorumMetPill from "@/components/VoteQuorumMetPill/VoteQuorumMetPill";
import MajorityApprovedPill from "@/components/MajorityApprovedPill/MajorityApprovedPill";
import VoteBar from "@/components/VoteBar/VoteBar";
import algosdk from "algosdk";
import { useNFD, useProposal, useVoterBox, useVoterBoxes, useXGovDelegates } from "@/hooks";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { formatDistanceToNow } from "date-fns";
import { ProposalPayorCard } from "@/components/ProposalPayorCard/ProposalPayorCard";
import { useTransactionState } from "@/hooks/useTransactionState";
import { TransactionStateLoader } from "@/components/TransactionStateLoader/TransactionStateLoader";
import type { QueryObserverResult, RefetchOptions } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { shortenAddress } from "@/functions";

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
    icon: <ChatBubbleLeftIcon aria-hidden="true" className="size-24 stroke-[1] text-algo-blue dark:text-algo-teal group-hover:text-white" />,
    action: 'View the discussion',
  },
  [ProposalStatus.ProposalStatusSubmitted]: {
    header: 'Proposal is being discussed',
    subHeader: 'Take part in the discussion and help shape public sentiment on this proposal.',
    sideHeader: '',
    icon: <ChatBubbleLeftIcon aria-hidden="true" className="size-24 stroke-[1] text-algo-blue dark:text-algo-teal group-hover:text-white" />,
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
    subHeader: 'The proposal has been approved by the xGov community! Once the proposal is verified to meet requirements, it will be funded!',
    sideHeader: '',
    icon: <PartyPopperIcon className="size-24 stroke-[1] text-algo-blue dark:text-algo-teal group-hover:text-white" />,
    action: 'woo hoo! 🎉',
  },
  [ProposalStatus.ProposalStatusRejected]: {
    header: 'Proposal Rejected',
    subHeader: 'Unfortunately, this proposal has been rejected by the xGov community.',
    sideHeader: '',
    icon: <HeartCrackIcon className="size-40 stroke-[1] text-algo-blue dark:text-algo-teal group-hover:text-white" />,
    action: '',
  },
  [ProposalStatus.ProposalStatusReviewed]: {
    header: 'Proposal Reviewed',
    subHeader: 'Proposal has been reviewed & meets xGov terms & conditions',
    sideHeader: '',
    icon: <PartyPopperIcon className="size-40 stroke-[1] text-algo-blue dark:text-algo-teal group-hover:text-white" />,
    action: 'ahh yeah! 🎉',
  },
  [ProposalStatus.ProposalStatusFunded]: {
    header: 'Proposal Funded!',
    subHeader: 'Proposal funds have been released to the proposer.',
    sideHeader: '',
    icon: <CoinsIcon className="size-40 stroke-[1] text-algo-blue dark:text-algo-teal group-hover:text-white" />,
    action: '',
  },
  [ProposalStatus.ProposalStatusBlocked]: {
    header: 'Proposal Blocked',
    subHeader: 'Unfortunately, this proposal has been blocked for not meeting xGov terms & conditions.',
    sideHeader: '',
    icon: <HeartCrackIcon className="size-40 stroke-[1] text-algo-blue dark:text-algo-teal group-hover:text-white" />,
    action: '',
  },
  [ProposalStatus.ProposalStatusDelete]: {
    header: 'Proposal Deleted',
    subHeader: 'This proposal has been deleted.',
    sideHeader: '',
    icon: <TrashIcon className="size-40 stroke-[1] text-algo-blue dark:text-algo-teal group-hover:text-white" />,
    action: '',
  },
}

const PostVotingStates = [
  ProposalStatus.ProposalStatusApproved,
  ProposalStatus.ProposalStatusRejected,
  ProposalStatus.ProposalStatusReviewed,
  ProposalStatus.ProposalStatusFunded,
  ProposalStatus.ProposalStatusBlocked
]

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
        "w-full lg:min-w-[30rem] xl:min-w-[40rem] bg-algo-blue-10 dark:bg-algo-black-90 rounded-3xl flex flex-wrap items-center justify-between sm:flex-nowrap relative transition overflow-hidden",
      )}
    >
      <div className="w-full px-4 py-5 sm:px-6">
        <div className="w-full flex gap-10 items-center justify-between">
          <h3 className="text-base font-semibold text-algo-black dark:text-white">
            {header}
          </h3>

          <p className="text-algo-blue dark:text-algo-teal">{sideHeader}</p>
        </div>

        <div className="mt-3 max-w-[30rem] text-wrap text-sm text-algo-black-50 dark:text-algo-black-30">
          {subHeader}
        </div>
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

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isDropModalOpen, setIsDropModalOpen] = useState(false);

  const submitable = discussionDuration > minimumDiscussionDuration;
  const [days, hours, minutes] = useTimeLeft(
    Date.now() + (Number(minimumDiscussionDuration) - discussionDuration),
  );
  let remainingTime = `${days}d ${hours}h ${minutes}m`;

  let header = 'Proposal is being discussed';
  let icon = <ChatBubbleLeftIcon aria-hidden="true" className="size-24 stroke-[1] text-algo-blue dark:text-algo-teal group-hover:text-white" />;
  if (!submitable && proposal.proposer === activeAddress) {
    header = "Your proposal is in the drafting & discussion phase";
    icon = (
      <SquarePenIcon
        aria-hidden="true"
        className="size-24 stroke-[1] text-algo-blue dark:text-algo-teal group-hover:text-white"
      />
    );
  }

  let action = (
    <Link
      target="_blank"
      to={proposal.forumLink}
      className="flex gap-2 mt-2 px-4 py-2 bg-algo-blue dark:bg-algo-teal text-white dark:text-algo-black rounded-md hover:bg-algo-blue-50 dark:hover:bg-algo-teal-50"
    >
      View the discussion
      <ExternalLinkIcon />
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
          onClick={() => setIsSubmitModalOpen(true)}
          type="button"
          variant="secondary"
          disabled={!submitable}
          disabledMessage={
            submitable
              ? undefined
              : `Discussion is ongoing. ${remainingTime}`
          }
        >
          Submit
        </InfinityMirrorButton>

        <SubmitModal
          isOpen={isSubmitModalOpen}
          onClose={() => setIsSubmitModalOpen(false)}
          proposalId={proposal.id}
          refetchProposal={() => proposalQuery.refetch()}
          activeAddress={activeAddress}
          transactionSigner={transactionSigner}
        />
        <DropModal
          isOpen={isDropModalOpen}
          onClose={() => setIsDropModalOpen(false)}
          proposalId={proposal.id}
          refetch={[proposalQuery.refetch]}
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
      sideHeader={discussionDuration > Number(minimumDiscussionDuration) ? 'Ready to submit' : remainingTime}
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
  const { activeAddress, transactionSigner: innerSigner } = useWallet();
  const proposalQuery = useProposal(proposal.id, proposal);
  const delegates = useXGovDelegates(activeAddress)
  const infoQueryAddresses = [activeAddress, ...(delegates?.data?.map(d => d.xgov) || [])].filter(a => !!a) as string[];
  const voterInfoQuery = useVoterBoxes(Number(proposal.id), infoQueryAddresses);

  const [selectedVotingAs, setSelectedVotingAs] = useState(activeAddress);
  const [mode, setMode] = useState<'simple' | 'advanced'>('simple');
  const [votesExceeded, setVotesExceeded] = useState(false);

  const {
    setStatus: setAdvancedStatus,
    isPending: advancedIsPending
  } = useTransactionState();

  const {
    status: rejectStatus,
    setStatus: setRejectStatus,
    errorMessage: rejectErrorMessage,
    isPending: rejectIsPending
  } = useTransactionState();

  const {
    status: approveStatus,
    setStatus: setApproveStatus,
    errorMessage: approveErrorMessage,
    isPending: approveIsPending
  } = useTransactionState();

  const voterInfo = voterInfoQuery.data?.[selectedVotingAs!] || undefined;
  const totalVotes = Number(proposal.approvals) + Number(proposal.rejections) + Number(proposal.nulls);

  const xgovQuorum = getXGovQuorum(proposal.fundingCategory, quorums);
  const voteQuorum = getVoteQuorum(proposal.fundingCategory, weightedQuorums);
  const voteStartTime = Number(proposal.voteOpenTs) * 1000;
  const minimumVotingDuration = getVotingDuration(proposal.fundingCategory, votingDurations);
  const voteEndTime = voteStartTime + minimumVotingDuration;
  const votingTimeElapsed = Date.now() - voteStartTime;

  const [days, hours, minutes] = useTimeLeft(voteEndTime);
  const remainingTime = `${days}d ${hours}h ${minutes}m`;

  const votingSchema = z.object({
    approvals: z.number().min(0, { message: "Must be a positive number" }),
    rejections: z.number().min(0, { message: "Must be a positive number" }),
    nulls: z.number().min(0, { message: "Must be a positive number" }),
  }).superRefine((data) => {
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

  const onSubmit = async ({ approvals, rejections }: z.infer<typeof votingSchema>) => {
    await voteProposal({
      activeAddress,
      xgovAddress: selectedVotingAs,
      innerSigner,
      setStatus: setAdvancedStatus,
      refetch: [proposalQuery.refetch, voterInfoQuery.refetch],
      appId: proposal.id,
      approvals,
      rejections,
      voterInfo
    });
  }

  const subheader = (
    <div className="h-9 flex items-start">
      <Link
        target="_blank"
        to={proposal.forumLink}
        className="flex items-center gap-1 text-algo-black/80 dark:text-white/80 hover:underline"
      >
        View the discussion
        <ExternalLinkIcon size={16} />
      </Link>
    </div>
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
          approved={Number(proposal.votedMembers) >= Number(proposal.committeeMembers) * (xgovQuorum / 100)}
          votesHave={Number(proposal.votedMembers)}
          votesNeed={Math.floor(Number(proposal.committeeMembers) * (xgovQuorum / 100))}
          quorumRequirement={xgovQuorum}
          label="xgov quorum met"
        />
        <VoteQuorumMetPill
          approved={totalVotes > Number(proposal.committeeVotes) * (voteQuorum / 100)}
          votesHave={totalVotes}
          votesNeed={Math.floor(Number(proposal.committeeVotes) * (voteQuorum / 100))}
          quorumRequirement={voteQuorum}
          label="vote quorum met"
        />
        <MajorityApprovedPill
          approved={proposal.approvals > proposal.rejections}
          percentApproved={proposal.approvals + proposal.rejections === 0n ? 0 : Math.floor((Number(proposal.approvals) / (Number(proposal.approvals) + Number(proposal.rejections))) * 100)}
          label="majority approved"
        />
      </div>
      <VoteBar
        total={Number(proposal.committeeVotes)}
        approvals={Number(proposal.approvals)}
        rejections={Number(proposal.rejections)}
        nulls={Number(proposal.nulls)}
      />
      <div className="w-full flex items-center justify-between">
        <Button
          className="-ml-4"
          variant='link'
          onClick={() => setMode(mode === 'simple' ? 'advanced' : 'simple')}
        >
          {mode === 'simple' ? 'Advanced' : 'Simple'} Mode
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-xxs font-semibold">Voting For</span>
          <Select
            onValueChange={setSelectedVotingAs}
            defaultValue={activeAddress!}
          >
            <SelectTrigger id="voting-as" className="w-40" aria-label="Select voting as">
              <SelectValue placeholder="Select voting as" />
            </SelectTrigger>
            <SelectContent>
              {
                [
                  ...Object.keys(voterInfoQuery?.data ?? {})
                    // .filter(key => (voterInfoQuery?.data?.[key]?.votes ?? 0) > 0 && !voterInfoQuery?.data?.[key]?.voted)
                ].map(address => (
                  <SelectItem key={address} value={address} disabled={!((voterInfoQuery?.data?.[address]?.votes ?? 0) > 0)}>
                    {shortenAddress(address)}
                  </SelectItem>
                ))
              }
            </SelectContent>
          </Select>
        </div>
      </div>
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
      action = (
        <>
          {baseAction}
          <p className="h-9 px-4 py-2">Already Voted!</p>
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
                onClick={() => voteProposal({
                  activeAddress,
                  xgovAddress: selectedVotingAs,
                  innerSigner,
                  setStatus: setApproveStatus,
                  refetch: [proposalQuery.refetch, voterInfoQuery.refetch],
                  appId: proposal.id,
                  approvals: Number(voterInfo.votes),
                  rejections: 0,
                  voterInfo: voterInfo,
                })}
                disabled={rejectIsPending || approveIsPending}
              >
                <TransactionStateLoader
                  defaultText="Approve"
                  txnState={{
                    status: approveStatus,
                    errorMessage: approveErrorMessage,
                    isPending: approveIsPending
                  }}
                />
              </Button>

              <Button
                type='button'
                variant='destructive'
                onClick={() => voteProposal({
                  activeAddress,
                  xgovAddress: selectedVotingAs,
                  innerSigner,
                  setStatus: setRejectStatus,
                  refetch: [proposalQuery.refetch, voterInfoQuery.refetch],
                  appId: proposal.id,
                  approvals: 0,
                  rejections: Number(voterInfo.votes),
                  voterInfo: voterInfo,
                })}
                disabled={rejectIsPending || approveIsPending}
              >
                <TransactionStateLoader
                  defaultText="Reject"
                  txnState={{
                    status: rejectStatus,
                    errorMessage: rejectErrorMessage,
                    isPending: rejectIsPending
                  }}
                />
              </Button>
            </div >
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
                          <span className="ml-0.5 text-algo-red">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="vote-approvals"
                            className={!!errors.approvals?.message ? "border-algo-red" : ""}
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
                          <span className="ml-0.5 text-algo-red">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="vote-abstains"
                            className={!!errors.nulls?.message ? "border-algo-red" : ""}
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
                          <span className="ml-0.5 text-algo-red">*</span>
                        </FormLabel>
                        <FormControl>
                          <Input
                            id="vote-rejections"
                            className={!!errors.rejections?.message ? "border-algo-red" : ""}
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
                    disabled={votesExceeded || advancedIsPending}
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
      sideHeader={votingTimeElapsed > minimumVotingDuration ? 'Voting window elapsed!' : remainingTime}
      icon={<VoteIcon className="size-24 stroke-[1] stroke-algo-blue dark:stroke-algo-teal" />}
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

interface PostVotingStatusCardProps {
  className?: string;
  proposal: ProposalMainCardDetails;
  quorums: [bigint, bigint, bigint];
  weightedQuorums: [bigint, bigint, bigint];
}

function PostVotingStatusCard({
  className = "",
  proposal,
  quorums,
  weightedQuorums,
}: PostVotingStatusCardProps) {
  const totalVotes = Number(proposal.approvals) + Number(proposal.rejections) + Number(proposal.nulls);

  const xgovQuorum = getXGovQuorum(proposal.fundingCategory, quorums);
  const voteQuorum = getVoteQuorum(proposal.fundingCategory, weightedQuorums);

  const defaults = defaultsStatusCardMap[proposal.status];

  const subheader = (
    <div className="h-9 flex items-start">
      <Link
        target="_blank"
        to={proposal.forumLink}
        className="flex items-center gap-1 text-algo-black/80 dark:text-white/80 hover:underline"
      >
        View the discussion
        <ExternalLinkIcon size={16} />
      </Link>
    </div>
  )

  const voteMetricsAction = (
    <div className="w-full flex flex-col items-center justify-center gap-4">
      <VoteCounter
        approvals={Number(proposal.approvals)}
        rejections={Number(proposal.rejections)}
        nulls={Number(proposal.nulls)}
      />
      <div className="flex gap-2">
        <XGovQuorumMetPill
          approved={Number(proposal.votedMembers) > Number(proposal.committeeMembers) * (xgovQuorum / 100)}
          votesHave={Number(proposal.votedMembers)}
          votesNeed={Math.floor(Number(proposal.committeeMembers) * (xgovQuorum / 100))}
          quorumRequirement={xgovQuorum}
          label="xgov quorum met"
        />
        <VoteQuorumMetPill
          approved={totalVotes > Number(proposal.committeeVotes) * (voteQuorum / 100)}
          votesHave={totalVotes}
          votesNeed={Math.floor(Number(proposal.committeeVotes) * (voteQuorum / 100))}
          quorumRequirement={voteQuorum}
          label="vote quorum met"
        />
        <MajorityApprovedPill
          approved={proposal.approvals > proposal.rejections}
          percentApproved={proposal.approvals + proposal.rejections === 0n ? 0 : Math.floor((Number(proposal.approvals) / (Number(proposal.approvals) + Number(proposal.rejections))) * 100)}
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

  return <StatusCardTemplate
    className={className}
    header={defaults.header}
    subHeader={subheader}
    sideHeader={defaults.sideHeader}
    icon={defaults.icon}
    action={voteMetricsAction}
  />
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

  // States that should show vote metrics: Approved, Rejected, Reviewed, Funded, Blocked
  if (PostVotingStates.includes(proposal.status)) {
    return <PostVotingStatusCard
      className={className}
      proposal={proposal}
      quorums={quorums}
      weightedQuorums={weightedQuorums}
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
  activeAddress: string | null;
  xGovCouncil?: string;
  xGovPayor?: string;
  proposal: ProposalMainCardDetailsWithNFDs;
  pastProposals?: ProposalBrief[];
  children?: ReactNode;
}

export function ProposalInfo({
  activeAddress,
  xGovCouncil,
  xGovPayor,
  proposal,
  pastProposals,
  children,
}: ProposalInfoProps) {
  const nfd = useNFD(proposal.proposer);

  const phase = ProposalStatusMap[proposal.status];

  const _pastProposals = (pastProposals || []).filter((p) =>
    ![
      ProposalStatus.ProposalStatusEmpty,
      ProposalStatus.ProposalStatusDelete,
    ].includes(p.status) && p.id !== proposal.id
  )

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
        {
          proposal.status === ProposalStatus.ProposalStatusApproved && (
            <div className="lg:col-span-2">
              <ProposalCouncilCard
                proposalId={proposal.id}
                status={proposal.status}
              />
            </div>
          )
        }
        {
          xGovPayor
          && activeAddress
          && activeAddress === xGovPayor
          && (
            <div className="lg:col-span-2">
              <ProposalPayorCard
                proposalId={proposal.id}
                status={proposal.status}
              />
            </div>
          )
        }

        <div className="lg:col-span-2 lg:grid lg:w-full lg:max-w-7xl lg:grid-cols-2 lg:gap-x-8 pt-6">
          <div className="lg:pr-4">
            <div className="sm:max-w-lg md:max-w-[unset]">
              <p className="text-base/7 text-algo-blue">
                <BracketedPhaseDetail phase={phase} />
              </p>
              <h1 className="mt-2 text-pretty text-4xl font-semibold tracking-tight sm:text-5xl">
                {proposal.title}
              </h1>

              <p className="whitespace-pre-line mt-6 text-xl/8 text-algo-black-70 dark:text-algo-black-30">
                {proposal.description}
              </p>
            </div>
          </div>
        </div>
        <div className="lg:flex lg:flex-col lg:items-end lg:fixed lg:right-0 lg:pr-8 lg:pt-6 2xl:pt-14 proposal-fixed-sidebar">
          {children}
        </div>
        <div className="lg:col-span-2 lg:grid lg:w-full lg:max-w-7xl lg:grid-cols-2 lg:gap-x-8">
          <div className="lg:pr-4">
            <div className="max-w-xl text-lg/8 text-algo-black-70 dark:text-algo-black-30 sm:max-w-lg md:max-w-[unset]">
              <p className="whitespace-pre-line mb-8">
                <strong className="font-semibold text-algo-black dark:text-white">
                  About the team
                  <br />
                </strong>
                {proposal.team}
              </p>
              <p className="whitespace-pre-line mb-4">
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

              <div className="text-sm md:text-base inline-flex items-center justify-between gap-3 mt-2 mb-6 p-1 pr-4">
                Created By
                <UserPill nfdName={nfd.data?.name} variant="secondary" address={proposal.proposer} />
                <span className="text-2xl font-semibold text-algo-blue dark:text-algo-teal">
                  //
                </span>
                <span className="text-algo-black-50 dark:text-white">
                  {formatDistanceToNow(new Date((Number(proposal.openTs) * 1000)), { addSuffix: true }).replace('about ', '').replace(' minutes', 'm').replace(' minute', 'm').replace(' hours', 'h').replace(' hour', 'h').replace(' days', 'd').replace(' day', 'd').replace(' weeks', 'w').replace(' week', 'w')}
                </span>
              </div>

              {!!_pastProposals && !!_pastProposals.length && (
                <>
                  <h5 className="font-semibold text-algo-black dark:text-algo-black-30 mb-2">
                    Past Proposals
                  </h5>
                  <ul className="text-xl text-algo-black dark:text-white flex flex-col gap-2">
                    {_pastProposals.map((pastProposal) => {
                      const phase = ProposalStatusMap[pastProposal.status];
                      return (
                        <li
                          key={pastProposal.id}
                          className="bg-algo-blue-10 dark:bg-algo-black-90 rounded-x-xl rounded-2xl flex flex-wrap items-center justify-between gap-x-6 gap-y-4 p-2.5 sm:flex-nowrap relative transition overflow-hidden text-wrap"
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

interface SubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposalId: bigint;
  activeAddress: string | null;
  transactionSigner: any;
  refetchProposal: () => void;
}

export function SubmitModal({
  isOpen,
  onClose,
  proposalId,
  activeAddress,
  transactionSigner,
  refetchProposal,
}: SubmitModalProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    try {
      if (!activeAddress || !transactionSigner) {
        setErrorMessage("Wallet not connected.");
        return false;
      }

      const { xgovDaemon } = (await getGlobalState())!

      const proposalFactory = new ProposalFactory({ algorand });
      const proposalClient = proposalFactory.getAppClientById({
        appId: proposalId,
      });

      const res = await proposalClient.send.submit({
        sender: activeAddress,
        signer: transactionSigner,
        args: {},
        appReferences: [registryClient.appId],
        accountReferences: [activeAddress, xgovDaemon],
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

        // call backend to assign voters
        try {
          await callAssignVoters(proposalId);
        } catch (e) {
          console.warn("Failed to assign voters:", e);
        }
        refetchProposal();

        return true;
      }

      console.log("Transaction not confirmed");
      setErrorMessage("Transaction not confirmed.");
      return false;
    } catch (error) {
      console.error("Error during assign voters:", error);
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
        {errorMessage && <p className="text-algo-red">{errorMessage}</p>}
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
  refetch: ((options?: RefetchOptions) => Promise<QueryObserverResult<any, Error>>)[];
}

export function DropModal({
  isOpen,
  onClose,
  proposalId,
  activeAddress,
  transactionSigner,
  refetch,
}: DropModalProps) {

  const {
    status,
    setStatus,
    errorMessage,
    reset,
    isPending,
  } = useTransactionState();

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
        {errorMessage && <p className="text-algo-red">{errorMessage}</p>}
        <DialogFooter className="mt-8">
          <Button variant="ghost" onClick={() => {
            reset();
            onClose();
          }}>
            Cancel
          </Button>
          <Button
            className="group"
            variant="destructive"
            onClick={async () => {
              await dropProposal({
                activeAddress,
                innerSigner: transactionSigner,
                setStatus,
                refetch,
                appId: proposalId,
              })
              onClose();
              navigate("/");
            }}
            disabled={isPending}
          >
            <TransactionStateLoader defaultText="Delete" txnState={{ status, errorMessage, isPending }} />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
