import type { Meta, StoryObj } from '@storybook/react';
import { FocusDetail } from './FocusDetail';
import { ProposalFocus } from '@/api/types/proposals';

const meta: Meta<typeof FocusDetail> = {
  title: 'Components/FocusDetail',
  component: FocusDetail,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FocusDetail>;

export const Default: Story = {
  args: {
    focus: ProposalFocus.FocusDeFi,
    variant: 'default',
  },
};

export const Secondary: Story = {
  args: {
    focus: ProposalFocus.FocusDeFi,
    variant: 'secondary',
  },
};

// Display each focus type
export const AllFocusTypes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <FocusDetail focus={ProposalFocus.FocusDeFi} />
      <FocusDetail focus={ProposalFocus.FocusEducation} />
      <FocusDetail focus={ProposalFocus.FocusLibraries} />
      <FocusDetail focus={ProposalFocus.FocusNFT} />
      <FocusDetail focus={ProposalFocus.FocusSaas} />
      <FocusDetail focus={ProposalFocus.FocusOther} />
    </div>
  ),
};

// Show different variants side by side
export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="p-4 bg-white">
        <FocusDetail focus={ProposalFocus.FocusDeFi} variant="default" />
      </div>
      <div className="p-4 bg-algo-blue">
        <FocusDetail focus={ProposalFocus.FocusDeFi} variant="secondary" />
      </div>
    </div>
  ),
};