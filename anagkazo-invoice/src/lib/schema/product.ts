import { z } from 'zod';

export const productSchema = z.object({
	brand: z
		.string()
		.min(1, 'Tyre brand is required'),
	model: z
		.string()
		.min(1, 'Tyre model name is required')
		.min(2, 'Model name must be at least 2 characters'),
	size: z
		.string()
		.min(1, 'Tyre size is required (e.g. 265/65 R17 or 315/80 R22.5)'),
	sku: z
		.string()
		.min(1, 'SKU code is required')
		.min(3, 'SKU must be at least 3 characters'),
	application: z
		.string()
		.min(1, 'Vehicle application category is required'),
	unitPriceTZS: z
		.coerce
		.number()
		.min(1000, 'Unit price must be at least 1,000 TZS'),
	stockQuantity: z
		.coerce
		.number()
		.min(0, 'Stock quantity cannot be negative'),
	reorderLevel: z
		.coerce
		.number()
		.min(1, 'Reorder level must be at least 1 unit')
		.default(10),
	location: z
		.string()
		.min(1, 'Warehouse location is required')
		.default('Warehouse Bay A-1')
});

export type ProductSchema = typeof productSchema;
export type ProductInput = z.infer<typeof productSchema>;
