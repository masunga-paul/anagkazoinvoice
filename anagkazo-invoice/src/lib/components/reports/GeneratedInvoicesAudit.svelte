<script lang="ts">
	import type { InvoiceStatus, InvoiceFormData, InvoiceItem } from '$lib/types/invoice';
	import type { PaymentDetail } from '$lib/types/payment';
	import { formatTZS, formatDisplayDate, formatTimestamp } from '$lib/utils/format';
	import DeleteConfirmModal from '../common/DeleteConfirmModal.svelte';
	import {
		FileText,
		Search,
		Filter,
		CheckCircle2,
		Clock,
		AlertTriangle,
		Download,
		Eye,
		ArrowUpRight,
		CreditCard,
		TrendingUp,
		Layers,
		Trash2
	} from 'lucide-svelte';

	export interface GeneratedInvoiceItem {
		id: string;
		customer: string;
		date: string;
		dueDate?: string;
		amount: number;
		status: InvoiceStatus;
		itemsCount: number;
		paymentTerms?: string;
		billingAddress?: string;
		items?: InvoiceItem[];
		discount?: number;
		taxRate?: number;
		notes?: string;
		paymentDetailId?: string;
		paymentDetail?: PaymentDetail;
		fullData?: InvoiceFormData;
		createdAt?: string;
		updatedAt?: string;
		createdBy?: string;
	}

	interface Props {
		invoices: GeneratedInvoiceItem[];
		onLoadInvoice?: (invoice: GeneratedInvoiceItem) => void;
		onDeleteInvoice?: (id: string) => void;
		onDeleteAllInvoices?: () => void;
		onShowToast: (message: string, type?: 'success' | 'error' | 'info', action?: any, title?: string) => void;
	}

	let { invoices, onLoadInvoice, onDeleteInvoice, onDeleteAllInvoices, onShowToast }: Props = $props();

	let searchQuery = $state('');
	let selectedStatusFilter = $state<string>('All');
	let isDeleteModalOpen = $state(false);
	let isDeleteAllModalOpen = $state(false);
	let pendingDeleteInvoice = $state<GeneratedInvoiceItem | null>(null);

	function promptDeleteInvoice(inv: GeneratedInvoiceItem) {
		pendingDeleteInvoice = inv;
		isDeleteModalOpen = true;
	}

	function confirmDeleteInvoice() {
		if (!pendingDeleteInvoice) return;
		const inv = pendingDeleteInvoice;
		onDeleteInvoice?.(inv.id);
		onShowToast(
			`Invoice ${inv.id} (${inv.customer}) deleted from ledger.`,
			'info',
			'DELETE',
			'Invoice Deleted'
		);
		pendingDeleteInvoice = null;
	}

	function confirmDeleteAllInvoices() {
		onDeleteAllInvoices?.();
		onShowToast(
			'All recent invoice records have been deleted.',
			'info',
			'DELETE',
			'Invoices Cleared'
		);
		isDeleteAllModalOpen = false;
	}

	const totalCount = $derived(invoices.length);
	const totalAmount = $derived(invoices.reduce((acc, inv) => acc + inv.amount, 0));
	const paidInvoices = $derived(invoices.filter((i) => i.status === 'Paid'));
	const pendingInvoices = $derived(invoices.filter((i) => i.status === 'Pending'));
	const overdueInvoices = $derived(invoices.filter((i) => i.status === 'Overdue'));

	const paidAmount = $derived(paidInvoices.reduce((acc, inv) => acc + inv.amount, 0));
	const pendingAmount = $derived(pendingInvoices.reduce((acc, inv) => acc + inv.amount, 0));
	const overdueAmount = $derived(overdueInvoices.reduce((acc, inv) => acc + inv.amount, 0));

	const filteredInvoices = $derived(
		invoices.filter((inv) => {
			const matchesStatus =
				selectedStatusFilter === 'All' || inv.status === selectedStatusFilter;
			const q = searchQuery.toLowerCase().trim();
			const matchesSearch =
				!q ||
				inv.id.toLowerCase().includes(q) ||
				inv.customer.toLowerCase().includes(q) ||
				inv.amount.toString().includes(q);
			return matchesStatus && matchesSearch;
		})
	);

	const statusBadges: Record<InvoiceStatus, { label: string; bg: string; text: string; icon: any }> = {
		Paid: { label: 'Paid', bg: 'bg-emerald-50 border-emerald-200/80', text: 'text-emerald-700', icon: CheckCircle2 },
		Pending: { label: 'Pending', bg: 'bg-amber-50 border-amber-200/80', text: 'text-amber-700', icon: Clock },
		Overdue: { label: 'Overdue', bg: 'bg-rose-50 border-rose-200/80', text: 'text-rose-700', icon: AlertTriangle }
	};
