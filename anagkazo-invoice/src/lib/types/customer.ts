export type CustomerType = 'Fleet & Logistics' | 'Corporate' | 'Retail / Private' | 'Government / NGO';

export interface Customer {
	id: string;
	name: string;
	companyName?: string;
	contactPerson: string;
	email: string;
	phone: string;
	address: string;
	city: string;
	customerType: CustomerType;
	totalPurchases: number; // in TZS
	outstandingBalance: number; // in TZS
	invoicesCount: number;
	creditLimit: number; // in TZS
	paymentTerms: string;
	tin?: string;
	status: 'Paid' | 'Pending' | 'Overdue';
	createdAt?: string;
	updatedAt?: string;
	createdBy?: string;
}
