import { browser } from '$app/environment';
import { broadcastSync } from './syncBus';
import {
	MOCK_CUSTOMERS,
	MOCK_TYRE_STOCKS,
	MOCK_RECENT_INVOICES,
	MOCK_PAYMENT_DETAILS,
	type TyreProductStock
} from '$lib/data/mockData';
import type { Customer } from '$lib/types/customer';
import type { InvoiceFormData } from '$lib/types/invoice';
import type { PaymentDetail } from '$lib/types/payment';
import type { StaffCredentials, AdminCredentials } from '$lib/types/auth';
import type { GeneratedInvoiceItem } from '$lib/components/reports/GeneratedInvoicesAudit.svelte';

const CUSTOMERS_STORAGE_KEY = 'anagkazo_fleet_customers';
const STOCKS_STORAGE_KEY = 'anagkazo_tyre_inventory';
const INVOICES_STORAGE_KEY = 'anagkazo_generated_invoices';
const DRAFT_INVOICE_STORAGE_KEY = 'anagkazo_active_draft_invoice';
const ACTIVE_TAB_STORAGE_KEY = 'anagkazo_active_nav_tab';
const PAYMENT_DETAILS_STORAGE_KEY = 'anagkazo_payment_details';
const STAFF_CREDENTIALS_STORAGE_KEY = 'anagkazo_staff_credentials';
const ADMIN_CREDENTIALS_STORAGE_KEY = 'anagkazo_admin_credentials';

export const DEFAULT_ADMIN_CREDENTIALS: AdminCredentials = {
	id: 'usr-admin-001',
	email: 'masungapaulmaganga@gmail.com',
	password: '',
	name: 'Masunga Paul Maganga',
	role: 'admin',
	department: 'Executive Management',
	title: 'Managing Director & Admin',
	avatarBg: 'from-navy-950 to-navy-800',
	initials: 'MP'
};

export const DEFAULT_STAFF_CREDENTIALS: StaffCredentials = {
	id: 'usr-std-002',
	email: 'bmaganga32@gmail.com',
	password: '123456789Brk',
	name: 'Baraka Maganga',
	role: 'standard_user',
	department: 'Sales & Workshop Operations',
	title: 'Sales & Invoicing Officer',
	avatarBg: 'from-sky-700 to-navy-900',
	initials: 'BM'
};


/**
 * Load persisted customers or fall back to initial mock data on first visit
 */
export function getStoredCustomers(): Customer[] {
	if (!browser) return [...MOCK_CUSTOMERS];
	try {
		const stored = localStorage.getItem(CUSTOMERS_STORAGE_KEY);
		if (stored !== null) {
			const parsed = JSON.parse(stored);
			if (Array.isArray(parsed)) {
				return parsed.map((c: any) => ({
					...c,
					status: (c.status === 'Active' ? (c.outstandingBalance > 0 ? 'Pending' : 'Paid') : c.status) as Customer['status']
				}));
			}
		}
	} catch (e) {
		console.warn('Failed to parse stored customers:', e);
	}
	const initial = [...MOCK_CUSTOMERS];
	saveStoredCustomers(initial);
	return initial;
}

/**
 * Save customers list to persistent storage & broadcast sync
 */
export function saveStoredCustomers(customers: Customer[], shouldBroadcast = true): void {
	if (!browser) return;
	try {
		localStorage.setItem(CUSTOMERS_STORAGE_KEY, JSON.stringify(customers));
		if (shouldBroadcast) {
			broadcastSync('CUSTOMERS_UPDATED', customers);
		}
	} catch (e) {
		console.error('Failed to save customers to localStorage:', e);
	}
}

/**
 * Load persisted tyre stock products or fall back to initial mock data on first visit
 */
export function getStoredStocks(): TyreProductStock[] {
	if (!browser) return [...MOCK_TYRE_STOCKS];
	try {
		const stored = localStorage.getItem(STOCKS_STORAGE_KEY);
		if (stored !== null) {
			const parsed = JSON.parse(stored);
			if (Array.isArray(parsed)) {
				return parsed;
			}
		}
	} catch (e) {
		console.warn('Failed to parse stored tyre stocks:', e);
	}
	const initial = [...MOCK_TYRE_STOCKS];
	saveStoredStocks(initial, false);
	return initial;
}

