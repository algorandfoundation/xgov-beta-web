import type { Meta, StoryObj } from "@storybook/react";
// import { userEvent, within } from '@storybook/testing-library';
import { EditableAddress } from "./EditableAddress";
import { userEvent, within } from "@storybook/test";

const meta = {
  title: "Components/EditableAddress",
  component: EditableAddress,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  args: {
    title: "Voting Address",
    defaultValue: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
    loading: false,
    disabled: false,
    onSave: (value: string) => console.log("Saved:", value),
  },
} satisfies Meta<typeof EditableAddress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Editing: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Click the Edit button
    const editButton = canvas.getByText("Edit");
    console.log("editButton", editButton);
    await userEvent.click(editButton);
  },
};

export const Loading: Story = {
  args: {
    loading: true,
  },
};

export const SaveVotingAddress: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const editButton = canvas.getByText("Edit");
    await userEvent.click(editButton);

    const input = canvas.getByRole("textbox");
    await userEvent.clear(input);
    await userEvent.type(
      input,
      "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ",
    );

    // Click Save
    const saveButton = canvas.getByText("Save");
    await userEvent.click(saveButton);
  },
};

export const WithInvalidAddress: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Click the Edit button
    const editButton = canvas.getByText("Edit");
    await userEvent.click(editButton);

    // Type an invalid address
    const input = canvas.getByRole("textbox");
    await userEvent.clear(input);
    await userEvent.type(input, "invalid");

    // Move focus away to trigger validation
    await userEvent.tab();
  },
};
