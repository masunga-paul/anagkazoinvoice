<script lang="ts">
	import { Trash2, AlertTriangle, X } from 'lucide-svelte';

	interface Props {
		open: boolean;
		title?: string;
		itemName?: string;
		itemType?: string;
		description?: string;
		confirmText?: string;
		onConfirm: () => void;
		onClose: () => void;
	}

	let {
		open = false,
		title = 'Are you sure you want to delete this?',
		itemName,
		itemType = 'item',
		description = 'This action is irreversible and will permanently remove this record from the database and active session.',
		confirmText = 'Yes, Delete',
		onConfirm,
		onClose
	}: Props = $props();
</script>

{#if open}
	<div
		class="fixed inset-0 z-[99] flex items-center justify-center bg-slate-900/65 p-4 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
		role="dialog"
		aria-modal="true"
	>
		<div
			class="relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10 animate-in zoom-in-95 duration-200"
		>
			<!-- Top Header -->
			<div class="flex items-start justify-between">
				<div class="flex items-center gap-3">
					<div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 ring-1 ring-rose-200">
						<AlertTriangle class="h-6 w-6" />
					</div>
					<div>
						<h3 class="text-base font-extrabold text-slate-900 leading-snug">
							{title}
						</h3>
						<p class="text-xs text-slate-500 mt-0.5">
							Confirm deletion of this {itemType.toLowerCase()}
						</p>
					</div>
				</div>

				<button
					type="button"
					onclick={onClose}
					class="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
					aria-label="Close dialog"
				>
					<X class="h-4 w-4" />
				</button>
			</div>

			<!-- Item Detail Card -->
			{#if itemName}
				<div class="my-4 rounded-xl border border-rose-100 bg-rose-50/50 p-3.5 space-y-1">
					<div class="text-[11px] font-bold uppercase tracking-wider text-rose-800">
						Target {itemType}:
					</div>
					<div class="text-sm font-extrabold text-slate-900 break-words">
						{itemName}
					</div>
				</div>
			{/if}

			<!-- Explanatory note -->
			<p class="text-xs text-slate-600 leading-relaxed {itemName ? 'mb-5' : 'my-4'}">
				{description}
			</p>

			<!-- Action Buttons -->
			<div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
				<button
					type="button"
					onclick={onClose}
					class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition cursor-pointer"
				>
					Cancel
				</button>
				<button
					type="button"
					onclick={() => {
						onConfirm();
						onClose();
					}}
					class="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 active:scale-95 transition cursor-pointer"
				>
					<Trash2 class="h-3.5 w-3.5" />
					<span>{confirmText}</span>
				</button>
			</div>
		</div>
	</div>
{/if}