/**
 * Save tyre stock products to persistent storage & broadcast sync
 */
export function saveStoredStocks(stocks: TyreProductStock[], shouldBroadcast = true): void {
	if (!browser) return;
	try {
		localStorage.setItem(STOCKS_STORAGE_KEY, JSON.stringify(stocks));
		if (shouldBroadcast) {
			broadcastSync('STOCKS_UPDATED', stocks);
		}
	} catch (e) {
		console.error('Failed to save stocks to localStorage:', e);
	}
}

/**
 * Load persisted generated invoices or fall back to initial mock data on first visit
 */
export function getStoredInvoices(): GeneratedInvoiceItem[] {
	if (!browser) return [...MOCK_RECENT_INVOICES] as GeneratedInvoiceItem[];
	try {
		const stored = localStorage.getItem(INVOICES_STORAGE_KEY);
		if (stored !== null) {
			const parsed = JSON.parse(stored);
			if (Array.isArray(parsed)) {
				const enriched = parsed.map((inv: GeneratedInvoiceItem) => {
					const mockMatch = (MOCK_RECENT_INVOICES as GeneratedInvoiceItem[]).find((m) => m.id === inv.id);
					if (mockMatch && (!inv.items || inv.items.length === 0)) {
						return {
							...mockMatch,
							...inv,
							items: mockMatch.items,
							billingAddress: inv.billingAddress || mockMatch.billingAddress,
							notes: inv.notes || mockMatch.notes,
							dueDate: inv.dueDate || mockMatch.dueDate,
							paymentTerms: inv.paymentTerms || mockMatch.paymentTerms
						};
					}
					return inv;
				});
				return enriched;
			}
		}
	} catch (e) {
		console.warn('Failed to parse stored invoices:', e);
	}
	const initial = [...MOCK_RECENT_INVOICES] as GeneratedInvoiceItem[];
	saveStoredInvoices(initial, false);
	return initial;
}

/**
 * Save generated invoices to persistent storage & broadcast sync
 */
export function saveStoredInvoices(invoices: GeneratedInvoiceItem[], shouldBroadcast = true): void {
	if (!browser) return;
	try {
		localStorage.setItem(INVOICES_STORAGE_KEY, JSON.stringify(invoices));
		if (shouldBroadcast) {
			broadcastSync('INVOICES_UPDATED', invoices);
		}
	} catch (e) {
		console.error('Failed to save invoices to localStorage:', e);
	}
}

/**
 * Load persisted active invoice form draft
 */
export function getStoredDraftInvoice(): InvoiceFormData | null {
	if (!browser) return null;
	try {
		const stored = localStorage.getItem(DRAFT_INVOICE_STORAGE_KEY);
		if (stored !== null) {
			const parsed = JSON.parse(stored);
			if (parsed && typeof parsed === 'object' && Array.isArray(parsed.items)) {
				return parsed as InvoiceFormData;
			}
		}
	} catch (e) {
		console.warn('Failed to parse stored draft invoice:', e);
	}
	return null;
}

/**
 * Save active invoice form draft to persistent storage & broadcast sync
 */
export function saveStoredDraftInvoice(draft: InvoiceFormData | null, shouldBroadcast = true): void {
	if (!browser) return;
	try {
		if (draft === null) {
			localStorage.removeItem(DRAFT_INVOICE_STORAGE_KEY);
		} else {
			localStorage.setItem(DRAFT_INVOICE_STORAGE_KEY, JSON.stringify(draft));
		}
		if (shouldBroadcast) {
			broadcastSync('DRAFT_INVOICE_UPDATED', draft);
		}
	} catch (e) {
		console.error('Failed to save draft invoice to localStorage:', e);
	}
}

/**
 * Load persisted active navigation tab
 */
export function getStoredActiveTab(defaultTab: string = 'Invoices'): string {
	if (!browser) return defaultTab;
	try {
		const stored = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY);
		if (stored) {
			return stored;
		}
	} catch (e) {
		console.warn('Failed to read stored active tab:', e);
	}
	return defaultTab;
}

