<script lang="ts">
	import type { PaymentDetail } from '$lib/types/payment';
	import { generateId } from '$lib/utils/format';
	import { X, Building2, CreditCard, ShieldCheck, Check, Info } from 'lucide-svelte';

	interface Props {
		open: boolean;
		paymentDetail?: PaymentDetail | null;
		onSave: (detail: PaymentDetail) => void;
		onClose: () => void;
	}

	let { open = false, paymentDetail = null, onSave, onClose }: Props = $props();

	// Local Form State
	let bankName = $state('');
	let accountName = $state('');
	let accountNumber = $state('');
	let swiftCode = $state('');
	let branch = $state('');
	let currency = $state<'TZS' | 'USD'>('TZS');
	let accountType = $state<PaymentDetail['accountType']>('Corporate Bank');
	let isDefault = $state(false);
	let notes = $state('');
	let validationError = $state('');

	// Popular Bank Presets in Tanzania
	const BANK_PRESETS = [
		{ name: 'CRDB Bank Plc', swift: 'CORUTZTZ', type: 'Corporate Bank' },
		{ name: 'NMB Bank Plc', swift: 'NMIBTZTZ', type: 'Commercial Bank' },
		{ name: 'Vodacom M-Pesa Merchant', swift: 'N/A', type: 'Mobile Money / Till' },
		{ name: 'Stanbic Bank Tanzania', swift: 'SBICZTZX', type: 'Corporate Bank' },
		{ name: 'KCB Bank Tanzania', swift: 'KCBLTZTZ', type: 'Corporate Bank' },
		{ name: 'Azania Bank Ltd', swift: 'AZNITZTZ', type: 'Commercial Bank' },
		{ name: 'Standard Chartered TZ', swift: 'SCBLTZTX', type: 'Corporate Bank' },
		{ name: 'NBC Bank Tanzania', swift: 'NLCBTZTZ', type: 'Commercial Bank' },
		{ name: 'Airtel Money Till', swift: 'N/A', type: 'Mobile Money / Till' },
		{ name: 'Tigo Pesa Merchant Till', swift: 'N/A', type: 'Mobile Money / Till' }
	];

	$effect(() => {
		if (open) {
			validationError = '';
			if (paymentDetail) {
				bankName = paymentDetail.bankName || '';
				accountName = paymentDetail.accountName || 'Anagkazo Autoparts Co. Ltd';
				accountNumber = paymentDetail.accountNumber || '';
				swiftCode = paymentDetail.swiftCode || '';
				branch = paymentDetail.branch || '';
				currency = paymentDetail.currency || 'TZS';
				accountType = paymentDetail.accountType || 'Corporate Bank';
				isDefault = !!paymentDetail.isDefault;
				notes = paymentDetail.notes || '';
			} else {
				bankName = '';
				accountName = 'Anagkazo Autoparts Co. Ltd';
				accountNumber = '';
				swiftCode = '';
				branch = 'Dar es Salaam Commercial Hub';
				currency = 'TZS';
				accountType = 'Corporate Bank';
				isDefault = false;
				notes = 'Please include invoice number in payment description/narration.';
			}
		}
	});

	function handlePresetSelect(event: Event) {
		const select = event.target as HTMLSelectElement;
		const found = BANK_PRESETS.find(p => p.name === select.value);
		if (found) {
			bankName = found.name;
			if (found.swift && found.swift !== 'N/A') swiftCode = found.swift;
			if (found.type) accountType = found.type as PaymentDetail['accountType'];
		}
		select.value = '';
	}

	function handleSubmit(e: Event) {
		e.preventDefault();
		if (!bankName.trim()) {
			validationError = 'Bank or Provider Name is required.';
			return;
		}
		if (!accountName.trim()) {
			validationError = 'Account Name is required.';
			return;
		}
		if (!accountNumber.trim()) {
			validationError = 'Account Number / Till Number is required.';
			return;
		}

		const detail: PaymentDetail = {
			id: paymentDetail?.id || `PAY-${Date.now().toString().slice(-4)}`,
			bankName: bankName.trim(),
			accountName: accountName.trim(),
			accountNumber: accountNumber.trim(),
			swiftCode: swiftCode.trim() || undefined,
			branch: branch.trim() || undefined,
			currency,
			accountType,
			isDefault,
			notes: notes.trim() || undefined
		};

		onSave(detail);
		onClose();
	}
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-xs animate-in fade-in duration-150">
		<div
			class="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
			role="dialog"
			aria-modal="true"
		>
			<!-- Modal Header -->
			<div class="flex items-center justify-between border-b border-slate-100 pb-3">
				<div class="flex items-center gap-2.5">
					<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-900 text-sky-400">
						<Building2 class="h-5 w-5" />
					</div>
					<div>
						<h3 class="text-base font-extrabold text-navy-950">
							{paymentDetail ? 'Edit Payment Account' : 'Add New Payment Detail'}
						</h3>
						<p class="text-xs text-slate-500">
							Configure bank accounts and payment options for customer invoices.
						</p>
					</div>
				</div>
				<button
					type="button"
					onclick={onClose}
					class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition cursor-pointer"
				>
					<X class="h-5 w-5" />
				</button>
			</div>

			{#if validationError}
				<div class="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 flex items-center gap-2">
					<Info class="h-4 w-4 shrink-0" />
					<span>{validationError}</span>
				</div>
			{/if}

			<!-- Form Body -->
			<form onsubmit={handleSubmit} class="space-y-4">
				<!-- Quick Preset Selector -->
				<div>
					<div class="flex items-center justify-between mb-1">
						<label for="bankPreset" class="text-xs font-bold text-slate-700 uppercase tracking-wider">
							Quick Bank / Mobile Money Preset
						</label>
						<span class="text-[10px] text-slate-400">Optional Autofill</span>
					</div>
					<select
						id="bankPreset"
						onchange={handlePresetSelect}
						class="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-xs font-medium text-slate-700 focus:border-navy-900 focus:bg-white focus:outline-none cursor-pointer"
					>
						<option value="">Select a Tanzanian Bank or Mobile Provider...</option>
						{#each BANK_PRESETS as preset}
							<option value={preset.name}>{preset.name} ({preset.type})</option>
						{/each}
					</select>
				</div>

				<!-- Bank Name & Account Type -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div>
						<label for="bankNameInput" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
							Bank / Provider Name *
						</label>
						<input
							id="bankNameInput"
							type="text"
							bind:value={bankName}
							placeholder="e.g. CRDB Bank Plc"
							required
							class="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-900"
						/>
					</div>

					<div>
						<label for="accountTypeSelect" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
							Account Type
						</label>
						<select
							id="accountTypeSelect"
							bind:value={accountType}
							class="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-navy-900 focus:outline-none cursor-pointer"
						>
							<option value="Corporate Bank">Corporate Bank</option>
							<option value="Commercial Bank">Commercial Bank</option>
							<option value="Mobile Money / Till">Mobile Money / Till</option>
							<option value="Escrow / Trust">Escrow / Trust</option>
						</select>
					</div>
				</div>

				<!-- Account Name -->
				<div>
					<label for="accountNameInput" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
						Beneficiary Account Name *
					</label>
					<input
						id="accountNameInput"
						type="text"
						bind:value={accountName}
						placeholder="e.g. Anagkazo Autoparts Co. Ltd"
						required
						class="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-900"
					/>
				</div>

				<!-- Account Number & Currency -->
				<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
					<div class="sm:col-span-2">
						<label for="accountNumberInput" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
							Account / Till / Paybill No. *
						</label>
						<input
							id="accountNumberInput"
							type="text"
							bind:value={accountNumber}
							placeholder="e.g. 01504289033400"
							required
							class="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-mono text-slate-900 focus:border-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-900"
						/>
					</div>

					<div>
						<label for="currencySelect" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
							Currency
						</label>
						<select
							id="currencySelect"
							bind:value={currency}
							class="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800 focus:border-navy-900 focus:outline-none cursor-pointer"
						>
							<option value="TZS">TZS (Shillings)</option>
							<option value="USD">USD (US Dollars)</option>
						</select>
					</div>
				</div>

				<!-- Swift Code & Branch -->
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div>
						<label for="swiftInput" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
							Swift / BIC Code
						</label>
						<input
							id="swiftInput"
							type="text"
							bind:value={swiftCode}
							placeholder="e.g. CORUTZTZ"
							class="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-mono text-slate-900 focus:border-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-900"
						/>
					</div>

					<div>
						<label for="branchInput" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
							Branch Name
						</label>
						<input
							id="branchInput"
							type="text"
							bind:value={branch}
							placeholder="e.g. Samora Commercial Branch"
							class="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-900"
						/>
					</div>
				</div>

				<!-- Notes / Instructions -->
				<div>
					<label for="notesInput" class="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
						Special Payment Instructions / Narration
					</label>
					<input
						id="notesInput"
						type="text"
						bind:value={notes}
						placeholder="e.g. Please reference invoice number in payment description"
						class="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-navy-900 focus:outline-none focus:ring-1 focus:ring-navy-900"
					/>
				</div>

				<!-- Default Account Toggle -->
				<label class="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-slate-50/60 cursor-pointer hover:bg-slate-100/60 transition">
					<input
						type="checkbox"
						bind:checked={isDefault}
						class="h-4 w-4 rounded border-slate-300 text-navy-900 focus:ring-navy-900"
					/>
					<div class="text-xs">
						<span class="font-bold text-slate-800">Set as Default Payment Detail</span>
						<p class="text-[11px] text-slate-500">Automatically pre-select this account for all new invoices.</p>
					</div>
				</label>

				<!-- Modal Actions -->
				<div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
					<button
						type="button"
						onclick={onClose}
						class="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-navy-800 transition active:scale-95 cursor-pointer"
					>
						<Check class="h-4 w-4 text-sky-400" />
						<span>{paymentDetail ? 'Save Changes' : 'Create Payment Account'}</span>
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
