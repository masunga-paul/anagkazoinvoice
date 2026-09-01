import { neon } from '@neondatabase/serverless';
import { env } from '$env/dynamic/private';
import type { User, UserRole } from '$lib/types/auth';
import { hashPassword, verifyPassword, generateSignedToken } from './security';

const CONNECTION_STRING = env.DATABASE_URL || '';

// Initialize Neon Serverless SQL Client
export const sql = neon(CONNECTION_STRING || 'postgresql://placeholder:placeholder@localhost:5432/neondb');

let isDbInitialized = false;

/**
 * Initializes the Neon PostgreSQL database tables and seeds the default Admin and Standard User accounts with PBKDF2 hashed passwords.
 */
export async function initializeNeonDatabase() {
	if (isDbInitialized) return;

	try {
		// 1. Create Users Table
		await sql`
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
		await sql`
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
				updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
			);
		`;

		// 3. Create Customers Table
		await sql`
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
				updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
			);
		`;

		// 4. Create Invoices Table
		await sql`
			CREATE TABLE IF NOT EXISTS anagkazo_invoices (
				id TEXT PRIMARY KEY,
				customer TEXT NOT NULL,
				date TEXT NOT NULL,
				amount_tzs BIGINT NOT NULL DEFAULT 0,
				paid_tzs BIGINT NOT NULL DEFAULT 0,
				status TEXT NOT NULL DEFAULT 'Pending',
				items_count INT NOT NULL DEFAULT 1,
				due_date TEXT,
				created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
				updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
			);
		`;

		// Seed initial users if they don't exist yet
		const existingAdmin = await sql`
			SELECT id FROM anagkazo_users WHERE id = 'usr-admin-001' OR LOWER(email) = 'masungapaulmaganga@gmail.com' LIMIT 1;
		`;
		if (!existingAdmin || existingAdmin.length === 0) {
			const adminHashedPass = hashPassword('123456789Baraka');
			await sql`
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

		const existingStaff = await sql`
			SELECT id FROM anagkazo_users WHERE id = 'usr-std-002' OR LOWER(email) = 'bmaganga32@gmail.com' LIMIT 1;
		`;
		if (!existingStaff || existingStaff.length === 0) {
			const staffHashedPass = hashPassword('123456789Brk');
			await sql`
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
export async function authenticateWithNeonDB(email: string, password: string): Promise<User | null> {
	try {
		await initializeNeonDatabase();

		const cleanEmail = email.trim().toLowerCase();
		const rows = await sql`
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

		// Seamless auto-upgrade legacy plain text password to PBKDF2 hash on successful login
		if (!userRecord.password.startsWith('pbkdf2$')) {
			try {
				const newHash = hashPassword(password);
				await sql`
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
	department?: string
): Promise<User | null> {
	try {
		await initializeNeonDatabase();
		const cleanEmail = email.trim().toLowerCase();
		const cleanPass = password.trim();
		const staffName = name?.trim() || 'Baraka Maganga';
		const staffDept = department?.trim() || 'Sales & Workshop Operations';
		const hashedPassword = hashPassword(cleanPass);

		const rows = await sql`
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
			const inserted = await sql`
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
	department?: string
): Promise<User | null> {
	try {
		await initializeNeonDatabase();
		const cleanEmail = email.trim().toLowerCase();
		const cleanPass = password.trim();
		const adminName = name?.trim() || 'Masunga Paul Maganga';
		const adminDept = department?.trim() || 'Executive Management';
		const hashedPassword = hashPassword(cleanPass);

		const rows = await sql`
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
			const inserted = await sql`
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
 * Wipes all customers, products, and invoices from Neon database while preserving admin and staff user accounts.
 */
export async function wipeAllDataFromDB(): Promise<boolean> {

	try {
		await initializeNeonDatabase();
		await sql`
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
		console.log('[Neon DB] Successfully deleted all customers, products, and invoices from PostgreSQL while preserving user credentials.');
		return true;
	} catch (error) {
		console.error('[Neon DB] Failed to wipe database records:', error);
		return false;
	}
}
