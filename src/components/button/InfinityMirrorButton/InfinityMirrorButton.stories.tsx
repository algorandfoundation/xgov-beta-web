import type { Meta, StoryObj } from '@storybook/react';
import { InfinityMirrorButton } from './InfinityMirrorButton';
import { ArrowRightIcon, CheckIcon } from 'lucide-react';

const meta = {
  title: 'Components/Button/InfinityMirrorButton',
  component: InfinityMirrorButton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost'],
      description: 'Visual style variant of the button',
      defaultValue: 'default',
    },
    size: {
      control: { type: 'select' },
      options: ['default', 'sm', 'lg', 'icon'],
      description: 'Size of the button',
      defaultValue: 'default',
    },
    rings: {
      control: { type: 'number' },
      description: 'Number of background rings displayed on hover',
      defaultValue: 4,
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Whether the button is disabled',
      defaultValue: false,
    },
    asChild: {
      control: { type: 'boolean' },
      description: 'Whether to merge props onto child element (Radix UI Slot pattern)',
      defaultValue: false,
    },
    children: {
      control: { type: 'text' },
      description: 'Button content',
    },
    onClick: {
      action: 'clicked',
      description: 'Function called when button is clicked',
    },
  },
} satisfies Meta<typeof InfinityMirrorButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="bg-algo-blue dark:bg-algo-teal p-8 rounded-lg">
      <InfinityMirrorButton variant="default">Button</InfinityMirrorButton>
    </div>
  ),
};

export const Secondary: Story = {
  args: {
    children: 'Secondary Button',
    variant: 'secondary',
  },
};

export const Destructive: Story = {
  args: {
    children: 'Destructive Action',
    variant: 'destructive',
  },
};

export const Outline: Story = {
  args: {
    children: 'Outline Button',
    variant: 'outline',
  },
};

export const Ghost: Story = {
  args: {
    children: 'Ghost Button',
    variant: 'ghost',
  },
};

export const Small: Story = {
  render: () => (
    <div className="bg-algo-blue dark:bg-algo-teal p-8 rounded-lg">
      <InfinityMirrorButton size="sm">Small Button</InfinityMirrorButton>
    </div>
  ),
};

export const Large: Story = {
  render: () => (
    <div className="bg-algo-blue dark:bg-algo-teal p-8 rounded-lg">
      <InfinityMirrorButton size="lg">Large Button</InfinityMirrorButton>
    </div>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <div className="bg-algo-blue dark:bg-algo-teal p-8 rounded-lg">
      <InfinityMirrorButton>
        <CheckIcon className="mr-2" /> With Icon
      </InfinityMirrorButton>
    </div>
  ),
};

export const IconOnly: Story = {
  render: () => (
    <div className="bg-algo-blue dark:bg-algo-teal p-8 rounded-lg">
      <InfinityMirrorButton size="icon" aria-label="Go to next page">
        <ArrowRightIcon />
      </InfinityMirrorButton>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="bg-algo-blue dark:bg-algo-teal p-8 rounded-lg">
      <InfinityMirrorButton disabled>Disabled Button</InfinityMirrorButton>
    </div>
  ),
};

export const MoreRings: Story = {
  render: () => (
    <div className="bg-algo-blue dark:bg-algo-teal p-8 rounded-lg">
      <InfinityMirrorButton rings={8}>More Rings</InfinityMirrorButton>
    </div>
  ),
};

export const FewerRings: Story = {
  render: () => (
    <div className="bg-algo-blue dark:bg-algo-teal p-8 rounded-lg">
      <InfinityMirrorButton rings={3}>Fewer Rings</InfinityMirrorButton>
    </div>
  ),
};

export const LongText: Story = {
  render: () => (
    <div className="bg-algo-blue dark:bg-algo-teal p-8 rounded-lg">
      <InfinityMirrorButton>This is a button with very long text content that might wrap</InfinityMirrorButton>
    </div>
  ),
};