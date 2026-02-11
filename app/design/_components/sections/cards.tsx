import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
} from "@/shared/ui";
import { ComponentSection, ComponentGrid } from "../component-section";

export function CardsSection() {
  return (
    <ComponentSection id="cards" title="CARD_VARIANTS" description="Content containers">
      <ComponentGrid cols={2}>
        <Card>
          <CardHeader>
            <CardTitle>HYPERPARAMETERS</CardTitle>
            <CardDescription>Neural network training configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-[13px]">
              <span className="text-muted-foreground">L_RATE</span>
              <span>0.045</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-muted-foreground">MOMTM</span>
              <span>128</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-muted-foreground">BATCH</span>
              <span>64</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>CREATE_PROJECT</CardTitle>
            <CardDescription>Deploy a new instance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">PROJECT_NAME</Label>
              <Input id="name" placeholder="neural-engine-v4" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline">Cancel</Button>
            <Button>Deploy</Button>
          </CardFooter>
        </Card>
      </ComponentGrid>
    </ComponentSection>
  );
}
