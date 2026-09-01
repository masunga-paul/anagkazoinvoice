<script lang="ts">
	import type { MonthlyRevenue } from '$lib/types/report';
	import { formatTZS } from '$lib/utils/format';

	interface Props {
		data: MonthlyRevenue[];
	}

	let { data }: Props = $props();

	let hoveredIndex = $state<number | null>(null);

	// Compute max value for scaling safely
	const maxVal = $derived(
		Math.max(Math.max(...data.map((d) => Math.max(d.revenue, d.target))) * 1.15, 1000000)
	);

	// Chart dimensions
	const width = 760;
	const height = 260;
	const padX = 45;
	const padY = 30;
	const chartW = width - padX * 2;
	const chartH = height - padY * 2;

	// Calculate coordinates for Area & Line
	const points = $derived(
		data.map((d, i) => {
			const divisor = data.length > 1 ? data.length - 1 : 1;
			const x = padX + (i / divisor) * chartW;
			const y = height - padY - (d.revenue / maxVal) * chartH;
			return { x, y, data: d, index: i };
		})
	);

	const targetPoints = $derived(
		data.map((d, i) => {
			const divisor = data.length > 1 ? data.length - 1 : 1;
			const x = padX + (i / divisor) * chartW;
			const y = height - padY - (d.target / maxVal) * chartH;
			return { x, y };
		})
	);

	// Smooth SVG Path generator
	function getSmoothPath(pts: { x: number; y: number }[]): string {
		if (pts.length === 0) return '';
		let path = `M ${pts[0].x},${pts[0].y}`;
		for (let i = 0; i < pts.length - 1; i++) {
			const p0 = i > 0 ? pts[i - 1] : pts[i];
			const p1 = pts[i];
			const p2 = pts[i + 1];
			const p3 = i != pts.length - 2 ? pts[i + 2] : p2;

			const cp1x = p1.x + (p2.x - p0.x) / 6;
			const cp1y = p1.y + (p2.y - p0.y) / 6;
			const cp2x = p2.x - (p3.x - p1.x) / 6;
			const cp2y = p2.y - (p3.y - p1.y) / 6;

			path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
		}
		return path;
	}

	const linePath = $derived(getSmoothPath(points));
	const areaPath = $derived(
		points.length > 0
			? `${linePath} L ${points[points.length - 1].x},${height - padY} L ${points[0].x},${height - padY} Z`
			: ''
	);

	const targetLinePath = $derived(getSmoothPath(targetPoints));
</script>

