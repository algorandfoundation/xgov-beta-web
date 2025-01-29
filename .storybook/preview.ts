import 'tailwindcss/tailwind.css'
import type { Preview } from "@storybook/react";

declare global {
  interface BigIntConstructor {
    toJSON:() => string;
  }
}

// @ts-expect-error
BigInt.prototype.toJSON = function() {
  return this.toString();
};

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
