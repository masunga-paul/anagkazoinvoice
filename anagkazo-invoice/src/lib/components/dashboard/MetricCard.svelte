<script lang="ts">
	import type { Snippet } from 'svelte';
	import { TrendingUp, TrendingDown } from 'lucide-svelte';

	interface Props {
		title: string;
		value: string;
		subtitle?: string;
		trend?: string;
		trendPositive?: boolean;
		icon?: any;
		iconBg?: string;
		iconColor?: string;
	}

	let {
		title,
		value,
		subtitle,
		trend,
		trendPositive = true,
		icon: IconComponent,
		iconBg = 'bg-slate-100',
		iconColor = 'text-slate-900'
	}: Props = $props();
</script>

<div class="rounded-2xl border border-slate-300/90 bg-white p-5 shadow-2xs transition hover:border-slate-400 hover:shadow-xs">
	<div class="flex items-start justify-between">
		<div>
			<span class="text-xs sm:text-[13px] font-black text-slate-700 uppercase tracking-wider block mb-1.5">
				{title}
			</span>
			<div class="text-2xl sm:text-3xl font-black tracking-tight text-slate-950 font-mono">
				{value}
			</div>
		</div>

		{#if IconComponent}
			<div class="flex h-11 w-11 items-center justify-center rounded-xl {iconBg} {iconColor} shadow-2xs">
				<IconComponent class="h-5 w-5" />
			</div>
		{/if}
	</div>

	{#if trend || subtitle}
		<div class="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs sm:text-[13px]">
			{#if trend}
				<div class="flex items-center gap-1 font-bold {trendPositive ? 'text-emerald-700' : 'text-rose-700'}">
					{#if trendPositive}
						<TrendingUp class="h-4 w-4 text-emerald-600" />
					{:else}
						<TrendingDown class="h-4 w-4 text-rose-600" />
					{/if}
					<span>{trend}</span>
					<span class="text-slate-500 font-semibold ml-0.5">vs last month</span>
				</div>
			{/if}

			{#if subtitle}
				<span class="text-slate-600 font-bold text-xs">{subtitle}</span>
			{/if}
		</div>
	{/if}
</div>
