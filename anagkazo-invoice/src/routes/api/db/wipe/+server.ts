import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { wipeAllDataFromDB } from '$lib/server/db';
import { verifySignedToken } from '$lib/server/security';

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		// Strict Admin Authorization Check
		const authHeader = request.headers.get('authorization');
		const authResult = verifySignedToken(authHeader);

		if (!authResult.valid || authResult.role !== 'admin') {
			return json(
				{
					success: false,
					error: 'Forbidden. Administrator authorization token required to execute database wipe.'
				},
				{ status: 403 }
			);
		}

		const success = await wipeAllDataFromDB(platform?.env);
		return json({
			success,
			message: success
				? 'All data (customers, products, invoices) wiped successfully from database. User credentials preserved.'
				: 'Partial or failed wipe operation.'
		});
	} catch (e: unknown) {
		const message = e instanceof Error ? e.message : 'Failed to wipe database';
		return json({ success: false, error: message }, { status: 500 });
	}
};
