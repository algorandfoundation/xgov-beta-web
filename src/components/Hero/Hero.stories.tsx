import type { Meta, StoryObj } from '@storybook/react';
import { Hero } from './Hero';

const meta: Meta<typeof Hero> = {
  title: 'Components/Hero',
  component: Hero,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="m-auto w-full px-2 md:px-4">
        <Story />
      </div>
    ),
  ]
};

export default meta;
type Story = StoryObj<typeof Hero>;

export const Default: Story = {
  args: {
    title: 'xGov Beta',
    description: 'The xGov platform enables community-driven governance on the Algorand blockchain, allowing participants to propose, discuss, and vote on initiatives.',
    xgovs: 1250,
    proposals: 87,
    treasury: 5_000_000_000, // 5,000 ALGO (in microAlgos)
    votes: 34560,
  },
};

export const DarkMode: Story = {
  args: {
    ...Default.args,
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <Story />
      </div>
    ),
  ],
};

export const LargeNumbers: Story = {
  args: {
    ...Default.args,
    xgovs: 12500,
    proposals: 8700,
    treasury: 50000000000, // 50,000 ALGO
    votes: 3456000,
  },
};

export const Mobile: Story = {
  args: {
    ...Default.args,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile2',
    },
  },
};

export const Tablet: Story = {
  args: {
    ...Default.args,
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};