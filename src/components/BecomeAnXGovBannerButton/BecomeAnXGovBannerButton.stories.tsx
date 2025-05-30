import type { Meta, StoryObj } from '@storybook/react';
import {BecomeAnXGovBannerButton} from './BecomeAnXGovBannerButton';

const meta = {
    title: 'Components/BecomeAnXGovBannerButton',
    component: BecomeAnXGovBannerButton,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        rings: { 
            control: { type: 'number' },
            description: 'Number of rings to display'
        },
        amplifier: { 
            control: { type: 'number' },
            description: 'Size multiplier for rings'
        },
        onClick: { 
            action: 'clicked',
            description: 'Function called when button is clicked'
        },
        disabled: { 
            control: { type: 'boolean' },
            description: 'Whether the button is disabled'
        },
    },
} satisfies Meta<typeof BecomeAnXGovBannerButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
    args: {},
};

export const FewerRings: Story = {
    args: {
        rings: 5,
    },
};

export const MoreRings: Story = {
    args: {
        rings: 15,
    },
};

export const LowerAmplifier: Story = {
    args: {
        amplifier: 5,
    },
};

export const HigherAmplifier: Story = {
    args: {
        amplifier: 20,
    },
};

export const Disabled: Story = {
    args: {
        disabled: true,
    },
};

export const CustomConfiguration: Story = {
    args: {
        rings: 8,
        amplifier: 15,
    },
};