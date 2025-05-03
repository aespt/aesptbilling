// Re-export schemas from purchaseEntrySchema for backward compatibility
import {
  PurchaseEntrySchema,
  CreatePurchaseEntrySchema,
  UpdatePurchaseEntrySchema,
  PurchaseTypeEnum,
} from './purchaseEntrySchema';

export const insertPurchaseEntrySchema = CreatePurchaseEntrySchema;
export const updatePurchaseEntrySchema = UpdatePurchaseEntrySchema;
export const purchaseEntrySchema = PurchaseEntrySchema;
export { PurchaseTypeEnum };
