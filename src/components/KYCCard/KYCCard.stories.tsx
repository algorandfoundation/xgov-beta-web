import type { Meta, StoryFn } from "@storybook/react";
import { KYCCard, type KYCCardProps } from "./KYCCard";
import type { ProposerBoxState } from "@/api";

const meta: Meta<typeof KYCCard> = {
  title: "Components/KYCCard",
  component: KYCCard,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
  args: {
    proposalAddress:
      "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ",
    values: [false, false, BigInt(0).toString()] as unknown as ProposerBoxState,
    setProposerKYC: async () => {},
  },
  argTypes: {
    proposalAddress: {
      control: "text",
      description: "The address associated with the KYC card",
    },
    values: {
      control: "object",
      description: "The KYC status and expiration date of the address",
    },
    setProposerKYC: {
      control: undefined,
      description: "Function to set the KYC status",
    },
  },
};

export default meta;

const Template: StoryFn<KYCCardProps> = (args: any) => <KYCCard {...args} />;

export const mockKYCBoxData = [
  {
    proposalAddress:
      "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ",
    values: [false, false, BigInt(0).toString()] as unknown as ProposerBoxState,
  },
  {
    proposalAddress:
      "B243SD5USOH4DMV55K7SOOHXJQ3LUUVIQJOFXM7QIVEKUGCPKM6Q2B5PCA",
    values: [
      true,
      true,
      BigInt(Math.floor(Date.now() / 1000)).toString(),
    ] as unknown as ProposerBoxState,
  },
  {
    proposalAddress:
      "FU56YMMJFRODITZMI7JPOSVHRJ5QBJBSN5TZTE724MOSLAPCK7OGQ2HFRQ",
    values: [
      true,
      true,
      BigInt(Math.floor(new Date(3000, 0, 1).getTime() / 1000)).toString(),
    ] as unknown as ProposerBoxState,
  },
];

export const Default = Template.bind({});
Default.args = mockKYCBoxData[0];

export const Expired = Template.bind({});
Expired.args = mockKYCBoxData[1];

export const Approved = Template.bind({});
Approved.args = mockKYCBoxData[2];
