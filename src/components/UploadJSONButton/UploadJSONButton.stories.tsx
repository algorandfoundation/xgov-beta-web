import type { Meta, StoryObj } from "@storybook/react";
import {
  UploadJSONButton,
  type UploadJSONButtonProps,
} from "./UploadJSONButton";

const meta: Meta<typeof UploadJSONButton> = {
  title: "Components/UploadJSONButton",
  component: UploadJSONButton,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  argTypes: {
    setJsonData: { action: "setJsonData" },
  },
};

export default meta;

type Story = StoryObj<UploadJSONButtonProps>;

export const Default: Story = {
  args: {
    setJsonData: (data: any) => console.log("JSON Data:", data),
  },
};
