import { describe, it, expect } from 'vitest';
import {
	hashPassword,
	verifyPassword,
	generateSignedToken,
	verifySignedToken,
	checkRateLimit,
	resetRateLimit
} from './security';

describe('Server Security Tests', () => {
	describe('Password Hashing & Timing-Safe Verification', () => {
		it('should hash passwords using PBKDF2 with salt', () => {
			const rawPassword = 'StrongPassword2026!';
			const hash = hashPassword(rawPassword);

			expect(hash).toContain('pbkdf2$100000$');
			expect(hash.split('$')).toHaveLength(4);
		});

		it('should correctly verify valid PBKDF2 hashed password', () => {
			const rawPassword = 'AdminSecretPassword#1';
			const hash = hashPassword(rawPassword);

			expect(verifyPassword(rawPassword, hash)).toBe(true);
			expect(verifyPassword('WrongPassword', hash)).toBe(false);
			expect(verifyPassword('', hash)).toBe(false);
		});

		it('should generate different hashes for same password due to unique random salts', () => {
			const pass = 'IdenticalPassword123';
			const hash1 = hashPassword(pass);
			const hash2 = hashPassword(pass);

			expect(hash1).not.toBe(hash2);
			expect(verifyPassword(pass, hash1)).toBe(true);
			expect(verifyPassword(pass, hash2)).toBe(true);
		});

		it('should verify legacy plain text passwords seamlessly without throwing', () => {
			const plain = '123456789Baraka';
			expect(verifyPassword(plain, plain)).toBe(true);
			expect(verifyPassword('WrongPass', plain)).toBe(false);
		});
	});

	describe('Cryptographic Session Tokens', () => {
		it('should generate and verify valid signed HMAC tokens', () => {
			const userId = 'usr-admin-001';
			const role = 'admin';
			const token = generateSignedToken(userId, role);

			const result = verifySignedToken(token);
			expect(result.valid).toBe(true);
			expect(result.userId).toBe(userId);
			expect(result.role).toBe(role);
		});

		it('should support Bearer prefix formatting', () => {
			const token = generateSignedToken('usr-std-002', 'standard_user');
			const result = verifySignedToken(`Bearer ${token}`);

			expect(result.valid).toBe(true);
			expect(result.userId).toBe('usr-std-002');
			expect(result.role).toBe('standard_user');
		});

		it('should reject tampered token payloads or signatures', () => {
			const token = generateSignedToken('usr-std-002', 'standard_user');
			const [header, payload, signature] = token.split('.');

			// Tamper role from standard_user to admin in payload
			const tamperedPayload = Buffer.from(
				JSON.stringify({ sub: 'usr-std-002', role: 'admin', exp: Date.now() / 1000 + 3600 })
			).toString('base64url');

			const tamperedToken = `${header}.${tamperedPayload}.${signature}`;
			const result = verifySignedToken(tamperedToken);

			expect(result.valid).toBe(false);
			expect(result.error).toBe('Invalid token signature.');
		});

		it('should reject expired tokens', () => {
			const expiredToken = generateSignedToken('usr-admin-001', 'admin', -1); // expired 1 hour ago
			const result = verifySignedToken(expiredToken);

			expect(result.valid).toBe(false);
			expect(result.error).toContain('expired');
		});

		it('should reject invalid or empty tokens', () => {
			expect(verifySignedToken(null).valid).toBe(false);
			expect(verifySignedToken('').valid).toBe(false);
			expect(verifySignedToken('random.garbage.token').valid).toBe(false);
		});
	});

	describe('Rate Limiting Guard', () => {
		it('should enforce threshold and lock after max failed attempts', () => {
			const testKey = 'ip_test_rate_limiter_123';
			resetRateLimit(testKey);

			// First 3 attempts allowed
			expect(checkRateLimit(testKey, 3, 60000).allowed).toBe(true);
			expect(checkRateLimit(testKey, 3, 60000).allowed).toBe(true);
			expect(checkRateLimit(testKey, 3, 60000).allowed).toBe(true);

			// 4th attempt should be blocked
			const blocked = checkRateLimit(testKey, 3, 60000);
			expect(blocked.allowed).toBe(false);
			expect(blocked.retryAfterSeconds).toBeGreaterThan(0);

			// Reset unlocks
			resetRateLimit(testKey);
			expect(checkRateLimit(testKey, 3, 60000).allowed).toBe(true);
		});
	});
});
