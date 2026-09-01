import type { TyreProductStock } from '$lib/data/mockData';
import type { InvoiceItem } from '$lib/types/invoice';

/**
 * Finds a matching tyre stock record for a given invoice line item.
 */
export function findStockForItem(
	item: InvoiceItem,
	stocks: TyreProductStock[]
): TyreProductStock | undefined {
	if (!stocks || stocks.length === 0) return undefined;

	// 1. Direct ID match
	if (item.stockId) {
		const byId = stocks.find((s) => s.id === item.stockId);
		if (byId) return byId;
	}

	// 2. Direct SKU match
	if (item.sku) {
		const bySku = stocks.find((s) => s.sku.toUpperCase() === item.sku?.toUpperCase());
		if (bySku) return bySku;
	}

	// 3. Match SKU in description
	if (item.description) {
		const desc = item.description.toUpperCase();
		const bySkuInDesc = stocks.find((s) => s.sku && desc.includes(s.sku.toUpperCase()));
		if (bySkuInDesc) return bySkuInDesc;

		// 4. Fuzzy match Brand + Model or Brand + Size
		const descLower = item.description.toLowerCase();
		const byBrandSize = stocks.find((s) => {
			const brandMatch = s.brand && descLower.includes(s.brand.toLowerCase());
			const sizeMatch = s.size && descLower.includes(s.size.toLowerCase());
			const modelMatch = s.model && descLower.includes(s.model.toLowerCase());
			return (brandMatch && sizeMatch) || (brandMatch && modelMatch);
		});
		if (byBrandSize) return byBrandSize;
	}

	return undefined;
}

/**
 * Calculates total units of a stock item allocated in the current invoice items list.
 */
export function getAllocatedQuantity(
	stock: TyreProductStock,
	items: InvoiceItem[],
	excludeItemId?: string
): number {
	if (!items || items.length === 0) return 0;

	return items.reduce((sum, item) => {
		if (excludeItemId && item.id === excludeItemId) return sum;
		const matched = findStockForItem(item, [stock]);
		if (matched && (matched.id === stock.id || matched.sku === stock.sku)) {
			return sum + (Number(item.qty) || 0);
		}
		return sum;
	}, 0);
}

/**
 * Returns available warehouse stock after subtracting active invoice allocations.
 */
export function getEffectiveAvailableStock(
	stock: TyreProductStock,
	items: InvoiceItem[],
	excludeItemId?: string
): number {
	const allocated = getAllocatedQuantity(stock, items, excludeItemId);
	return Math.max(0, (stock.stockQuantity || 0) - allocated);
}

/**
 * Produces an array of stocks with real-time diminished quantities based on active invoice items.
 */
export function getEffectiveStocksList(
	masterStocks: TyreProductStock[],
	items: InvoiceItem[]
): TyreProductStock[] {
	if (!masterStocks) return [];

	return masterStocks.map((s) => {
		const remaining = getEffectiveAvailableStock(s, items);
		const reorder = s.reorderLevel || 10;
		return {
			...s,
			stockQuantity: remaining,
			status: remaining === 0 ? 'Out of Stock' : remaining <= reorder ? 'Low Stock' : 'In Stock'
		};
	});
}

/**
 * Returns the maximum permissible quantity for a specific line item row in the invoice.
 */
export function getMaxAvailableForLineItem(
	item: InvoiceItem,
	masterStocks: TyreProductStock[],
	items: InvoiceItem[]
): {
	stock?: TyreProductStock;
	maxQty: number;
	currentRemaining: number;
} {
	const matched = findStockForItem(item, masterStocks);
	if (!matched) {
		return { maxQty: 99999, currentRemaining: 99999 };
	}

	const otherAllocated = getAllocatedQuantity(matched, items, item.id);
	const currentRemaining = Math.max(0, (matched.stockQuantity || 0) - otherAllocated);

	return {
		stock: matched,
		maxQty: Math.max(0, currentRemaining),
		currentRemaining
	};
}
