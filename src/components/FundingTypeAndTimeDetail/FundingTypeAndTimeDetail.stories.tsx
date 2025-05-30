import type { Meta, StoryObj } from '@storybook/react';
import {FundingTypeAndTimeDetail} from './FundingTypeAndTimeDetail';
import { ProposalFundingType } from '@/api/types/proposals';

const meta: Meta<typeof FundingTypeAndTimeDetail> = {
  title: 'Components/FundingTypeAndTimeDetail',
  component: FundingTypeAndTimeDetail,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FundingTypeAndTimeDetail>;

export const Default: Story = {
  args: {
    fundingType: ProposalFundingType.Retroactive,
    time: '3d 6h',
  },
};

// Display all funding types with the same time
export const AllFundingTypes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <FundingTypeAndTimeDetail fundingType={ProposalFundingType.Retroactive} time="2d 8h" />
      <FundingTypeAndTimeDetail fundingType={ProposalFundingType.Proactive} time="2d 8h" />
      <FundingTypeAndTimeDetail fundingType={ProposalFundingType.Proactive} time="2d 8h" />
    </div>
  ),
};

// Show different time formats
export const DifferentTimeFormats: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <FundingTypeAndTimeDetail fundingType={ProposalFundingType.Retroactive} time="3d 6h" />
      <FundingTypeAndTimeDetail fundingType={ProposalFundingType.Retroactive} time="12h 30m" />
      <FundingTypeAndTimeDetail fundingType={ProposalFundingType.Retroactive} time="45m" />
      <FundingTypeAndTimeDetail fundingType={ProposalFundingType.Retroactive} time="< 1m" />
    </div>
  ),
};

// Dark mode
export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="dark p-6 bg-algo-black-90">
        <Story />
      </div>
    ),
  ],
};

// Responsive view
export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

// Component in context
export const InContext: Story = {
  decorators: [
    (Story) => (
      <div className="p-6 max-w-md bg-white dark:bg-algo-black-90 rounded-lg shadow">
        <div className="mb-4">
          <h3 className="text-xl font-semibold mb-1 text-algo-black dark:text-white">
            Community Development Proposal
          </h3>
          <p className="text-algo-black-60 dark:text-white/60 text-sm mb-3">
            By AlgoBuilder Labs
          </p>
          <Story />
        </div>
      </div>
    ),
  ],
};