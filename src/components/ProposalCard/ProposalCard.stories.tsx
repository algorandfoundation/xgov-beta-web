import type { Meta, StoryObj } from '@storybook/react';

import type { ProposalInfoCardDetails, ProposalMainCardDetails } from '@/types/proposals';
import { ProposalCard, type ProposalCardProps } from './ProposalCard';

export const mockProposal: ProposalMainCardDetails = {
    id: 1,
    title: "Auto-Compounding Farms",
    description: "This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users",
    phase: "discussion",
    proposer: "CompX",
    properties: {
        openSource: true,
        focus: 'defi',
        deliveryDate: '2023-01-01',
        team: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
        experience: 'CompX has been delivering impact via auto-compounding farms for years',
        presentProposal: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users',
        deliverable: 'This is a retroactive proposal for impact delivered via CompX auto-compounding farms. These farms went live in 2023, and have been giving Algorand users ',
        futureBlueprint: 'CompX will continue to deliver impact via auto-compounding farms',
        benefits: 'Algorand users will benefit from the impact delivered by CompX',
    },
    pastProposals: [
        { title: 'Tealscript interactive developer course Tealscript interactive developer course', link: '/proposals/2' },
        { title: 'Use-Wallet', link: '/proposals/3' },
        { title: 'AlgoNFT Marketplace', link: '/proposals/4' },
    ],
};

export const mockProposalInfo: ProposalInfoCardDetails = {
  discussionLink: 'https://proposal-discussion-link-here.com',
  fundingType: 'retroactive',
  category: 'DeFi',
  license: 'MIT',
  requestedAmount: 75_000,
};

function ProposalCardWrapper(props: ProposalCardProps) {
  return (
    <div>
      <ProposalCard {...props} />
    </div>
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
  }
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
      phase: 'vote',
    },
  },
};

export const NoPastProposals: Story = {
  args: {
    proposal: {
      ...mockProposal,
      pastProposals: [],
    },
  },
};