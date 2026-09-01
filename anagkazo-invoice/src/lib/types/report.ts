export interface MonthlyRevenue {
	month: string;
	shortMonth: string;
	revenue: number; // in TZS
	target: number; // in TZS
	invoicesCount: number;
}

export interface BrandShare {
	brand: string;
	percentage: number;
	unitsSold: number;
	revenueTZS: number;
	color: string;
}

export interface TopProduct {
	name: string;
	category: string;
	unitsSold: number;
	revenueTZS: number;
	trend: string;
}

export interface InvoiceStatusMetric {
	status: 'Paid' | 'Pending' | 'Overdue' | 'Draft';
	count: number;
	totalAmountTZS: number;
	percentage: number;
	color: string;
}
