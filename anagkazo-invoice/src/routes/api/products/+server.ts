import { json, type RequestHandler } from '@sveltejs/kit';
import {
	getAllProductsFromDB,
	saveProductToDB,
	deleteProductFromDB,
	deleteAllProductsFromDB
} from '$lib/server/db';
import type { TyreProductStock } from '$lib/data/mockData';

export const GET: RequestHandler = async ({ platform }) => {
	try {
		const products = await getAllProductsFromDB(platform?.env);
		return json({ success: true, data: products });
	} catch (err: any) {
		console.error('[API Products] GET error:', err);
		return json({ success: false, error: err?.message || 'Failed to fetch products' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, platform }) => {
	try {
		const body = await request.json();
		const { product, userRole } = body as { product: TyreProductStock; userRole?: string };
		if (!product || !product.id || !product.sku || !product.brand) {
			return json({ success: false, error: 'Invalid product payload' }, { status: 400 });
		}
		const ok = await saveProductToDB(product, platform?.env, userRole || 'Admin');
		if (!ok) {
			return json({ success: false, error: 'Database write failed' }, { status: 500 });
		}
		return json({ success: true, message: 'Product saved successfully' });
	} catch (err: any) {
		console.error('[API Products] POST error:', err);
		return json({ success: false, error: err?.message || 'Failed to save product' }, { status: 500 });
	}
};

export const DELETE: RequestHandler = async ({ url, platform }) => {
	try {
		const isAll = url.searchParams.get('all') === 'true';
		const id = url.searchParams.get('id');

		if (isAll) {
			const ok = await deleteAllProductsFromDB(platform?.env);
			return json({ success: ok });
		}

		if (!id) {
			return json({ success: false, error: 'Missing product ID' }, { status: 400 });
		}

		const ok = await deleteProductFromDB(id, platform?.env);
		return json({ success: ok });
	} catch (err: any) {
		console.error('[API Products] DELETE error:', err);
		return json({ success: false, error: err?.message || 'Failed to delete product' }, { status: 500 });
	}
};
