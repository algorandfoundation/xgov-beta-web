import type { Meta, StoryObj } from '@storybook/react';
import { within, expect } from '@storybook/test';

import { ProposalCategory, ProposalFocus, ProposalFundingType, ProposalStatus, type ProposalSummaryCardDetails } from '@/types/proposals';
import { ProposalList, type ProposalListProps } from './ProposalList';

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
      submissionTime: Date.now(),
      category: ProposalCategory.ProposalCategoryNull,
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
      submissionTime: Date.now(),
      category: ProposalCategory.ProposalCategoryNull,
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
      submissionTime: Date.now(),
      category: ProposalCategory.ProposalCategoryNull,
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
      submissionTime: Date.now(),
      category: ProposalCategory.ProposalCategoryNull,
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
      submissionTime: Date.now(),
      category: ProposalCategory.ProposalCategoryNull,
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
    // const proposals = canvas.getAllByRole('listitem')
    // expect(proposals.length).toBe(5);
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
    const canvas = within(canvasElement);
    const p = await canvas.findByRole('paragraph');
    expect(p).toHaveTextContent('No proposals');
  },
};

export const SingleProposal: Story = {
  args: {
    proposals: [mockProposals[0]],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // const proposals = canvas.getAllByTestId('listitem')
    // expect(proposals.length).toBe(1);
  },
};
