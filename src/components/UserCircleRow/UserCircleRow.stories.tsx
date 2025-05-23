import type { Meta, StoryObj } from '@storybook/react';
import { UserCircleRow } from "./UserCircleRow";

const meta: Meta<typeof UserCircleRow> = {
  title: 'Components/UserCircleRow',
  component: UserCircleRow,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof UserCircleRow>;

export const Default: Story = {};

export const WithCustomUsers: Story = {
  render: () => {
    return <UserCircleRow />;
  },
};

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
