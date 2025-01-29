import type { Meta, StoryFn } from '@storybook/react';
import ErrorModal, { type ErrorModalProps } from './ErrorModal';

const meta: Meta<typeof ErrorModal> = {
  title: 'Components/ErrorModal',
  component: ErrorModal,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    isOpen: true,
    message: 'An error has occurred.',
    onClose: () => alert('Close button clicked'),
  },
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the modal is open',
    },
    message: {
      control: 'text',
      description: 'The error message to display',
    },
    onClose: {
      control: undefined,
      description: 'Function to call when the close button is clicked',
    },
  },
};

export default meta;

const Template: StoryFn<ErrorModalProps> = (args) => <ErrorModal {...args} />;

export const Default = Template.bind({});
Default.args = {
  isOpen: true,
  message: 'An error has occurred.',
  onClose: () => alert('Close button clicked'),
};