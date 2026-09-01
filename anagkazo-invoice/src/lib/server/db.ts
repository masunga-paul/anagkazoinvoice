import { neon, type NeonQueryFunction } from '@neondatabase/serverless';
import { env } from '$env/dynamic/private';
import type { User, UserRole } from '$lib/types/auth';
import type { Customer } from '$lib/types/customer';
import type { TyreProductStock } from '$lib/data/mockData';
import type { GeneratedInvoiceItem } from '$lib/components/reports/GeneratedInvoicesAudit.svelte';
import type { PaymentDetail } from '$lib/types/payment';
import { hashPassword, verifyPassword, generateSignedToken } from './security';

/**
 * Dynamically resolves the Neon Database connection string.
 */
export function getDbUrl(customEnv?: Record<string, any>): string {
	const url = customEnv?.DATABASE_URL || env.DATABASE_URL || (typeof process !== 'undefined' ? process.env?.DATABASE_URL : '') || '';
	return url;
}

/**
 * Returns a Neon SQL execution function for the active environment.
 */
export function getSql(customEnv?: Record<string, any>): NeonQueryFunction<false, false> {
	const conn = getDbUrl(customEnv);
	if (!conn) {
		throw new Error(
			'DATABASE_URL is not configured in Cloudflare environment variables. Please add DATABASE_URL in Cloudflare Pages Settings -> Environment variables.'
		);
	}
	return neon(conn);
}

// Fallback exported proxy for direct query execution
export const sql: NeonQueryFunction<false, false> = ((strings: TemplateStringsArray, ...values: any[]) => {
	const runner = getSql();
	return (runner as any)(strings, ...values);
}) as any;

let isDbInitialized = false;

/**
 * Initializes the Neon PostgreSQL database tables and seeds default Admin and Standard User accounts with PBKDF2 hashed passwords.
 */
