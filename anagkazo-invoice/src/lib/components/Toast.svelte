<script lang="ts">
	import {
		CheckCircle2,
		AlertCircle,
		Info,
		X,
		PlusCircle,
		RefreshCw,
		Trash2,
		Send,
		FileText,
		ShieldCheck,
		Sparkles,
		Save
	} from 'lucide-svelte';

	export type FlashAction =
		| 'CREATE'
		| 'READ'
		| 'UPDATE'
		| 'DELETE'
		| 'DISPATCH'
		| 'SUCCESS'
		| 'ERROR'
		| 'INFO'
		| 'AUTH'
		| 'LOGOUT';


	interface Props {
		type?: 'success' | 'error' | 'info';
		action?: FlashAction;
		title?: string;
		message: string;
		visible: boolean;
		durationMs?: number;
		onClose: () => void;
	}

	let {
		type = 'success',
		action,
		title,
		message,
		visible,
		durationMs = 4000,
		onClose
	}: Props = $props();

	// Auto-infer action if not explicitly supplied
	const effectiveAction = $derived.by(() => {
		if (action) return action;
		const msgLower = (message + ' ' + (title || '')).toLowerCase();
		if (msgLower.includes('delete') || msgLower.includes('remove') || msgLower.includes('cleared')) return 'DELETE';
		if (msgLower.includes('created') || msgLower.includes('added') || msgLower.includes('new')) return 'CREATE';
		if (msgLower.includes('update') || msgLower.includes('switch') || msgLower.includes('sync') || msgLower.includes('saved') || msgLower.includes('draft')) return 'UPDATE';
		if (msgLower.includes('dispatch') || msgLower.includes('sent') || msgLower.includes('send')) return 'DISPATCH';
		if (msgLower.includes('loaded') || msgLower.includes('preset')) return 'READ';
		return type === 'error' ? 'ERROR' : 'SUCCESS';
	});

	// Action metadata configuration
	const actionConfigs: Record<FlashAction, {
		label: string;
		badgeBg: string;
		badgeText: string;
		borderColor: string;
		barColor: string;
		icon: any;
	}> = {
		CREATE: {
			label: 'CREATED',
			badgeBg: 'bg-emerald-500 text-white',
			badgeText: 'text-emerald-700 bg-emerald-50 border-emerald-200',
			borderColor: 'border-emerald-500/40 shadow-emerald-500/10',
			barColor: 'bg-emerald-500',
			icon: PlusCircle
		},
		UPDATE: {
			label: 'UPDATED',
			badgeBg: 'bg-sky-500 text-white',
			badgeText: 'text-sky-700 bg-sky-50 border-sky-200',
			borderColor: 'border-sky-500/40 shadow-sky-500/10',
			barColor: 'bg-sky-500',
			icon: RefreshCw
		},
		DELETE: {
			label: 'DELETED',
			badgeBg: 'bg-rose-500 text-white',
			badgeText: 'text-rose-700 bg-rose-50 border-rose-200',
			borderColor: 'border-rose-500/40 shadow-rose-500/10',
			barColor: 'bg-rose-500',
			icon: Trash2
		},
		DISPATCH: {
			label: 'DISPATCHED',
			badgeBg: 'bg-navy-900 text-cyan-300',
			badgeText: 'text-navy-900 bg-navy-50 border-navy-200',
			borderColor: 'border-navy-900/40 shadow-navy-900/10',
			barColor: 'bg-cyan-500',
			icon: Send
		},
		READ: {
			label: 'LOADED',
			badgeBg: 'bg-amber-500 text-white',
			badgeText: 'text-amber-700 bg-amber-50 border-amber-200',
			borderColor: 'border-amber-500/40 shadow-amber-500/10',
			barColor: 'bg-amber-500',
			icon: FileText
		},
		SUCCESS: {
			label: 'SUCCESS',
			badgeBg: 'bg-emerald-600 text-white',
			badgeText: 'text-emerald-700 bg-emerald-50 border-emerald-200',
			borderColor: 'border-emerald-500/30 shadow-emerald-500/10',
			barColor: 'bg-emerald-500',
			icon: CheckCircle2
		},
		ERROR: {
			label: 'ERROR',
			badgeBg: 'bg-rose-600 text-white',
			badgeText: 'text-rose-700 bg-rose-50 border-rose-200',
			borderColor: 'border-rose-500/40 shadow-rose-500/10',
			barColor: 'bg-rose-500',
			icon: AlertCircle
		},
		INFO: {
			label: 'NOTICE',
			badgeBg: 'bg-blue-600 text-white',
			badgeText: 'text-blue-700 bg-blue-50 border-blue-200',
			borderColor: 'border-blue-500/30 shadow-blue-500/10',
			barColor: 'bg-blue-500',
			icon: Info
		},
		AUTH: {
			label: 'SECURITY',
			badgeBg: 'bg-indigo-600 text-white',
			badgeText: 'text-indigo-700 bg-indigo-50 border-indigo-200',
			borderColor: 'border-indigo-500/40 shadow-indigo-500/10',
			barColor: 'bg-indigo-500',
			icon: ShieldCheck
		},
		LOGOUT: {
			label: 'LOGGED OUT',
			badgeBg: 'bg-amber-600 text-white',
			badgeText: 'text-amber-800 bg-amber-50 border-amber-200',
			borderColor: 'border-amber-500/40 shadow-amber-500/10',
			barColor: 'bg-amber-500',
			icon: AlertCircle
		}
	};

	const currentCfg = $derived(actionConfigs[effectiveAction] || actionConfigs.SUCCESS);
</script>

{#if visible}
	{@const Icon = currentCfg.icon}
	<div
		class="fixed top-5 right-5 z-[100] max-w-md w-[92vw] sm:w-[420px] overflow-hidden rounded-2xl border bg-white/95 backdrop-blur-md p-4 shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-top-5 {currentCfg.borderColor}"
		role="alert"
	>
		<div class="flex items-start gap-3">
			<!-- Action Icon Circle -->
			<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl {currentCfg.badgeBg} shadow-sm">
				<Icon class="h-5 w-5" />
			</div>

			<!-- Notification Body -->
			<div class="flex-1 min-w-0 pr-1">
				<div class="flex items-center gap-2 mb-1">
					<span class="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border {currentCfg.badgeText}">
						{currentCfg.label}
					</span>
					{#if title}
						<h4 class="text-xs font-bold text-slate-900 truncate">
							{title}
						</h4>
					{/if}
				</div>

				<p class="text-xs font-medium text-slate-700 leading-relaxed break-words">
					{message}
				</p>
			</div>

			<!-- Dismiss Button -->
			<button
				type="button"
				onclick={onClose}
				aria-label="Dismiss flash notification"
				class="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
			>
				<X class="h-4 w-4" />
			</button>
		</div>

		<!-- Animated Countdown Bar -->
		<div class="mt-3 h-1 w-full bg-slate-100 rounded-full overflow-hidden">
			<div
				class="h-full {currentCfg.barColor} rounded-full"
				style="animation: shrinkWidth {durationMs}ms linear forwards;"
			></div>
		</div>
	</div>
{/if}

<style>
	@keyframes shrinkWidth {
		from {
			width: 100%;
		}
		to {
			width: 0%;
		}
	}
</style>
