export type UserRole = 'admin' | 'standard_user';

export interface User {
	id: string;
	email: string;
	name: string;
	role: UserRole;
	initials?: string;
	title?: string;
	avatarBg?: string;
	department?: string;
	token?: string;
	createdAt?: string;
	lastLogin?: string;
}



export interface AuthState {
	user: User | null;
	isAuthenticated: boolean;
	isLoading: boolean;
}

export interface LoginCredentials {
	email: string;
	password: string;
}

export interface StaffCredentials {
	id: string;
	email: string;
	password: string;
	name: string;
	role: UserRole;
	department?: string;
	title?: string;
	avatarBg?: string;
	initials?: string;
	updatedAt?: string;
}

export interface AdminCredentials {
	id: string;
	email: string;
	password?: string;
	name: string;
	role: 'admin';
	department?: string;
	title?: string;
	avatarBg?: string;
	initials?: string;
	updatedAt?: string;
}


/**
 * Role Permission Check Helpers
 */
export function canAccessDashboard(role?: UserRole | null): boolean {
	return role === 'admin';
}

export function canAccessReports(role?: UserRole | null): boolean {
	return role === 'admin';
}

export function canAddCustomers(role?: UserRole | null): boolean {
	return role === 'admin';
}

export function canManageProducts(role?: UserRole | null): boolean {
	return role === 'admin';
}

export function canGenerateInvoices(role?: UserRole | null): boolean {
	return role === 'admin' || role === 'standard_user';
}
