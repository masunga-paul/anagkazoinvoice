<script lang="ts">
	import type { PaymentDetail } from '$lib/types/payment';
	import PaymentDetailModal from './PaymentDetailModal.svelte';
	import DeleteConfirmModal from '../common/DeleteConfirmModal.svelte';
	import {
		Building2,
		Plus,
		Edit3,
		Trash2,
		Star,
		ShieldCheck,
		CreditCard,
		CheckCircle2,
		Info,
		Smartphone
	} from 'lucide-svelte';

	interface Props {
		paymentDetails: PaymentDetail[];
		onAddPaymentDetail: (detail: PaymentDetail) => void;
		onUpdatePaymentDetail: (detail: PaymentDetail) => void;
		onDeletePaymentDetail: (id: string) => void;
		onSetDefaultPaymentDetail: (id: string) => void;
		onShowToast?: (message: string, type?: 'success' | 'error' | 'info', action?: any, title?: string) => void;
	}

	let {
		paymentDetails = [],
		onAddPaymentDetail,
		onUpdatePaymentDetail,
		onDeletePaymentDetail,
		onSetDefaultPaymentDetail,
		onShowToast
	}: Props = $props();

	let isModalOpen = $state(false);
	let editingDetail = $state<PaymentDetail | null>(null);

	let isDeleteModalOpen = $state(false);
	let deletingDetail = $state<PaymentDetail | null>(null);

	function openCreateModal() {
		editingDetail = null;
		isModalOpen = true;
	}

	function openEditModal(detail: PaymentDetail) {
		editingDetail = detail;
		isModalOpen = true;
	}

	function handleSaveDetail(detail: PaymentDetail) {
		if (editingDetail) {
			onUpdatePaymentDetail(detail);
			onShowToast?.(`Updated payment account "${detail.bankName}"`, 'success', 'UPDATE', 'Payment Detail Updated');
		} else {
			onAddPaymentDetail(detail);
			onShowToast?.(`Added new payment account "${detail.bankName}"`, 'success', 'CREATE', 'Payment Detail Created');
		}
	}

	function openDeleteModal(detail: PaymentDetail) {
		if (paymentDetails.length <= 1) {
			onShowToast?.('You must keep at least one payment account for invoicing.', 'error', 'ERROR', 'Cannot Delete');
			return;
		}
		deletingDetail = detail;
		isDeleteModalOpen = true;
	}

	function confirmDelete() {
		if (deletingDetail) {
			onDeletePaymentDetail(deletingDetail.id);
			onShowToast?.(`Removed payment account "${deletingDetail.bankName}"`, 'info', 'DELETE', 'Payment Detail Deleted');
			deletingDetail = null;
			isDeleteModalOpen = false;
		}
	}

	function handleSetDefault(id: string, bankName: string) {
		onSetDefaultPaymentDetail(id);
		onShowToast?.(`Set "${bankName}" as default payment account`, 'success', 'UPDATE', 'Default Updated');
	}
</script>

