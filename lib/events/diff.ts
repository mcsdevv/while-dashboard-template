export interface PropertyChange {
  property: string;
  type: "added" | "removed" | "changed";
  before?: unknown;
  after?: unknown;
}

/**
 * Flatten a nested object into dot-notation keys
 */
function flattenObject(obj: unknown, prefix = ""): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  if (obj === null || obj === undefined) {
    return result;
  }

  if (typeof obj !== "object") {
    return { [prefix]: obj };
  }

  if (Array.isArray(obj)) {
    // For arrays, stringify to compare as a whole
    return { [prefix]: JSON.stringify(obj) };
  }

  const entries = Object.entries(obj as Record<string, unknown>);
  for (const [key, value] of entries) {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value, newKey));
    } else if (Array.isArray(value)) {
      result[newKey] = JSON.stringify(value);
    } else {
      result[newKey] = value;
    }
  }

  return result;
}

/**
 * Check if two values are deeply equal
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;

  if (typeof a !== typeof b) return false;

  if (a === null || b === null) return a === b;

  if (typeof a === "object" && typeof b === "object") {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  return false;
}

/**
 * Compute the diff between two objects (e.g., rawPayload from consecutive operations)
 */
export function computeDiff(before: unknown, after: unknown): PropertyChange[] {
  // Handle null/undefined cases
  if (!before && !after) return [];

  if (!before) {
    const afterFlat = flattenObject(after);
    return Object.entries(afterFlat).map(([property, value]) => ({
      property,
      type: "added" as const,
      after: value,
    }));
  }

  if (!after) {
    const beforeFlat = flattenObject(before);
    return Object.entries(beforeFlat).map(([property, value]) => ({
      property,
      type: "removed" as const,
      before: value,
    }));
  }

  const beforeFlat = flattenObject(before);
  const afterFlat = flattenObject(after);
  const allKeys = new Set([...Object.keys(beforeFlat), ...Object.keys(afterFlat)]);

  const changes: PropertyChange[] = [];

  for (const key of allKeys) {
    const hasInBefore = key in beforeFlat;
    const hasInAfter = key in afterFlat;

    if (!hasInBefore && hasInAfter) {
      changes.push({
        property: key,
        type: "added",
        after: afterFlat[key],
      });
    } else if (hasInBefore && !hasInAfter) {
      changes.push({
        property: key,
        type: "removed",
        before: beforeFlat[key],
      });
    } else if (!deepEqual(beforeFlat[key], afterFlat[key])) {
      changes.push({
        property: key,
        type: "changed",
        before: beforeFlat[key],
        after: afterFlat[key],
      });
    }
  }

  // Sort by property name for consistent display
  return changes.sort((a, b) => a.property.localeCompare(b.property));
}

/**
 * Format a value for display in the diff view
 */
export function formatDiffValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "null";
  }

  if (typeof value === "string") {
    // If it looks like a stringified array/object, try to parse and format
    if (value.startsWith("[") || value.startsWith("{")) {
      try {
        return JSON.stringify(JSON.parse(value), null, 2);
      } catch {
        return value;
      }
    }
    return value;
  }

  if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  return String(value);
}