export async function initializeNeonDatabase(customEnv?: Record<string, any>) {
	if (isDbInitialized) return;

	try {
		const db = getSql(customEnv);

		// 1. Create Users Table
		await db`
			CREATE TABLE IF NOT EXISTS anagkazo_users (
				id TEXT PRIMARY KEY,
				email TEXT UNIQUE NOT NULL,
				password TEXT NOT NULL,
				name TEXT NOT NULL,
				role TEXT NOT NULL,
				department TEXT,
				created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
			);
		`;

		// 2. Create Products Table
		await db`
			CREATE TABLE IF NOT EXISTS anagkazo_products (
				id TEXT PRIMARY KEY,
				sku TEXT UNIQUE NOT NULL,
				brand TEXT NOT NULL,
				model TEXT NOT NULL,
				size TEXT NOT NULL,
				application TEXT,
				unit_price_tzs BIGINT NOT NULL DEFAULT 0,
				stock_quantity INT NOT NULL DEFAULT 0,
				reorder_level INT NOT NULL DEFAULT 10,
				location TEXT,
				status TEXT DEFAULT 'In Stock',
				created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
				created_by TEXT
			);
		`;

		// 3. Create Customers Table
		await db`
			CREATE TABLE IF NOT EXISTS anagkazo_customers (
				id TEXT PRIMARY KEY,
				name TEXT NOT NULL,
				company_name TEXT,
				contact_person TEXT,
				email TEXT,
				phone TEXT,
				address TEXT,
				city TEXT,
				customer_type TEXT,
				credit_limit BIGINT DEFAULT 0,
				payment_terms TEXT,
				tin TEXT,
				status TEXT DEFAULT 'Paid',
				total_purchases BIGINT DEFAULT 0,
				outstanding_balance BIGINT DEFAULT 0,
				invoices_count INT DEFAULT 0,
				created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
				created_by TEXT
			);
		`;

		// 4. Create Invoices Table
		await db`
			CREATE TABLE IF NOT EXISTS anagkazo_invoices (
				id TEXT PRIMARY KEY,
				customer TEXT NOT NULL,
				date TEXT NOT NULL,
				amount_tzs BIGINT NOT NULL DEFAULT 0,
				paid_tzs BIGINT NOT NULL DEFAULT 0,
				status TEXT NOT NULL DEFAULT 'Pending',
				items_count INT NOT NULL DEFAULT 1,
				due_date TEXT,
				payment_terms TEXT,
				billing_address TEXT,
				notes TEXT,
				tax_rate INT DEFAULT 18,
				discount BIGINT DEFAULT 0,
				items_json TEXT,
				full_data_json TEXT,
				payment_detail_id TEXT,
				created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
				created_by TEXT
			);
		`;

		// 5. Create Payment Details Table
		await db`
			CREATE TABLE IF NOT EXISTS anagkazo_payment_details (
				id TEXT PRIMARY KEY,
				bank_name TEXT NOT NULL,
				account_name TEXT NOT NULL,
				account_number TEXT NOT NULL,
				currency TEXT DEFAULT 'TZS',
				branch TEXT,
				swift_code TEXT,
				is_default BOOLEAN DEFAULT false,
				created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
			);
		`;

		// 6. Create System Meta Table
		await db`
			CREATE TABLE IF NOT EXISTS anagkazo_system_meta (
				key TEXT PRIMARY KEY,
				value TEXT
			);
		`;

		// Migration: Add columns if they don't exist yet
		try {
			await db`ALTER TABLE anagkazo_customers ADD COLUMN IF NOT EXISTS created_by TEXT;`;
			await db`ALTER TABLE anagkazo_products ADD COLUMN IF NOT EXISTS created_by TEXT;`;
			await db`ALTER TABLE anagkazo_invoices ADD COLUMN IF NOT EXISTS payment_terms TEXT;`;
			await db`ALTER TABLE anagkazo_invoices ADD COLUMN IF NOT EXISTS billing_address TEXT;`;
			await db`ALTER TABLE anagkazo_invoices ADD COLUMN IF NOT EXISTS notes TEXT;`;
			await db`ALTER TABLE anagkazo_invoices ADD COLUMN IF NOT EXISTS tax_rate INT DEFAULT 18;`;
			await db`ALTER TABLE anagkazo_invoices ADD COLUMN IF NOT EXISTS discount BIGINT DEFAULT 0;`;
			await db`ALTER TABLE anagkazo_invoices ADD COLUMN IF NOT EXISTS items_json TEXT;`;
			await db`ALTER TABLE anagkazo_invoices ADD COLUMN IF NOT EXISTS full_data_json TEXT;`;
			await db`ALTER TABLE anagkazo_invoices ADD COLUMN IF NOT EXISTS payment_detail_id TEXT;`;
			await db`ALTER TABLE anagkazo_invoices ADD COLUMN IF NOT EXISTS created_by TEXT;`;
		} catch (mErr) {
			console.warn('[Neon DB] Column migration check notice:', mErr);
		}

		// Seed initial users if they don't exist yet
		const existingAdmin = await db`
			SELECT id FROM anagkazo_users WHERE id = 'usr-admin-001' OR LOWER(email) = 'masungapaulmaganga@gmail.com' LIMIT 1;
		`;
		if (!existingAdmin || existingAdmin.length === 0) {
			const adminHashedPass = hashPassword('123456789Baraka');
			await db`
				INSERT INTO anagkazo_users (id, email, password, name, role, department)
				VALUES (
					'usr-admin-001',
					'masungapaulmaganga@gmail.com',
					${adminHashedPass},
					'Masunga Paul Maganga',
					'admin',
					'Executive Management'
				);
			`;
		}

		const existingStaff = await db`
			SELECT id FROM anagkazo_users WHERE id = 'usr-std-002' OR LOWER(email) = 'bmaganga32@gmail.com' LIMIT 1;
		`;
		if (!existingStaff || existingStaff.length === 0) {
			const staffHashedPass = hashPassword('123456789Brk');
			await db`
				INSERT INTO anagkazo_users (id, email, password, name, role, department)
				VALUES (
					'usr-std-002',
					'bmaganga32@gmail.com',
					${staffHashedPass},
					'Baraka Maganga',
					'standard_user',
					'Sales & Workshop Operations'
				);
			`;
		}

		isDbInitialized = true;
		console.log('[Neon DB] Schema and user security verified in Neon PostgreSQL.');
	} catch (error) {
		console.error('[Neon DB] Error initializing Neon PostgreSQL database:', error);
		throw error;
	}
}

