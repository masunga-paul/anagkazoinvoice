<script lang="ts">
	import type { Customer } from '$lib/types/customer';
	import { formatTZS } from '$lib/utils/format';
	import { Users, TrendingUp, Building2, FileText, ArrowUpRight, Award, ShieldCheck } from 'lucide-svelte';

	interface Props {
		customers: Customer[];
		onSelectCustomer?: (customer: Customer) => void;
	}

	let { customers, onSelectCustomer }: Props = $props();

	// Sort customers by totalPurchases descending
	const sortedCustomers = $derived(
		[...customers].sort((a, b) => b.totalPurchases - a.totalPurchases).slice(0, 6)
	);

	const maxPurchases = $derived(
		Math.max(...sortedCustomers.map((c) => c.totalPurchases), 1)
	);

	const totalFleetRevenue = $derived(
		customers.reduce((acc, c) => acc + c.totalPurchases, 0)
	);

	let hoveredCustomerId = $state<string | null>(null);

	const rankColors = [
		'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs',
		'bg-gradient-to-r from-slate-400 to-slate-500 text-white shadow-xs',
		'bg-gradient-to-r from-amber-700 to-amber-800 text-white shadow-xs',
		'bg-slate-100 text-slate-700',
		'bg-slate-100 text-slate-700',
		'bg-slate-100 text-slate-700'
	];
</script>

<div class="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-5">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
		<div class="flex items-center gap-2.5">
			<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-900 text-sky-400 shadow-xs">
				<Award class="h-4 w-4" />
			</div>
			<div>
				<h2 class="text-base font-bold text-navy-900">
					Top Buying Customers (Revenue Contribution)
				</h2>
				<p class="text-xs text-slate-500">
					Highest volume commercial fleet and corporate accounts ranked by lifetime purchases.
				</p>
			</div>
		</div>

		<div class="flex items-center gap-2">
			<span class="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 border border-emerald-200/60">
				<TrendingUp class="h-3 w-3" />
				<span>Total Fleet Invoiced: {formatTZS(totalFleetRevenue)}</span>
			</span>
		</div>
	</div>

	<!-- Chart Visual: Horizontal Ranking Bars -->
	<div class="space-y-4 pt-1">
		{#if sortedCustomers.length === 0}
			<div class="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center">
				<Users class="mx-auto h-8 w-8 text-slate-300 mb-2" />
				<p class="text-xs font-bold text-slate-700">No Customer Accounts in System</p>
				<p class="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">All customer records have been deleted. New commercial fleet accounts and invoices will rank here automatically.</p>
			</div>
		{:else}
			{#each sortedCustomers as cust, index (cust.id)}
				{@const percentage = Math.round((cust.totalPurchases / maxPurchases) * 100)}
				{@const shareOfTotal = Math.round((cust.totalPurchases / (totalFleetRevenue || 1)) * 100)}
				{@const isHovered = hoveredCustomerId === cust.id}

				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="rounded-xl border p-3.5 transition duration-200 {
						isHovered
							? 'border-navy-400 bg-navy-50/30 shadow-xs scale-[1.005]'
							: 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/50'
					}"
					onmouseenter={() => hoveredCustomerId = cust.id}
					onmouseleave={() => hoveredCustomerId = null}
				>
					<!-- Customer Row Header -->
					<div class="flex flex-wrap items-center justify-between gap-2 mb-2">
						<div class="flex items-center gap-2.5 min-w-0">
							<!-- Rank Badge -->
							<span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold {rankColors[index] || 'bg-slate-100 text-slate-700'}">
								{index + 1}
							</span>

							<div class="min-w-0">
								<div class="flex items-center gap-2">
									<h3 class="font-extrabold text-xs sm:text-sm text-navy-900 truncate">
										{cust.companyName || cust.name}
									</h3>
									<span class="hidden sm:inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-600">
										{cust.customerType}
									</span>
								</div>
								<div class="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
									<span>{cust.invoicesCount} Invoices</span>
									<span>&bull;</span>
									<span>Contact: {cust.contactPerson}</span>
									{#if cust.outstandingBalance > 0}
										<span>&bull;</span>
										<span class="text-amber-600 font-semibold">
											Due: {formatTZS(cust.outstandingBalance)}
										</span>
									{/if}
								</div>
							</div>
						</div>

						<!-- Purchases Total & Share -->
						<div class="text-right shrink-0">
							<div class="font-extrabold font-mono text-xs sm:text-sm text-navy-900">
								{formatTZS(cust.totalPurchases)}
							</div>
							<div class="text-[10px] font-semibold text-slate-400">
								{shareOfTotal}% of total revenue
							</div>
						</div>
					</div>

					<!-- Visual Progress Bar -->
					<div class="relative h-3 w-full overflow-hidden rounded-full bg-slate-100">
						<div
							class="h-full rounded-full transition-all duration-500 {
								index === 0
									? 'bg-gradient-to-r from-navy-900 via-navy-800 to-sky-500'
									: index === 1
										? 'bg-gradient-to-r from-navy-800 to-sky-600'
										: index === 2
											? 'bg-gradient-to-r from-sky-600 to-sky-400'
											: 'bg-gradient-to-r from-slate-600 to-slate-400'
							}"
							style="width: {percentage}%"
						></div>
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>
