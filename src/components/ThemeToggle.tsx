"use client";

import * as React from "react";
import { Moon, Monitor, Palette, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { setTheme } = useTheme();

  return (
    <div className={className} {...props}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="relative rounded-full border-border/70 bg-card/75 shadow-sm backdrop-blur-md"
          >
            <Palette className="absolute h-3.5 w-3.5 -translate-y-3 translate-x-3 text-primary/70" />
            <Sun className="h-[1.1rem] w-[1.1rem] rotate-0 scale-100 text-amber-500 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.1rem] w-[1.1rem] rotate-90 scale-0 text-cyan-300 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40 rounded-xl">
          <DropdownMenuItem
            onClick={() => setTheme("light")}
            className="flex cursor-pointer items-center gap-2"
          >
            <Sun className="h-4 w-4 text-amber-500" />
            Light
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setTheme("dark")}
            className="flex cursor-pointer items-center gap-2"
          >
            <Moon className="h-4 w-4 text-cyan-300" />
            Dark
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setTheme("system")}
            className="flex cursor-pointer items-center gap-2"
          >
            <Monitor className="h-4 w-4 text-muted-foreground" />
            System
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
