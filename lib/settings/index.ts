/**
 * Settings module - provides encrypted configuration storage and unified config loading.
 */

// Types
export type {
  AppSettings,
  ExtendedFieldMapping,
  FieldConfig,
  FieldMapping,
  GoogleSettings,
  NotionPropertyType,
  NotionSettings,
} from "./types";
export {
  DEFAULT_EXTENDED_FIELD_MAPPING,
  DEFAULT_FIELD_MAPPING,
  ENCRYPTED_FIELDS,
  GCAL_COLORS,
} from "./types";

// Migration
export { ensureExtendedFieldMapping, isLegacyFieldMapping, migrateFieldMapping } from "./migration";

// Encryption utilities
export { decrypt, encrypt, isEncryptionConfigured, safeDecrypt, safeEncrypt } from "./encryption";

// Storage operations
export {
  deleteSettings,
  getSettings,
  hasSettings,
  isSetupComplete,
  saveSettings,
  updateSettings,
} from "./storage";

// Config loading
export type { GoogleConfig, NotionConfig } from "./loader";
export {
  getExtendedFieldMapping,
  getFieldMapping,
  getGoogleConfig,
  getLegacyFieldMapping,
  getNotionConfig,
  isFullyConfigured,
  isGoogleClientConfigured,
  isGoogleConfigured,
  isGoogleConnected,
  isNotionConfigured,
} from "./loader";
