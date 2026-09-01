import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { authenticateWithNeonDB } from '$lib/server/db';
import { checkRateLimit, resetRateLimit } from '$lib/server/security';

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';
		const body = await request.json();
		const rawEmail = body?.email;
		const rawPassword = body?.password;

		if (!rawEmail || typeof rawEmail !== 'string' || !rawPassword || typeof rawPassword !== 'string') {
			return json(
				{ success: false, error: 'Valid email and password are required.' },
				{ status: 400 }
			);
		}

		const email = rawEmail.trim().toLowerCase();
		const password = rawPassword.trim();

		// Basic length sanity limits
		if (email.length > 255 || password.length > 255) {
			return json(
				{ success: false, error: 'Input exceeds permissible character length.' },
				{ status: 400 }
			);
		}

		// Rate limiting per IP + email
		const rateKey = `${ip}:${email}`;
		const { allowed, retryAfterSeconds } = checkRateLimit(rateKey, 6, 15 * 60 * 1000);
		if (!allowed) {
			return json(
				{
					success: false,
					error: `Too many login attempts. Account temporarily locked for security. Please try again in ${retryAfterSeconds} seconds.`
				},
				{
					status: 429,
					headers: { 'Retry-After': String(retryAfterSeconds) }
				}
			);
		}

		const user = await authenticateWithNeonDB(email, password, platform?.env);

		if (!user) {
			return json(
				{ success: false, error: 'Invalid email or password. Please verify your credentials.' },
				{ status: 401 }
			);
		}

		// Reset rate limit counter on successful login
		resetRateLimit(rateKey);

		return json({
			success: true,
			user,
			message: `Successfully authenticated as ${user.name} (${user.role === 'admin' ? 'Administrator' : 'Standard User'}).`
		});
	} catch (err: unknown) {
		console.error('[API /auth/login] Error:', err);
		const message = err instanceof Error ? err.message : 'Database authentication failure.';
		return json(
			{ success: false, error: message },
			{ status: 500 }
		);
	}
};
