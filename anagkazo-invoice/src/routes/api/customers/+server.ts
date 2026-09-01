import { json, type RequestHandler } from '@sveltejs/kit';
import {
	getAllCustomersFromDB,
	saveCustomerToDB,
	deleteCustomerFromDB,
	deleteAllCustomersFromDB
} from '$lib/server/db';
import type { Customer } from '$lib/types/customer';

export const GET: RequestHandler = async ({ platform }) => {
	try {
		const customers = await getAllCustomersFromDB(platform?.env);
		return json({ success: true, data: customers });
	} catch (err: any) {
		console.error('[API Customers] GET error:', err);
		return json({ success: false, error: err?.message || 'Failed to fetch customers' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const body = await request.json();
		const { customer, userRole } = body as { customer: Customer; userRole?: string };
		if (!customer || !customer.id || !customer.name) {
			return json({ success: false, error: 'Invalid customer payload' }, { status: 400 });
		}
		const ok = await saveCustomerToDB(customer, platform?.env, userRole || 'Admin');
		if (!ok) {
			return json({ success: false, error: 'Database write failed' }, { status: 500 });
		}
		return json({ success: true, message: 'Customer saved successfully' });
	} catch (err: any) {
		console.error('[API Customers] POST error:', err);
		return json({ success: false, error: err?.message || 'Failed to save customer' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ url, platform }) => {
	try {
		const isAll = url.searchParams.get('all') === 'true';
		const id = url.searchParams.get('id');

		if (isAll) {
			const ok = await deleteAllCustomersFromDB(platform?.env);
			return json({ success: ok });
		}

		if (!id) {
			return json({ success: false, error: 'Missing customer ID' }, { status: 400 });
		}

		const ok = await deleteCustomerFromDB(id, platform?.env);
		return json({ success: ok });
	} catch (err: any) {
		console.error('[API Customers] DELETE error:', err);
		return json({ success: false, error: err?.message || 'Failed to delete customer' }, { status: 500 });
	}
};
