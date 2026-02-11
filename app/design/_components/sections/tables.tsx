import {
  Badge,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/ui";
import { ComponentSection } from "../component-section";

const weightData = [
  { idx: "00", hash: "0x42 0xD2", status: "ACT" },
  { idx: "01", hash: "0x85 0xC0", status: "ACT" },
  { idx: "02", hash: "0xF8 0x17", status: "ACT" },
  { idx: "03", hash: "0x21 0x1C", status: "ACT" },
  { idx: "04", hash: "0x1F 0xC1", status: "ACT" },
  { idx: "05", hash: "0x57 0x04", status: "ACT" },
  { idx: "06", hash: "0x0D 0x80", status: "IDLE" },
  { idx: "07", hash: "0xA8 0x14", status: "ACT" },
];

export function TablesSection() {
  return (
    <ComponentSection id="tables" title="TABLE_DATA" description="Tabular data display">
      <Table>
        <TableCaption>WEIGHT_HASH_TABLE // NEURAL_ENG</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px]">IDX</TableHead>
            <TableHead>WEIGHT_HASH</TableHead>
            <TableHead className="text-right">ST</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {weightData.map((row) => (
            <TableRow key={row.idx}>
              <TableCell className="text-muted-foreground">{row.idx}</TableCell>
              <TableCell>{row.hash}</TableCell>
              <TableCell className="text-right">
                <Badge variant={row.status === "ACT" ? "terminal" : "outline"}>
                  {row.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ComponentSection>
  );
}
