import type { Meta, StoryObj } from '@storybook/react';
import {DiscussionLink} from './DiscussionLink';

const meta = {
    title: 'Components/DiscussionLink',
    component: DiscussionLink,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        to: {
            control: { type: 'text' },
            description: 'URL to navigate to when clicked'
        },
    },
} satisfies Meta<typeof DiscussionLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {
        to: '/discussion/123',
    },
};

export const WithBackground: Story = {
    args: {
        to: '/discussion/123',
    },
    render: ({ to }) => (
        <div className="bg-algo-blue-10 dark:bg-algo-teal-10 p-8 rounded-lg">
            <DiscussionLink to={to} />
        </div>
    ),
};

export const OnContentBackground: Story = {
    args: {
        to: '/discussion/123',
    },
    render: ({ to }) => (
        <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg">
            <DiscussionLink to={to} />
        </div>
    ),
};

export const InContext: Story = {
    args: {
        to: '/discussion/123',
    },
    render: ({ to }) => (
        <div className="max-w-md bg-white dark:bg-algo-black shadow rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Proposal Title</h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
                This is a sample proposal description. The discussion link appears below.
            </p>
            <div className="flex justify-end">
                <DiscussionLink to={to} />
            </div>
        </div>
    ),
};