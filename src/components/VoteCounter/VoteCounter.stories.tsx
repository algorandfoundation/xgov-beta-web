import type { Meta, StoryObj } from '@storybook/react';
import {VoteCounter} from './VoteCounter';

const meta: Meta<typeof VoteCounter> = {
  title: 'Components/VoteCounter',
  component: VoteCounter,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  args: {
    approvals: 123,
    rejections: 45,
    nulls: 12,
  }
};

export default meta;
type Story = StoryObj<typeof VoteCounter>;

export const Default: Story = {};

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

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const WithHoverState: Story = {
  decorators: [
    (Story) => (
      <div className="group p-6 bg-white dark:bg-algo-black-90 hover:bg-algo-blue dark:hover:bg-algo-teal rounded-lg transition-colors">
        <Story />
      </div>
    ),
  ],
};

// This story shows how it would appear in a comment or post context
export const InContext: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-md p-4 border rounded-lg shadow bg-white dark:bg-algo-black-90">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-algo-black dark:text-white">
            Comment by User
          </span>
          <span className="text-xs text-algo-black-60 dark:text-white/60">
            2h ago
          </span>
        </div>
        <p className="mb-3 text-sm text-algo-black-80 dark:text-white/80">
          This is a great proposal! I especially like the focus on sustainability.
        </p>
        <Story />
      </div>
    ),
  ],
};

// Note: This would require modifying the component to accept props
export const CustomizableVotes: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Note: To support different vote counts, the component would need to be modified to accept upvotes and downvotes as props.',
      },
    },
  },
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <span className="text-sm text-algo-black-60 dark:text-white/60 w-32">Popular:</span>
        <VoteCounter approvals={100} rejections={10} nulls={5} />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-algo-black-60 dark:text-white/60 w-32">Controversial:</span>
        <VoteCounter approvals={50} rejections={50} nulls={0} />
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-algo-black-60 dark:text-white/60 w-32">New:</span>
        <VoteCounter approvals={0} rejections={0} nulls={0} />
      </div>
    </div>
  ),
};