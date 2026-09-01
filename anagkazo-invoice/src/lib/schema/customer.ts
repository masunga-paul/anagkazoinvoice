import { z } from 'zod';

export const customerSchema = z.object({
	name: z
		.string()
		.min(1, 'Customer/Company name is required')
		.min(2, 'Customer name must be at least 2 characters'),
	companyName: z
		.string()
		.min(1, 'Registered company name is required'),
	contactPerson: z
		.string()
		.min(1, 'Contact person name is required'),
	email: z
		.string()
		.min(1, 'Email address is required')
		.email('Please enter a valid email address'),
	phone: z
		.string()
		.min(1, 'Phone number is required')
		.min(7, 'Please enter a valid phone number (e.g. +255 7XX XXX XXX)'),
	address: z
		.string()
		.min(1, 'Physical / street address is required')
		.min(3, 'Address must be at least 3 characters'),
	city: z
		.string()
		.min(1, 'City is required')
		.default('Dar es Salaam'),
	customerType: z
		.enum(['Fleet & Logistics', 'Corporate', 'Retail / Private', 'Government / NGO'])
		.default('Fleet & Logistics'),
	creditLimit: z
		.coerce
		.number()
		.optional()
		.default(0),
	paymentTerms: z
		.string()
		.min(1, 'Payment terms are required')
		.default('Net 14'),
	tin: z
		.string()
		.min(1, 'Tax Identification Number (TIN) is required')
		.min(9, 'TIN must be at least 9 characters (e.g. 188-458-408)')
});

export type CustomerSchema = typeof customerSchema;
export type CustomerInput = z.infer<typeof customerSchema>;
