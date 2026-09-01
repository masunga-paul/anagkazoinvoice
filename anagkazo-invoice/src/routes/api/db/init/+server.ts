import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { initializeNeonDatabase, sql } from '$lib/server/db';

export const GET: RequestHandler = async () => {
	try {
		await initializeNeonDatabase();

		const usersCount = await sql`
			SELECT COUNT(*)::int as count FROM anagkazo_users;
		`;

		return json({
			status: 'healthy',
			service: 'Anagkazo Invoice API',
			database: 'PostgreSQL Active',
			usersConfigured: (usersCount[0]?.count || 0) > 0,
			timestamp: new Date().toISOString()
		});
	} catch (err: unknown) {
		console.error('[API /db/init] Error:', err);
		return json(
			{ status: 'error', error: 'Database service unavailable' },
			{ status: 500 }
		);
	}
};
