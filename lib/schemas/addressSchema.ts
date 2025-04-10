import { z } from 'zod';

import { BaseCreateSchema, BaseSchema } from './baseSchema';

// Zod schema for address validation
export const AddressSchema = BaseSchema.extend({
  id: z.number().optional(),
  type: z.string().min(1, 'Address type is required'),
  street: z.string().min(1, 'Street address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().optional(),
  country: z.string().min(1, 'Country is required'),
  postal_code: z.string().min(1, 'Postal code is required'),
  is_primary: z.boolean().default(false),
  transaction_no: z.string().optional(),
  phone_no: z.string().optional(),
  fax_no: z.string().optional(),
});

// Zod schema for creating a new address
export const CreateAddressSchema = BaseCreateSchema.extend(
  AddressSchema.omit({
    id: true,
    created_at: true,
    updated_at: true,
    created_by: true,
    updated_by: true,
  }).shape
);

// Zod schema for updating an address
export const UpdateAddressSchema = CreateAddressSchema.partial();

// Types derived from Zod schema
export type AddressInput = z.infer<typeof CreateAddressSchema>;
export type AddressUpdate = z.infer<typeof UpdateAddressSchema>;
export type Address = z.infer<typeof AddressSchema>;