</script>

<div class="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-6">
	<!-- Section Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
		<div class="flex items-center gap-2.5">
			<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-900 text-sky-400 shadow-xs">
				<FileText class="h-4 w-4" />
			</div>
			<div>
				<h2 class="text-base font-bold text-navy-900">
					Total Generated Invoices Audit & History
				</h2>
				<p class="text-xs text-slate-500">
					Complete ledger of all generated commercial invoices, settlement statuses, and receivables.
				</p>
			</div>
		</div>

		<div class="flex items-center gap-2">
			{#if invoices.length > 0 && onDeleteAllInvoices}
				<button
					type="button"
					onclick={() => (isDeleteAllModalOpen = true)}
					class="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl transition cursor-pointer shadow-2xs"
					title="Delete all recent invoices"
				>
					<Trash2 class="h-3.5 w-3.5" />
					<span>Delete All</span>
				</button>
			{/if}
			<span class="inline-flex items-center gap-1.5 rounded-xl bg-navy-900 text-white px-3.5 py-1.5 text-xs font-bold shadow-xs">
				<span>{totalCount} Total Invoices</span>
				<span>&bull;</span>
				<span>{formatTZS(totalAmount)}</span>
			</span>
		</div>
	</div>

	<!-- 4 Invoices KPI Mini Cards -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
		<!-- Total Invoices -->
		<div class="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5">
			<span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
				Total Invoices Issued
			</span>
			<div class="text-lg font-extrabold font-mono text-navy-900">
				{totalCount} Invoices
			</div>
			<div class="text-[11px] text-slate-500 mt-1">
				Gross Value: {formatTZS(totalAmount)}
			</div>
		</div>

		<!-- Paid Invoices -->
		<div class="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-3.5">
			<div class="flex items-center justify-between">
				<span class="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block mb-0.5">
					Settled / Paid
				</span>
				<CheckCircle2 class="h-3.5 w-3.5 text-emerald-600" />
			</div>
			<div class="text-lg font-extrabold font-mono text-emerald-900">
				{paidInvoices.length} Paid ({Math.round((paidInvoices.length / (totalCount || 1)) * 100)}%)
			</div>
			<div class="text-xs sm:text-sm font-bold text-emerald-800 mt-1">
				{formatTZS(paidAmount)} Collected
			</div>
		</div>

		<!-- Pending Invoices -->
		<div class="rounded-xl border border-amber-300 bg-amber-50/80 p-3.5 shadow-2xs">
			<div class="flex items-center justify-between">
				<span class="text-xs font-black text-amber-800 uppercase tracking-wider block mb-0.5">
					Pending Payment
				</span>
				<Clock class="h-4 w-4 text-amber-700" />
			</div>
			<div class="text-xl sm:text-2xl font-black font-mono text-amber-950">
				{pendingInvoices.length} Invoices
			</div>
			<div class="text-xs sm:text-sm font-bold text-amber-800 mt-1">
				{formatTZS(pendingAmount)} Awaiting Net 14
			</div>
		</div>

		<!-- Overdue Invoices -->
		<div class="rounded-xl border border-rose-300 bg-rose-50/80 p-3.5 shadow-2xs">
			<div class="flex items-center justify-between">
				<span class="text-xs font-black text-rose-800 uppercase tracking-wider block mb-0.5">
					Overdue Receivables
				</span>
				<AlertTriangle class="h-4 w-4 text-rose-700" />
			</div>
			<div class="text-xl sm:text-2xl font-black font-mono text-rose-950">
				{overdueInvoices.length} Overdue
			</div>
			<div class="text-xs sm:text-sm font-bold text-rose-800 mt-1">
				{formatTZS(overdueAmount)} Requires Follow-up
			</div>
		</div>
	</div>

	<!-- Filter & Search Toolbar -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
		<!-- Search -->
		<div class="relative w-full sm:w-80">
			<Search class="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search invoice #, customer name..."
				class="w-full rounded-xl border border-slate-300 bg-slate-50/60 pl-9 pr-4 py-2 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-900/10"
			/>
		</div>

		<!-- Status Filter Pills -->
		<div class="flex flex-wrap items-center gap-1.5">
			{#each ['All', 'Paid', 'Pending', 'Overdue'] as st}
				<button
					type="button"
					onclick={() => selectedStatusFilter = st}
					class="rounded-full px-3.5 py-1.5 text-xs sm:text-[13px] font-bold transition cursor-pointer {
						selectedStatusFilter === st
							? 'bg-navy-900 text-white shadow-xs'
							: 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-navy-950'
					}"
				>
					{st} ({st === 'All' ? totalCount : invoices.filter(i => i.status === st).length})
				</button>
			{/each}
		</div>
	</div>

	<!-- Invoices Table -->
	<div class="overflow-x-auto">
		<table class="w-full text-left text-xs sm:text-sm border-collapse min-w-[720px]">
			<thead>
				<tr class="border-b-2 border-slate-200 text-xs font-black uppercase tracking-wider text-slate-700 bg-slate-100/70">
					<th class="py-3 px-3">Invoice Number</th>
					<th class="py-3 px-3">Customer / Fleet</th>
					<th class="py-3 px-3">Issue Date</th>
					<th class="py-3 px-3 text-center">Items</th>
					<th class="py-3 px-3 text-right">Amount (TZS)</th>
					<th class="py-3 px-3 text-center">Payment Status</th>
					<th class="py-3 px-3 text-right">Actions</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-slate-100">
				{#if filteredInvoices.length === 0}
					<tr>
						<td colspan="7" class="py-10 text-center text-slate-500 text-xs sm:text-sm italic font-medium">
							No generated invoices found matching your filter criteria.
						</td>
					</tr>
				{:else}
					{#each filteredInvoices as inv (inv.id)}
						{@const badge = statusBadges[inv.status] || statusBadges.Pending}
						<tr class="hover:bg-slate-50/90 transition">
							<td class="py-3.5 px-3 font-mono font-bold text-navy-950 text-xs sm:text-sm">
								{inv.id}
							</td>
							<td class="py-3.5 px-3">
								<div class="font-black text-slate-950 text-xs sm:text-sm">{inv.customer}</div>
								{#if inv.paymentTerms}
									<span class="text-xs text-slate-600 font-semibold">
										Terms: {inv.paymentTerms}
									</span>
								{/if}
							</td>
							<td class="py-3.5 px-3 text-xs">
								<div class="font-semibold text-slate-800">{formatDisplayDate(inv.date)}</div>
								{#if inv.createdAt}
									<div class="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
										<Clock class="h-3 w-3 text-slate-400 shrink-0" />
										<span>{formatTimestamp(inv.createdAt)} {inv.createdBy ? `• ${inv.createdBy}` : ''}</span>
									</div>
								{/if}
							</td>
							<td class="py-3.5 px-3 text-center font-mono font-bold text-slate-800 text-xs sm:text-sm">
								{inv.itemsCount} {inv.itemsCount === 1 ? 'item' : 'items'}
							</td>
							<td class="py-3.5 px-3 text-right font-mono font-black text-navy-950 text-xs sm:text-sm">
								{formatTZS(inv.amount)}
							</td>
							<td class="py-3.5 px-3 text-center">
								<span class="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-extrabold border {badge.bg} {badge.text}">
									<badge.icon class="h-3.5 w-3.5 shrink-0" />
									<span>{badge.label}</span>
								</span>
							</td>
							<td class="py-3.5 px-3 text-right">
								<div class="inline-flex items-center gap-1.5 justify-end">
									<button
										type="button"
										onclick={() => onLoadInvoice?.(inv)}
										class="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-navy-950 shadow-2xs hover:bg-navy-900 hover:text-white hover:border-navy-900 transition cursor-pointer"
										title="Load invoice into generator"
									>
										<span>Open</span>
										<ArrowUpRight class="h-3.5 w-3.5" />
									</button>
									{#if onDeleteInvoice}
										<button
											type="button"
											onclick={() => promptDeleteInvoice(inv)}
											class="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition cursor-pointer"
											title="Delete invoice record"
										>
											<Trash2 class="h-3 w-3" />
										</button>
									{/if}
								</div>
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</div>

<!-- Delete Invoice Confirmation Modal -->
<DeleteConfirmModal
	open={isDeleteModalOpen}
	title="Are you sure you want to delete this invoice?"
	itemType="Invoice Record"
	itemName={pendingDeleteInvoice ? `${pendingDeleteInvoice.id} (${pendingDeleteInvoice.customer} - ${formatTZS(pendingDeleteInvoice.amount)})` : undefined}
	description="This will permanently delete this invoice from historical records, financial ledger, and customer transaction logs."
	confirmText="Yes, Delete Invoice"
	onConfirm={confirmDeleteInvoice}
	onClose={() => isDeleteModalOpen = false}
/>

<!-- Delete All Invoices Confirmation Modal -->
<DeleteConfirmModal
	open={isDeleteAllModalOpen}
	title="Delete ALL Invoice Records?"
	itemType="All Invoices"
	itemName={`${totalCount} Invoices (${formatTZS(totalAmount)})`}
	description="This will permanently clear and delete all invoice records from the system audit log, financial reports, and transaction ledger. This cannot be undone."
	confirmText="Yes, Delete All Invoices"
	onConfirm={confirmDeleteAllInvoices}
	onClose={() => isDeleteAllModalOpen = false}
/>