/**
 * Save active navigation tab
 */
export function saveStoredActiveTab(tab: string): void {
	if (!browser) return;
	try {
		localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, tab);
	} catch (e) {
		console.error('Failed to save active tab to localStorage:', e);
	}
}

/**
 * Load persisted payment details or fall back to initial mock data
 */
export function getStoredPaymentDetails(): PaymentDetail[] {
	if (!browser) return [...MOCK_PAYMENT_DETAILS];
	try {
		const stored = localStorage.getItem(PAYMENT_DETAILS_STORAGE_KEY);
		if (stored !== null) {
			const parsed = JSON.parse(stored);
			if (Array.isArray(parsed)) {
				return parsed;
			}
		}
	} catch (e) {
		console.warn('Failed to parse stored payment details:', e);
	}
	const initial = [...MOCK_PAYMENT_DETAILS];
	saveStoredPaymentDetails(initial, false);
	return initial;
}

/**
 * Save payment details list to persistent storage & broadcast sync
 */
export function saveStoredPaymentDetails(details: PaymentDetail[], shouldBroadcast = true): void {
	if (!browser) return;
	try {
		localStorage.setItem(PAYMENT_DETAILS_STORAGE_KEY, JSON.stringify(details));
		if (shouldBroadcast) {
			broadcastSync('PAYMENT_DETAILS_UPDATED', details);
		}
	} catch (e) {
		console.error('Failed to save payment details to localStorage:', e);
	}
}

/**
 * Load persisted staff login credentials or fall back to default seed credentials
 */
export function getStoredStaffCredentials(): StaffCredentials {
	if (!browser) return { ...DEFAULT_STAFF_CREDENTIALS };
	try {
		const stored = localStorage.getItem(STAFF_CREDENTIALS_STORAGE_KEY);
		if (stored !== null) {
			const parsed = JSON.parse(stored);
			if (parsed && typeof parsed === 'object' && parsed.email && parsed.password) {
				return {
					...DEFAULT_STAFF_CREDENTIALS,
					...parsed,
					email: String(parsed.email).trim().toLowerCase(),
					password: String(parsed.password).trim()
				};
			}
		}
	} catch (e) {
		console.warn('Failed to parse stored staff credentials:', e);
	}
	return { ...DEFAULT_STAFF_CREDENTIALS };
}

/**
 * Save updated staff login credentials (email & password), sync across tabs & backend
 */
export function saveStoredStaffCredentials(
	creds: Partial<StaffCredentials>,
	shouldBroadcast = true
): StaffCredentials {
	const current = getStoredStaffCredentials();
	const updated: StaffCredentials = {
		...current,
		...creds,
		email: (creds.email || current.email).trim().toLowerCase(),
		password: (creds.password || current.password).trim(),
		updatedAt: new Date().toISOString()
	};

	if (browser) {
		try {
			localStorage.setItem(STAFF_CREDENTIALS_STORAGE_KEY, JSON.stringify(updated));
			if (shouldBroadcast) {
				broadcastSync('STAFF_CREDENTIALS_UPDATED', updated);
			}

			// Proactively push update to backend server API endpoint with authorization token
			try {
				const authSessionStr = localStorage.getItem('anagkazo_neon_auth_session');
				const token = authSessionStr ? JSON.parse(authSessionStr)?.token : null;
				const headers: Record<string, string> = { 'Content-Type': 'application/json' };
				if (token) {
					headers['Authorization'] = `Bearer ${token}`;
				}
				fetch('/api/auth/update-staff', {
					method: 'POST',
					headers,
					body: JSON.stringify({
						email: updated.email,
						password: updated.password,
						name: updated.name,
						department: updated.department
					})
				}).catch((e) => console.warn('[Storage] Server sync update-staff notice:', e));
			} catch (e) {
				console.warn('[Storage] Could not attach auth token to update-staff request:', e);
			}
		} catch (e) {
			console.error('Failed to save staff credentials to localStorage:', e);
		}
	}
	return updated;
}

