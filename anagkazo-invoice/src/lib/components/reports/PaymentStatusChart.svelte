<script lang="ts">
	import type { InvoiceStatusMetric } from '$lib/types/report';
	import { formatTZS } from '$lib/utils/format';
	import { CheckCircle2, Clock, AlertTriangle } from 'lucide-svelte';

	interface Props {
		metrics: InvoiceStatusMetric[];
	}

	let { metrics }: Props = $props();

	const totalInvoiced = $derived(
		metrics.reduce((acc, m) => acc + m.totalAmountTZS, 0)
	);
</script>

<div class="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
	<div class="border-b border-slate-100 pb-3 mb-4">
		<h2 class="text-base font-bold text-slate-900">Invoice Collection & Aging</h2>
		<p class="text-xs text-slate-500">Breakdown of settled, pending, and overdue fleet billing.</p>
	</div>

	<!-- Stacked Horizontal Bar Chart -->
	<div class="space-y-4">
		{#if metrics.length === 0 || totalInvoiced === 0}
			<div class="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center my-2">
				<Clock class="mx-auto h-8 w-8 text-slate-300 mb-2" />
				<p class="text-xs font-bold text-slate-700">No Invoices Pending Settlement</p>
				<p class="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">Collection and aging breakdown will calculate as invoices are generated in the system.</p>
			</div>
		{:else}
			<div class="h-4 w-full rounded-full overflow-hidden flex bg-slate-100">
				{#each metrics as m}
					<div
						style="width: {m.percentage}%; background-color: {m.color};"
						class="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
						title="{m.status}: {m.percentage}% ({formatTZS(m.totalAmountTZS)})"
					></div>
				{/each}
			</div>

			<!-- Status Cards Grid -->
			<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
				{#each metrics as m}
					<div class="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-1">
						<div class="flex items-center gap-1.5 text-xs font-bold text-slate-700">
							{#if m.status === 'Paid'}
								<CheckCircle2 class="h-3.5 w-3.5 text-navy-900" />
							{:else if m.status === 'Pending'}
								<Clock class="h-3.5 w-3.5 text-amber-600" />
							{:else}
								<AlertTriangle class="h-3.5 w-3.5 text-rose-600" />
							{/if}
							<span>{m.status}</span>
							<span class="ml-auto font-mono text-[11px] text-slate-500">{m.percentage}%</span>
						</div>

						<div class="text-xs sm:text-sm font-extrabold font-mono text-slate-900">
							{formatTZS(m.totalAmountTZS)}
						</div>
						<div class="text-[10px] text-slate-400">
							{m.count} invoices
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Bottom Summary -->
	<div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
		<span>Total Billing Volume:</span>
		<span class="font-mono font-bold text-slate-900">{formatTZS(totalInvoiced)}</span>
	</div>
</div>
