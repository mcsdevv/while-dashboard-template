import { getFieldMapping, getNotionConfig } from "@/lib/settings";
import type { FieldConfig, NotionPropertyType } from "@/lib/settings/types";
import type { Event } from "@/lib/types";
import { Client } from "@notionhq/client";
import type {
  CreatePageParameters,
  PageObjectResponse,
  QueryDatabaseResponse,
  UpdatePageParameters,
} from "@notionhq/client/build/src/api-endpoints";

// Cached client and config (lazy initialization)
let cachedNotionClient: Client | null = null;
let cachedDatabaseId: string | null = null;

/**
 * Get or create the Notion client with credentials from settings or env vars.
 */
async function getClient(): Promise<Client> {
  if (cachedNotionClient) {
    return cachedNotionClient;
  }

  const config = await getNotionConfig();
  cachedNotionClient = new Client({ auth: config.apiToken });
  cachedDatabaseId = config.databaseId;

  return cachedNotionClient;
}

/**
 * Get the database ID from config.
 */
async function getDatabaseId(): Promise<string> {
  if (cachedDatabaseId) {
    return cachedDatabaseId;
  }

  const config = await getNotionConfig();
  cachedDatabaseId = config.databaseId;
  return cachedDatabaseId;
}

/**
 * Reset cached client (useful when credentials change).
 */
export function resetNotionClient(): void {
  cachedNotionClient = null;
  cachedDatabaseId = null;
}

// Type guard for page object responses
function isPageObjectResponse(page: unknown): page is PageObjectResponse {
  return (
    typeof page === "object" &&
    page !== null &&
    "properties" in page &&
    "object" in page &&
    (page as { object: string }).object === "page"
  );
}

// Helper to extract property values from Notion pages
export function getPropertyValue(
  properties: PageObjectResponse["properties"],
  key: string,
): unknown {
  const prop = properties[key];
  if (!prop) return null;

  switch (prop.type) {
    case "title":
      return prop.title[0]?.plain_text || "";
    case "rich_text":
      return prop.rich_text[0]?.plain_text || "";
    case "date":
      return prop.date;
    case "select":
      return prop.select?.name || null;
    case "number":
      return prop.number;
    case "url":
      return prop.url || "";
    case "checkbox":
      return prop.checkbox;
    default:
      return null;
  }
}

type NotionPropertyValue =
  | NonNullable<CreatePageParameters["properties"]>[string]
  | NonNullable<UpdatePageParameters["properties"]>[string];

export function buildNotionPropertyValue(
  type: NotionPropertyType,
  value: unknown,
): NotionPropertyValue | null {
  switch (type) {
    case "title":
      if (typeof value !== "string") return null;
      return { title: [{ text: { content: value } }] };
    case "rich_text":
      if (typeof value !== "string") return null;
      return { rich_text: [{ text: { content: value } }] };
    case "number":
      if (typeof value !== "number") return null;
      return { number: value };
    case "checkbox":
      if (typeof value !== "boolean") return null;
      return { checkbox: value };
    case "url":
      if (typeof value !== "string") return null;
      return { url: value };
    case "select":
      if (typeof value !== "string") return null;
      return { select: { name: value } };
    case "date": {
      if (!value || typeof value !== "object") return null;
      const dateValue = value as { start?: string | Date; end?: string | Date };
      if (!dateValue.start) return null;
      const start =
        dateValue.start instanceof Date ? dateValue.start.toISOString() : dateValue.start;
      const end = dateValue.end instanceof Date ? dateValue.end.toISOString() : dateValue.end;
      return { date: end ? { start, end } : { start } };
    }
  }
}

function setPropertyValue(
  properties: Record<string, NotionPropertyValue>,
  config: FieldConfig,
  value: unknown,
) {
  const propertyValue = buildNotionPropertyValue(config.propertyType, value);
  if (propertyValue) {
    properties[config.notionPropertyName] = propertyValue;
  }
}

