<script lang="ts">
	import type { Customer, CustomerType } from '$lib/types/customer';
	import { customerSchema } from '$lib/schema/customer';
	import { X, UserPlus, Pencil, AlertCircle, Save } from 'lucide-svelte';

	interface Props {
		open: boolean;
		customerToEdit?: Customer | null;
		onClose: () => void;
		onAddCustomer?: (customer: Customer) => void;
		onUpdateCustomer?: (customer: Customer) => void;
	}

	let { open, customerToEdit = null, onClose, onAddCustomer, onUpdateCustomer }: Props = $props();

	let name = $state('');
	let companyName = $state('');
	let contactPerson = $state('');
	let email = $state('');
	let phone = $state('+255 ');
	let address = $state('');
	let city = $state('Dar es Salaam');
	let customerType = $state('Fleet & Logistics');
	let creditLimit = $state<number | ''>(50000000);
	let paymentTerms = $state('Net 14');
	let tin = $state('');

	let formErrors = $state<Record<string, string>>({});

	$effect(() => {
		if (open) {
			if (customerToEdit) {
				name = customerToEdit.name || '';
				companyName = customerToEdit.companyName || customerToEdit.name || '';
				contactPerson = customerToEdit.contactPerson || '';
				email = customerToEdit.email || '';
				phone = customerToEdit.phone || '+255 ';
				address = customerToEdit.address || '';
				city = customerToEdit.city || 'Dar es Salaam';
				customerType = customerToEdit.customerType || 'Fleet & Logistics';
				creditLimit = customerToEdit.creditLimit !== undefined ? customerToEdit.creditLimit : 50000000;
				paymentTerms = customerToEdit.paymentTerms || 'Net 14';
				tin = customerToEdit.tin || '';
				formErrors = {};
			} else {
				resetForm();
			}
		}
	});

	function handleNameInput(e: Event) {
		const target = e.target as HTMLInputElement;
		name = target.value;
		if (!companyName || companyName === name.slice(0, -1)) {
			companyName = name;
		}
	}

	function resetForm() {
		name = '';
		companyName = '';
		contactPerson = '';
		email = '';
		phone = '+255 ';
		address = '';
		city = 'Dar es Salaam';
		customerType = 'Fleet & Logistics';
		creditLimit = 50000000;
		paymentTerms = 'Net 14';
		tin = '';
		formErrors = {};
	}

	function handleSubmit(e: Event) {
		e.preventDefault();
		const rawData = {
			name: name.trim(),
			companyName: (companyName || name).trim(),
			contactPerson: contactPerson.trim(),
			email: email.trim(),
			phone: phone.trim(),
			address: address.trim(),
			city: city.trim(),
			customerType,
			creditLimit: Number(creditLimit) || 0,
			paymentTerms,
			tin: tin.trim()
		};

		const result = customerSchema.safeParse(rawData);
		if (!result.success) {
			const errs: Record<string, string> = {};
			for (const issue of result.error.issues) {
				const path = issue.path.join('.');
				errs[path] = issue.message;
			}
			formErrors = errs;
			return;
		}

		formErrors = {};
		const valid = result.data;

		if (customerToEdit) {
			const updatedCustomer: Customer = {
				...customerToEdit,
				name: valid.name.trim(),
				companyName: (valid.companyName || valid.name).trim(),
				contactPerson: valid.contactPerson.trim(),
				email: valid.email.trim(),
				phone: valid.phone.trim(),
				address: valid.address.trim(),
				city: valid.city.trim(),
				customerType: valid.customerType as CustomerType,
				creditLimit: Number(valid.creditLimit) || 0,
				paymentTerms: valid.paymentTerms,
				tin: valid.tin.trim()
			};
			onUpdateCustomer?.(updatedCustomer);
		} else {
			const newCustomer: Customer = {
				id: 'CUST-' + Math.floor(100 + Math.random() * 900),
				name: valid.name.trim(),
				companyName: (valid.companyName || valid.name).trim(),
				contactPerson: valid.contactPerson.trim(),
				email: valid.email.trim(),
				phone: valid.phone.trim(),
				address: valid.address.trim(),
				city: valid.city.trim(),
				customerType: valid.customerType as CustomerType,
				totalPurchases: 0,
				outstandingBalance: 0,
				invoicesCount: 0,
				creditLimit: Number(valid.creditLimit) || 0,
				paymentTerms: valid.paymentTerms,
				tin: valid.tin.trim(),
				status: 'Paid'
			};
			onAddCustomer?.(newCustomer);
		}

		resetForm();
		onClose();
	}
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
		<div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10">
			<!-- Modal Header -->
			<div class="flex items-center justify-between border-b border-slate-100 pb-3">
				<div class="flex items-center gap-2">
					<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900 text-white">
						{#if customerToEdit}
							<Pencil class="h-4 w-4 text-sky-400" />
						{:else}
							<UserPlus class="h-4 w-4 text-sky-400" />
						{/if}
					</div>
					<h3 class="font-bold text-navy-900">
						{customerToEdit ? `Edit Client: ${customerToEdit.companyName || customerToEdit.name}` : 'Add New Commercial Customer'}
					</h3>
				</div>
				<button
					type="button"
					onclick={onClose}
					class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
				>
					<X class="h-4 w-4" />
				</button>
			</div>

			<!-- Form Content -->
			<form onsubmit={handleSubmit} novalidate class="py-4 space-y-3.5 text-xs text-slate-700">
				<!-- Customer / Company Name -->
				<div>
					<label for="newCustName" class="block font-bold text-slate-700 uppercase tracking-wider mb-1">
						Customer / Trading Name <span class="text-rose-500">*</span>
					</label>
					<input
						id="newCustName"
						name="name"
						type="text"
						value={name}
						oninput={handleNameInput}
						placeholder="e.g. Tanzania Safari Logistics Ltd"
						class="w-full rounded-xl border px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 transition {
							formErrors.name
								? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500/20'
								: 'border-slate-200 bg-slate-50/50 focus:border-navy-900 focus:ring-navy-900/10'
						}"
					/>
					{#if formErrors.name}
						<p class="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
							<AlertCircle class="h-3 w-3 shrink-0" />
							<span>{formErrors.name}</span>
						</p>
					{/if}
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<!-- Contact Person -->
					<div>
						<label for="newCustContact" class="block font-bold text-slate-700 uppercase tracking-wider mb-1">
							Contact Person <span class="text-rose-500">*</span>
						</label>
						<input
							id="newCustContact"
							name="contactPerson"
							type="text"
							bind:value={contactPerson}
							placeholder="e.g. Godfrey Mrema"
							class="w-full rounded-xl border px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 transition {
								formErrors.contactPerson
									? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500/20'
									: 'border-slate-200 bg-slate-50/50 focus:border-navy-900 focus:ring-navy-900/10'
							}"
						/>
						{#if formErrors.contactPerson}
							<p class="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
								<AlertCircle class="h-3 w-3 shrink-0" />
								<span>{formErrors.contactPerson}</span>
							</p>
						{/if}
					</div>

					<!-- Email -->
					<div>
						<label for="newCustEmail" class="block font-bold text-slate-700 uppercase tracking-wider mb-1">
							Email Address <span class="text-rose-500">*</span>
						</label>
						<input
							id="newCustEmail"
							name="email"
							type="email"
							bind:value={email}
							placeholder="gmrema@safarilogistics.co.tz"
							class="w-full rounded-xl border px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 transition {
								formErrors.email
									? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500/20'
									: 'border-slate-200 bg-slate-50/50 focus:border-navy-900 focus:ring-navy-900/10'
							}"
						/>
						{#if formErrors.email}
							<p class="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
								<AlertCircle class="h-3 w-3 shrink-0" />
								<span>{formErrors.email}</span>
							</p>
						{/if}
					</div>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<!-- Phone -->
					<div>
						<label for="newCustPhone" class="block font-bold text-slate-700 uppercase tracking-wider mb-1">
							Phone Number <span class="text-rose-500">*</span>
						</label>
						<input
							id="newCustPhone"
							name="phone"
							type="text"
							bind:value={phone}
							placeholder="+255 754 112 233"
							class="w-full rounded-xl border px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 transition {
								formErrors.phone
									? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500/20'
									: 'border-slate-200 bg-slate-50/50 focus:border-navy-900 focus:ring-navy-900/10'
							}"
						/>
						{#if formErrors.phone}
							<p class="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
								<AlertCircle class="h-3 w-3 shrink-0" />
								<span>{formErrors.phone}</span>
							</p>
						{/if}
					</div>

					<!-- Account Type -->
					<div>
						<label for="newCustType" class="block font-bold text-slate-700 uppercase tracking-wider mb-1">
							Account Type
						</label>
						<select
							id="newCustType"
							name="customerType"
							bind:value={customerType}
							class="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 focus:border-navy-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy-900/10 cursor-pointer"
						>
							<option value="Fleet & Logistics">Fleet & Logistics</option>
							<option value="Corporate">Corporate</option>
							<option value="Retail / Private">Retail / Private</option>
							<option value="Government / NGO">Government / NGO</option>
						</select>
					</div>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<!-- Billing Address -->
					<div>
						<label for="newCustAddress" class="block font-bold text-slate-700 uppercase tracking-wider mb-1">
							Billing Address <span class="text-rose-500">*</span>
						</label>
						<input
							id="newCustAddress"
							name="address"
							type="text"
							bind:value={address}
							placeholder="Samora Avenue, P.O. Box 4521"
							class="w-full rounded-xl border px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 transition {
								formErrors.address
									? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500/20'
									: 'border-slate-200 bg-slate-50/50 focus:border-navy-900 focus:ring-navy-900/10'
							}"
						/>
						{#if formErrors.address}
							<p class="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
								<AlertCircle class="h-3 w-3 shrink-0" />
								<span>{formErrors.address}</span>
							</p>
						{/if}
					</div>

					<!-- TIN -->
					<div>
						<label for="newCustTin" class="block font-bold text-slate-700 uppercase tracking-wider mb-1">
							TIN Number <span class="text-rose-500">*</span>
						</label>
						<input
							id="newCustTin"
							name="tin"
							type="text"
							bind:value={tin}
							placeholder="e.g. 188-458-408"
							class="w-full rounded-xl border px-3 py-2 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 transition {
								formErrors.tin
									? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500/20'
									: 'border-slate-200 bg-slate-50/50 focus:border-navy-900 focus:ring-navy-900/10'
							}"
						/>
						{#if formErrors.tin}
							<p class="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
								<AlertCircle class="h-3 w-3 shrink-0" />
								<span>{formErrors.tin}</span>
							</p>
						{/if}
					</div>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<!-- Payment Terms -->
					<div>
						<label for="newCustTerms" class="block font-bold text-slate-700 uppercase tracking-wider mb-1">
							Payment Terms
						</label>
						<select
							id="newCustTerms"
							name="paymentTerms"
							bind:value={paymentTerms}
							class="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 focus:border-navy-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy-900/10 cursor-pointer"
						>
							<option value="Net 7">Net 7</option>
							<option value="Net 14">Net 14</option>
							<option value="Due on Receipt">Due on Receipt</option>
							<option value="Cash on Delivery (COD)">Cash on Delivery (COD)</option>
							<option value="50% Advance / 50% on Delivery">50% Advance / 50% on Delivery</option>
						</select>
					</div>

					<!-- Credit Limit -->
					<div>
						<label for="newCustLimit" class="block font-bold text-slate-700 uppercase tracking-wider mb-1">
							Credit Limit (TZS)
						</label>
						<input
							id="newCustLimit"
							name="creditLimit"
							type="number"
							step="1000000"
							bind:value={creditLimit}
							class="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-900 focus:border-navy-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy-900/10"
						/>
						{#if formErrors.creditLimit}
							<p class="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
								<AlertCircle class="h-3 w-3 shrink-0" />
								<span>{formErrors.creditLimit}</span>
							</p>
						{/if}
					</div>
				</div>

				<!-- Footer Buttons -->
				<div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
					<button
						type="button"
						onclick={onClose}
						class="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="inline-flex items-center gap-1.5 rounded-xl bg-navy-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-navy-800 transition active:scale-95 cursor-pointer"
					>
						<UserPlus class="h-3.5 w-3.5 text-sky-400" />
						<span>Save Customer</span>
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
