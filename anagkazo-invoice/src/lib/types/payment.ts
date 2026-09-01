export interface PaymentDetail {
	id: string;
	bankName: string;
	accountName: string;
	accountNumber: string;
	swiftCode?: string;
	branch?: string;
	currency: 'TZS' | 'USD';
	isDefault?: boolean;
	accountType?: 'Corporate Bank' | 'Commercial Bank' | 'Mobile Money / Till' | 'Escrow / Trust';
	notes?: string;
}