// Convert Notion page to Event
export async function notionPageToEvent(page: PageObjectResponse): Promise<Event | null> {
  try {
    const properties = page.properties;
    const fieldMapping = await getFieldMapping();

    // Required fields - always read
    const title = getPropertyValue(properties, fieldMapping.title.notionPropertyName) as string;
    const dateRange = getPropertyValue(properties, fieldMapping.date.notionPropertyName) as {
      start?: string;
      end?: string;
    } | null;

    if (!dateRange?.start) {
      console.warn(`Page ${page.id} missing start date`);
      return null;
    }

    const startTime = new Date(dateRange.start);
    const endTime = dateRange.end
      ? new Date(dateRange.end)
      : new Date(startTime.getTime() + 3600000); // +1 hour default

    // Optional fields - only read if enabled
    const description = fieldMapping.description.enabled
      ? (getPropertyValue(properties, fieldMapping.description.notionPropertyName) as
          | string
          | undefined)
      : undefined;
    const location = fieldMapping.location.enabled
      ? (getPropertyValue(properties, fieldMapping.location.notionPropertyName) as
          | string
          | undefined)
      : undefined;
    const gcalEventId = fieldMapping.gcalEventId.enabled
      ? (getPropertyValue(properties, fieldMapping.gcalEventId.notionPropertyName) as
          | string
          | undefined)
      : undefined;
    const reminders = fieldMapping.reminders.enabled
      ? (getPropertyValue(properties, fieldMapping.reminders.notionPropertyName) as
          | number
          | undefined)
      : undefined;

    // New extended fields - only read if enabled
    const attendeesStr = fieldMapping.attendees.enabled
      ? (getPropertyValue(properties, fieldMapping.attendees.notionPropertyName) as
          | string
          | undefined)
      : undefined;
    const attendees = attendeesStr ? attendeesStr.split(", ").filter(Boolean) : undefined;

    const organizer = fieldMapping.organizer.enabled
      ? (getPropertyValue(properties, fieldMapping.organizer.notionPropertyName) as
          | string
          | undefined)
      : undefined;
    const conferenceLink = fieldMapping.conferenceLink.enabled
      ? (getPropertyValue(properties, fieldMapping.conferenceLink.notionPropertyName) as
          | string
          | undefined)
      : undefined;
    const recurrence = fieldMapping.recurrence.enabled
      ? (getPropertyValue(properties, fieldMapping.recurrence.notionPropertyName) as
          | string
          | undefined)
      : undefined;
    const color = fieldMapping.color.enabled
      ? (getPropertyValue(properties, fieldMapping.color.notionPropertyName) as string | undefined)
      : undefined;
    const visibilityStr = fieldMapping.visibility.enabled
      ? (getPropertyValue(properties, fieldMapping.visibility.notionPropertyName) as
          | string
          | undefined)
      : undefined;
    const visibility = visibilityStr as Event["visibility"];

    const statusValue = getPropertyValue(properties, "Status") as string | undefined;
    const status = statusValue?.toLowerCase() as Event["status"];

    return {
      id: page.id,
      title: title || "Untitled",
      description,
      startTime,
      endTime,
      location,
      status,
      reminders,
      attendees,
      organizer,
      conferenceLink,
      recurrence,
      color,
      visibility,
      notionPageId: page.id,
      gcalEventId,
    };
  } catch (error) {
    console.error("Error converting Notion page to event:", error);
    return null;
  }
}

// Fetch all events from Notion database
export async function fetchNotionEvents(): Promise<Event[]> {
  try {
    const client = await getClient();
    const databaseId = await getDatabaseId();
    const fieldMapping = await getFieldMapping();

    const response: QueryDatabaseResponse = await client.databases.query({
      database_id: databaseId,
      filter: {
        property: fieldMapping.date.notionPropertyName,
        date: {
          is_not_empty: true,
        },
      },
    });

    const events: Event[] = [];
    for (const result of response.results) {
      if (isPageObjectResponse(result)) {
        const event = await notionPageToEvent(result);
        if (event) {
          events.push(event);
        }
      }
    }

    return events;
  } catch (error) {
    console.error("Error fetching Notion events:", error);
    throw error;
  }
}

