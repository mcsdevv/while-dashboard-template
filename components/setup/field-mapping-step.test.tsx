import { DEFAULT_EXTENDED_FIELD_MAPPING } from "@/lib/settings/types";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { SWRConfig } from "swr";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FieldMappingStep } from "./field-mapping-step";

vi.mock("lucide-react", () => ({
  ArrowRight: () => <span aria-hidden="true">→</span>,
  Pencil: () => <span aria-hidden="true">✎</span>,
  Plus: () => <span aria-hidden="true">+</span>,
}));

vi.mock("@/lib/toast", () => ({
  useToast: () => ({
    addToast: vi.fn(),
  }),
}));

// Mock the UI components
vi.mock("@/shared/ui", () => ({
  Button: ({
    children,
    onClick,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    [key: string]: unknown;
  }) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div>{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogFooter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
  Label: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => (
    // biome-ignore lint/a11y/noLabelWithoutControl: test stub
    <label {...props}>{children}</label>
  ),
  Select: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectItem: ({
    children,
    value,
    disabled,
  }: {
    children: React.ReactNode;
    value: string;
    disabled?: boolean;
  }) => (
    <div data-disabled={disabled ? "true" : "false"} data-value={value}>
      {children}
    </div>
  ),
  SelectSeparator: () => <div data-testid="separator" />,
  SelectTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <div>{placeholder}</div>,
  Switch: ({
    checked,
    onCheckedChange,
  }: {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
  }) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onCheckedChange(event.target.checked)}
    />
  ),
}));

describe("FieldMappingStep", () => {
  const renderWithSWR = (ui: React.ReactElement) =>
    render(<SWRConfig value={{ provider: () => new Map() }}>{ui}</SWRConfig>);

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("creates missing default properties before saving", async () => {
    const mapping = {
      ...DEFAULT_EXTENDED_FIELD_MAPPING,
      description: { ...DEFAULT_EXTENDED_FIELD_MAPPING.description, enabled: false },
      gcalEventId: { ...DEFAULT_EXTENDED_FIELD_MAPPING.gcalEventId, enabled: false },
      location: { ...DEFAULT_EXTENDED_FIELD_MAPPING.location, enabled: true },
    };

    const fetchMock = vi.fn(async (input: RequestInfo, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";

      if (url === "/api/setup/field-mapping" && method === "GET") {
        return {
          ok: true,
          json: async () => ({
            fieldMapping: mapping,
            notionProperties: [
              { id: "title", name: "Title", type: "title" },
              { id: "date", name: "Date", type: "date" },
            ],
          }),
        } as Response;
      }

      if (url === "/api/setup/notion/property" && method === "POST") {
        return {
          ok: true,
          json: async () => ({
            property: { id: "location", name: "Location", type: "rich_text" },
          }),
        } as Response;
      }

      if (url === "/api/setup/field-mapping" && method === "POST") {
        return {
          ok: true,
          json: async () => ({ status: "success" }),
        } as Response;
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    const onNext = vi.fn();
    renderWithSWR(<FieldMappingStep onBack={() => {}} onNext={onNext} />);

    await screen.findByText(/Configure how properties sync between Notion and Google Calendar/i);

    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));

    expect(screen.getByText(/Confirm Notion Changes/i)).toBeInTheDocument();
    expect(screen.getAllByText(/^Location$/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: /Confirm/i }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/setup/notion/property",
        expect.objectContaining({ method: "POST" }),
      ),
    );

    const createCall = fetchMock.mock.calls.find(
      ([url, init]) => String(url) === "/api/setup/notion/property" && init?.method === "POST",
    );
    const body = JSON.parse((createCall?.[1] as RequestInit).body as string);
    expect(body).toEqual({ name: "Location", type: "rich_text" });

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/setup/field-mapping",
        expect.objectContaining({ method: "POST" }),
      ),
    );
    await waitFor(() => expect(onNext).toHaveBeenCalledTimes(1));
  });

  it("shows incompatible defaults in the confirmation dialog and blocks saving", async () => {
    const mapping = {
      ...DEFAULT_EXTENDED_FIELD_MAPPING,
      reminders: { ...DEFAULT_EXTENDED_FIELD_MAPPING.reminders, enabled: true },
    };

    const fetchMock = vi.fn(async (input: RequestInfo, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";

      if (url === "/api/setup/field-mapping" && method === "GET") {
        return {
          ok: true,
          json: async () => ({
            fieldMapping: mapping,
            notionProperties: [
              { id: "title", name: "Title", type: "title" },
              { id: "date", name: "Date", type: "date" },
              { id: "reminders", name: "Reminders", type: "rich_text" },
            ],
          }),
        } as Response;
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    renderWithSWR(<FieldMappingStep onBack={() => {}} onNext={() => {}} />);

    await screen.findByText(/Configure how properties sync between Notion and Google Calendar/i);
    await screen.findByText(/^Title$/);

    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));

    expect(await screen.findByText(/Confirm Notion Changes/i)).toBeInTheDocument();
    expect(await screen.findByText(/Incompatible existing properties/i)).toBeInTheDocument();
    expect(
      screen.getByText(/default field names require specific Notion property types/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/Expected Number, found Text/i)).toBeInTheDocument();

    const resolveButton = screen.getByRole("button", { name: /Resolve issues/i });
    expect(resolveButton).toBeDisabled();
  });

  it("shows incompatible existing property in the list", async () => {
    const mapping = {
      ...DEFAULT_EXTENDED_FIELD_MAPPING,
      reminders: { ...DEFAULT_EXTENDED_FIELD_MAPPING.reminders, enabled: true },
    };

    const fetchMock = vi.fn(async (input: RequestInfo, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method ?? "GET";

      if (url === "/api/setup/field-mapping" && method === "GET") {
        return {
          ok: true,
          json: async () => ({
            fieldMapping: mapping,
            notionProperties: [
              { id: "title", name: "Title", type: "title" },
              { id: "date", name: "Date", type: "date" },
              { id: "reminders", name: "Reminders", type: "rich_text" },
            ],
          }),
        } as Response;
      }

      throw new Error(`Unexpected fetch call: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    renderWithSWR(<FieldMappingStep onBack={() => {}} onNext={() => {}} />);

    await screen.findByText(/Configure how properties sync between Notion and Google Calendar/i);
    await screen.findByText(/^Title$/);

    expect(screen.queryByText(/^None$/i)).not.toBeInTheDocument();
    expect(
      await screen.findByText((content) => content.includes("incompatible: rich_text")),
    ).toBeInTheDocument();
  });
});