/**
 * Verifies user credentials against Neon database with secure cryptographic comparison.
 */
export async function authenticateWithNeonDB(
	email: string,
	password: string,
	customEnv?: Record<string, any>
): Promise<User | null> {
	try {
		await initializeNeonDatabase(customEnv);
		const db = getSql(customEnv);

		const cleanEmail = email.trim().toLowerCase();
		const rows = await db`
			SELECT id, email, password, name, role, department, created_at
			FROM anagkazo_users
			WHERE LOWER(email) = ${cleanEmail}
			LIMIT 1;
		`;

		if (!rows || rows.length === 0) {
			return null;
		}

		const userRecord = rows[0];

		// Timing-safe cryptographic password verification
		const isPasswordCorrect = verifyPassword(password, userRecord.password);
		if (!isPasswordCorrect) {
			return null;
		}

		// Auto-upgrade legacy plain text password to PBKDF2 hash on successful login
		if (!userRecord.password.startsWith('pbkdf2$')) {
			try {
				const newHash = hashPassword(password);
				await db`
					UPDATE anagkazo_users
					SET password = ${newHash}, updated_at = CURRENT_TIMESTAMP
					WHERE id = ${userRecord.id};
				`;
			} catch (upgradeErr) {
				console.warn('[Neon DB] Could not auto-upgrade password hash:', upgradeErr);
			}
		}

		const isAdmin = userRecord.role === 'admin';
		const token = generateSignedToken(userRecord.id, userRecord.role);

		const user: User = {
			id: userRecord.id,
			email: userRecord.email,
			name: userRecord.name,
			role: userRecord.role as UserRole,
			initials: isAdmin ? 'MP' : 'BM',
			title: isAdmin ? 'Managing Director & Admin' : 'Sales & Invoicing Officer',
			avatarBg: isAdmin ? 'from-navy-950 to-navy-800' : 'from-sky-700 to-navy-900',
			department: userRecord.department,
			token,
			createdAt: userRecord.created_at ? new Date(userRecord.created_at).toISOString() : new Date().toISOString()
		};

		return user;
	} catch (error) {
		console.error('[Neon Auth] Authentication query failed:', error);
		throw error;
	}
}

/**
 * Updates staff user login credentials (email & password) in the Neon PostgreSQL database with PBKDF2 hashing.
 */
export async function updateStaffCredentialsInDB(
	email: string,
	password: string,
	name?: string,
	department?: string,
	customEnv?: Record<string, any>
): Promise<User | null> {
	try {
		await initializeNeonDatabase(customEnv);
		const db = getSql(customEnv);
		const cleanEmail = email.trim().toLowerCase();
		const cleanPass = password.trim();
		const staffName = name?.trim() || 'Baraka Maganga';
		const staffDept = department?.trim() || 'Sales & Workshop Operations';
		const hashedPassword = hashPassword(cleanPass);

		const rows = await db`
			UPDATE anagkazo_users
			SET 
				email = ${cleanEmail},
				password = ${hashedPassword},
				name = ${staffName},
				department = ${staffDept},
				updated_at = CURRENT_TIMESTAMP
			WHERE role = 'standard_user' OR id = 'usr-std-002'
			RETURNING id, email, name, role, department, created_at, updated_at;
		`;

		if (!rows || rows.length === 0) {
			const inserted = await db`
				INSERT INTO anagkazo_users (id, email, password, name, role, department)
				VALUES ('usr-std-002', ${cleanEmail}, ${hashedPassword}, ${staffName}, 'standard_user', ${staffDept})
				RETURNING id, email, name, role, department, created_at, updated_at;
			`;
			if (inserted && inserted.length > 0) {
				const r = inserted[0];
				return {
					id: r.id,
					email: r.email,
					name: r.name,
					role: r.role as UserRole,
					initials: 'BM',
					title: 'Sales & Invoicing Officer',
					avatarBg: 'from-sky-700 to-navy-900',
					department: r.department,
					token: generateSignedToken(r.id, r.role)
				};
			}
			return null;
		}

		const r = rows[0];
		return {
			id: r.id,
			email: r.email,
			name: r.name,
			role: r.role as UserRole,
			initials: 'BM',
			title: 'Sales & Invoicing Officer',
			avatarBg: 'from-sky-700 to-navy-900',
			department: r.department,
			token: generateSignedToken(r.id, r.role)
		};
	} catch (error) {
		console.error('[Neon DB] Failed to update staff credentials:', error);
		throw error;
	}
}

