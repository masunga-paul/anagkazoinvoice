import { json, type RequestHandler } from '@sveltejs/kit';
import {
	getAllPaymentDetailsFromDB,
	savePaymentDetailToDB,
	deletePaymentDetailFromDB
} from '$lib/server/db';
import type { PaymentDetail } from '$lib/types/payment';

export const GET: RequestHandler = async ({ platform }) => {
	try {
		const paymentDetails = await getAllPaymentDetailsFromDB(platform?.env);
		return json({ success: true, data: paymentDetails });
	} catch (err: any) {
		console.error('[API PaymentDetails] GET error:', err);
		return json({ success: false, error: err?.message || 'Failed to fetch payment details' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const body = await request.json();
		const { paymentDetail } = body as { paymentDetail: PaymentDetail };
		if (!paymentDetail || !paymentDetail.id || !paymentDetail.bankName) {
			return json({ success: false, error: 'Invalid payment detail payload' }, { status: 400 });
		}
		const ok = await savePaymentDetailToDB(paymentDetail, platform?.env);
		if (!ok) {
			return json({ success: false, error: 'Database write failed' }, { status: 500 });
		}
		return json({ success: true, message: 'Payment detail saved successfully' });
	} catch (err: any) {
		console.error('[API PaymentDetails] POST error:', err);
		return json({ success: false, error: err?.message || 'Failed to save payment detail' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ url, platform }) => {
	try {
		const id = url.searchParams.get('id');
		if (!id) {
			return json({ success: false, error: 'Missing payment detail ID' }, { status: 400 });
		}
		const ok = await deletePaymentDetailFromDB(id, platform?.env);
		return json({ success: ok });
	} catch (err: any) {
		console.error('[API PaymentDetails] DELETE error:', err);
		return json({ success: false, error: err?.message || 'Failed to delete payment detail' }, { status: 500 });
	}
};
