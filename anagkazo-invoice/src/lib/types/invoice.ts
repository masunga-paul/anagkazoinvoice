import type { PaymentDetail } from './payment';

export interface InvoiceItem {
	id: string;
	description: string;
	qty: number;
	unitPrice: number;
	stockId?: string;
	sku?: string;
}

export type InvoiceStatus = 'Paid' | 'Pending' | 'Overdue';

export interface InvoiceFormData {
	invoiceNumber: string;
	customerName: string;
	billingAddress: string;
	issueDate: string;
	dueDate: string;
	paymentTerms: string;
	status: InvoiceStatus;
	items: InvoiceItem[];
	discount: number;
	taxRate: number; // e.g. 18 for Tanzania VAT
	notes: string;
	paymentDetailId?: string;
	paymentDetail?: PaymentDetail;
	createdAt?: string;
	updatedAt?: string;
	createdBy?: string;
}

export interface CompanyDetails {
	name: string;
	tagline: string;
	address: string;
	city: string;
	country: string;
	phone: string;
	email: string;
	tin: string;
	vrn: string;
	bankName: string;
	accountName: string;
	accountNumber: string;
	branch: string;
	swiftCode: string;
}
