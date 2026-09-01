import type { CompanyDetails, InvoiceFormData } from '$lib/types/invoice';

/**
 * Format a number into Tanzanian Shilling currency representation: e.g. "TZS 1,500,000"
 */
export function formatTZS(amount: number | null | undefined): string {
	const val = amount == null || isNaN(amount) ? 0 : amount;
	const formatted = new Intl.NumberFormat('en-TZ', {
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(val);
	return `TZS ${formatted}`;
}

/**
 * Format pure integer with thousand separators (without currency prefix)
 */
export function formatNumber(amount: number | null | undefined): string {
	const val = amount == null || isNaN(amount) ? 0 : amount;
	return new Intl.NumberFormat('en-US', {
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(val);
}

/**
 * Format date string (YYYY-MM-DD) into display format (e.g. "29 January 2026")
 */
export function formatDisplayDate(dateStr: string): string {
	if (!dateStr) return '—';
	try {
		const parts = dateStr.split('-');
		if (parts.length === 3) {
			const year = parseInt(parts[0], 10);
			const month = parseInt(parts[1], 10) - 1;
			const day = parseInt(parts[2], 10);
			const date = new Date(year, month, day);
			return new Intl.DateTimeFormat('en-GB', {
				day: 'numeric',
				month: 'long',
				year: 'numeric'
			}).format(date);
		}
		const d = new Date(dateStr);
		if (isNaN(d.getTime())) return dateStr;
		return new Intl.DateTimeFormat('en-GB', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		}).format(d);
	} catch {
		return dateStr;
	}
}

/**
 * Generate a unique random ID for items
 */
export function generateId(): string {
	return 'item_' + Math.random().toString(36).substring(2, 9);
}

/**
 * Default company information for Anagkazo Autopart
 */
export const COMPANY_INFO: CompanyDetails = {
	name: 'Anagkazo Autopart',
	tagline: 'Premium Car & Commercial Truck Tyres Specialist',
	address: 'Kariakoo, P.O. Box 4854',
	city: 'Dar es Salaam',
	country: 'Tanzania',
	phone: '+255 752 565 372 / +255 623 697 262',
	email: 'anagkazolimitedcompany@gmail.com',
	tin: '188-458-408',
	vrn: '40-028491-Z',
	bankName: 'CRDB Bank PLC',
	accountName: 'Anagikazo Tyre Company',
	accountNumber: '0150843114900',
	branch: 'Kariakoo Branch',
	swiftCode: 'CORUTZTZ'
};


/**
 * Today's date in YYYY-MM-DD
 */
export function getTodayDateStr(): string {
	const today = new Date();
	return today.toISOString().split('T')[0];
}

/**
 * Date N days from today or from a given date string in YYYY-MM-DD
 */
export function getFutureDateStr(days: number, fromDateStr?: string): string {
	const d = fromDateStr ? new Date(fromDateStr) : new Date();
	d.setDate(d.getDate() + days);
	return d.toISOString().split('T')[0];
}

/**
 * Initial tyre stock sample data matching reference layout & tyre industry
 */
export const INITIAL_INVOICE_DATA: InvoiceFormData = {
	invoiceNumber: 'INV-2026-0842',
	customerName: 'Tanzania Safari Logistics Ltd',
	billingAddress: 'Samora Avenue, Clock Tower Roundabout, P.O. Box 4521, Dar es Salaam, Tanzania',
	issueDate: '2026-01-29',
	dueDate: '2026-02-12',
	paymentTerms: 'Net 14',
	status: 'Pending',
	items: [
		{
			id: 'item_1',
			description: 'Michelin 265/65R17 Primacy SUV Tyre (All-Terrain)',
			qty: 10,
			unitPrice: 750000
		},
		{
			id: 'item_2',
			description: 'Bridgestone Dueler A/T 275/70R16 Heavy Duty Land Cruiser Tyre',
			qty: 8,
			unitPrice: 625000
		},
		{
			id: 'item_3',
			description: 'Precision Laser 3D Wheel Alignment & Dynamic Wheel Balancing',
			qty: 4,
			unitPrice: 125000
		}
	],
	discount: 500000,
	taxRate: 18,
	notes: 'Thank you for your business! Please complete the payment before the due date. For any technical warranty questions or fitment assistance, feel free to contact us at sales@anagkazo.co.tz.'
};

/**
 * Alternate sample presets for quick demos
 */
export const PRESETS = [
	{
		label: 'Heavy Commercial Fleet Tyres',
		data: {
			invoiceNumber: 'INV-2026-0914',
			customerName: 'Bakhresa Transport & Haulage Ltd',
			billingAddress: 'Tazara Industrial Zone, Mandela Road, P.O. Box 2517, Dar es Salaam',
			issueDate: '2026-02-01',
			dueDate: '2026-02-15',
			paymentTerms: 'Net 14',
			status: 'Paid' as const,
			items: [
				{
					id: 'item_p1',
					description: 'Pirelli 315/80R22.5 FH01 Steer Axle Commercial Truck Tyre',
					qty: 12,
					unitPrice: 1280000
				},
				{
					id: 'item_p2',
					description: 'Goodyear 315/80R22.5 KMAX D Drive Axle Radial Tyre',
					qty: 16,
					unitPrice: 1350000
				},
				{
					id: 'item_p3',
					description: 'Heavy Truck Nitrogen Inflation & Rim Bead Inspection Service',
					qty: 28,
					unitPrice: 35000
				}
			],
			discount: 1200000,
			taxRate: 18,
			notes: 'Authorized Fleet Warranty applied. Payment payable directly to CRDB Bank account.'
		}
	},
	{
		label: 'Executive SUV & Saloon Tyres',
		data: {
			invoiceNumber: 'INV-2026-1052',
			customerName: 'Kilimanjaro Mining & Exploration Ltd',
			billingAddress: 'Ali Hassan Mwinyi Road, Oysterbay, Dar es Salaam, Tanzania',
			issueDate: '2026-02-15',
			dueDate: '2026-02-15',
			paymentTerms: 'Due on Receipt',
			status: 'Overdue' as const,
			items: [
				{
					id: 'item_e1',
					description: 'Continental CrossContact 285/60R18 (V8 Fleet Spec)',
					qty: 4,
					unitPrice: 890000
				},
				{
					id: 'item_e2',
					description: 'Dunlop Grandtrek AT5 265/65R17 High-Traction Tubeless',
					qty: 4,
					unitPrice: 580000
				}
			],
			discount: 250000,
			taxRate: 18,
			notes: 'Goods once inspected and delivered carry a 24-month manufacturer defect warranty.'
		}
	}
];

