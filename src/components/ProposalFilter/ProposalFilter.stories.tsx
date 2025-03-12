import type { Meta, StoryObj } from '@storybook/react';
import { userEvent, within, expect, screen } from '@storybook/test';
import { ProposalFilter, type ProposalFilterProps } from './ProposalFilter';
import { MemoryRouter } from 'react-router-dom';

// Wrapper is needed because the component uses useSearchParams from react-router-dom
function ProposalFilterWrapper(props: ProposalFilterProps) {
  return (
    <MemoryRouter>
      <div className="p-6">
        <ProposalFilter {...props} />
      </div>
    </MemoryRouter>
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
    className: '',
  },
  argTypes: {
    className: {
      control: 'text',
      description: 'Additional CSS classes to apply to the filter button',
    },
  },
  // Test opening the filter dialog and selecting an option
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Open the filter dialog
    const filterButton = canvas.getByRole('button');
    await userEvent.click(filterButton);
    
    // Find and click on a filter option (e.g., Discussion in the status section)
    const discussionOption = await screen.findByRole('button', { name: 'Discussion' });
    await userEvent.click(discussionOption);
    
    // Close the dialog
    const applyButton = await screen.findByRole('button', { name: 'Apply Filters' });
    await userEvent.click(applyButton);
  },
} satisfies Meta<typeof ProposalFilterWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    className: '',
  },
};

export const DarkMode: Story = {
  args: {
    className: '',
  },
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