/**
 * Updates administrator login credentials (email & password) in the Neon PostgreSQL database with PBKDF2 hashing.
 */
export async function updateAdminCredentialsInDB(
	email: string,
	password: string,
	name?: string,
	department?: string,
	customEnv?: Record<string, any>
): Promise<User | null> {
	try {
		await initializeNeonDatabase(customEnv);
		const db = getSql(customEnv);
		const cleanEmail = email.trim().toLowerCase();
		const cleanPass = password.trim();
		const adminName = name?.trim() || 'Masunga Paul Maganga';
		const adminDept = department?.trim() || 'Executive Management';
		const hashedPassword = hashPassword(cleanPass);

		const rows = await db`
			UPDATE anagkazo_users
			SET 
				email = ${cleanEmail},
				password = ${hashedPassword},
				name = ${adminName},
				department = ${adminDept},
				updated_at = CURRENT_TIMESTAMP
			WHERE role = 'admin' OR id = 'usr-admin-001'
			RETURNING id, email, name, role, department, created_at, updated_at;
		`;

		if (!rows || rows.length === 0) {
			const inserted = await db`
				INSERT INTO anagkazo_users (id, email, password, name, role, department)
				VALUES ('usr-admin-001', ${cleanEmail}, ${hashedPassword}, ${adminName}, 'admin', ${adminDept})
				RETURNING id, email, name, role, department, created_at, updated_at;
			`;
			if (inserted && inserted.length > 0) {
				const r = inserted[0];
				return {
					id: r.id,
					email: r.email,
					name: r.name,
					role: r.role as UserRole,
					initials: 'MP',
					title: 'Managing Director & Admin',
					avatarBg: 'from-navy-950 to-navy-800',
					department: r.department,
					token: generateSignedToken(r.id, r.role)
				};
			}
			return null;
		}

		const r = rows[0];
		return {
			id: r.id,
			email: r.email,
			name: r.name,
			role: r.role as UserRole,
			initials: 'MP',
			title: 'Managing Director & Admin',
			avatarBg: 'from-navy-950 to-navy-800',
			department: r.department,
			token: generateSignedToken(r.id, r.role)
		};
	} catch (error) {
		console.error('[Neon DB] Failed to update admin credentials:', error);
		throw error;
	}
}

/**
 * CUSTOMERS CRUD
 */
export async function getAllCustomersFromDB(customEnv?: Record<string, any>): Promise<Customer[]> {
	try {
		await initializeNeonDatabase(customEnv);
		const db = getSql(customEnv);
		const rows = await db`
			SELECT id, name, company_name, contact_person, email, phone, address, city, 
			       customer_type, credit_limit, payment_terms, tin, status, total_purchases, 
			       outstanding_balance, invoices_count, created_at, updated_at, created_by
			FROM anagkazo_customers
			ORDER BY created_at DESC;
		`;
		return rows.map((r: any) => ({
			id: r.id,
			name: r.name,
			companyName: r.company_name,
			contactPerson: r.contact_person,
			email: r.email,
			phone: r.phone,
			address: r.address,
			city: r.city,
			customerType: r.customer_type,
			creditLimit: Number(r.credit_limit) || 0,
			paymentTerms: r.payment_terms || 'Net 14',
			tin: r.tin || '',
			status: r.status || 'Paid',
			totalPurchases: Number(r.total_purchases) || 0,
			outstandingBalance: Number(r.outstanding_balance) || 0,
			invoicesCount: Number(r.invoices_count) || 0,
			createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
			updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
			createdBy: r.created_by || 'Admin'
		}));
	} catch (error) {
		console.error('[Neon DB] Error fetching customers:', error);
		return [];
	}
}

