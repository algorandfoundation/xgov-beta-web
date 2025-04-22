import type { Meta, StoryObj } from '@storybook/react';
import {XGovStatusPill} from './XGovStatusPill';

const meta: Meta<typeof XGovStatusPill> = {
  title: 'Components/XGovStatusPill',
  component: XGovStatusPill,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof XGovStatusPill>;

// xGov Member
export const XGovMember: Story = {
  args: {
    isXGov: true,
    unsubscribeXgov: () => alert('Unsubscribe action triggered'),
    unsubscribeXGovLoading: false,
  },
};

// Not an xGov Member
export const NotXGovMember: Story = {
  args: {
    isXGov: false,
    unsubscribeXgov: () => alert('Unsubscribe action triggered'),
    unsubscribeXGovLoading: false,
  },
};