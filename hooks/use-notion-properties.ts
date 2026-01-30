import { useEffect, useState } from "react";
import useSWR from "swr";

interface NotionProperty {
  id: string;
  name: string;
  type: string;
}

interface FieldMappingResponse {
  fieldMapping?: unknown;
  mapping?: unknown; // Settings API uses "mapping" instead of "fieldMapping"
  notionProperties: NotionProperty[];
  defaults: unknown;
}

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    let message = "Failed to load Notion properties";
    try {
      const data = await response.json();
      if (data?.error) {
        message = data.error;
      }
    } catch {
      // Ignore JSON parsing errors and fall back to default message.
    }
    throw new Error(message);
  }
  return response.json();
};

export function useNotionProperties(endpoint = "/api/setup/field-mapping") {
  const { data, error, isLoading, mutate } = useSWR<FieldMappingResponse>(endpoint, fetcher, {
    revalidateOnFocus: false, // We'll manually revalidate on dropdown open
    dedupingInterval: 3000, // Dedupe requests within 3s
  });

  const [fieldMapping, setFieldMapping] = useState<FieldMappingResponse["fieldMapping"]>();
  const [defaults, setDefaults] = useState<FieldMappingResponse["defaults"]>();

  const resolvedFieldMapping = fieldMapping ?? data?.fieldMapping ?? data?.mapping;
  const resolvedDefaults = defaults ?? data?.defaults;

  useEffect(() => {
    setFieldMapping(undefined);
    setDefaults(undefined);
  }, []);

  useEffect(() => {
    if (!data) return;
    if (
      fieldMapping === undefined &&
      (data.fieldMapping !== undefined || data.mapping !== undefined)
    ) {
      setFieldMapping(data.fieldMapping ?? data.mapping);
    }
    if (defaults === undefined && data.defaults !== undefined) {
      setDefaults(data.defaults);
    }
  }, [data, fieldMapping, defaults]);

  return {
    properties: data?.notionProperties ?? [],
    fieldMapping: resolvedFieldMapping, // Keep initial mapping stable; refresh only updates properties
    defaults: resolvedDefaults,
    isLoading,
    error,
    refresh: () => mutate(), // Call this on dropdown open
  };
}
