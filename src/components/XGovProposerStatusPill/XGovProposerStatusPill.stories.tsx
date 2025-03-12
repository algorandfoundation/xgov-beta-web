import type { Meta, StoryObj } from '@storybook/react';
import XGovProposerStatusPill from './XGovProposerStatusPill';

const MAX_UINT64 = BigInt('18446744073709551615');

const meta: Meta<typeof XGovProposerStatusPill> = {
  title: 'Components/XGovProposerStatusPill',
  component: XGovProposerStatusPill,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof XGovProposerStatusPill>;

// Not a proposer
export const NotProposer: Story = {
  args: {
    proposer: {
      isProposer: false,
      kycStatus: false,
      kycExpiring: 0n,
      activeProposal: false
    },
  },
};

// Proposer with no KYC
export const ProposerNoKYC: Story = {
  args: {
    proposer: {
      isProposer: true,
      kycStatus: false,
      kycExpiring: 0n,
      activeProposal: false
    },
  },
};

// Proposer with expired KYC
export const ProposerExpiredKYC: Story = {
  args: {
    proposer: {
      isProposer: true,
      kycStatus: true,
      kycExpiring: 0n,
      activeProposal: false
    },
  },
};

// Proposer with valid KYC
export const ProposerValidKYC: Story = {
  args: {
    proposer: {
      isProposer: true,
      kycStatus: true,
      kycExpiring: MAX_UINT64,
      activeProposal: false
    },
  },
};

// No proposer data provided
export const NoProposerData: Story = {
  args: {},
};