export async function saveCustomerToDB(customer: Customer, customEnv?: Record<string, any>, userRole = 'Admin'): Promise<boolean> {
	try {
		await initializeNeonDatabase(customEnv);
		const db = getSql(customEnv);
		await db`
			INSERT INTO anagkazo_customers (
				id, name, company_name, contact_person, email, phone, address, city,
				customer_type, credit_limit, payment_terms, tin, status, total_purchases,
				outstanding_balance, invoices_count, created_by, updated_at
			) VALUES (
				${customer.id},
				${customer.name},
				${customer.companyName || customer.name},
				${customer.contactPerson},
				${customer.email},
				${customer.phone},
				${customer.address},
				${customer.city},
				${customer.customerType},
				${customer.creditLimit || 0},
				${customer.paymentTerms},
				${customer.tin || ''},
				${customer.status || 'Paid'},
				${customer.totalPurchases || 0},
				${customer.outstandingBalance || 0},
				${customer.invoicesCount || 0},
				${customer.createdBy || userRole},
				CURRENT_TIMESTAMP
			)
			ON CONFLICT (id) DO UPDATE SET
				name = EXCLUDED.name,
				company_name = EXCLUDED.company_name,
				contact_person = EXCLUDED.contact_person,
				email = EXCLUDED.email,
				phone = EXCLUDED.phone,
				address = EXCLUDED.address,
				city = EXCLUDED.city,
				customer_type = EXCLUDED.customer_type,
				credit_limit = EXCLUDED.credit_limit,
				payment_terms = EXCLUDED.payment_terms,
				tin = EXCLUDED.tin,
				status = EXCLUDED.status,
				total_purchases = EXCLUDED.total_purchases,
				outstanding_balance = EXCLUDED.outstanding_balance,
				invoices_count = EXCLUDED.invoices_count,
				updated_at = CURRENT_TIMESTAMP;
		`;
		return true;
	} catch (error) {
		console.error('[Neon DB] Error saving customer:', error);
		return false;
	}
}

export async function deleteCustomerFromDB(id: string, customEnv?: Record<string, any>): Promise<boolean> {
	try {
		await initializeNeonDatabase(customEnv);
		const db = getSql(customEnv);
		await db`DELETE FROM anagkazo_customers WHERE id = ${id};`;
		return true;
	} catch (error) {
		console.error('[Neon DB] Error deleting customer:', error);
		return false;
	}
}

export async function deleteAllCustomersFromDB(customEnv?: Record<string, any>): Promise<boolean> {
	try {
		await initializeNeonDatabase(customEnv);
		const db = getSql(customEnv);
		await db`DELETE FROM anagkazo_customers;`;
		return true;
	} catch (error) {
		console.error('[Neon DB] Error deleting all customers:', error);
		return false;
	}
}

/**
 * PRODUCTS / STOCKS CRUD
 */