<div class="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs space-y-5">
	<!-- Section Header -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
		<div class="flex items-center gap-3">
			<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-900 text-sky-400">
				<Building2 class="h-5 w-5" />
			</div>
			<div>
				<div class="flex items-center gap-2">
					<h2 class="text-base font-extrabold text-navy-950">Corporate Payment Details & Banking</h2>
					<span class="rounded-full bg-navy-100 px-2 py-0.5 text-[10px] font-bold text-navy-900">
						{paymentDetails.length} Accounts Active
					</span>
				</div>
				<p class="text-xs text-slate-500">
					Manage receiving bank accounts and mobile merchant lines available for staff invoice selection.
				</p>
			</div>
		</div>

		<button
			type="button"
			onclick={openCreateModal}
			class="inline-flex items-center justify-center gap-2 rounded-xl bg-navy-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-navy-800 transition active:scale-95 cursor-pointer"
		>
			<Plus class="h-4 w-4 text-sky-400" />
			<span>+ Add Payment Detail</span>
		</button>
	</div>

	<!-- Payment Details Cards Grid -->
	<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
		{#each paymentDetails as detail (detail.id)}
			<div
				class="relative rounded-xl border transition duration-200 p-4.5 flex flex-col justify-between {
					detail.isDefault
						? 'border-sky-300 bg-sky-50/30 ring-1 ring-sky-300/60 shadow-xs'
						: 'border-slate-200 bg-slate-50/40 hover:border-navy-200 hover:bg-white'
				}"
			>
				<!-- Top Bar: Bank Name, Currency & Default Badge -->
				<div>
					<div class="flex items-start justify-between gap-2 mb-2">
						<div class="flex items-center gap-2.5">
							{#if detail.accountType === 'Mobile Money / Till'}
								<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
									<Smartphone class="h-4 w-4" />
								</div>
							{:else}
								<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-100 text-navy-900">
									<CreditCard class="h-4 w-4 text-navy-900" />
								</div>
							{/if}
							<div>
								<h3 class="text-sm sm:text-base font-extrabold text-navy-950 leading-snug">{detail.bankName}</h3>
								<span class="text-xs text-slate-600 font-semibold">{detail.accountType || 'Bank Account'}</span>
							</div>
						</div>

						<div class="flex items-center gap-1.5">
							<span class="rounded-md bg-navy-900 text-white font-mono text-xs font-black px-2.5 py-0.5">
								{detail.currency}
							</span>
							{#if detail.isDefault}
								<span class="inline-flex items-center gap-1 rounded-md bg-sky-500/20 text-sky-900 text-xs font-bold px-2 py-0.5 border border-sky-300">
									<Star class="h-3.5 w-3.5 fill-sky-600 text-sky-600" />
									Default
								</span>
							{/if}
						</div>
					</div>

					<!-- Account Details Grid -->
					<div class="mt-3 space-y-2 rounded-xl bg-white border border-slate-200 p-3.5 text-xs sm:text-sm shadow-2xs">
						<div class="flex justify-between items-center">
							<span class="text-slate-600 font-bold text-xs">Account Name:</span>
							<span class="font-extrabold text-slate-950 text-right">{detail.accountName}</span>
						</div>
						<div class="flex justify-between items-center">
							<span class="text-slate-600 font-bold text-xs">Account / Till No:</span>
							<span class="font-black text-navy-950 font-mono text-right text-xs sm:text-sm bg-slate-100 px-2 py-0.5 rounded">
								{detail.accountNumber}
							</span>
						</div>
						{#if detail.swiftCode && detail.swiftCode !== 'N/A'}
							<div class="flex justify-between items-center">
								<span class="text-slate-600 font-bold text-xs">Swift Code:</span>
								<span class="font-mono font-bold text-slate-900 text-right text-xs sm:text-sm">{detail.swiftCode}</span>
							</div>
						{/if}
						{#if detail.branch}
							<div class="flex justify-between items-center">
								<span class="text-slate-600 font-bold text-xs">Branch:</span>
								<span class="text-slate-800 font-semibold text-right text-xs sm:text-sm">{detail.branch}</span>
							</div>
						{/if}
						{#if detail.notes}
							<div class="pt-1.5 border-t border-slate-200 text-xs text-slate-600 font-medium italic">
								{detail.notes}
							</div>
						{/if}
					</div>
				</div>

				<!-- Action Controls -->
				<div class="mt-3.5 pt-2.5 border-t border-slate-200 flex items-center justify-between gap-2">
					<div>
						{#if !detail.isDefault}
							<button
								type="button"
								onclick={() => handleSetDefault(detail.id, detail.bankName)}
								class="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-navy-950 transition cursor-pointer"
							>
								<Star class="h-3.5 w-3.5" />
								<span>Make Default</span>
							</button>
						{:else}
							<span class="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800">
								<ShieldCheck class="h-4 w-4 text-emerald-600" />
								<span>Primary Invoice Account</span>
							</span>
						{/if}
					</div>

					<div class="flex items-center gap-1.5">
						<button
							type="button"
							onclick={() => openEditModal(detail)}
							aria-label={`Edit ${detail.bankName}`}
							class="rounded-lg p-1.5 text-slate-500 hover:bg-slate-200/70 hover:text-navy-900 transition cursor-pointer"
						>
							<Edit3 class="h-3.5 w-3.5" />
						</button>
						{#if !detail.isDefault && paymentDetails.length > 1}
							<button
								type="button"
								onclick={() => openDeleteModal(detail)}
								aria-label={`Delete ${detail.bankName}`}
								class="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition cursor-pointer"
							>
								<Trash2 class="h-3.5 w-3.5" />
							</button>
						{/if}
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>

<!-- Modal for Creating/Editing Payment Detail -->
<PaymentDetailModal
	open={isModalOpen}
	paymentDetail={editingDetail}
	onSave={handleSaveDetail}
	onClose={() => {
		isModalOpen = false;
		editingDetail = null;
	}}
/>

<!-- Modal for Confirming Payment Detail Deletion -->
<DeleteConfirmModal
	open={isDeleteModalOpen}
	title="Delete Payment Account?"
	itemType="Payment Detail"
	itemName={deletingDetail?.bankName || 'Payment Account'}
	description="Are you sure you want to remove this receiving bank account? Invoices that have already been exported will not be affected."
	confirmText="Yes, Delete Account"
	onConfirm={confirmDelete}
	onClose={() => {
		isDeleteModalOpen = false;
		deletingDetail = null;
	}}
/>
