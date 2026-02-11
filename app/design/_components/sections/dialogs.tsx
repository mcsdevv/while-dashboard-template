"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
} from "@/shared/ui";
import { ComponentSection, ComponentRow } from "../component-section";

export function DialogsSection() {
  return (
    <ComponentSection id="dialogs" title="DIALOG_OVERLAYS" description="Modal and overlay components">
      <ComponentRow label="STANDARD_DIALOG">
        <Dialog>
          <DialogTrigger>
            <Button variant="outline">Open Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>CONFIGURE_ENDPOINT</DialogTitle>
              <DialogDescription>
                Set the connection parameters for the neural engine sync endpoint.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="dialog-url">ENDPOINT_URL</Label>
                <Input id="dialog-url" placeholder="https://api.neural.sys" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dialog-key">API_KEY</Label>
                <Input id="dialog-key" type="password" placeholder="••••••••" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline">Cancel</Button>
              <Button>Connect</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </ComponentRow>
    </ComponentSection>
  );
}