export async function getAllProductsFromDB(customEnv?: Record<string, any>): Promise<TyreProductStock[]> {
	try {
		await initializeNeonDatabase(customEnv);
		const db = getSql(customEnv);
		const rows = await db`
			SELECT id, sku, brand, model, size, application, unit_price_tzs, stock_quantity,
			       reorder_level, location, status, created_at, updated_at, created_by
			FROM anagkazo_products
			ORDER BY brand ASC, model ASC;
		`;
		return rows.map((r: any) => ({
			id: r.id,
			sku: r.sku,
			brand: r.brand,
			model: r.model,
			size: r.size,
			application: r.application || '',
			unitPriceTZS: Number(r.unit_price_tzs) || 0,
			stockQuantity: Number(r.stock_quantity) || 0,
			reorderLevel: Number(r.reorder_level) || 10,
			location: r.location || '',
			status: r.status as TyreProductStock['status'],
			createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
			updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
			createdBy: r.created_by || 'Admin'
		}));
	} catch (error) {
		console.error('[Neon DB] Error fetching products:', error);
		return [];
	}
}

export async function saveProductToDB(product: TyreProductStock, customEnv?: Record<string, any>, userRole = 'Admin'): Promise<boolean> {
	try {
		await initializeNeonDatabase(customEnv);
		const db = getSql(customEnv);
		await db`
			INSERT INTO anagkazo_products (
				id, sku, brand, model, size, application, unit_price_tzs, stock_quantity,
				reorder_level, location, status, created_by, updated_at
			) VALUES (
				${product.id},
				${product.sku},
				${product.brand},
				${product.model},
				${product.size},
				${product.application || ''},
				${product.unitPriceTZS || 0},
				${product.stockQuantity || 0},
				${product.reorderLevel || 10},
				${product.location || ''},
				${product.status || 'In Stock'},
				${product.createdBy || userRole},
				CURRENT_TIMESTAMP
			)
			ON CONFLICT (id) DO UPDATE SET
				sku = EXCLUDED.sku,
				brand = EXCLUDED.brand,
				model = EXCLUDED.model,
				size = EXCLUDED.size,
				application = EXCLUDED.application,
				unit_price_tzs = EXCLUDED.unit_price_tzs,
				stock_quantity = EXCLUDED.stock_quantity,
				reorder_level = EXCLUDED.reorder_level,
				location = EXCLUDED.location,
				status = EXCLUDED.status,
				updated_at = CURRENT_TIMESTAMP;
		`;
		return true;
	} catch (error) {
		console.error('[Neon DB] Error saving product:', error);
		return false;
	}
}

export async function deleteProductFromDB(id: string, customEnv?: Record<string, any>): Promise<boolean> {
	try {
		await initializeNeonDatabase(customEnv);
		const db = getSql(customEnv);
		await db`DELETE FROM anagkazo_products WHERE id = ${id};`;
		return true;
	} catch (error) {
		console.error('[Neon DB] Error deleting product:', error);
		return false;
	}
}

export async function deleteAllProductsFromDB(customEnv?: Record<string, any>): Promise<boolean> {
	try {
		await initializeNeonDatabase(customEnv);
		const db = getSql(customEnv);
		await db`DELETE FROM anagkazo_products;`;
		return true;
	} catch (error) {
		console.error('[Neon DB] Error deleting all products:', error);
		return false;
	}
}

/**
 * INVOICES CRUD
 */
export async function getAllInvoicesFromDB(customEnv?: Record<string, any>): Promise<GeneratedInvoiceItem[]> {
	try {
		await initializeNeonDatabase(customEnv);
		const db = getSql(customEnv);
		const rows = await db`
			SELECT id, customer, date, due_date, amount_tzs, paid_tzs, status, items_count,
			       payment_terms, billing_address, notes, tax_rate, discount, items_json,
			       full_data_json, payment_detail_id, created_at, updated_at, created_by
			FROM anagkazo_invoices
			ORDER BY created_at DESC;
		`;
		return rows.map((r: any) => {
			let items = [];
			let fullData = undefined;
			try {
				if (r.items_json) items = JSON.parse(r.items_json);
			} catch {}
			try {
				if (r.full_data_json) fullData = JSON.parse(r.full_data_json);
			} catch {}

			return {
				id: r.id,
				customer: r.customer,
				date: r.date,
				dueDate: r.due_date,
				amount: Number(r.amount_tzs) || 0,
				status: r.status,
				itemsCount: Number(r.items_count) || (items.length || 1),
				paymentTerms: r.payment_terms || 'Net 14',
				billingAddress: r.billing_address || '',
				notes: r.notes || '',
				discount: Number(r.discount) || 0,
				taxRate: Number(r.tax_rate) || 18,
				items,
				fullData,
				paymentDetailId: r.payment_detail_id || undefined,
				createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
				updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString(),
				createdBy: r.created_by || 'Admin / Staff'
			};
		});
	} catch (error) {
		console.error('[Neon DB] Error fetching invoices:', error);
		return [];
	}
}

