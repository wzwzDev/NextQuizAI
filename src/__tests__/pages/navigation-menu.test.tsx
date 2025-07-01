global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  NavigationMenuIndicator,
  NavigationMenuViewport,
} from "../../components/ui/navigation-menu";

// Mock the Radix UI icons and utils
jest.mock("@radix-ui/react-icons", () => ({
  ChevronDownIcon: (props: any) => <svg data-testid="chevron-down-icon" {...props} />,
}));
jest.mock("@/lib/utils", () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(" "),
}));

describe("NavigationMenu", () => {
  it("renders menu with trigger and content", () => {
    render(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Menu</NavigationMenuTrigger>
            <NavigationMenuContent>
              <NavigationMenuLink href="/test">Test Link</NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    );
    expect(screen.getByText("Menu")).toBeInTheDocument();
    expect(screen.getByTestId("chevron-down-icon")).toBeInTheDocument();
  });

  it("shows content when trigger is clicked", () => {
    render(
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Menu</NavigationMenuTrigger>
            <NavigationMenuContent>
              <NavigationMenuLink href="/test">Test Link</NavigationMenuLink>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    );
    fireEvent.click(screen.getByText("Menu"));
    expect(screen.getByText("Test Link")).toBeInTheDocument();
  });

  
});