// Create a new event in Notion
export async function createNotionEvent(event: Event): Promise<string> {
  try {
    const client = await getClient();
    const databaseId = await getDatabaseId();
    const fieldMapping = await getFieldMapping();

    // Build properties object, checking enabled flags
    const properties: CreatePageParameters["properties"] = {};

    // Required fields - always include
    setPropertyValue(properties, fieldMapping.title, event.title);
    setPropertyValue(properties, fieldMapping.date, {
      start: event.startTime,
      end: event.endTime,
    });

    // Optional fields - only include if enabled and value exists
    if (fieldMapping.description.enabled && event.description) {
      setPropertyValue(properties, fieldMapping.description, event.description);
    }

    if (fieldMapping.location.enabled && event.location) {
      setPropertyValue(properties, fieldMapping.location, event.location);
    }

    if (fieldMapping.gcalEventId.enabled && event.gcalEventId) {
      setPropertyValue(properties, fieldMapping.gcalEventId, event.gcalEventId);
    }

    if (fieldMapping.reminders.enabled && event.reminders !== undefined) {
      setPropertyValue(properties, fieldMapping.reminders, event.reminders);
    }

    // Status field (not part of field mapping)
    if (event.status) {
      properties.Status = {
        select: {
          name: event.status.charAt(0).toUpperCase() + event.status.slice(1),
        },
      };
    }

    // New extended fields - only include if enabled and value exists
    if (fieldMapping.attendees.enabled && event.attendees?.length) {
      setPropertyValue(properties, fieldMapping.attendees, event.attendees.join(", "));
    }

    if (fieldMapping.organizer.enabled && event.organizer) {
      setPropertyValue(properties, fieldMapping.organizer, event.organizer);
    }

    if (fieldMapping.conferenceLink.enabled && event.conferenceLink) {
      setPropertyValue(properties, fieldMapping.conferenceLink, event.conferenceLink);
    }

    if (fieldMapping.recurrence.enabled && event.recurrence) {
      setPropertyValue(properties, fieldMapping.recurrence, event.recurrence);
    }

    if (fieldMapping.color.enabled && event.color) {
      setPropertyValue(properties, fieldMapping.color, event.color);
    }

    if (fieldMapping.visibility.enabled && event.visibility) {
      setPropertyValue(properties, fieldMapping.visibility, event.visibility);
    }

    const response = await client.pages.create({
      parent: { database_id: databaseId },
      properties,
    });

    return response.id;
  } catch (error) {
    console.error("Error creating Notion event:", error);
    throw error;
  }
}

// Update an existing Notion event
export async function updateNotionEvent(pageId: string, event: Partial<Event>): Promise<void> {
  try {
    const client = await getClient();
    const fieldMapping = await getFieldMapping();

    const properties: UpdatePageParameters["properties"] = {};

    // Required fields - always update if provided
    if (event.title !== undefined) {
      setPropertyValue(properties, fieldMapping.title, event.title);
    }

    if (event.startTime && event.endTime) {
      setPropertyValue(properties, fieldMapping.date, {
        start: event.startTime,
        end: event.endTime,
      });
    } else if (event.startTime) {
      setPropertyValue(properties, fieldMapping.date, {
        start: event.startTime,
      });
    }

    // Optional fields - only update if enabled
    if (fieldMapping.description.enabled && event.description !== undefined) {
      setPropertyValue(properties, fieldMapping.description, event.description);
    }

    if (fieldMapping.location.enabled && event.location !== undefined) {
      setPropertyValue(properties, fieldMapping.location, event.location);
    }

    if (event.status) {
      properties.Status = {
        select: {
          name: event.status.charAt(0).toUpperCase() + event.status.slice(1),
        },
      };
    }

    if (fieldMapping.reminders.enabled && event.reminders !== undefined) {
      setPropertyValue(properties, fieldMapping.reminders, event.reminders);
    }

    if (fieldMapping.gcalEventId.enabled && event.gcalEventId !== undefined) {
      setPropertyValue(properties, fieldMapping.gcalEventId, event.gcalEventId);
    }

    // Extended fields - only update if enabled in field mapping
    if (event.attendees !== undefined && fieldMapping.attendees.enabled) {
      setPropertyValue(properties, fieldMapping.attendees, event.attendees.join(", "));
    }

    if (event.organizer !== undefined && fieldMapping.organizer.enabled) {
      setPropertyValue(properties, fieldMapping.organizer, event.organizer);
    }

    if (event.conferenceLink !== undefined && fieldMapping.conferenceLink.enabled) {
      setPropertyValue(properties, fieldMapping.conferenceLink, event.conferenceLink);
    }

    if (event.recurrence !== undefined && fieldMapping.recurrence.enabled) {
      setPropertyValue(properties, fieldMapping.recurrence, event.recurrence);
    }

    if (event.color !== undefined && fieldMapping.color.enabled) {
      setPropertyValue(properties, fieldMapping.color, event.color);
    }

    if (event.visibility !== undefined && fieldMapping.visibility.enabled) {
      setPropertyValue(properties, fieldMapping.visibility, event.visibility);
    }

    await client.pages.update({
      page_id: pageId,
      properties,
    });
  } catch (error) {
    console.error("Error updating Notion event:", error);
    throw error;
  }
}

