import { browser } from '$app/environment';
import type { Customer } from '$lib/types/customer';
import type { TyreProductStock } from '$lib/data/mockData';
import type { PaymentDetail } from '$lib/types/payment';
import type { GeneratedInvoiceItem } from '$lib/components/reports/GeneratedInvoicesAudit.svelte';

export type SyncEventType =
	| 'CUSTOMERS_UPDATED'
	| 'STOCKS_UPDATED'
	| 'INVOICES_UPDATED'
	| 'PAYMENT_DETAILS_UPDATED'
	| 'DRAFT_INVOICE_UPDATED'
	| 'STAFF_CREDENTIALS_UPDATED'
	| 'ADMIN_CREDENTIALS_UPDATED'
	| 'ALL_SYNC';


export interface SyncMessage {
	type: SyncEventType;
	timestamp: number;
	senderId: string;
	payload?: any;
}

const CHANNEL_NAME = 'anagkazo_realtime_sync_channel';
const LOCAL_EVENT_NAME = 'anagkazo_local_sync_event';

// Unique tab/instance identifier
export const CLIENT_SESSION_ID = typeof crypto !== 'undefined' && crypto.randomUUID
	? crypto.randomUUID()
	: `tab_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;

let broadcastChannel: BroadcastChannel | null = null;

if (browser && typeof BroadcastChannel !== 'undefined') {
	try {
		broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
	} catch (e) {
		console.warn('BroadcastChannel initialization error:', e);
	}
}

/**
 * Broadcast an update event to all other tabs/windows and local listeners
 */
export function broadcastSync(type: SyncEventType, payload?: any): void {
	if (!browser) return;

	let cleanPayload = payload;
	if (payload !== undefined) {
		try {
			cleanPayload = JSON.parse(JSON.stringify(payload));
		} catch {
			cleanPayload = undefined;
		}
	}

	const message: SyncMessage = {
		type,
		timestamp: Date.now(),
		senderId: CLIENT_SESSION_ID,
		payload: cleanPayload
	};

	// 1. Send via native BroadcastChannel for cross-tab real-time sync
	if (broadcastChannel) {
		try {
			broadcastChannel.postMessage(message);
		} catch (e) {
			console.warn('Failed to postMessage on BroadcastChannel:', e);
		}
	}

	// 2. Dispatch local custom event for current window components
	try {
		window.dispatchEvent(
			new CustomEvent(LOCAL_EVENT_NAME, {
				detail: message
			})
		);
	} catch (e) {
		console.warn('Failed to dispatch local sync event:', e);
	}
}

/**
 * Subscribe to real-time sync updates across all windows, tabs, and local events
 */
export function subscribeToSync(callback: (message: SyncMessage) => void): () => void {
	if (!browser) return () => {};

	const handleBroadcastMessage = (event: MessageEvent) => {
		if (event.data && event.data.type) {
			if (event.data.senderId === CLIENT_SESSION_ID) return;
			callback(event.data as SyncMessage);
		}
	};

	const handleLocalMessage = (event: Event) => {
		const customEvent = event as CustomEvent<SyncMessage>;
		if (customEvent.detail && customEvent.detail.type) {
			if (customEvent.detail.senderId === CLIENT_SESSION_ID) return;
			callback(customEvent.detail);
		}
	};

	const handleStorageEvent = (event: StorageEvent) => {
		if (!event.key) return;
		if (event.key.startsWith('anagkazo_')) {
			let type: SyncEventType = 'ALL_SYNC';
			if (event.key === 'anagkazo_fleet_customers') type = 'CUSTOMERS_UPDATED';
			else if (event.key === 'anagkazo_tyre_inventory') type = 'STOCKS_UPDATED';
			else if (event.key === 'anagkazo_generated_invoices') type = 'INVOICES_UPDATED';
			else if (event.key === 'anagkazo_payment_details') type = 'PAYMENT_DETAILS_UPDATED';
			else if (event.key === 'anagkazo_active_draft_invoice') type = 'DRAFT_INVOICE_UPDATED';

			callback({
				type,
				timestamp: Date.now(),
				senderId: 'storage_fallback'
			});
		}
	};

	if (broadcastChannel) {
		broadcastChannel.addEventListener('message', handleBroadcastMessage);
	}
	window.addEventListener(LOCAL_EVENT_NAME, handleLocalMessage);
	window.addEventListener('storage', handleStorageEvent);

	return () => {
		if (broadcastChannel) {
			broadcastChannel.removeEventListener('message', handleBroadcastMessage);
		}
		window.removeEventListener(LOCAL_EVENT_NAME, handleLocalMessage);
		window.removeEventListener('storage', handleStorageEvent);
	};
}
