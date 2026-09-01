import { z } from 'zod';

export const invoiceItemSchema = z.object({
	id: z.string(),
	description: z.string().min(1, 'Item description is required'),
	qty: z.coerce.number().min(1, 'Quantity must be at least 1'),
	unitPrice: z.coerce.number().min(0, 'Unit price must be 0 or greater'),
	stockId: z.string().optional(),
	sku: z.string().optional()
});

export const invoiceSchema = z.object({
	invoiceNumber: z.string().min(1, 'Invoice number is required'),
	customerName: z.string().min(1, 'Customer name is required'),
	billingAddress: z.string().min(1, 'Billing address is required'),
	issueDate: z.string().min(1, 'Issue date is required'),
	dueDate: z.string().min(1, 'Due date is required'),
	paymentTerms: z.string().min(1, 'Payment terms required'),
	status: z.enum(['Paid', 'Pending', 'Overdue']).default('Pending'),
	items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
	discount: z.coerce.number().min(0, 'Discount cannot be negative').default(0),
	taxRate: z.coerce.number().min(0, 'Tax rate must be 0 or greater').default(18),
	notes: z.string().default('')
});


export type InvoiceSchemaType = z.infer<typeof invoiceSchema>;
