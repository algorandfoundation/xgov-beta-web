import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, within, expect } from '@storybook/test';
import { ProposalInfoCard, type ProposalProps } from './index';
import { useState } from 'react';
import type { ProposalInfoCardDetails } from '@/types/proposals';

export const mockProposalInfo: ProposalInfoCardDetails = {
    discussionLink: 'https://proposal-discussion-link-here.com',
    fundingType: 'retroactive',
    category: 'DeFi',
    license: 'MIT',
    requestedAmount: 75_000,
};


function ProposalInfoCardWrapper(props: ProposalProps) {
  const [clickedLink, setClickedLink] = useState<string | null>(null);

  return (
    <div>
      <ProposalInfoCard {...props} />
      {clickedLink && (
        <div data-testid="clicked-link">Clicked: {clickedLink}</div>
      )}
    </div>
  );
}

const meta = {
  title: 'Components/ProposalInfoCard',
  component: ProposalInfoCardWrapper,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    proposal: mockProposalInfo,
  },
  argTypes: {
    proposal: {
      control: 'object',
      description: 'Proposal information object to display',
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const discussionLink = canvas.getByRole('link');
    await userEvent.click(discussionLink);
    await expect(canvas.getByTestId('clicked-link')).toHaveTextContent('Clicked: https://forum.algorand.org/t/sample-proposal/12345');
  },
} satisfies Meta<typeof ProposalInfoCardWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    proposal: mockProposalInfo,
  },
};

export const LargeAmount: Story = {
  args: {
    proposal: {
      ...mockProposalInfo,
      requestedAmount: 1000000,
    },
  },
};

export const ProactiveFunding: Story = {
  args: {
    proposal: {
      ...mockProposalInfo,
      fundingType: 'proactive',
    },
  },
};

export const DifferentCategory: Story = {
  args: {
    proposal: {
      ...mockProposalInfo,
      category: 'Education',
    },
  },
};