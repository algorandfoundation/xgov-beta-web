import type { Meta, StoryObj } from '@storybook/react';
import {FundingTypeDetail} from './FundingTypeDetail';
import { ProposalFundingType } from '@/api/types/proposals';

const meta: Meta<typeof FundingTypeDetail> = {
  title: 'Components/FundingTypeDetail',
  component: FundingTypeDetail,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof FundingTypeDetail>;

export const Default: Story = {
  args: {
    fundingType: ProposalFundingType.Proactive,
    variant: 'default',
  },
};

export const Secondary: Story = {
  args: {
    fundingType: ProposalFundingType.Retroactive,
    variant: 'secondary',
  },
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="p-4 bg-algo-blue">
        <FundingTypeDetail fundingType={ProposalFundingType.Retroactive} variant="secondary" />
      </div>
    </div>
  ),
};

// Display each funding type
export const AllFundingTypes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <FundingTypeDetail fundingType={ProposalFundingType.Proactive} />
      <FundingTypeDetail fundingType={ProposalFundingType.Retroactive} />
    </div>
  ),
};

// Show different variants side by side
export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="p-4 bg-white">
        <FundingTypeDetail fundingType={ProposalFundingType.Retroactive} variant="default" />
      </div>
      <div className="p-4 bg-algo-blue">
        <FundingTypeDetail fundingType={ProposalFundingType.Retroactive} variant="secondary" />
      </div>
    </div>
  ),
};

// Dark mode
export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  args: {
    fundingType: ProposalFundingType.Retroactive,
    variant: 'default',
  },
  decorators: [
    (Story) => (
      <div className="dark p-6 bg-algo-black-90">
        <Story />
      </div>
    ),
  ],
};