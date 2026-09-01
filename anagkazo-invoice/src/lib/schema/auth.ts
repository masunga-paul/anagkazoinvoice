import { z } from 'zod';

export const loginSchema = z.object({
	email: z
		.string()
		.min(1, 'Email address is required')
		.email('Please enter a valid email address (e.g. user@anagkazo.co.tz)'),
	password: z
		.string()
		.min(1, 'Password is required')
		.min(6, 'Password must contain at least 6 characters')
});

export type LoginSchema = typeof loginSchema;
export type LoginInput = z.infer<typeof loginSchema>;
