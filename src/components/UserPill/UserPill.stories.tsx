import type { Meta, StoryObj } from '@storybook/react';
import UserPill from './UserPill';
import { BrowserRouter } from 'react-router-dom';

// Sample Algorand address
const sampleAddress = 'ALGO...1234';

const meta: Meta<typeof UserPill> = {
    title: 'Components/UserPill',
    component: UserPill,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    decorators: [
        (Story) => (
            <BrowserRouter>
                <Story />
            </BrowserRouter>
        ),
    ],
};

export default meta;
type Story = StoryObj<typeof UserPill>;

export const Default: Story = {
    args: {
        address: sampleAddress,
        variant: 'default',
    },
};

export const Secondary: Story = {
    args: {
        address: sampleAddress,
        variant: 'secondary',
    },
};

export const DisplayName: Story = {
    args: {
        address: 'builder.algo',
        variant: 'default',
    },
};

export const Variants: Story = {
    render: () => (
        <div className="flex flex-col gap-4">
            <UserPill address={sampleAddress} variant="default" />
            <UserPill address={sampleAddress} variant="secondary" />
        </div>
    ),
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
        address: sampleAddress,
        variant: 'secondary',
    },
};

export const Mobile: Story = {
    parameters: {
        viewport: {
            defaultViewport: 'mobile1',
        },
    },
    args: {
        address: sampleAddress,
    },
};