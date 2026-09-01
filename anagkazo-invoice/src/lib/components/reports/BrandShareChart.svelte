<script lang="ts">
	import type { BrandShare } from '$lib/types/report';
	import { formatTZS } from '$lib/utils/format';
	import { PieChart } from 'lucide-svelte';

	interface Props {
		brands: BrandShare[];
	}

	let { brands }: Props = $props();

	let hoveredBrand = $state<string | null>(null);

	// Calculate SVG Donut stroke dashes
	const size = 180;
	const strokeWidth = 24;
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;

	// Compute cumulative offsets
	let currentOffset = 0;
	const brandSegments = $derived(
		brands.map((b) => {
			const strokeDasharray = `${(b.percentage / 100) * circumference} ${circumference}`;
			const strokeDashoffset = -currentOffset;
			currentOffset += (b.percentage / 100) * circumference;
			return {
				...b,
				strokeDasharray,
				strokeDashoffset
			};
		})
	);

	const totalRevenue = $derived(
		brands.reduce((acc, b) => acc + b.revenueTZS, 0)
	);

	const totalUnits = $derived(
		brands.reduce((acc, b) => acc + b.unitsSold, 0)
	);
</script>

<div class="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs flex flex-col justify-between">
	<div class="border-b border-slate-100 pb-3 mb-4">
		<h2 class="text-base font-bold text-slate-900">Tyre Brand Sales Share</h2>
		<p class="text-xs text-slate-500">Distribution of commercial & passenger tyre volumes sold.</p>
	</div>

	{#if brands.length === 0 || totalUnits === 0}
		<div class="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center my-4">
			<PieChart class="mx-auto h-8 w-8 text-slate-300 mb-2" />
			<p class="text-xs font-bold text-slate-700">No Tyre Brand Distribution Data</p>
			<p class="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">Brand market shares will calculate in real time as tyres are sold via generated invoices.</p>
		</div>
	{:else}
		<!-- Donut & Legends Container -->
		<div class="flex flex-col sm:flex-row items-center justify-around gap-6 my-2">
			<!-- SVG Donut Ring -->
			<div class="relative flex items-center justify-center">
				<svg width={size} height={size} viewBox="0 0 {size} {size}" class="rotate-[-90deg]">
					{#each brandSegments as seg}
						<circle
							cx={size / 2}
							cy={size / 2}
							r={radius}
							fill="transparent"
							stroke={seg.color}
							stroke-width={hoveredBrand === seg.brand ? strokeWidth + 4 : strokeWidth}
							stroke-dasharray={seg.strokeDasharray}
							stroke-dashoffset={seg.strokeDashoffset}
							class="transition-all duration-200 cursor-pointer"
							role="presentation"
							onmouseenter={() => hoveredBrand = seg.brand}
							onmouseleave={() => hoveredBrand = null}
						/>
					{/each}

				</svg>

				<!-- Donut Center Text -->
				<div class="absolute text-center select-none pointer-events-none">
					{#if hoveredBrand}
						{@const active = brands.find((b) => b.brand === hoveredBrand)}
						<div class="text-[11px] font-bold text-slate-500">{active?.brand}</div>
						<div class="text-base font-extrabold text-slate-900">{active?.percentage}%</div>
					{:else}
						<div class="text-[10px] font-bold text-slate-400 uppercase">Total Sales</div>
						<div class="text-xs font-extrabold text-slate-900 font-mono">
							{totalUnits} Tyres
						</div>
					{/if}
				</div>
			</div>

			<!-- Brand Legends List -->
			<div class="space-y-2.5 w-full sm:w-auto">
				{#each brands as b}
					<button
						type="button"
						class="w-full flex items-center justify-between sm:justify-start gap-4 text-xs p-1.5 rounded-lg transition text-left cursor-pointer {
							hoveredBrand === b.brand ? 'bg-slate-50 font-bold' : ''
						}"
						onmouseenter={() => hoveredBrand = b.brand}
						onmouseleave={() => hoveredBrand = null}
						onfocus={() => hoveredBrand = b.brand}
						onblur={() => hoveredBrand = null}
					>
						<div class="flex items-center gap-2">
							<span class="h-3 w-3 rounded-md" style="background-color: {b.color}"></span>
							<span class="font-medium text-slate-800">{b.brand}</span>
						</div>
						<div class="flex items-center gap-2 font-mono">
							<span class="font-bold text-slate-900">{b.percentage}%</span>
							<span class="text-slate-400 text-[11px]">({b.unitsSold} units)</span>
						</div>
					</button>
				{/each}
			</div>

		</div>
	{/if}

	<!-- Total Brand Revenue Footnote -->
	<div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
		<span>Total Tyre Portfolio:</span>
		<span class="font-mono font-bold text-slate-900">{formatTZS(totalRevenue)}</span>
	</div>
</div>
