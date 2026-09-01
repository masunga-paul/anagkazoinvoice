import type { User, UserRole, LoginCredentials } from '$lib/types/auth';

const STORAGE_KEY = 'anagkazo_neon_auth_session';

/**
 * Public client safe metadata (No database secrets or credentials exposed to client bundle)
 */
export const NEON_CONFIG = {
	authStatus: 'active',
	provider: 'Neon PostgreSQL',
	environment: 'production'
};

/**
 * Authenticate securely with the server-side Neon Auth API endpoint.
 */
export async function loginWithNeon(credentials: LoginCredentials): Promise<{ success: boolean; user?: User; error?: string }> {
	const email = credentials.email.trim().toLowerCase();
	const password = credentials.password.trim();

	if (!email || !password) {
		return { success: false, error: 'Email and password are required.' };
	}

	try {
		const response = await fetch('/api/auth/login', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({ email, password })
		});

		const data = await response.json().catch(() => ({}));

		if (response.ok && data.success && data.user) {
			const user: User = {
				...data.user,
				initials: data.user.role === 'admin' ? 'MP' : 'BM',
				title: data.user.role === 'admin' ? 'Managing Director & Admin' : 'Sales & Invoicing Officer',
				avatarBg: data.user.role === 'admin' ? 'from-navy-950 to-navy-800' : 'from-sky-700 to-navy-900',
				lastLogin: new Date().toISOString()
			};

			saveSession(user);
			return { success: true, user };
		} else {
			return {
				success: false,
				error: data.error || (response.status === 429 ? 'Too many attempts. Please wait.' : 'Invalid credentials.')
			};
		}
	} catch (e) {
		console.error('[Neon Auth] Network or server error during authentication:', e);
		return {
			success: false,
			error: 'Unable to reach authentication server. Please check your network connection.'
		};
	}
}

/**
 * Saves authenticated user session to browser localStorage securely.
 */
function saveSession(user: User): void {
	if (typeof window !== 'undefined') {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
		} catch (e) {
			console.warn('[Neon Auth] Could not save session to localStorage:', e);
		}
	}
}

/**
 * Restores authenticated session from localStorage.
 */
export function getStoredSession(): User | null {
	if (typeof window === 'undefined') return null;
	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			return JSON.parse(stored) as User;
		}
	} catch (e) {
		console.warn('[Neon Auth] Failed to parse auth session:', e);
	}
	return null;
}

/**
 * Retrieves the current session's JWT authorization token for authenticated API requests.
 */
export function getStoredToken(): string | null {
	const session = getStoredSession();
	return session?.token || null;
}

/**
 * Clears authenticated session from browser storage upon logout.
 */
export function logoutFromNeon(): void {
	if (typeof window !== 'undefined') {
		try {
			localStorage.removeItem(STORAGE_KEY);
		} catch (e) {
			console.warn('[Neon Auth] Failed to clear auth session:', e);
		}
	}
}
