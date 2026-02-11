"use client";

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/shared/ui";
import { ComponentSection, ComponentRow } from "../component-section";

export function NavigationSection() {
  return (
    <ComponentSection id="navigation" title="NAVIGATION_CONTROLS" description="Tabs, accordion, breadcrumb, and pagination">
      <ComponentRow label="TABS">
        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">OVERVIEW</TabsTrigger>
            <TabsTrigger value="metrics">METRICS</TabsTrigger>
            <TabsTrigger value="config">CONFIG</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <p className="text-[13px] text-muted-foreground pt-2">
              Neural engine overview panel. System status: NOMINAL
            </p>
          </TabsContent>
          <TabsContent value="metrics">
            <p className="text-[13px] text-muted-foreground pt-2">
              Performance metrics: 12ms avg latency, 99.7% uptime
            </p>
          </TabsContent>
          <TabsContent value="config">
            <p className="text-[13px] text-muted-foreground pt-2">
              Configuration parameters for the neural sync endpoint
            </p>
          </TabsContent>
        </Tabs>
      </ComponentRow>

      <ComponentRow label="ACCORDION">
        <Accordion className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>NEURAL_ENGINE_STATUS</AccordionTrigger>
            <AccordionContent>
              All neural pathways operational. Current load: 12% capacity.
              Last sync: 2.4s ago.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>WEIGHT_DISTRIBUTION</AccordionTrigger>
            <AccordionContent>
              Weights distributed across 8 shards. Hash verification: PASS.
              Integrity: 100%.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>SYNC_CONFIGURATION</AccordionTrigger>
            <AccordionContent>
              Sync interval: 500ms. Protocol: gRPC. Compression: zstd.
              Buffer size: 4096.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </ComponentRow>

      <ComponentRow label="BREADCRUMB">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">SYS</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#">NEURAL_ENG</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>CONFIG</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </ComponentRow>

      <ComponentRow label="PAGINATION">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#" isActive>2</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="#">3</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </ComponentRow>
    </ComponentSection>
  );
}