export async function saveInvoiceToDB(invoice: GeneratedInvoiceItem, customEnv?: Record<string, any>, userRole = 'Staff'): Promise<boolean> {
	try {
		await initializeNeonDatabase(customEnv);
		const db = getSql(customEnv);
		const itemsJson = invoice.items ? JSON.stringify(invoice.items) : null;
		const fullDataJson = invoice.fullData ? JSON.stringify(invoice.fullData) : null;
		const paidAmount = invoice.status === 'Paid' ? (Number(invoice.amount) || 0) : 0;

		await db`
			INSERT INTO anagkazo_invoices (
				id, customer, date, due_date, amount_tzs, paid_tzs, status, items_count,
				payment_terms, billing_address, notes, tax_rate, discount, items_json,
				full_data_json, payment_detail_id, created_by, updated_at
			) VALUES (
				${invoice.id},
				${invoice.customer},
				${invoice.date},
				${invoice.dueDate || null},
				${Number(invoice.amount) || 0},
				${paidAmount},
				${invoice.status || 'Pending'},
				${invoice.itemsCount || (invoice.items?.length || 1)},
				${invoice.paymentTerms || 'Net 14'},
				${invoice.billingAddress || ''},
				${invoice.notes || ''},
				${invoice.taxRate || 18},
				${invoice.discount || 0},
				${itemsJson},
				${fullDataJson},
				${invoice.paymentDetailId || null},
				${invoice.createdBy || userRole},
				CURRENT_TIMESTAMP
			)
			ON CONFLICT (id) DO UPDATE SET
				customer = EXCLUDED.customer,
				date = EXCLUDED.date,
				due_date = EXCLUDED.due_date,
				amount_tzs = EXCLUDED.amount_tzs,
				paid_tzs = EXCLUDED.paid_tzs,
				status = EXCLUDED.status,
				items_count = EXCLUDED.items_count,
				payment_terms = EXCLUDED.payment_terms,
				billing_address = EXCLUDED.billing_address,
				notes = EXCLUDED.notes,
				tax_rate = EXCLUDED.tax_rate,
				discount = EXCLUDED.discount,
				items_json = EXCLUDED.items_json,
				full_data_json = EXCLUDED.full_data_json,
				payment_detail_id = EXCLUDED.payment_detail_id,
				updated_at = CURRENT_TIMESTAMP;
		`;
		return true;
	} catch (error) {
		console.error('[Neon DB] Error saving invoice:', error);
		return false;
	}
}

export async function deleteInvoiceFromDB(id: string, customEnv?: Record<string, any>): Promise<boolean> {
	try {
		await initializeNeonDatabase(customEnv);
		const db = getSql(customEnv);
		await db`DELETE FROM anagkazo_invoices WHERE id = ${id};`;
		return true;
	} catch (error) {
		console.error('[Neon DB] Error deleting invoice:', error);
		return false;
	}
}

export async function deleteAllInvoicesFromDB(customEnv?: Record<string, any>): Promise<boolean> {
	try {
		await initializeNeonDatabase(customEnv);
		const db = getSql(customEnv);
		await db`DELETE FROM anagkazo_invoices;`;
		return true;
	} catch (error) {
		console.error('[Neon DB] Error deleting all invoices:', error);
		return false;
	}
}

/**
 * PAYMENT DETAILS CRUD
 */