// Delete a Notion event (archive the page)
export async function deleteNotionEvent(pageId: string): Promise<void> {
  try {
    const client = await getClient();

    await client.pages.update({
      page_id: pageId,
      archived: true,
    });
  } catch (error: unknown) {
    // If the page is already archived, treat it as success
    const errorCode =
      error && typeof error === "object" && "code" in error
        ? String((error as { code: unknown }).code)
        : "";
    const errorMessage = error instanceof Error ? error.message : "";

    if (errorCode === "validation_error" && errorMessage.includes("archived")) {
      console.log(`Page ${pageId} is already archived, skipping`);
      return;
    }
    console.error("Error deleting Notion event:", error);
    throw error;
  }
}

// Get a single event by page ID
export async function getNotionEvent(pageId: string): Promise<Event | null> {
  try {
    const client = await getClient();

    const page = await client.pages.retrieve({
      page_id: pageId,
    });

    if (isPageObjectResponse(page)) {
      return notionPageToEvent(page);
    }

    return null;
  } catch (error) {
    console.error("Error fetching Notion event:", error);
    throw error;
  }
}

// ============================================================
// Webhook Management (Notion API v1)
// ============================================================

interface CreateWebhookParams {
  url: string;
  databaseId: string;
  eventTypes?: string[];
}

interface WebhookResponse {
  id: string;
  url: string;
  created_time: string;
  event_types: string[];
  state: string;
}

/**
 * Create a webhook subscription for the Notion database
 * Note: This uses the Notion API directly as the SDK doesn't support webhooks yet
 */
export async function createNotionWebhook(params: CreateWebhookParams): Promise<WebhookResponse> {
  try {
    const config = await getNotionConfig();

    const response = await fetch("https://api.notion.com/v1/webhooks", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        url: params.url,
        event_types: params.eventTypes || ["page.content_updated"],
        database_id: params.databaseId,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create webhook: ${response.status} ${error}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating Notion webhook:", error);
    throw error;
  }
}

/**
 * Delete a webhook subscription
 */
export async function deleteNotionWebhook(webhookId: string): Promise<void> {
  try {
    const config = await getNotionConfig();

    const response = await fetch(`https://api.notion.com/v1/webhooks/${webhookId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        "Notion-Version": "2022-06-28",
      },
    });

    if (!response.ok && response.status !== 404) {
      const error = await response.text();
      throw new Error(`Failed to delete webhook: ${response.status} ${error}`);
    }
  } catch (error) {
    console.error("Error deleting Notion webhook:", error);
    throw error;
  }
}

/**
 * List all webhook subscriptions
 *
 * @deprecated This function calls an undocumented Notion API endpoint that returns 400 errors.
 * Notion webhooks are managed through the UI only - there's no public API to list subscriptions.
 * Use local state (Redis) to track webhook status instead.
 */
export async function listNotionWebhooks(): Promise<WebhookResponse[]> {
  try {
    const config = await getNotionConfig();

    const response = await fetch("https://api.notion.com/v1/webhooks", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        "Notion-Version": "2022-06-28",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to list webhooks: ${response.status} ${error}`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error("Error listing Notion webhooks:", error);
    throw error;
  }
}
