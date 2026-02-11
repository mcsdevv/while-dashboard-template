"use client";

import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui";
import { ChevronDown, Copy, Download, Settings, Trash2 } from "lucide-react";
import { ComponentSection, ComponentRow } from "../component-section";

export function OverlaysSection() {
  return (
    <ComponentSection id="overlays" title="OVERLAY_CONTROLS" description="Tooltips, dropdowns, and popovers">
      <ComponentRow label="TOOLTIP">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Button variant="outline">Hover me</Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>SYS_INFO: Neural engine status</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </ComponentRow>

      <ComponentRow label="DROPDOWN_MENU">
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="outline">
              Actions <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>OPERATIONS</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem><Copy className="mr-2 h-4 w-4" />Copy Hash</DropdownMenuItem>
            <DropdownMenuItem><Download className="mr-2 h-4 w-4" />Export Weights</DropdownMenuItem>
            <DropdownMenuItem><Settings className="mr-2 h-4 w-4" />Configure</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Purge Cache</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </ComponentRow>
    </ComponentSection>
  );
}