<div class="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
	<!-- Chart Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4 mb-4">
		<div>
			<h2 class="text-base font-bold text-slate-900">Revenue Performance Curve</h2>
			<p class="text-xs text-slate-500">Invoicing revenue vs sales targets across the selected period (in TZS).</p>
		</div>

		<!-- Legends -->
		<div class="flex items-center gap-4 text-xs">
			<div class="flex items-center gap-1.5">
				<span class="h-2.5 w-2.5 rounded-full bg-navy-900"></span>
				<span class="text-slate-700 font-semibold">Actual Invoiced</span>
			</div>
			<div class="flex items-center gap-1.5">
				<span class="h-2.5 w-2.5 rounded-full bg-sky-400"></span>
				<span class="text-slate-500 font-medium">Monthly Target</span>
			</div>
		</div>
	</div>

	<!-- Interactive SVG Chart Area -->
	<div class="relative w-full overflow-hidden">
		{#if data.length === 0 || data.every((d) => d.revenue === 0 && d.target === 0)}
			<div class="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-12 text-center my-2">
				<p class="text-xs font-bold text-slate-700">No Monthly Invoicing History</p>
				<p class="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">Revenue curves will plot here in real time as invoices are generated.</p>
			</div>
		{:else}
			<svg
				viewBox="0 0 {width} {height}"
				class="w-full h-auto overflow-visible select-none"
			>
			<defs>
				<linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stop-color="#0f2038" stop-opacity="0.22" />
					<stop offset="100%" stop-color="#0f2038" stop-opacity="0.01" />
				</linearGradient>
			</defs>

			<!-- Horizontal Grid Lines -->
			{#each [0.25, 0.5, 0.75, 1] as frac}
				{@const yPos = height - padY - frac * chartH}
				<line
					x1={padX}
					y1={yPos}
					x2={width - padX}
					y2={yPos}
					stroke="#f1f5f9"
					stroke-width="1"
					stroke-dasharray="4 4"
				/>
				<text
					x={padX - 8}
					y={yPos + 3}
					text-anchor="end"
					class="text-[9px] fill-slate-400 font-mono"
				>
					{Math.round((frac * maxVal) / 1000000)}M
				</text>
			{/each}

			<!-- Area Fill -->
			<path d={areaPath} fill="url(#revenueGradient)" />

			<!-- Target Line (Dashed Sky Blue) -->
			<path
				d={targetLinePath}
				fill="none"
				stroke="#38bdf8"
				stroke-width="2"
				stroke-dasharray="3 3"
				opacity="0.85"
			/>

			<!-- Actual Revenue Line -->
			<path
				d={linePath}
				fill="none"
				stroke="#0f2038"
				stroke-width="2.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>

			<!-- Interactive Points & Bars -->
			{#each points as pt, i}
				<!-- Hover Bar Column -->
				<rect
					x={pt.x - chartW / (data.length * 2)}
					y={padY}
					width={chartW / data.length}
					height={chartH}
					fill="transparent"
					class="cursor-pointer"
					role="presentation"
					onmouseenter={() => hoveredIndex = i}
					onmouseleave={() => hoveredIndex = null}
				/>

				<!-- Vertical Hover Guide Line -->
				{#if hoveredIndex === i}
					<line
						x1={pt.x}
						y1={padY}
						x2={pt.x}
						y2={height - padY}
						stroke="#cbd5e1"
						stroke-width="1"
						stroke-dasharray="2 2"
					/>
				{/if}

				<!-- Data Point Circle -->
				<circle
					cx={pt.x}
					cy={pt.y}
					r={hoveredIndex === i ? 5.5 : 3.5}
					fill={hoveredIndex === i ? '#38bdf8' : '#0f2038'}
					stroke="#ffffff"
					stroke-width="2"
					class="transition-all duration-200"
				/>

				<!-- Month Labels on X Axis -->
				<text
					x={pt.x}
					y={height - 10}
					text-anchor="middle"
					class="text-[10px] font-medium {hoveredIndex === i ? 'fill-navy-900 font-bold' : 'fill-slate-400'}"
				>
					{pt.data.shortMonth}
				</text>
			{/each}
		</svg>

		<!-- Tooltip Display -->
		{#if hoveredIndex !== null && points[hoveredIndex]}
			{@const pt = points[hoveredIndex]}
			<div
				class="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 sm:static sm:translate-x-0 mt-2 flex items-center justify-center"
			>
				<div class="rounded-xl border border-navy-800 bg-navy-950 p-2.5 text-white shadow-xl text-xs flex items-center gap-4 animate-in fade-in">
					<div>
						<div class="font-bold text-slate-200">{pt.data.month}</div>
						<div class="text-[10px] text-slate-400">{pt.data.invoicesCount} Invoices Issued</div>
					</div>
					<div class="border-l border-navy-800 pl-3">
						<div class="text-[10px] text-slate-400 uppercase">Revenue</div>
						<div class="font-mono font-bold text-sky-400">{formatTZS(pt.data.revenue)}</div>
					</div>
					<div class="border-l border-navy-800 pl-3 hidden sm:block">
						<div class="text-[10px] text-slate-400 uppercase">Target</div>
						<div class="font-mono text-slate-300">{formatTZS(pt.data.target)}</div>
					</div>
				</div>
			</div>
		{/if}
		{/if}
	</div>
</div>