export async function getAllPaymentDetailsFromDB(customEnv?: Record<string, any>): Promise<PaymentDetail[]> {
	try {
		await initializeNeonDatabase(customEnv);
		const db = getSql(customEnv);
		const rows = await db`
			SELECT id, bank_name, account_name, account_number, currency, branch, swift_code, is_default, created_at, updated_at
			FROM anagkazo_payment_details
			ORDER BY is_default DESC, created_at ASC;
		`;
		return rows.map((r: any) => ({
			id: r.id,
			bankName: r.bank_name,
			accountName: r.account_name,
			accountNumber: r.account_number,
			currency: r.currency || 'TZS',
			branch: r.branch || '',
			swiftCode: r.swift_code || '',
			isDefault: Boolean(r.is_default),
			createdAt: r.created_at ? new Date(r.created_at).toISOString() : new Date().toISOString(),
			updatedAt: r.updated_at ? new Date(r.updated_at).toISOString() : new Date().toISOString()
		}));
	} catch (error) {
		console.error('[Neon DB] Error fetching payment details:', error);
		return [];
	}
}

export async function savePaymentDetailToDB(detail: PaymentDetail, customEnv?: Record<string, any>): Promise<boolean> {
	try {
		await initializeNeonDatabase(customEnv);
		const db = getSql(customEnv);
		if (detail.isDefault) {
			await db`UPDATE anagkazo_payment_details SET is_default = false;`;
		}
		await db`
			INSERT INTO anagkazo_payment_details (
				id, bank_name, account_name, account_number, currency, branch, swift_code, is_default, updated_at
			) VALUES (
				${detail.id},
				${detail.bankName},
				${detail.accountName},
				${detail.accountNumber},
				${detail.currency || 'TZS'},
				${detail.branch || ''},
				${detail.swiftCode || ''},
				${Boolean(detail.isDefault)},
				CURRENT_TIMESTAMP
			)
			ON CONFLICT (id) DO UPDATE SET
				bank_name = EXCLUDED.bank_name,
				account_name = EXCLUDED.account_name,
				account_number = EXCLUDED.account_number,
				currency = EXCLUDED.currency,
				branch = EXCLUDED.branch,
				swift_code = EXCLUDED.swift_code,
				is_default = EXCLUDED.is_default,
				updated_at = CURRENT_TIMESTAMP;
		`;
		return true;
	} catch (error) {
		console.error('[Neon DB] Error saving payment detail:', error);
		return false;
	}
}

export async function deletePaymentDetailFromDB(id: string, customEnv?: Record<string, any>): Promise<boolean> {
	try {
		await initializeNeonDatabase(customEnv);
		const db = getSql(customEnv);
		await db`DELETE FROM anagkazo_payment_details WHERE id = ${id};`;
		return true;
	} catch (error) {
		console.error('[Neon DB] Error deleting payment detail:', error);
		return false;
	}
}

/**
 * Wipes all customers, products, and invoices from Neon database while preserving admin and staff user accounts.
 */
export async function wipeAllDataFromDB(customEnv?: Record<string, any>): Promise<boolean> {
	try {
		await initializeNeonDatabase(customEnv);
		const db = getSql(customEnv);
		await db`
			DO $$ 
			BEGIN
				IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'anagkazo_invoices') THEN
					DELETE FROM anagkazo_invoices;
				END IF;
				IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'anagkazo_customers') THEN
					DELETE FROM anagkazo_customers;
				END IF;
				IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'anagkazo_products') THEN
					DELETE FROM anagkazo_products;
				END IF;
			END $$;
		`;
		// Record that user deliberately wiped data
		await db`
			INSERT INTO anagkazo_system_meta (key, value) VALUES ('wiped', 'true')
			ON CONFLICT (key) DO UPDATE SET value = 'true';
		`;
		console.log('[Neon DB] Successfully deleted all customers, products, and invoices from PostgreSQL while preserving user credentials.');
		return true;
	} catch (error) {
		console.error('[Neon DB] Failed to wipe database records:', error);
		return false;
	}
}
