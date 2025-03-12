import type { Meta, StoryObj } from '@storybook/react';
import LoraPillLink from './LoraPillLink';

const meta: Meta<typeof LoraPillLink> = {
  title: 'Components/LoraPillLink',
  component: LoraPillLink,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof LoraPillLink>;

export const Default: Story = {
  args: {
    id: BigInt(123456789),
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
  args: {
    id: BigInt(123456789),
  },
};