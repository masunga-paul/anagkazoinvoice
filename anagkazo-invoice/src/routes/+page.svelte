<script lang="ts">
	import { onMount } from 'svelte';
	import Navbar from '$lib/components/Navbar.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import PageHeader from '$lib/components/PageHeader.svelte';
	import InvoiceForm from '$lib/components/InvoiceForm.svelte';
	import InvoicePreview from '$lib/components/InvoicePreview.svelte';
	import DashboardSection from '$lib/components/dashboard/DashboardSection.svelte';
	import CustomersSection from '$lib/components/customers/CustomersSection.svelte';
	import ServicesSection from '$lib/components/services/ServicesSection.svelte';
	import ReportsSection from '$lib/components/reports/ReportsSection.svelte';
	import PaymentDetailsManager from '$lib/components/payment/PaymentDetailsManager.svelte';
	import StaffCredentialsModal from '$lib/components/admin/StaffCredentialsModal.svelte';
	import LoginModal from '$lib/components/auth/LoginModal.svelte';
	import AuthGateway from '$lib/components/auth/AuthGateway.svelte';
	import Toast, { type FlashAction } from '$lib/components/Toast.svelte';

	import type { InvoiceFormData, InvoiceStatus, InvoiceItem } from '$lib/types/invoice';
	import type { Customer } from '$lib/types/customer';
	import type { WorkshopService } from '$lib/types/service';
	import type { User, AdminCredentials } from '$lib/types/auth';
	import type { PaymentDetail } from '$lib/types/payment';
	import type { GeneratedInvoiceItem } from '$lib/components/reports/GeneratedInvoicesAudit.svelte';
	import { MOCK_RECENT_INVOICES, MOCK_CUSTOMERS, MOCK_TYRE_STOCKS, MOCK_PAYMENT_DETAILS, type TyreProductStock } from '$lib/data/mockData';
	import {
		getStoredCustomers,
		saveStoredCustomers,
		fetchRemoteCustomers,
		syncSingleCustomer,
		deleteRemoteCustomer,
		deleteAllRemoteCustomers,
		getStoredStocks,
		saveStoredStocks,
		fetchRemoteProducts,
		syncSingleProduct,
		deleteRemoteProduct,
		deleteAllRemoteProducts,
		getStoredInvoices,
		saveStoredInvoices,
		fetchRemoteInvoices,
		syncSingleInvoice,
		deleteRemoteInvoice,
		deleteAllRemoteInvoices,
		getStoredDraftInvoice,
		saveStoredDraftInvoice,
		getStoredActiveTab,
		saveStoredActiveTab,
		getStoredPaymentDetails,
		saveStoredPaymentDetails,
		fetchRemotePaymentDetails,
		syncSinglePaymentDetail,
		deleteRemotePaymentDetail,
		getStoredStaffCredentials,
		saveStoredStaffCredentials,
		DEFAULT_STAFF_CREDENTIALS,
		getStoredAdminCredentials,
		saveStoredAdminCredentials,
		DEFAULT_ADMIN_CREDENTIALS
	} from '$lib/utils/storage';
	import { subscribeToSync, broadcastSync } from '$lib/utils/syncBus';
	import { invoiceSchema } from '$lib/schema/invoice';
	import { INITIAL_INVOICE_DATA, formatTZS, generateId, getTodayDateStr, getFutureDateStr } from '$lib/utils/format';
	import { getAllocatedQuantity } from '$lib/utils/inventory';
	import { downloadInvoicePDF } from '$lib/utils/pdf';
	import { getStoredSession, logoutFromNeon } from '$lib/auth/neonAuth';
	import { CheckCircle2, Send, X, FileText, Download, ShieldAlert, LogIn, Lock } from 'lucide-svelte';

	// Neon Authenticated User State
	const initialSession = getStoredSession();
	let currentUser = $state<User | null>(initialSession);
	let isLoginModalOpen = $state(false);
	let isStaffCredentialsModalOpen = $state(false);
	let isHydrated = $state(false);

	// Shared Application Inventory, Invoices & Banking State (Synchronized across all roles & sessions)
	let invoicesList = $state<GeneratedInvoiceItem[]>(getStoredInvoices());
	let customersList = $state<Customer[]>(getStoredCustomers());
	let tyreStocksList = $state<TyreProductStock[]>(getStoredStocks());
	let paymentDetailsList = $state<PaymentDetail[]>(getStoredPaymentDetails());

	// Svelte 5 Active Section State (persisted across manual page refreshes)
	let currentTab = $state<string>(
		getStoredActiveTab(initialSession?.role === 'admin' ? 'Dashboard' : 'Invoices')
	);

	// Svelte 5 State Rune for Form Data
	let formData = $state<InvoiceFormData>(JSON.parse(JSON.stringify(INITIAL_INVOICE_DATA)));

	// Auto-persist updates to localStorage ONLY after client hydration
	$effect(() => {
		if (isHydrated) {
			saveStoredCustomers(customersList);
		}
	});
	$effect(() => {
		if (isHydrated) {
			saveStoredStocks(tyreStocksList);
		}
	});
	$effect(() => {
		if (isHydrated) {
			saveStoredInvoices(invoicesList);
		}
	});
	$effect(() => {
		if (isHydrated) {
			saveStoredPaymentDetails(paymentDetailsList);
		}
	});
	$effect(() => {
		if (isHydrated) {
			saveStoredDraftInvoice(formData);
		}
	});

	// Persist active tab changes
	$effect(() => {
		if (isHydrated && currentUser && currentTab) {
			saveStoredActiveTab(currentTab);
		}
	});

	// Verify and restore on mount (client-side hydration & real-time sync)
	onMount(() => {
		const restoredUser = getStoredSession();
		if (restoredUser) {
			if (restoredUser.role === 'standard_user') {
				const currentStaff = getStoredStaffCredentials();
				if (restoredUser.email.toLowerCase().trim() !== currentStaff.email.toLowerCase().trim()) {
					logoutFromNeon();
					currentUser = null;
					currentTab = 'Invoices';
					saveStoredActiveTab('Invoices');
					isLoginModalOpen = true;
					showToast(
						'Your login credentials were changed by the Administrator. Please sign in with your updated email & password.',
						'error',
						'AUTH',
						'Session Expired'
					);
				} else {
					currentUser = restoredUser;
					const defaultTab = 'Invoices';
					const storedTab = getStoredActiveTab(defaultTab);
					currentTab = storedTab === 'Dashboard' || storedTab === 'Reports' ? 'Invoices' : storedTab;
				}
			} else if (restoredUser.role === 'admin') {
				const currentAdmin = getStoredAdminCredentials();
				if (currentAdmin.email && restoredUser.email.toLowerCase().trim() !== currentAdmin.email.toLowerCase().trim()) {
					logoutFromNeon();
					currentUser = null;
					currentTab = 'Invoices';
					saveStoredActiveTab('Invoices');
					isLoginModalOpen = true;
					showToast(
						'Administrator login credentials have changed. Please log in with your updated email & password.',
						'info',
						'AUTH',
						'Re-Authentication Required'
					);
				} else {
					currentUser = restoredUser;
					const defaultTab = 'Dashboard';
					const storedTab = getStoredActiveTab(defaultTab);
					currentTab = storedTab;
				}
			} else {
				currentUser = restoredUser;
				const defaultTab = 'Invoices';
				const storedTab = getStoredActiveTab(defaultTab);
				currentTab = storedTab;
			}
		}

		// Re-hydrate stored data arrays so refresh NEVER reverts to initial mock data
		customersList = getStoredCustomers();
		tyreStocksList = getStoredStocks();
		invoicesList = getStoredInvoices();
		paymentDetailsList = getStoredPaymentDetails();
		const savedDraft = getStoredDraftInvoice();
		if (savedDraft && savedDraft.items && savedDraft.items.length > 0) {
			formData = savedDraft;
		}
		isHydrated = true;

		// Fetch live Neon PostgreSQL records asynchronously to ensure cross-device consistency
		fetchRemoteCustomers().then((c) => {
			if (c && Array.isArray(c)) customersList = c;
		});
		fetchRemoteProducts().then((p) => {
			if (p && Array.isArray(p)) tyreStocksList = p;
		});
		fetchRemoteInvoices().then((i) => {
			if (i && Array.isArray(i)) invoicesList = i;
		});
		fetchRemotePaymentDetails().then((d) => {
			if (d && Array.isArray(d)) paymentDetailsList = d;
		});

		// Subscribe to sync bus across tabs
		const unsubscribeSync = subscribeToSync((message) => {
			if (message.type === 'CUSTOMERS_UPDATED') {
				const latestCustomers = Array.isArray(message.payload) ? message.payload : getStoredCustomers();
				customersList = latestCustomers;

				if (formData.customerName) {
					const matched = latestCustomers.find(
						(c: Customer) =>
							(c.companyName && c.companyName.trim().toLowerCase() === formData.customerName.trim().toLowerCase()) ||
							c.name.trim().toLowerCase() === formData.customerName.trim().toLowerCase()
					);
					if (matched) {
						formData.billingAddress = `${matched.address}, ${matched.city}, Tanzania (Tel: ${matched.phone})`;
						if (matched.paymentTerms) {
							formData.paymentTerms = matched.paymentTerms;
						}
					}
				}
			} else if (message.type === 'STOCKS_UPDATED') {
				tyreStocksList = Array.isArray(message.payload) ? message.payload : getStoredStocks();
			} else if (message.type === 'INVOICES_UPDATED') {
				invoicesList = Array.isArray(message.payload) ? message.payload : getStoredInvoices();
			} else if (message.type === 'PAYMENT_DETAILS_UPDATED') {
				paymentDetailsList = Array.isArray(message.payload) ? message.payload : getStoredPaymentDetails();
			} else if (message.type === 'DRAFT_INVOICE_UPDATED') {
				if (message.payload) {
					formData = message.payload;
				}
			} else if (message.type === 'STAFF_CREDENTIALS_UPDATED') {
				if (currentUser && currentUser.role === 'standard_user') {
					logoutFromNeon();
					currentUser = null;
					currentTab = 'Invoices';
					saveStoredActiveTab('Invoices');
					isLoginModalOpen = true;
					showToast(
						'Your staff login credentials (email or password) were updated by the Administrator. You have been logged out. Please sign in with your updated credentials.',
						'error',
						'AUTH',
						'Session Expired'
					);
				}
			} else if (message.type === 'ADMIN_CREDENTIALS_UPDATED') {
				if (currentUser && currentUser.role === 'admin') {
					logoutFromNeon();
					currentUser = null;
					currentTab = 'Invoices';
					saveStoredActiveTab('Invoices');
					isLoginModalOpen = true;
					showToast(
						'Your administrator credentials were updated. You have been logged out. Please sign in with your new email and password.',
						'info',
						'AUTH',
						'Session Terminated'
					);
				}
			} else if (message.type === 'ALL_SYNC') {
				customersList = getStoredCustomers();
				tyreStocksList = getStoredStocks();
				invoicesList = getStoredInvoices();
				paymentDetailsList = getStoredPaymentDetails();
			}
		});

		return () => {
			unsubscribeSync();
		};
	});

	// Initial tab routing based on role
	$effect(() => {
		if (currentUser && currentUser.role === 'standard_user') {
			if (currentTab === 'Dashboard' || currentTab === 'Reports') {
				currentTab = 'Invoices';
			}
		}
	});

	// Validation Errors State
	let formErrors = $state<Record<string, string>>({});

	// Flash Toast Notification State
	let toastVisible = $state(false);
	let toastMessage = $state('');
	let toastTitle = $state<string | undefined>(undefined);
	let toastAction = $state<FlashAction>('SUCCESS');
	let toastType = $state<'success' | 'error' | 'info'>('success');
	let toastTimer: ReturnType<typeof setTimeout> | null = null;

	// Send Confirmation Modal State
	let showSendModal = $state(false);

	function showToast(
		message: string,
		type: 'success' | 'error' | 'info' = 'success',
		action?: FlashAction,
		title?: string
	) {
		if (toastTimer) clearTimeout(toastTimer);
		toastMessage = message;
		toastType = type;
		toastAction = action || (type === 'error' ? 'ERROR' : 'SUCCESS');
		toastTitle = title;
		toastVisible = true;
		toastTimer = setTimeout(() => {
			toastVisible = false;
		}, 4000);
	}

	// Login Success Handler
	function handleLoginSuccess(user: User) {
		currentUser = user;
		customersList = getStoredCustomers();
		tyreStocksList = getStoredStocks();
		invoicesList = getStoredInvoices();

		// When admin logs in, take them directly to Dashboard. When staff logs in, take them to Invoices.
		if (user.role === 'admin') {
			currentTab = 'Dashboard';
		} else {
			currentTab = 'Invoices';
		}
		saveStoredActiveTab(currentTab);

		if (user.role === 'admin') {
			showToast(`Welcome back, ${user.name}! Admin dashboard & analytics unlocked.`, 'success', 'SUCCESS', 'Authenticated');
		} else {
			showToast(`Welcome, ${user.name}! Invoicing, customer directory, and products catalog active.`, 'success', 'SUCCESS', 'Authenticated');
		}
	}

	// Logout Handler
	function handleLogout() {
		logoutFromNeon();
		currentUser = null;
		currentTab = 'Invoices';
		saveStoredActiveTab('Invoices');
		showToast('Signed out of user session successfully.', 'info', 'INFO', 'Session Ended');
	}

	// Handler for when Admin credentials are changed in Security Credentials Modal
	function handleAdminCredentialsSaved(updated: AdminCredentials) {
		logoutFromNeon();
		currentUser = null;
		currentTab = 'Invoices';
		saveStoredActiveTab('Invoices');
		isLoginModalOpen = true;
		showToast(
			`Administrator credentials successfully updated to ${updated.email}. You have been logged out. Please sign in with your new email and password.`,
			'success',
			'AUTH',
			'Credentials Updated'
		);
	}


	// Validate with Zod
	function validateForm(): boolean {
		const result = invoiceSchema.safeParse(formData);
		if (!result.success) {
			const errors: Record<string, string> = {};
			for (const issue of result.error.issues) {
				const path = issue.path.join('.');
				errors[path] = issue.message;
			}
			formErrors = errors;
			return false;
		}
		formErrors = {};
		return true;
	}

	// Action: Quick Status Switcher (Paid / Pending / Overdue)
	function handleStatusChange(newStatus: InvoiceStatus) {
		formData.status = newStatus;
		syncInvoiceWithCustomer(formData, newStatus, false);
		showToast(
			`Switched status to "${newStatus}"! Customer "${formData.customerName || 'records'}" updated in real time.`,
			newStatus === 'Paid' ? 'success' : newStatus === 'Overdue' ? 'error' : 'info',
			'UPDATE',
			'Status Updated'
		);
	}

	// Action: Save / Update Invoice, Sync Customer Dashboard, & Reset Form for New Invoices
	function handleSaveAndUpdateInvoice() {
		const isValid = validateForm();
		if (!isValid) {
			showToast('Please fix required fields before updating the invoice.', 'error', 'ERROR', 'Validation Failed');
			return;
		}
		const savedInvoiceNumber = formData.invoiceNumber || 'INV-2026';
		const savedCustomerName = formData.customerName || 'Customer';

		// Find previous invoice in list if editing existing record
		const existingIndex = invoicesList.findIndex(i => i.id === formData.invoiceNumber);
		const prevInvoice = existingIndex !== -1 ? invoicesList[existingIndex] : null;

		// 1. Commit stock adjustments dynamically when user clicks Update & Sync
		let stocksChanged = false;
		for (const stock of tyreStocksList) {
			const oldAllocated = prevInvoice && prevInvoice.items ? getAllocatedQuantity(stock, prevInvoice.items) : 0;
			const newAllocated = formData.items ? getAllocatedQuantity(stock, formData.items) : 0;
			const delta = newAllocated - oldAllocated;

			if (delta !== 0) {
				stock.stockQuantity = Math.max(0, stock.stockQuantity - delta);
				stock.status = stock.stockQuantity === 0 ? 'Out of Stock' : (stock.stockQuantity <= (stock.reorderLevel || 10) ? 'Low Stock' : 'In Stock');
				stock.updatedAt = new Date().toISOString();
				syncSingleProduct(stock, currentUser?.role || 'Admin');
				stocksChanged = true;
			}
		}

		if (stocksChanged) {
			tyreStocksList = [...tyreStocksList];
			saveStoredStocks(tyreStocksList);
		}

		// 2. Synchronize invoice and customer records
		syncInvoiceWithCustomer(formData, formData.status, true);

		// 3. Reset the invoice form to a clean state ready to take new invoices
		const nextInvoiceNumber = 'INV-2026-' + Math.floor(1000 + Math.random() * 9000);
		formData = {
			invoiceNumber: nextInvoiceNumber,
			customerName: '',
			billingAddress: '',
			issueDate: getTodayDateStr(),
			dueDate: getFutureDateStr(14),
			paymentTerms: 'Net 14',
			status: 'Pending',
			items: [
				{
					id: generateId(),
					description: '',
					qty: 1,
					unitPrice: 0
				}
			],
			discount: 0,
			taxRate: 18,
			notes: 'Thank you for your business! Please complete the payment before the due date. For any technical warranty questions or fitment assistance, feel free to contact us at sales@anagkazo.co.tz.'
		};
		saveStoredDraftInvoice(null);
		formErrors = {};

		showToast(
			`Invoice ${savedInvoiceNumber} updated and synced successfully for ${savedCustomerName}! All records and product stocks updated.`,
			'success',
			'CREATE',
			'Invoice Updated & Synced'
		);
	}

	// Real-time synchronization between invoice modifications & customer dashboard
	function syncInvoiceWithCustomer(data: InvoiceFormData, targetStatus: InvoiceStatus, showSuccessMessage: boolean = true) {
		const total = Number(grandTotal) || 0;

		// 1. Update or create the invoice in invoicesList
		const existingIndex = invoicesList.findIndex(i => i.id === data.invoiceNumber);
		const invoiceItem: GeneratedInvoiceItem = {
			id: data.invoiceNumber || ('INV-2026-' + Math.floor(1000 + Math.random() * 9000)),
			customer: data.customerName,
			date: data.issueDate || getTodayDateStr(),
			dueDate: data.dueDate,
			amount: total,
			status: targetStatus,
			itemsCount: data.items.length,
			paymentTerms: data.paymentTerms,
			billingAddress: data.billingAddress,
			items: JSON.parse(JSON.stringify(data.items)),
			discount: Number(data.discount) || 0,
			taxRate: Number(data.taxRate) || 0,
			notes: data.notes,
			paymentDetailId: data.paymentDetailId,
			paymentDetail: data.paymentDetail,
			fullData: JSON.parse(JSON.stringify(data)),
			createdAt: existingIndex !== -1 && invoicesList[existingIndex].createdAt ? invoicesList[existingIndex].createdAt : new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			createdBy: existingIndex !== -1 && invoicesList[existingIndex].createdBy ? invoicesList[existingIndex].createdBy : (currentUser?.name || (currentUser?.role === 'admin' ? 'Masunga Paul Maganga (Admin)' : 'Baraka Maganga (Staff)'))
		};

		if (existingIndex !== -1) {
			invoicesList[existingIndex] = invoiceItem;
			invoicesList = [...invoicesList];
		} else {
			invoicesList = [invoiceItem, ...invoicesList];
		}
		saveStoredInvoices(invoicesList);
		syncSingleInvoice(invoiceItem, currentUser?.role || 'Staff');

		// 2. Synchronize the Customer in customersList in real-time
		const custNameLower = data.customerName.toLowerCase().trim();
		const custIndex = customersList.findIndex(
			c => c.name.toLowerCase().trim() === custNameLower ||
			     (c.companyName && c.companyName.toLowerCase().trim() === custNameLower) ||
			     custNameLower.includes(c.name.toLowerCase().trim()) ||
			     (c.companyName && custNameLower.includes(c.companyName.toLowerCase().trim()))
		);

		if (custIndex !== -1) {
			const targetCustomer = { ...customersList[custIndex] };
			
			// Recalculate customer metrics based on updated status & invoice total
			if (existingIndex === -1) {
				targetCustomer.invoicesCount = (targetCustomer.invoicesCount || 0) + 1;
			}
			if (targetStatus === 'Paid') {
				targetCustomer.status = 'Paid';
				targetCustomer.outstandingBalance = 0;
			} else if (targetStatus === 'Overdue') {
				targetCustomer.status = 'Overdue';
				targetCustomer.outstandingBalance = total > 0 ? total : 0;
			} else {
				targetCustomer.status = 'Pending';
				targetCustomer.outstandingBalance = total > 0 ? total : 0;
			}

			customersList[custIndex] = targetCustomer;
			customersList = [...customersList];
			saveStoredCustomers(customersList);
			syncSingleCustomer(targetCustomer, currentUser?.role || 'Admin');
		}

		// Product stock quantities remain exact and un-tampered when editing invoices or changing status
	}

	// Action: Delete Invoice from records
	function handleDeleteInvoice(invoiceId: string) {
		if (currentUser?.role !== 'admin') {
			showToast('Only administrators can delete invoice records.', 'error', 'INFO', 'Permission Denied');
			return;
		}
		invoicesList = invoicesList.filter(i => i.id !== invoiceId);
		saveStoredInvoices(invoicesList);
		deleteRemoteInvoice(invoiceId);
		showToast(`Invoice ${invoiceId} deleted from transaction records & database.`, 'info', 'DELETE', 'Invoice Deleted');
	}

	// Action: Delete All Invoices from records
	function handleDeleteAllInvoices() {
		if (currentUser?.role !== 'admin') {
			showToast('Only administrators can delete invoice records.', 'error', 'INFO', 'Permission Denied');
			return;
		}
		invoicesList = [];
		saveStoredInvoices([]);
		deleteAllRemoteInvoices();
		showToast('All recent invoice records have been permanently deleted from database.', 'info', 'DELETE', 'Invoices Cleared');
	}

	// Action: Delete All Data from whole system & database to start fresh (Admin only)
	function handleDeleteAllData() {
		if (currentUser?.role !== 'admin') {
			showToast('Only administrators can delete all system data.', 'error', 'INFO', 'Permission Denied');
			return;
		}

		// 1. Delete all Customers
		customersList = [];
		saveStoredCustomers([]);

		// 2. Delete all Tyre Stocks / Products
		tyreStocksList = [];
		saveStoredStocks([]);

		// 3. Delete all Invoices
		invoicesList = [];
		saveStoredInvoices([]);

		// 4. Delete all Corporate Payment Details
		paymentDetailsList = [];
		saveStoredPaymentDetails([]);

		// 5. Reset Draft Invoice to clean blank state
		formData = {
			invoiceNumber: 'INV-2026-1001',
			customerName: '',
			billingAddress: '',
			issueDate: getTodayDateStr(),
			dueDate: getFutureDateStr(14),
			paymentTerms: 'Net 14',
			status: 'Pending',
			items: [
				{
					id: generateId(),
					description: '',
					qty: 1,
					unitPrice: 0
				}
			],
			discount: 0,
			taxRate: 18,
			notes: 'Official commercial fleet invoice. For billing inquiries, contact accounting@anagkazo.co.tz.',
			paymentDetailId: undefined,
			paymentDetail: undefined
		};
		saveStoredDraftInvoice(null);
		formErrors = {};

		// 6. Proactively trigger server database wipe (Neon PostgreSQL, preserves user accounts)
		const headers: Record<string, string> = {};
		if (currentUser?.token) {
			headers['Authorization'] = `Bearer ${currentUser.token}`;
		}
		fetch('/api/db/wipe', { method: 'POST', headers }).catch((e) =>
			console.warn('[System] Server db wipe error:', e)
		);

		// 7. Broadcast all-sync to all active browser windows & tabs
		broadcastSync('ALL_SYNC', null);

		showToast(
			'All data (customers, products/stocks, recent invoices, banking details, and reports insights) has been completely deleted from the database and system.',
			'info',
			'DELETE',
			'All System Data Deleted'
		);
	}

	// Action: Delete Customer from directory
	function handleDeleteCustomer(customerId: string) {
		if (currentUser?.role !== 'admin') {
			showToast('Only administrators can delete customer records.', 'error', 'INFO', 'Permission Denied');
			return;
		}
		const cust = customersList.find(c => c.id === customerId);
		customersList = customersList.filter(c => c.id !== customerId);
		saveStoredCustomers(customersList);
		deleteRemoteCustomer(customerId);
		showToast(`Customer "${cust?.companyName || cust?.name || customerId}" permanently removed from database.`, 'info', 'DELETE', 'Customer Deleted');
	}

	// Action: Delete All Customers from directory (Admin only)
	function handleDeleteAllCustomers() {
		if (currentUser?.role !== 'admin') {
			showToast('Only administrators can delete customer records.', 'error', 'INFO', 'Permission Denied');
			return;
		}
		customersList = [];
		saveStoredCustomers([]);
		deleteAllRemoteCustomers();
		showToast('All customer records have been deleted permanently from database.', 'info', 'DELETE', 'Customers Cleared');
	}

	// Action: Delete Product from inventory
	function handleDeleteProduct(idOrSku: string) {
		if (currentUser?.role !== 'admin') {
			showToast('Only administrators can delete product inventory records.', 'error', 'INFO', 'Permission Denied');
			return;
		}
		const prod = tyreStocksList.find(p => p.sku === idOrSku || p.id === idOrSku);
		const prodId = prod?.id || idOrSku;
		tyreStocksList = tyreStocksList.filter(p => p.sku !== idOrSku && p.id !== idOrSku);
		saveStoredStocks(tyreStocksList);
		deleteRemoteProduct(prodId);
		showToast(
			`Product "${prod?.brand || ''} ${prod?.model || ''}" (${prod?.size || idOrSku}) permanently removed from database.`,
			'info',
			'DELETE',
			'Product Deleted'
		);
	}

	// Action: Delete All Products from inventory (Admin only)
	function handleDeleteAllProducts() {
		if (currentUser?.role !== 'admin') {
			showToast('Only administrators can delete product inventory records.', 'error', 'INFO', 'Permission Denied');
			return;
		}
		tyreStocksList = [];
		saveStoredStocks([]);
		deleteAllRemoteProducts();
		showToast('All product stock records have been deleted permanently from database.', 'info', 'DELETE', 'Inventory Cleared');
	}

	// Action: Save as Draft
	function handleSaveDraft() {
		try {
			localStorage.setItem('anagkazo_invoice_draft', JSON.stringify(formData));
			showToast(`Draft for ${formData.invoiceNumber} saved successfully to local storage.`, 'success', 'UPDATE', 'Draft Saved');
		} catch {
			showToast(`Draft saved for ${formData.invoiceNumber}.`, 'info', 'UPDATE', 'Draft Saved');
		}
	}

	// Action: Send Invoice
	function handleSendInvoice() {
		const isValid = validateForm();
		if (!isValid) {
			showToast('Please fix required fields before sending the invoice.', 'error', 'ERROR', 'Validation Failed');
			return;
		}
		showSendModal = true;
	}

	function confirmSendInvoice() {
		showSendModal = false;
		const savedInvoiceNumber = formData.invoiceNumber || 'INV-2026';
		const savedCustomerName = formData.customerName || 'Customer';

		syncInvoiceWithCustomer(formData, formData.status || 'Pending', false);

		// Reset form for next invoice
		const nextInvoiceNumber = 'INV-2026-' + Math.floor(1000 + Math.random() * 9000);
		formData = {
			invoiceNumber: nextInvoiceNumber,
			customerName: '',
			billingAddress: '',
			issueDate: getTodayDateStr(),
			dueDate: getFutureDateStr(14),
			paymentTerms: 'Net 14',
			status: 'Pending',
			items: [
				{
					id: generateId(),
					description: '',
					qty: 1,
					unitPrice: 0
				}
			],
			discount: 0,
			taxRate: 18,
			notes: 'Thank you for your business! Please complete the payment before the due date. For any technical warranty questions or fitment assistance, feel free to contact us at sales@anagkazo.co.tz.'
		};
		saveStoredDraftInvoice(null);
		formErrors = {};

		showToast(`Invoice ${savedInvoiceNumber} dispatched to ${savedCustomerName}! Form reset for next invoice (${nextInvoiceNumber}).`, 'success', 'DISPATCH', 'Invoice Dispatched');
	}

	function handleLoadGeneratedInvoice(inv: GeneratedInvoiceItem) {
		// 1. If fullData was stored, restore it directly
		if (inv.fullData) {
			formData = JSON.parse(JSON.stringify(inv.fullData));
		} else {
			// 2. Find matching customer for address and contact info if not explicitly set
			const custNameLower = (inv.customer || '').toLowerCase().trim();
			const matchedCust = customersList.find(
				(c) =>
					c.name.toLowerCase().trim() === custNameLower ||
					(c.companyName && c.companyName.toLowerCase().trim() === custNameLower) ||
					custNameLower.includes(c.name.toLowerCase().trim()) ||
					(c.companyName && custNameLower.includes(c.companyName.toLowerCase().trim()))
			);

			const billingAddr =
				inv.billingAddress ||
				(matchedCust
					? `${matchedCust.address}, ${matchedCust.city}, Tanzania (Tel: ${matchedCust.phone})`
					: 'Dar es Salaam, Tanzania');
			const payTerms = inv.paymentTerms || matchedCust?.paymentTerms || 'Net 14';

			// 3. Line items: use inv.items if present, or generate realistic tyre items matching inv.amount
			let loadedItems = inv.items && inv.items.length > 0 ? JSON.parse(JSON.stringify(inv.items)) : [];
			if (loadedItems.length === 0) {
				if (inv.id === 'INV-2026-0842') {
					loadedItems = [
						{ id: generateId(), description: 'Michelin 265/65R17 Primacy SUV Tubeless (MIC-2656517)', qty: 10, unitPrice: 750000, stockId: 'STK-001', sku: 'MIC-2656517' },
						{ id: generateId(), description: 'Bridgestone 275/70R16 Land Cruiser A/T Heavy Duty (BST-2757016)', qty: 5, unitPrice: 650000, stockId: 'STK-003', sku: 'BST-2757016' },
						{ id: generateId(), description: 'High-Speed Dynamic Wheel Balancing & Heavy Duty Tubeless Valves', qty: 15, unitPrice: 35000 }
					];
				} else if (inv.id === 'INV-2026-0841') {
					loadedItems = [
						{ id: generateId(), description: 'Pirelli 315/80R22.5 FH01 Heavy Commercial Steer Tyres (PIR-31580225)', qty: 20, unitPrice: 1150000, stockId: 'STK-002', sku: 'PIR-31580225' },
						{ id: generateId(), description: 'Continental 12.00R20 HDR Heavy Haulage Radial (CON-120020)', qty: 8, unitPrice: 600000, stockId: 'STK-004', sku: 'CON-120020' }
					];
				} else if (inv.id === 'INV-2026-0840') {
					loadedItems = [
						{ id: generateId(), description: 'Pirelli 12.00R24 Amarok OTR Mining Radial (PIR-120024)', qty: 10, unitPrice: 1250000 },
						{ id: generateId(), description: 'OTR Heavy Industrial High-Pressure Nitrogen Inflation Service', qty: 10, unitPrice: 45000 }
					];
				} else if (inv.id === 'INV-2026-0839') {
					loadedItems = [
						{ id: generateId(), description: 'Sailun 315/80R22.5 S815 Mixed Service All-Position Tyres (SLN-31580225)', qty: 30, unitPrice: 680000, stockId: 'STK-007', sku: 'SLN-31580225' },
						{ id: generateId(), description: 'Fleet 3D Laser Multi-Axle Computerized Alignment', qty: 5, unitPrice: 150000 }
					];
				} else if (inv.id === 'INV-2026-0838') {
					loadedItems = [
						{ id: generateId(), description: 'Michelin 315/80R22.5 X MultiWay 3D Heavy Long-Haul Tyres (MIC-31580225)', qty: 36, unitPrice: 1100000, stockId: 'STK-009', sku: 'MIC-31580225' },
						{ id: generateId(), description: 'Dunlop 295/80R22.5 SP320 Highway Commercial Drive Tyres (DNL-29580225)', qty: 10, unitPrice: 850000, stockId: 'STK-006', sku: 'DNL-29580225' },
						{ id: generateId(), description: 'Commercial Fleet Complete Demounting, Mounting & High-Pressure Rim Sealing', qty: 46, unitPrice: 25000 }
					];
				} else {
					loadedItems = [
						{ id: generateId(), description: 'Commercial Heavy Duty Fleet Tyres', qty: inv.itemsCount || 2, unitPrice: Math.round((inv.amount || 2000000) / (inv.itemsCount || 2) / 1.18) }
					];
				}
			}

			// Payment details selection
			const selectedPayment =
				(inv.paymentDetailId && paymentDetailsList.find((p) => p.id === inv.paymentDetailId)) ||
				inv.paymentDetail ||
				paymentDetailsList.find((p) => p.isDefault) ||
				paymentDetailsList[0];

			formData = {
				invoiceNumber: inv.id,
				customerName: inv.customer,
				billingAddress: billingAddr,
				issueDate: inv.date,
				dueDate: inv.dueDate || getFutureDateStr(14, inv.date),
				paymentTerms: payTerms,
				status: inv.status,
				items: loadedItems,
				discount: inv.discount || 0,
				taxRate: inv.taxRate ?? 18,
				notes:
					inv.notes ||
					'Thank you for choosing Anagkazo Tyre & Fleet Solutions. Payment is due as per agreed corporate terms.',
				paymentDetailId: selectedPayment?.id,
				paymentDetail: selectedPayment
			};
		}

		// Sync with storage & reset validation errors
		saveStoredDraftInvoice(formData);
		formErrors = {};
		currentTab = 'Invoices';
		showToast(`Loaded invoice ${inv.id} (${inv.customer}) with full line items & details into workspace.`, 'success', 'READ', 'Invoice Loaded');
	}

	// Action: Direct PDF Export to Device
	async function handleExportPDF() {
		showToast(`Generating ${formData.invoiceNumber} PDF download...`, 'info', 'READ', 'Preparing PDF');
		const success = await downloadInvoicePDF('invoice-printable-area', `Invoice-${formData.invoiceNumber || 'INV-2026'}.pdf`);
		if (success) {
			showToast(`Downloaded ${formData.invoiceNumber}.pdf to your device!`, 'success', 'READ', 'PDF Downloaded');
		} else {
			showToast(`Failed to generate ${formData.invoiceNumber} PDF.`, 'error', 'ERROR', 'Export Failed');
		}
	}

	// Action: Print Physical Invoice
	function handlePrint() {
		if (typeof window !== 'undefined') {
			window.print();
		}
	}

	// Payment Details Handlers (Admin Managed, Staff Selectable)
	function handleAddPaymentDetail(detail: PaymentDetail) {
		if (detail.isDefault) {
			paymentDetailsList = paymentDetailsList.map((p) => ({ ...p, isDefault: false }));
		}
		paymentDetailsList = [detail, ...paymentDetailsList];
		saveStoredPaymentDetails(paymentDetailsList);
		syncSinglePaymentDetail(detail);
	}

	function handleUpdatePaymentDetail(detail: PaymentDetail) {
		if (detail.isDefault) {
			paymentDetailsList = paymentDetailsList.map((p) => ({
				...p,
				isDefault: p.id === detail.id
			}));
		}
		paymentDetailsList = paymentDetailsList.map((p) => (p.id === detail.id ? detail : p));
		if (formData.paymentDetail?.id === detail.id) {
			formData.paymentDetail = detail;
		}
		saveStoredPaymentDetails(paymentDetailsList);
		syncSinglePaymentDetail(detail);
	}

	function handleDeletePaymentDetail(id: string) {
		paymentDetailsList = paymentDetailsList.filter((p) => p.id !== id);
		if (formData.paymentDetail?.id === id && paymentDetailsList.length > 0) {
			formData.paymentDetail = paymentDetailsList.find((p) => p.isDefault) || paymentDetailsList[0];
			formData.paymentDetailId = formData.paymentDetail.id;
		}
		saveStoredPaymentDetails(paymentDetailsList);
		deleteRemotePaymentDetail(id);
	}

	function handleSetDefaultPaymentDetail(id: string) {
		paymentDetailsList = paymentDetailsList.map((p) => ({
			...p,
			isDefault: p.id === id
		}));
		const defaultPay = paymentDetailsList.find((p) => p.id === id);
		if (defaultPay) {
			showToast(`"${defaultPay.bankName}" is now the primary collection account.`, 'success', 'UPDATE', 'Default Set');
		}
	}


	// Action: Load Sample Preset
	function handlePresetSelect(presetData: Partial<InvoiceFormData>) {
		formData = {
			...formData,
			...JSON.parse(JSON.stringify(presetData))
		};
		formErrors = {};
		showToast(`Loaded "${presetData.customerName}" demo data.`, 'info', 'READ', 'Preset Loaded');
	}

	// Action: Reset Form
	function handleResetForm() {
		formData = JSON.parse(JSON.stringify(INITIAL_INVOICE_DATA));
		saveStoredDraftInvoice(null);
		formErrors = {};
		showToast('Invoice form reset and items cleared.', 'info', 'DELETE', 'Form Reset');
	}

	// Cross-section shortcut: Pre-fill customer from Customers section
	function handleSelectCustomerForInvoice(customer: Customer) {
		const custName = customer.companyName || customer.name;
		const custNameLower = custName.toLowerCase().trim();
		const defaultPayment = paymentDetailsList.find((p) => p.isDefault) || paymentDetailsList[0];

		// Check if there is an existing invoice for this customer in invoicesList
		const existingInv = invoicesList.find(
			(i) =>
				i.customer.toLowerCase().trim() === custNameLower ||
				i.customer.toLowerCase().trim() === customer.name.toLowerCase().trim() ||
				(customer.companyName && i.customer.toLowerCase().trim() === customer.companyName.toLowerCase().trim())
		);

		// Compute payment terms & due date
		const terms = customer.paymentTerms || existingInv?.paymentTerms || 'Net 14';
		let days = 14;
		if (terms.includes('7')) days = 7;
		else if (terms.includes('14')) days = 14;
		else if (terms.includes('30')) days = 30;
		else if (terms.toLowerCase().includes('receipt') || terms.toLowerCase().includes('cod')) days = 0;

		const issueDate = existingInv?.date || getTodayDateStr();
		const dueDate = existingInv?.dueDate || getFutureDateStr(days, issueDate);

		// Comprehensive billing address with contact person and TIN
		const billingAddress =
			existingInv?.billingAddress ||
			`${customer.address}, ${customer.city}, Tanzania (Attn: ${customer.contactPerson} - Tel: ${customer.phone}${customer.tin ? ` | TIN: ${customer.tin}` : ''})`;

		// Line items determination: Use existing invoice items or tailor from stocks
		let loadedItems: InvoiceItem[] = [];
		if (existingInv?.items && existingInv.items.length > 0) {
			loadedItems = JSON.parse(JSON.stringify(existingInv.items));
		} else if (existingInv?.fullData?.items && existingInv.fullData.items.length > 0) {
			loadedItems = JSON.parse(JSON.stringify(existingInv.fullData.items));
		} else {
			// Prepopulate realistic tyre batch tailored to customer profile
			if (customer.customerType === 'Fleet & Logistics') {
				const s1 = tyreStocksList.find((s) => s.size?.includes('315/80R22.5')) || tyreStocksList[0];
				const s2 = tyreStocksList.find((s) => s.size?.includes('12.00R20') || s.size?.includes('295/80R22.5')) || tyreStocksList[1];
				loadedItems = [
					{
						id: generateId(),
						description: `${s1.brand} ${s1.size} ${s1.model} Commercial Steer Tyres (${s1.sku})`,
						qty: 8,
						unitPrice: s1.unitPriceTZS,
						stockId: s1.id,
						sku: s1.sku
					},
					{
						id: generateId(),
						description: `${s2.brand} ${s2.size} ${s2.model} Heavy Duty Radials (${s2.sku})`,
						qty: 4,
						unitPrice: s2.unitPriceTZS,
						stockId: s2.id,
						sku: s2.sku
					},
					{
						id: generateId(),
						description: 'High-Speed Dynamic Wheel Balancing & Heavy Duty Tubeless Valves',
						qty: 12,
						unitPrice: 35000
					}
				];
			} else if (customer.customerType === 'Corporate') {
				const s1 = tyreStocksList.find((s) => s.size?.includes('265/65R17')) || tyreStocksList[0];
				loadedItems = [
					{
						id: generateId(),
						description: `${s1.brand} ${s1.size} ${s1.model} Premium Tubeless Tyres (${s1.sku})`,
						qty: 4,
						unitPrice: s1.unitPriceTZS,
						stockId: s1.id,
						sku: s1.sku
					},
					{
						id: generateId(),
						description: 'Fleet 3D Laser Multi-Axle Computerized Alignment & Wheel Balance',
						qty: 1,
						unitPrice: 150000
					}
				];
			} else if (customer.customerType === 'Government / NGO') {
				const s1 = tyreStocksList.find((s) => s.size?.includes('275/70R16') || s.size?.includes('S815')) || tyreStocksList[0];
				loadedItems = [
					{
						id: generateId(),
						description: `${s1.brand} ${s1.size} ${s1.model} Heavy-Duty All-Terrain Tyres (${s1.sku})`,
						qty: 6,
						unitPrice: s1.unitPriceTZS,
						stockId: s1.id,
						sku: s1.sku
					},
					{
						id: generateId(),
						description: 'High-Pressure Pure Nitrogen Tyre Inflation & Sealing Service',
						qty: 6,
						unitPrice: 45000
					}
				];
			} else {
				const s1 = tyreStocksList[0];
				loadedItems = [
					{
						id: generateId(),
						description: `${s1.brand} ${s1.size} ${s1.model} (${s1.sku})`,
						qty: 4,
						unitPrice: s1.unitPriceTZS,
						stockId: s1.id,
						sku: s1.sku
					},
					{
						id: generateId(),
						description: 'High-Speed Dynamic Wheel Balancing & Tubeless Valves',
						qty: 4,
						unitPrice: 35000
					}
				];
			}
		}

		const invoiceNum = existingInv ? existingInv.id : 'INV-2026-' + Math.floor(1000 + Math.random() * 9000);
		const paymentAcc =
			(existingInv?.paymentDetailId && paymentDetailsList.find((p) => p.id === existingInv.paymentDetailId)) ||
			existingInv?.paymentDetail ||
			defaultPayment;

		formData = {
			invoiceNumber: invoiceNum,
			customerName: custName,
			billingAddress: billingAddress,
			issueDate: issueDate,
			dueDate: dueDate,
			paymentTerms: terms,
			status: customer.status || existingInv?.status || 'Pending',
			items: loadedItems,
			discount: existingInv?.discount || 0,
			taxRate: existingInv?.taxRate ?? 18,
			notes:
				existingInv?.notes ||
				`Official commercial fleet supply for ${custName}. Payment terms: ${terms}. For billing inquiries, contact accounting@anagkazo.co.tz.`,
			paymentDetailId: paymentAcc?.id,
			paymentDetail: paymentAcc
		};

		saveStoredDraftInvoice(formData);
		formErrors = {};
		currentTab = 'Invoices';
		showToast(`Loaded invoice with full customer details & items for ${custName}.`, 'success', 'CREATE', 'Invoice Loaded');
	}


	// Cross-section shortcut: Add Tyre to Invoice line items (with real-time stock boundary enforcement)
	function handleAddServiceToInvoice(service: WorkshopService | { title: string; priceTZS: number; stockId?: string; sku?: string }) {
		const unitPrice = 'priceTZS' in service ? service.priceTZS : 0;
		const description = 'code' in service ? `${service.title} (${service.code})` : service.title;
		const stockId = 'stockId' in service ? service.stockId : undefined;
		const sku = 'sku' in service ? service.sku : undefined;

		// Check stock availability
		const matched = tyreStocksList.find(s => (stockId && s.id === stockId) || (sku && s.sku === sku) || (s.sku && description.includes(s.sku)));
		if (matched) {
			const allocated = getAllocatedQuantity(matched, formData.items);
			if (allocated >= matched.stockQuantity) {
				showToast(
					`Cannot add more products than available stocks! "${matched.brand} ${matched.size}" is at maximum available capacity (${matched.stockQuantity} units).`,
					'error',
					'INFO',
					'Stock Limit Reached'
				);
				return;
			}
		}

		// Check if an existing line item can have qty incremented or append
		const existingItemIndex = formData.items.findIndex(
			(i) => (stockId && i.stockId === stockId) || (sku && i.sku === sku) || (i.description === description && i.unitPrice === unitPrice)
		);

		if (existingItemIndex !== -1) {
			const item = formData.items[existingItemIndex];
			if (matched) {
				const otherAllocated = getAllocatedQuantity(matched, formData.items, item.id);
				if (item.qty + 1 > matched.stockQuantity - otherAllocated) {
					showToast(
						`Cannot add more products than available stocks! Maximum available stock for "${matched.brand} ${matched.size}" is ${matched.stockQuantity} units.`,
						'error',
						'INFO',
						'Stock Limit Reached'
					);
					return;
				}
			}
			item.qty += 1;
			formData.items = [...formData.items];
		} else {
			if (formData.items.length === 1 && !formData.items[0].description.trim() && formData.items[0].unitPrice === 0) {
				formData.items = [
					{
						id: generateId(),
						description,
						qty: 1,
						unitPrice,
						stockId,
						sku
					}
				];
			} else {
				formData.items = [
					...formData.items,
					{
						id: generateId(),
						description,
						qty: 1,
						unitPrice,
						stockId,
						sku
					}
				];
			}
		}
		showToast(`Added 1 unit of "${description}" to invoice.`, 'success', 'CREATE', 'Line Item Added');
	}

	// Calculated grand total for modal summary
	const subtotal = $derived(
		formData.items.reduce((acc, item) => acc + (Number(item.qty) || 0) * (Number(item.unitPrice) || 0), 0)
	);
	const discountAmount = $derived(Number(formData.discount) || 0);
	const taxAmount = $derived(subtotal * ((Number(formData.taxRate) || 0) / 100));
	const grandTotal = $derived(Math.max(0, subtotal + taxAmount - discountAmount));
