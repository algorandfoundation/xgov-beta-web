import type { Meta, StoryObj } from '@storybook/react';
import { InfoPopover } from './InfoPopover';

const meta: Meta<typeof InfoPopover> = {
  title: 'Components/InfoPopover',
  component: InfoPopover,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof InfoPopover>;

export const Default: Story = {
  args: {
    label: 'Basic Information',
    children: 'This is a simple tooltip that provides additional information.',
  },
};

export const WithRichContent: Story = {
  args: {
    label: 'Rich Content',
    children: (
      <div className="space-y-2">
        <h4 className="font-medium">Detailed Information</h4>
        <p>This popover contains rich content with multiple elements.</p>
        <ul className="list-disc pl-4">
          <li>Important point 1</li>
          <li>Important point 2</li>
          <li>Important point 3</li>
        </ul>
      </div>
    ),
  },
};

export const DifferentSides: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-16 p-10">
      <InfoPopover label="Top side" side="top">
        This popover appears on the top
      </InfoPopover>
      
      <InfoPopover label="Right side" side="right">
        This popover appears on the right
      </InfoPopover>
      
      <InfoPopover label="Bottom side" side="bottom">
        This popover appears on the bottom
      </InfoPopover>
      
      <InfoPopover label="Left side" side="left">
        This popover appears on the left
      </InfoPopover>
    </div>
  ),
};

export const InContext: Story = {
  render: () => (
    <div className="max-w-md p-6 border rounded-lg shadow bg-white dark:bg-gray-800">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-semibold">Voting Power</h3>
        <InfoPopover label="Voting power explanation">
          <div className="space-y-2">
            <p>Voting power is calculated based on your xGov status and ALGO holdings.</p>
            <p>The formula used: VP = (commitment * weight) + (holdings * multiplier)</p>
          </div>
        </InfoPopover>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Your current voting power is 2,500 VP
      </p>
    </div>
  ),
};

export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="dark p-6 bg-gray-900">
        <Story />
      </div>
    ),
  ],
  args: {
    label: 'Dark Mode Info',
    children: 'This shows the InfoPopover in dark mode.',
  },
};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  args: {
    label: 'Mobile View',
    children: 'This demonstrates the InfoPopover on mobile devices.',
  },
};