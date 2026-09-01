import crypto from 'node:crypto';
import { Buffer } from 'node:buffer';
import { env } from '$env/dynamic/private';


// Server-side secret for HMAC token signing (falls back to a generated stable secret if not set)
const SERVER_SECRET = env.AUTH_SECRET || env.DATABASE_URL || 'anagkazo_secure_salt_key_2026_crm_autopart_sign';

// In-memory rate limiting cache: key -> { attempts: number, resetTime: number }
const rateLimitMap = new Map<string, { attempts: number; resetTime: number }>();

/**
 * Checks if a given key (e.g. IP + email) has exceeded the rate limit threshold.
 */
export function checkRateLimit(
	key: string,
	maxAttempts = 5,
	windowMs = 15 * 60 * 1000
): { allowed: boolean; retryAfterSeconds: number } {
	const now = Date.now();
	const record = rateLimitMap.get(key);

	// Clean up expired entry
	if (!record || now > record.resetTime) {
		rateLimitMap.set(key, { attempts: 1, resetTime: now + windowMs });
		return { allowed: true, retryAfterSeconds: 0 };
	}

	if (record.attempts >= maxAttempts) {
		const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);
		return { allowed: false, retryAfterSeconds };
	}

	record.attempts += 1;
	return { allowed: true, retryAfterSeconds: 0 };
}

/**
 * Resets the rate limit for a key upon successful authentication.
 */
export function resetRateLimit(key: string): void {
	rateLimitMap.delete(key);
}

/**
 * Cryptographically hashes a password with salt using PBKDF2 (100,000 iterations of SHA-512).
 */
export function hashPassword(password: string, existingSalt?: string): string {
	const salt = existingSalt || crypto.randomBytes(16).toString('hex');
	const iterations = 100000;
	const keylen = 64;
	const digest = 'sha512';
	const derivedKey = crypto.pbkdf2Sync(password, salt, iterations, keylen, digest);
	return `pbkdf2$${iterations}$${salt}$${derivedKey.toString('hex')}`;
}

/**
 * Timing-safe password verification that handles both hashed passwords and legacy plain text seeds.
 */
export function verifyPassword(password: string, storedHashOrPlain: string): boolean {
	if (!storedHashOrPlain || !password) return false;

	// Hashed format: pbkdf2$iterations$salt$hash
	if (storedHashOrPlain.startsWith('pbkdf2$')) {
		const parts = storedHashOrPlain.split('$');
		if (parts.length !== 4) return false;
		const iterations = parseInt(parts[1], 10);
		const salt = parts[2];
		const expectedHash = parts[3];

		const derivedKey = crypto.pbkdf2Sync(password, salt, iterations, 64, 'sha512');
		const expectedBuffer = Buffer.from(expectedHash, 'hex');

		if (derivedKey.length !== expectedBuffer.length) {
			return false;
		}

		return crypto.timingSafeEqual(derivedKey, expectedBuffer);
	}

	// Legacy plain text check (using timing-safe comparison to avoid timing attacks)
	const passBuf = Buffer.from(password, 'utf8');
	const storedBuf = Buffer.from(storedHashOrPlain, 'utf8');
	if (passBuf.length !== storedBuf.length) {
		return false;
	}
	return crypto.timingSafeEqual(passBuf, storedBuf);
}

/**
 * Generates a tamper-proof cryptographically signed session token using HMAC-SHA256.
 */
export function generateSignedToken(userId: string, role: string, expiresInHours = 24): string {
	const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
	const payload = Buffer.from(
		JSON.stringify({
			sub: userId,
			role,
			iat: Math.floor(Date.now() / 1000),
			exp: Math.floor(Date.now() / 1000) + expiresInHours * 3600
		})
	).toString('base64url');

	const signature = crypto
		.createHmac('sha256', SERVER_SECRET)
		.update(`${header}.${payload}`)
		.digest('base64url');

	return `${header}.${payload}.${signature}`;
}

/**
 * Verifies and decodes a signed session token.
 */
export function verifySignedToken(
	token: string | null | undefined
): { valid: boolean; userId?: string; role?: string; error?: string } {
	if (!token) {
		return { valid: false, error: 'Token missing.' };
	}

	// Clean up 'Bearer ' prefix if present
	const cleanToken = token.startsWith('Bearer ') ? token.slice(7).trim() : token.trim();
	const parts = cleanToken.split('.');

	if (parts.length !== 3) {
		// Fallback for legacy tokens
		if (cleanToken.startsWith('neon_jwt_')) {
			try {
				const decoded = atob(cleanToken.replace('neon_jwt_', ''));
				const [uid] = decoded.split(':');
				return { valid: true, userId: uid, role: uid.includes('admin') ? 'admin' : 'standard_user' };
			} catch {
				return { valid: false, error: 'Invalid legacy token format.' };
			}
		}
		return { valid: false, error: 'Malformed token structure.' };
	}

	const [header, payload, signature] = parts;

	const expectedSignature = crypto
		.createHmac('sha256', SERVER_SECRET)
		.update(`${header}.${payload}`)
		.digest('base64url');

	const sigBuf = Buffer.from(signature);
	const expSigBuf = Buffer.from(expectedSignature);

	if (sigBuf.length !== expSigBuf.length || !crypto.timingSafeEqual(sigBuf, expSigBuf)) {
		return { valid: false, error: 'Invalid token signature.' };
	}

	try {
		const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
		const nowSeconds = Math.floor(Date.now() / 1000);

		if (decodedPayload.exp && decodedPayload.exp < nowSeconds) {
			return { valid: false, error: 'Session token has expired. Please sign in again.' };
		}

		return {
			valid: true,
			userId: decodedPayload.sub,
			role: decodedPayload.role
		};
	} catch {
		return { valid: false, error: 'Corrupt token payload.' };
	}
}
