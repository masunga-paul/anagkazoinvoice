<script lang="ts">
	interface Props {
		invoiceNumber: string;
	}

	let { invoiceNumber }: Props = $props();
</script>

<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
	<!-- Left Title Info -->
	<div>
		<div class="flex flex-wrap items-center gap-2 sm:gap-3">
			<h1 class="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-slate-950">
				Create / Edit Invoice
			</h1>
			<span class="inline-flex items-center rounded-lg bg-slate-100 px-2.5 sm:px-3 py-1 text-xs sm:text-sm font-bold font-mono text-slate-800 ring-1 ring-inset ring-slate-300">
				{invoiceNumber}
			</span>
		</div>
		<p class="text-xs sm:text-sm text-slate-600 font-medium mt-1">
			Commercial tyre fleet invoicing and live document generation.
		</p>
	</div>
</div>
