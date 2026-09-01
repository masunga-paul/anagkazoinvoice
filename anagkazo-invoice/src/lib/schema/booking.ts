import { z } from 'zod';

export const bookingSchema = z.object({
	serviceTitle: z
		.string()
		.min(1, 'Service selection is required'),
	customer: z
		.string()
		.min(1, 'Customer/Company name is required')
		.min(2, 'Customer name must be at least 2 characters'),
	vehiclePlate: z
		.string()
		.min(1, 'Vehicle plate number is required')
		.min(3, 'Enter a valid registration plate (e.g. T 452 DLK)'),
	date: z
		.string()
		.min(1, 'Booking date is required'),
	timeSlot: z
		.string()
		.min(1, 'Time slot is required')
		.default('09:00 AM - 10:30 AM'),
	notes: z
		.string()
		.optional()
		.default('')
});

export type BookingSchema = typeof bookingSchema;
export type BookingInput = z.infer<typeof bookingSchema>;
