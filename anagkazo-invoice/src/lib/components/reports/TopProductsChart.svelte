<script lang="ts">
	import type { TopProduct } from '$lib/types/report';
	import { formatTZS } from '$lib/utils/format';
	import { Disc3, TrendingUp, PackageCheck, Layers, Sparkles } from 'lucide-svelte';

	interface Props {
		products: TopProduct[];
	}

	let { products }: Props = $props();

	const maxUnits = $derived(
		Math.max(...products.map((p) => p.unitsSold), 1)
	);

	const totalUnits = $derived(
		products.reduce((acc, p) => acc + p.unitsSold, 0)
	);

	const totalProductRevenue = $derived(
		products.reduce((acc, p) => acc + p.revenueTZS, 0)
	);

	let hoveredIndex = $state<number | null>(null);

	const barColors = [
		'from-navy-950 via-navy-900 to-sky-500',
		'from-navy-900 via-sky-700 to-sky-400',
		'from-sky-700 to-sky-400',
		'from-amber-600 to-amber-400',
		'from-slate-700 to-slate-400'
	];
</script>

<div class="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs space-y-5">
	<!-- Chart Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
		<div class="flex items-center gap-2.5">
			<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-900 text-sky-400 shadow-xs">
				<Disc3 class="h-4 w-4" />
			</div>
			<div>
				<h2 class="text-base font-bold text-navy-900">
					Top Sold Products & Tyre Models (Volume & Value)
				</h2>
				<p class="text-xs text-slate-500">
					Fastest-moving tyre inventory and commercial units sold in Dar es Salaam.
				</p>
			</div>
		</div>

		<!-- Summary Badges -->
		<div class="flex items-center gap-2">
			<span class="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-navy-900 border border-sky-200/60">
				<PackageCheck class="h-3.5 w-3.5 text-sky-600" />
				<span>{totalUnits} Units Sold</span>
			</span>
			<span class="inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-2.5 py-1 text-[11px] font-bold text-white shadow-xs">
				<span>{formatTZS(totalProductRevenue)}</span>
			</span>
		</div>
	</div>

	<!-- Interactive Visual Bar Chart -->
	<div class="space-y-4 pt-1">
		{#if products.length === 0}
			<div class="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center">
				<Disc3 class="mx-auto h-8 w-8 text-slate-300 mb-2" />
				<p class="text-xs font-bold text-slate-700">No Product Sales Recorded</p>
				<p class="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">All product sales transactions have been deleted. Top selling tyres and services will rank here once invoices are created.</p>
			</div>
		{:else}
			{#each products as prod, index (prod.name)}
				{@const percentage = Math.round((prod.unitsSold / maxUnits) * 100)}
				{@const volumeShare = Math.round((prod.unitsSold / (totalUnits || 1)) * 100)}
				{@const isHovered = hoveredIndex === index}

				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="rounded-xl border p-3.5 transition duration-200 {
						isHovered
							? 'border-navy-400 bg-sky-50/20 shadow-xs scale-[1.005]'
							: 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50/50'
					}"
					onmouseenter={() => hoveredIndex = index}
					onmouseleave={() => hoveredIndex = null}
				>
					<!-- Product Title & Stats Row -->
					<div class="flex flex-wrap items-center justify-between gap-2 mb-2">
						<div class="flex items-center gap-2.5 min-w-0">
							<span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-navy-900 text-white text-[10px] font-extrabold">
								{index + 1}
							</span>
							<div class="min-w-0">
								<div class="flex items-center gap-2">
									<h3 class="font-extrabold text-xs sm:text-sm text-navy-900 truncate">
										{prod.name}
									</h3>
									<span class="inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-600">
										{prod.category}
									</span>
								</div>
								<div class="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
									<span class="font-mono font-bold text-slate-700">{prod.unitsSold} units</span>
									<span>&bull;</span>
									<span>Avg price: {formatTZS(Math.round(prod.revenueTZS / (prod.unitsSold || 1)))}</span>
								</div>
							</div>
						</div>

						<div class="flex items-center gap-3 shrink-0">
							<div class="text-right">
								<div class="font-extrabold font-mono text-xs sm:text-sm text-navy-900">
									{formatTZS(prod.revenueTZS)}
								</div>
								<div class="text-[10px] font-semibold text-slate-400">
									{volumeShare}% market volume
								</div>
							</div>

							<span class="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60">
								<TrendingUp class="h-2.5 w-2.5" />
								<span>{prod.trend}</span>
							</span>
						</div>
					</div>

					<!-- Bar Track -->
					<div class="relative h-3 w-full overflow-hidden rounded-full bg-slate-100">
						<div
							class="h-full rounded-full bg-gradient-to-r {barColors[index % barColors.length]} transition-all duration-500"
							style="width: {percentage}%"
						></div>
					</div>
				</div>
			{/each}
		{/if}
	</div>
</div>
