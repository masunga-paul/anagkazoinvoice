import { json, type RequestHandler } from '@sveltejs/kit';
import {
	getAllInvoicesFromDB,
	saveInvoiceToDB,
	deleteInvoiceFromDB,
	deleteAllInvoicesFromDB
} from '$lib/server/db';
import type { GeneratedInvoiceItem } from '$lib/components/reports/GeneratedInvoicesAudit.svelte';

export const GET: RequestHandler = async ({ platform }) => {
	try {
		const invoices = await getAllInvoicesFromDB(platform?.env);
		return json({ success: true, data: invoices });
	} catch (err: any) {
		console.error('[API Invoices] GET error:', err);
		return json({ success: false, error: err?.message || 'Failed to fetch invoices' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const body = await request.json();
		const { invoice, userRole } = body as { invoice: GeneratedInvoiceItem; userRole?: string };
		if (!invoice || !invoice.id || !invoice.customer) {
			return json({ success: false, error: 'Invalid invoice payload' }, { status: 400 });
		}
		const ok = await saveInvoiceToDB(invoice, platform?.env, userRole || 'Staff');
		if (!ok) {
			return json({ success: false, error: 'Database write failed' }, { status: 500 });
		}
		return json({ success: true, message: 'Invoice saved successfully' });
	} catch (err: any) {
		console.error('[API Invoices] POST error:', err);
		return json({ success: false, error: err?.message || 'Failed to save invoice' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ url, platform }) => {
	try {
		const isAll = url.searchParams.get('all') === 'true';
		const id = url.searchParams.get('id');

		if (isAll) {
			const ok = await deleteAllInvoicesFromDB(platform?.env);
			return json({ success: ok });
		}

		if (!id) {
			return json({ success: false, error: 'Missing invoice ID' }, { status: 400 });
		}

		const ok = await deleteInvoiceFromDB(id, platform?.env);
		return json({ success: ok });
	} catch (err: any) {
		console.error('[API Invoices] DELETE error:', err);
		return json({ success: false, error: err?.message || 'Failed to delete invoice' }, { status: 500 });
	}
};