/**
 * Load persisted administrator login credentials or fall back to default administrator profile
 */
export function getStoredAdminCredentials(): AdminCredentials {
	if (!browser) return { ...DEFAULT_ADMIN_CREDENTIALS };
	try {
		const stored = localStorage.getItem(ADMIN_CREDENTIALS_STORAGE_KEY);
		if (stored !== null) {
			const parsed = JSON.parse(stored);
			if (parsed && typeof parsed === 'object' && parsed.email) {
				return {
					...DEFAULT_ADMIN_CREDENTIALS,
					...parsed,
					email: String(parsed.email).trim().toLowerCase()
				};
			}
		}
	} catch (e) {
		console.warn('Failed to parse stored admin credentials:', e);
	}
	return { ...DEFAULT_ADMIN_CREDENTIALS };
}

/**
 * Save updated administrator login credentials (email & password), sync across tabs & backend database
 */
export async function saveStoredAdminCredentials(
	creds: { email: string; password: string; name?: string; department?: string },
	shouldBroadcast = true
): Promise<AdminCredentials> {
	const current = getStoredAdminCredentials();
	const cleanEmail = creds.email.trim().toLowerCase();
	const cleanPass = creds.password.trim();
	const cleanName = (creds.name || current.name).trim();
	const cleanDept = (creds.department || current.department || 'Executive Management').trim();

	const updated: AdminCredentials = {
		...current,
		email: cleanEmail,
		name: cleanName,
		department: cleanDept,
		updatedAt: new Date().toISOString()
	};

	if (browser) {
		try {
			localStorage.setItem(ADMIN_CREDENTIALS_STORAGE_KEY, JSON.stringify(updated));

			// Push update to backend server API endpoint with authorization token
			const authSessionStr = localStorage.getItem('anagkazo_neon_auth_session');
			const token = authSessionStr ? JSON.parse(authSessionStr)?.token : null;
			const headers: Record<string, string> = { 'Content-Type': 'application/json' };
			if (token) {
				headers['Authorization'] = `Bearer ${token}`;
			}

			const res = await fetch('/api/auth/update-admin', {
				method: 'POST',
				headers,
				body: JSON.stringify({
					email: cleanEmail,
					password: cleanPass,
					name: cleanName,
					department: cleanDept
				})
			});

			if (!res.ok) {
				const errorData = await res.json().catch(() => ({}));
				throw new Error(errorData.error || `Server responded with status ${res.status}`);
			}

			if (shouldBroadcast) {
				broadcastSync('ADMIN_CREDENTIALS_UPDATED', updated);
			}
		} catch (e) {
			console.error('Failed to save admin credentials to database/localStorage:', e);
			throw e;
		}
	}
	return updated;
}

/**
 * Wipes all customers, products/stocks, invoices, payment details, and draft invoice from system storage,

 * calls the database wipe API, and broadcasts ALL_SYNC across all browser windows.
 * User login credentials (Admin and Staff) are preserved intact.
 */
export function wipeAllSystemData(): void {
	if (!browser) return;
	try {
		saveStoredCustomers([], false);
		saveStoredStocks([], false);
		saveStoredInvoices([], false);
		saveStoredPaymentDetails([], false);
		saveStoredDraftInvoice(null);

		// Proactively trigger server database wipe with admin authorization token
		try {
			const authSessionStr = localStorage.getItem('anagkazo_neon_auth_session');
			const token = authSessionStr ? JSON.parse(authSessionStr)?.token : null;
			const headers: Record<string, string> = {};
			if (token) {
				headers['Authorization'] = `Bearer ${token}`;
			}
			fetch('/api/db/wipe', { method: 'POST', headers }).catch((e) =>
				console.warn('[Storage] Server db wipe notice:', e)
			);
		} catch (e) {
			console.warn('[Storage] Could not attach auth token to wipe request:', e);
		}

		// Broadcast ALL_SYNC to update all active browser windows & tabs in real time
		broadcastSync('ALL_SYNC', null);
	} catch (e) {
		console.error('Failed to wipe all system data:', e);
	}
}


