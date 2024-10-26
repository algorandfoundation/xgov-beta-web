import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, within, expect } from '@storybook/test';
import { ProposalFilter, type ProposalFilterProps } from './ProposalFilter';
import { useState } from 'react';

function ProposalFilterWrapper(props: ProposalFilterProps) {

  return (
    <div>
      <ProposalFilter {...props} onFilterChange={() => {}} />
        {/* <div data-testid="selected-filter">status: {selectedFilter}</div> */}
    </div>
  );
}

const meta = {
  title: 'Components/ProposalFilter',
  component: ProposalFilterWrapper,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    className: 'bg-white dark:bg-algo-black p-4',
  },
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply to the component',
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const statusDropdown = canvas.getByText('status');
    await userEvent.click(statusDropdown);
    
    const discussionOption = canvas.queryAllByRole('menuitem')[1];
    await userEvent.click(discussionOption);
    await expect(statusDropdown).toHaveClass('border-algo-teal');
  },
} satisfies Meta<typeof ProposalFilterWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    className: 'bg-white dark:bg-algo-black p-4',
  },
};

export const HasSelected: Story = {
  args: {
    className: 'bg-gray-100 dark:bg-gray-800 p-6 rounded-lg',
  },
};