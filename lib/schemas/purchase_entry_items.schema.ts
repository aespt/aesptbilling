// Re-export schemas from purchaseEntryItemSchema for backward compatibility
import {
  PurchaseEntryItemSchema,
  CreatePurchaseEntryItemSchema,
  UpdatePurchaseEntryItemSchema,
} from './purchaseEntryItemSchema';

export const insertPurchaseEntryItemSchema = CreatePurchaseEntryItemSchema;
export const updatePurchaseEntryItemSchema = UpdatePurchaseEntryItemSchema;
export const purchaseEntryItemSchema = PurchaseEntryItemSchema;
