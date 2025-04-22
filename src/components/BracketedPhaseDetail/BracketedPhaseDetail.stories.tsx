import type { Meta, StoryObj } from '@storybook/react';
import {BracketedPhaseDetail} from './BracketedPhaseDetail';

const meta = {
    title: 'Components/BracketedPhaseDetail',
    component: BracketedPhaseDetail,
    parameters: {
        layout: 'centered',
    },
    tags: ['autodocs'],
    argTypes: {
        phase: { 
            control: { type: 'select' },
            options: ['Draft', 'Submission', 'Discussion', 'Voting'],
            description: 'Current phase name to display'
        },
    },
} satisfies Meta<typeof BracketedPhaseDetail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Draft: Story = {
    args: {
        phase: 'Draft',
    },
};

export const Submission: Story = {
    args: {
        phase: 'Submission',
    },
};

export const Discussion: Story = {
    args: {
        phase: 'Discussion',
    },
};

export const Voting: Story = {
    args: {
        phase: 'Voting',
    },
};

// Example with lowercase input to demonstrate capitalization function
export const LowercaseInput: Story = {
    args: {
        phase: 'draft',
    },
};