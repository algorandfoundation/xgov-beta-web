import type { Meta, StoryObj } from '@storybook/react';
import ActionButton from './ActionButton';

const meta: Meta<typeof ActionButton> = {
    title: 'Components/Button/ActionButton',
    component: ActionButton,
    tags: ['autodocs'],
};

export default meta;

type Story = StoryObj<typeof ActionButton>;

export const Default: Story = {
    args: {
        type: 'button',
        onClick: () => console.log('clicked'),
        disabled: false,
        children: 'Click Me',
    },
};

export const Disabled: Story = {
    args: {
        ...Default.args,
        disabled: true,
    },
};

export const WithLongText: Story = {
    args: {
        ...Default.args,
        children: 'This is a button with longer text',
    },
};