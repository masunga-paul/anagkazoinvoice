import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updateStaffCredentialsInDB } from '$lib/server/db';
import { verifySignedToken } from '$lib/server/security';

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Verify Administrator authorization token
		const authHeader = request.headers.get('authorization');
		const authResult = verifySignedToken(authHeader);

		if (!authResult.valid || authResult.role !== 'admin') {
			return json(
				{
					success: false,
					error: 'Unauthorized. Administrator authentication required to update staff credentials.'
				},
				{ status: 403 }
			);
		}

		const body = await request.json();
		const rawEmail = body?.email;
		const rawPassword = body?.password;
		const rawName = body?.name;
		const rawDept = body?.department;

		if (!rawEmail || typeof rawEmail !== 'string' || !rawPassword || typeof rawPassword !== 'string') {
			return json(
				{ success: false, error: 'Valid email and password are required.' },
				{ status: 400 }
			);
		}

		const email = rawEmail.trim().toLowerCase();
		const password = rawPassword.trim();
		const name = typeof rawName === 'string' ? rawName.trim().slice(0, 100) : 'Baraka Maganga';
		const department = typeof rawDept === 'string' ? rawDept.trim().slice(0, 100) : 'Sales & Workshop Operations';

		// Input validation
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			return json(
				{ success: false, error: 'Invalid email address format.' },
				{ status: 400 }
			);
		}

		if (password.length < 6) {
			return json(
				{ success: false, error: 'Staff password must be at least 6 characters long.' },
				{ status: 400 }
			);
		}

		const user = await updateStaffCredentialsInDB(email, password, name, department);

		return json({
			success: true,
			user,
			message: 'Staff login credentials updated successfully in database.'
		});
	} catch (err: unknown) {
		console.error('[API /auth/update-staff] Error:', err);
		const message = err instanceof Error ? err.message : 'Database error updating staff credentials.';
		return json(
			{ success: false, error: message },
			{ status: 500 }
		);
	}
};
