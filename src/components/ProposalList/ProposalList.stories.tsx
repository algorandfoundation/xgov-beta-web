import type { Meta, StoryObj } from '@storybook/react';
import { within, expect } from '@storybook/test';
import { MemoryRouter } from 'react-router-dom';

import { ProposalFocus, ProposalFundingType, ProposalStatus, type ProposalSummaryCardDetails } from '@/types/proposals';
import ProposalList, { type ProposalListProps } from './ProposalList';

export const mockProposals: ProposalSummaryCardDetails[] = [
  {
      id: BigInt(1),
      title: "Auto-Compounding Farms",
      cid: "QmQk7wM2J8Gc2e8s9XZ1W5LQJr7d1z2J9",
      status: ProposalStatus.ProposalStatusDraft,
      focus: ProposalFocus.FocusDeFi,
      fundingType: ProposalFundingType.Retroactive,
      requestedAmount: BigInt(75_000_000_000),
      proposer: "compx.algo",
  },
  {
      id: BigInt(2),
      title: "Tealscript interactive developer course Tealscript interactive developer course",
      cid: "QmQk7wM2J8Gc2e8s9XZ1W5LQJr7d1z2J9",
      status: ProposalStatus.ProposalStatusFinal,
      focus: ProposalFocus.FocusEducation,
      fundingType: ProposalFundingType.Proactive,
      requestedAmount: BigInt(30_000_000_000),
      proposer: "agorapp.algo",
  },
  {
      id: BigInt(3),
      title: "Use-Wallet",
      cid: "QmQk7wM2J8Gc2e8s9XZ1W5LQJr7d1z2J9",
      status: ProposalStatus.ProposalStatusFinal,
      focus: ProposalFocus.FocusLibraries,
      fundingType: ProposalFundingType.Retroactive,
      requestedAmount: BigInt(75_000_000_000),
      proposer: "txnlab.algo",
  },
  {
      id: BigInt(4),
      title: "AlgoNFT Marketplace",
      cid: "QmQk7wM2J8Gc2e8s9XZ1W5LQJr7d1z2J9",
      status: ProposalStatus.ProposalStatusFinal,
      focus: ProposalFocus.FocusNFT,
      fundingType: ProposalFundingType.Proactive,
      requestedAmount: BigInt(50_000_000_000),
      proposer: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ',
  },
  {
      id: BigInt(5),
      title: "AlgoSwap",
      cid: "QmQk7wM2J8Gc2e8s9XZ1W5LQJr7d1z2J9",
      status: ProposalStatus.ProposalStatusApproved,
      focus: ProposalFocus.FocusDeFi,
      fundingType: ProposalFundingType.Retroactive,
      requestedAmount: BigInt(100_000_000_000),
      proposer: "swapx.algo",
  },
];

function ProposalListWrapper(props: ProposalListProps) {
  return (
    <MemoryRouter>
      <div>
        <ProposalList {...props} />
      </div>
    </MemoryRouter>
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
    // Use standard DOM API instead of non-existent getAllByClassName
    const proposals = canvasElement.querySelectorAll('.bg-algo-blue-10');
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
  play: async ({ canvasElement }) => {
    // Check that no proposal items are rendered
    const proposalElements = canvasElement.querySelectorAll('.bg-algo-blue-10');
    expect(proposalElements.length).toBe(0);
    
    // Verify the container is present but empty
    const container = canvasElement.querySelector('.flex.flex-col.gap-y-4');
    expect(container).toBeTruthy();
    expect(container!.children.length).toBe(0);
  },
};

export const SingleProposal: Story = {
  args: {
    proposals: [mockProposals[0]],
  },
  play: async ({ canvasElement }) => {
    const proposals = canvasElement.querySelectorAll('.bg-algo-blue-10');
    expect(proposals.length).toBe(1);
  },
};
