import type { Meta, StoryObj } from '@storybook/react';
import { within, expect } from '@storybook/test';

import { ProposalFocus, ProposalFundingType, ProposalStatus, type ProposalInfoCardDetails, type ProposalMainCardDetails } from '@/types/proposals';
import { ProposalCard, type ProposalCardProps } from './ProposalCard';

declare global
{
    interface BigIntConstructor
    {
        toJSON:()=>string;
    }
}

BigInt.toJSON = function() { return this.toString(); };

export const mockProposal: ProposalMainCardDetails = {
    id: BigInt(1),
    title: "Auto-Compounding Farms",
    cid: "QmQk7wM2J8Gc2e8s9XZ1W5LQJr7d1z2J9",
    requestedAmount: BigInt(75_000_000_000),
    proposer: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ',
    fundingType: ProposalFundingType.Proactive,
    status: ProposalStatus.ProposalStatusFinal,
    description: "This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users",
    // phase: "discussion",
    // proposer: "CompX",
    team: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
    additionalInfo: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users ',
    openSource: true,
    focus: ProposalFocus.FocusDeFi,
    deliverables: [
        { amount: BigInt(75_000_000_000), description: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms.' },
    ],
    pastProposalLinks: [
        BigInt(1),
        BigInt(2),
        BigInt(3),
    ],
    forumLink: 'https://forum.algorand.org/',
};

export const mockProposalInfo: ProposalInfoCardDetails = {
  forumLink: 'https://proposal-discussion-link-here.com',
  fundingType: ProposalFundingType.Proactive,
  focus: ProposalFocus.FocusDeFi,
  openSource: true,
  requestedAmount: BigInt(75_000_000_000),
};

function ProposalCardWrapper(props: ProposalCardProps) {
  return (
      <ProposalCard {...props} />
  );
}

const meta = {
  title: 'Components/ProposalCard',
  component: ProposalCardWrapper,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    proposal: mockProposal,
  },
  argTypes: {
    proposal: {
      control: 'object',
      description: 'Proposal object to display',
    },
  },
} satisfies Meta<typeof ProposalCardWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    proposal: mockProposal,
  },
};

export const VotingPhase: Story = {
  args: {
    proposal: {
      ...mockProposal,
      status: ProposalStatus.ProposalStatusVoting,
    },
  },
};

export const NoPastProposals: Story = {
  args: {
    proposal: {
      ...mockProposal,
      pastProposalLinks: [],
    },
  },
};