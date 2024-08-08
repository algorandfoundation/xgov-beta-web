import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, within, expect } from '@storybook/test';
import { ProposalSummaryCard } from './index';
import type { ProposalSummaryCardDetails } from '@/types/proposals';

const mockProposalSummary: ProposalSummaryCardDetails = {
    id: 1,
    title: "Auto-Compounding Farms",
    phase: "discussion",
    category: "DeFi",
    fundingType: "retroactive",
    requestedAmount: 75_000,
    proposer: "CompX",
};

const meta = {
    title: 'Components/ProposalSummaryCard',
    component: ProposalSummaryCard,
    tags: ['autodocs'],
    parameters: {
        layout: 'padded',
    },
    args: {
        proposal: mockProposalSummary,
    },
    argTypes: {
        path: {
            control: 'text',
            description: 'Current router path',
        },
        proposal: {
            control: 'object',
            description: 'Proposal summary details object',
        },
    },
    play: async ({ canvasElement }) => {
        const canvas = within(canvasElement);
        const readMoreLink = canvas.getByText('Read More');
        await userEvent.click(readMoreLink);
        // Note: In a real scenario, you might want to check for navigation or other side effects
        await expect(readMoreLink).toHaveClass('hover:text-algo-teal');
    },
} satisfies Meta<typeof ProposalSummaryCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        proposal: mockProposalSummary,
    },
};

export const VotingPhase: Story = {
    args: {
        proposal: {
            ...mockProposalSummary,
            phase: 'vote',
        },
    },
};

export const LongTitle: Story = {
    args: {
        proposal: {
            ...mockProposalSummary,
            title: 'This is a very long title that might wrap to multiple lines and test the layout of our component',
        },
    },
};

export const LargeAmount: Story = {
    args: {
        proposal: {
            ...mockProposalSummary,
            requestedAmount: 10000000,
        },
    },
};

export const ActivePath: Story = {
    args: {
        path: '/proposal/1',
        proposal: mockProposalSummary,
    },
};