</script>

<div class="min-h-screen flex flex-col bg-[#f3f4f8] text-slate-900 justify-between overflow-x-hidden w-full max-w-full">
	<!-- Top Navigation (Sticky) -->
	<div class="no-print sticky top-0 z-40 w-full">
		<Navbar
			bind:activeNav={currentTab}
			currentUser={currentUser}
			onOpenLogin={() => isLoginModalOpen = true}
			onLogout={handleLogout}
		/>
	</div>

	<!-- Main App Content Container -->
	<main class="flex-1 mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8 pt-4 sm:pt-8 overflow-x-hidden">
		{#if !currentUser}
			<!-- Unauthenticated State: Protected Gateway with Neon Auth & 1-Click Fast Login -->
			<AuthGateway onSuccess={handleLoginSuccess} />
		{:else}
			<!-- Authenticated Workspace: Render based on active tab & user role -->
			{#if currentTab === 'Dashboard'}
				{#if currentUser.role === 'admin'}
					<DashboardSection
						invoices={invoicesList}
						stocks={tyreStocksList}
						customers={customersList}
						paymentDetails={paymentDetailsList}
						onNavigateTab={(tab) => currentTab = tab}
						onSelectInvoiceCustomer={(name) => {
							const custLower = (name || '').toLowerCase().trim();
							const matched = customersList.find(
								(c) =>
									c.name.toLowerCase().trim() === custLower ||
									(c.companyName && c.companyName.toLowerCase().trim() === custLower)
							);
							if (matched) {
								handleSelectCustomerForInvoice(matched);
							} else {
								formData.customerName = name;
								formData.invoiceNumber = 'INV-2026-' + Math.floor(1000 + Math.random() * 9000);
								currentTab = 'Invoices';
							}
						}}
						onLoadInvoice={handleLoadGeneratedInvoice}
						onDeleteInvoice={handleDeleteInvoice}
						onDeleteAllInvoices={handleDeleteAllInvoices}
						onDeleteAllData={handleDeleteAllData}
						onResetAllData={handleDeleteAllData}
						onAddPaymentDetail={handleAddPaymentDetail}
						onUpdatePaymentDetail={handleUpdatePaymentDetail}
						onDeletePaymentDetail={handleDeletePaymentDetail}
						onSetDefaultPaymentDetail={handleSetDefaultPaymentDetail}
						onAdminSaved={handleAdminCredentialsSaved}
						onShowToast={showToast}
					/>
				{:else}
					<div class="rounded-2xl border border-slate-200 bg-white p-8 text-center max-w-md mx-auto my-12 shadow-xs space-y-4">
						<div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-50 text-navy-900">
							<Lock class="h-6 w-6" />
						</div>
						<div>
							<h2 class="text-lg font-bold text-navy-900">Admin Dashboard Restricted</h2>
							<p class="text-xs text-slate-500 mt-1">
								The executive analytics dashboard is reserved for Admin accounts.
							</p>
						</div>
						<button
							type="button"
							onclick={() => currentTab = 'Invoices'}
							class="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-navy-800 transition cursor-pointer"
						>
							<span>Go to Invoices</span>
						</button>
					</div>
				{/if}

			{:else if currentTab === 'Customers'}
				<CustomersSection
					userRole={currentUser.role}
					customers={customersList}
					invoices={invoicesList}
					onAddCustomer={(newCust) => {
						newCust.createdAt = newCust.createdAt || new Date().toISOString();
						newCust.createdBy = newCust.createdBy || (currentUser?.name || 'Admin');
						customersList = [newCust, ...customersList.filter(c => c.id !== newCust.id)];
						saveStoredCustomers(customersList);
						syncSingleCustomer(newCust, currentUser?.role || 'Admin');
					}}
					onUpdateCustomer={(updatedCust) => {
						updatedCust.updatedAt = new Date().toISOString();
						customersList = customersList.map(c => c.id === updatedCust.id ? updatedCust : c);
						saveStoredCustomers(customersList);
						syncSingleCustomer(updatedCust, currentUser?.role || 'Admin');
					}}
					onDeleteCustomer={handleDeleteCustomer}
					onDeleteAllCustomers={handleDeleteAllCustomers}
					onSelectCustomerForInvoice={handleSelectCustomerForInvoice}
					onShowToast={showToast}
				/>


			{:else if currentTab === 'Services'}
				<ServicesSection
					userRole={currentUser.role}
					stocks={tyreStocksList}
					onAddServiceToInvoice={handleAddServiceToInvoice}
					onAddProduct={(newProd) => {
						newProd.createdAt = newProd.createdAt || new Date().toISOString();
						newProd.createdBy = newProd.createdBy || (currentUser?.name || 'Admin');
						tyreStocksList = [newProd, ...tyreStocksList.filter(s => s.id !== newProd.id)];
						saveStoredStocks(tyreStocksList);
						syncSingleProduct(newProd, currentUser?.role || 'Admin');
					}}
					onUpdateProduct={(updatedProd) => {
						updatedProd.updatedAt = new Date().toISOString();
						tyreStocksList = tyreStocksList.map(s => s.id === updatedProd.id || s.sku === updatedProd.sku ? updatedProd : s);
						saveStoredStocks(tyreStocksList);
						syncSingleProduct(updatedProd, currentUser?.role || 'Admin');
					}}
					onDeleteProduct={handleDeleteProduct}
					onDeleteAllProducts={handleDeleteAllProducts}
					onShowToast={showToast}
				/>

			{:else if currentTab === 'Invoices'}
				<!-- Invoices Section (Standard User & Admin Access) -->
				<div class="no-print">
					<PageHeader invoiceNumber={formData.invoiceNumber} />
				</div>

				<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
					<!-- Left Column: Form Editor -->
					<div class="no-print w-full">
						<InvoiceForm
							bind:form={formData}
							errors={formErrors}
							customers={customersList}
							stocks={tyreStocksList}
							paymentDetails={paymentDetailsList}
							onStatusChange={handleStatusChange}
							onSaveInvoice={handleSaveAndUpdateInvoice}
							onPresetSelect={handlePresetSelect}
							onResetForm={handleResetForm}
							onShowToast={showToast}
						/>
					</div>

					<!-- Right Column: Live A4 Preview -->
					<div class="w-full lg:sticky lg:top-24">
						<InvoicePreview
							form={formData}
							onExportPDF={handleExportPDF}
							onPrint={handlePrint}
						/>
					</div>
				</div>

			{:else if currentTab === 'PaymentDetails'}
				{#if currentUser.role === 'admin'}
					<PaymentDetailsManager
						paymentDetails={paymentDetailsList}
						onAddPaymentDetail={handleAddPaymentDetail}
						onUpdatePaymentDetail={handleUpdatePaymentDetail}
						onDeletePaymentDetail={handleDeletePaymentDetail}
						onSetDefaultPaymentDetail={handleSetDefaultPaymentDetail}
						onShowToast={showToast}
					/>
				{:else}
					<div class="rounded-2xl border border-slate-200 bg-white p-8 text-center max-w-md mx-auto my-12 shadow-xs space-y-4">
						<div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-50 text-navy-900">
							<ShieldAlert class="h-6 w-6 text-sky-600" />
						</div>
						<div>
							<h2 class="text-lg font-bold text-navy-900">Payment Accounts Restricted</h2>
							<p class="text-xs text-slate-500 mt-1">
								Payment details configuration requires Administrator access.
							</p>
						</div>
						<button
							type="button"
							onclick={() => currentTab = 'Invoices'}
							class="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-navy-800 transition cursor-pointer"
						>
							<span>Go to Invoices</span>
						</button>
					</div>
				{/if}

			{:else if currentTab === 'Reports'}
				{#if currentUser.role === 'admin'}
					<ReportsSection
						customers={customersList}
						stocks={tyreStocksList}
						invoices={invoicesList}
						onLoadInvoice={handleLoadGeneratedInvoice}
						onDeleteInvoice={handleDeleteInvoice}
						onDeleteAllInvoices={handleDeleteAllInvoices}
						onShowToast={showToast}
					/>
				{:else}
					<div class="rounded-2xl border border-slate-200 bg-white p-8 text-center max-w-md mx-auto my-12 shadow-xs space-y-4">
						<div class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-50 text-navy-900">
							<ShieldAlert class="h-6 w-6 text-sky-600" />
						</div>
						<div>
							<h2 class="text-lg font-bold text-navy-900">Financial Reports Restricted</h2>
							<p class="text-xs text-slate-500 mt-1">
								Financial reports require Administrator access.
							</p>
						</div>
						<button
							type="button"
							onclick={() => currentTab = 'Invoices'}
							class="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-navy-800 transition cursor-pointer"
						>
							<span>Go to Invoices</span>
						</button>
					</div>
				{/if}

			{:else}
				<!-- Fallback Default to Invoices -->
				<div class="no-print">
					<PageHeader invoiceNumber={formData.invoiceNumber} />
				</div>

				<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
					<!-- Left Column: Form Editor -->
					<div class="no-print w-full">
						<InvoiceForm
							bind:form={formData}
							errors={formErrors}
							customers={customersList}
							stocks={tyreStocksList}
							paymentDetails={paymentDetailsList}
							onStatusChange={handleStatusChange}
							onSaveInvoice={handleSaveAndUpdateInvoice}
							onPresetSelect={handlePresetSelect}
							onResetForm={handleResetForm}
							onShowToast={showToast}
						/>
					</div>

					<!-- Right Column: Live A4 Preview -->
					<div class="w-full lg:sticky lg:top-24">
						<InvoicePreview
							form={formData}
							onExportPDF={handleExportPDF}
							onPrint={handlePrint}
						/>
					</div>
				</div>
			{/if}
		{/if}
	</main>

	<!-- Global Application Footer (Visible across all sections for both Admin & Staff) -->
	<Footer
		currentUser={currentUser}
		activeTab={currentTab}
		onNavigateTab={(tab) => (currentTab = tab)}
		onOpenLogin={() => (isLoginModalOpen = true)}
		onOpenStaffCredentials={() => (isStaffCredentialsModalOpen = true)}
		onLogout={handleLogout}
	/>

	<!-- Staff & Admin Login Credentials Management Modal (Global Admin Access) -->
	<StaffCredentialsModal
		open={isStaffCredentialsModalOpen}
		onClose={() => (isStaffCredentialsModalOpen = false)}
		onAdminSaved={handleAdminCredentialsSaved}
		onShowToast={showToast}
	/>

	<!-- Neon Authentication Modal -->
	<LoginModal
		isOpen={isLoginModalOpen}
		onClose={() => isLoginModalOpen = false}
		onSuccess={handleLoginSuccess}
	/>

	<!-- Flash Notification Component -->
	<Toast
		type={toastType}
		action={toastAction}
		title={toastTitle}
		message={toastMessage}
		visible={toastVisible}
		onClose={() => toastVisible = false}
	/>

	<!-- Send Invoice Modal Dialog -->
	{#if showSendModal}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
			<div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10">
				<div class="flex items-center justify-between border-b border-slate-100 pb-3">
					<div class="flex items-center gap-2">
						<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900 text-sky-400">
							<Send class="h-4 w-4" />
						</div>
						<h3 class="font-bold text-navy-900">Send Invoice Confirmation</h3>
					</div>
					<button
						type="button"
						onclick={() => showSendModal = false}
						class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
					>
						<X class="h-4 w-4" />
					</button>
				</div>


				<div class="py-4 space-y-3 text-xs text-slate-600">
					<p>You are about to issue and send the electronic invoice to:</p>
					<div class="rounded-xl bg-slate-50 p-3.5 border border-slate-100 space-y-1.5">
						<div class="flex items-center justify-between">
							<div class="font-bold text-slate-900 text-sm">{formData.customerName}</div>
							<span class="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase {
								formData.status === 'Paid'
									? 'bg-navy-900 text-white'
									: formData.status === 'Overdue'
									? 'bg-rose-100 text-rose-700'
									: 'bg-amber-100 text-amber-700'
							}">
								{formData.status}
							</span>
						</div>
						<div class="text-[11px] text-slate-500">{formData.billingAddress}</div>
						<div class="pt-2 border-t border-slate-200/60 flex justify-between font-semibold">
							<span>Total Due:</span>
							<span class="text-navy-900 font-bold font-mono">{formatTZS(grandTotal)}</span>
						</div>
						<div class="flex justify-between text-slate-500">
							<span>Payment Term:</span>
							<span>{formData.paymentTerms} (Due: {formData.dueDate})</span>
						</div>
					</div>
				</div>

				<div class="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
					<button
						type="button"
						onclick={() => showSendModal = false}
						class="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
					>
						Cancel
					</button>
					<button
						type="button"
						onclick={confirmSendInvoice}
						class="inline-flex items-center gap-1.5 rounded-xl bg-navy-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-navy-800 cursor-pointer"
					>
						<CheckCircle2 class="h-3.5 w-3.5 text-sky-400" />
						<span>Confirm & Send</span>
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>
