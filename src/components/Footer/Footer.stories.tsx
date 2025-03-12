import type { Meta, StoryObj } from '@storybook/react';
import Footer from './Footer';

const meta: Meta<typeof Footer> = {
  title: 'Components/Footer',
  component: Footer,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Footer>;

export const Default: Story = {};

export const WithContent: Story = {
  decorators: [
    (Story) => (
      <div className="min-h-[50vh] flex flex-col">
        <div className="flex-1 p-6 bg-white dark:bg-algo-black-90">
          <h2 className="text-2xl font-bold text-algo-black dark:text-white mb-4">
            Sample Page Content
          </h2>
          <p className="text-algo-black-60 dark:text-white/60">
            This demonstrates how the footer appears at the bottom of a page with content.
          </p>
        </div>
        <Story />
      </div>
    ),
  ],
};

export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="dark min-h-[40vh] flex flex-col bg-algo-black-90">
        <div className="flex-1"></div>
        <Story />
      </div>
    ),
  ],
};

export const LightMode: Story = {
  parameters: {
    backgrounds: { default: 'light' },
  },
  decorators: [
    (Story) => (
      <div className="min-h-[40vh] flex flex-col bg-white">
        <div className="flex-1"></div>
        <Story />
      </div>
    ),
  ],
};

export const ResponsiveView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};