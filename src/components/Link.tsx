import React from "react";
import { Slot } from "@radix-ui/react-slot";

/**
 * Represents the properties for a link component.
 * Extends the standard React Anchor HTML attributes.
 */
export interface LinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  /**
   * Represents the destination or target in a process or operation.
   * This variable is typically used to specify where an action should be directed or sent.
   */
  to: string;
  /**
   * Represents a URL or hyperlink reference as a string.
   * This optional property can be used to specify a destination address for navigation.
   */
  href?: string;
  /**
   * Use the child component instead of the default anchor tag
   */
  asChild?: boolean;
}

/**
 * Link is a React component that renders an anchor element or a custom child component.
 * It leverages the `forwardRef` API to pass a ref to the underlying element.
 */
export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ to, asChild = false, ...rest }, ref) => {
    const Comp = asChild ? Slot : "a";
    return <Comp ref={ref} href={to} {...rest} />;
  },
);

Link.displayName = "Link";
