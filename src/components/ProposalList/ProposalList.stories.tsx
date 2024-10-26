import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, within, expect } from '@storybook/test';

import { useState } from 'react';
import type { ProposalSummaryCardDetails } from '@/types/proposals';
import { ProposalList, type ProposalListProps } from './ProposalList';

export const mockProposals: ProposalSummaryCardDetails[] = [
  {
      id: 1,
      title: "Auto-Compounding Farms",
      phase: "discussion",
      category: "DeFi",
      fundingType: "retroactive",
      requestedAmount: 75_000,
      proposer: "CompX",
  },
  {
      id: 2,
      title: "Tealscript interactive developer course Tealscript interactive developer course",
      phase: "vote",
      category: "Education",
      fundingType: "proactive",
      requestedAmount: 30_000,
      proposer: "AgorApp",
  },
  {
      id: 3,
      title: "Use-Wallet",
      phase: "vote",
      category: "Libraries",
      fundingType: "retroactive",
      requestedAmount: 75_000,
      proposer: "TxnLab",
  },
  {
      id: 4,
      title: "AlgoNFT Marketplace",
      phase: "submission",
      category: "NFT",
      fundingType: "proactive",
      requestedAmount: 50_000,
      proposer: "NFTify",
  },
  {
      id: 5,
      title: "AlgoSwap",
      phase: "closure",
      category: "DeFi",
      fundingType: "retroactive",
      requestedAmount: 100_000,
      proposer: "SwapX",
  },
];

function ProposalListWrapper(props: ProposalListProps) {
  return (
    <div>
      <ProposalList {...props} />
    </div>
  );
}

const meta = {
  title: 'Components/ProposalList',
  component: ProposalListWrapper,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    proposals: mockProposals,
  },
  argTypes: {
    proposals: {
      control: 'object',
      description: 'Array of proposal objects to display',
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const proposals = canvas.getAllByRole('listitem')
    expect(proposals.length).toBe(5);
  },
} satisfies Meta<typeof ProposalListWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithProposals: Story = {
  args: {
    proposals: mockProposals,
  },
};

export const Empty: Story = {
  args: {
    proposals: [],
  },
};

export const SingleProposal: Story = {
  args: {
    proposals: [mockProposals[0]],
  },
};