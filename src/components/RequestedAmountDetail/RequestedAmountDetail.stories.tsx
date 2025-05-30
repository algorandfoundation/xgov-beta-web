import type { Meta, StoryObj } from '@storybook/react';
import {RequestedAmountDetail} from './RequestedAmountDetail';

const meta: Meta<typeof RequestedAmountDetail> = {
  title: 'Components/RequestedAmountDetail',
  component: RequestedAmountDetail,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof RequestedAmountDetail>;

export const Default: Story = {
  args: {
    requestedAmount: BigInt(10_000_000), // 10 ALGO
    variant: 'default',
  },
};

export const Secondary: Story = {
  args: {
    requestedAmount: BigInt(10_000_000), // 10 ALGO
    variant: 'secondary',
  },
};

export const DifferentAmounts: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <RequestedAmountDetail requestedAmount={BigInt(1_000_000)} /> {/* 1 ALGO */}
      <RequestedAmountDetail requestedAmount={BigInt(123_456_000)} /> {/* 123.456 ALGO */}
      <RequestedAmountDetail requestedAmount={BigInt(1_000_000_000)} /> {/* 1,000 ALGO */}
      <RequestedAmountDetail requestedAmount={BigInt(1_000_000_000_000)} /> {/* 1,000,000 ALGO */}
    </div>
  ),
};

// Show different variants side by side
export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="p-4 bg-white">
        <RequestedAmountDetail requestedAmount={BigInt(5_000_000_000)} variant="default" />
      </div>
      <div className="p-4 bg-algo-blue">
        <RequestedAmountDetail requestedAmount={BigInt(5_000_000_000)} variant="secondary" />
      </div>
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
  args: {
    requestedAmount: BigInt(10_000_000),
    variant: 'default',
  },
};

// Mobile view
export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  args: {
    requestedAmount: BigInt(10_000_000),
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
          <div className="flex items-center justify-between">
            <span className="text-algo-black-60 dark:text-white/60">Requested funding:</span>
            <Story />
          </div>
        </div>
      </div>
    ),
  ],
  args: {
    requestedAmount: BigInt(5_000_000_000), // 5,000 ALGO
  },
};