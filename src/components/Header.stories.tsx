import type { Meta, StoryObj } from '@storybook/react';
import { fn, userEvent, within, expect } from '@storybook/test';
import { Header, type HeaderProps } from './Header.tsx';
import {type ComponentType, useState} from "react";
import type {LinkProps} from "./Link.tsx";

function HeaderWrapper(props: HeaderProps){
  const [path, setPath] = useState("/docs")

  function Link(props: LinkProps & {onClick: ()=>void}){
    return (
      <button {...props} onClick={()=>setPath(props.to)} />
    )
  }
  return <Header {...props} path={path} LinkComponent={Link as ComponentType<LinkProps>}/>
}

const meta = {
  title: 'Components/Header',
  component: HeaderWrapper,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    children: "Connected"
  },
  argTypes:{
    children: {
      name: 'Wallet State',
      type: 'function',
      description: "Pick the state of the wallet.",
      control: {
        type: 'select',
      },
      options: ['Connected', 'Disconnected'],
      mapping: {
        // TODO: Connect Component
        Connected: <button onClick={()=>fn()} id="connect-button"
                         className="flex items-center gap-2 bg-algo-black text-lg rounded-md text-white p-2 px-4">
          xgov.algo
        </button>,
        Disconnected: <button onClick={()=>fn()} id="connect-button"
                           className="flex items-center gap-2 bg-algo-black text-lg rounded-md text-white p-2 px-4">
          Connect Wallet
        </button>,
      }
    }
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

   // 👇 Click the "Cohort" link
   await userEvent.click(canvas.getByTestId('header-cohort-link'));

    // 👇 Assert DOM structure
    await expect(
        canvas.getByTestId('header-cohort-link')
    ).toHaveClass('bg-purple-900');
  },
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

export const LoggedIn: Story = {
  args: {
    children: "Connected"
  },
};

export const LoggedOut: Story = {
  args: {
    children: "Disconnected"
  },
};
