<script lang="ts">
	import type { WorkshopService } from '$lib/types/service';
	import { bookingSchema, type BookingInput } from '$lib/schema/booking';
	import { formatTZS } from '$lib/utils/format';
	import { X, Calendar, Wrench, Clock, CheckCircle2, AlertCircle } from 'lucide-svelte';
	import { superForm, defaults } from 'sveltekit-superforms';
	import { zod, zodClient } from 'sveltekit-superforms/adapters';

	interface Props {
		open: boolean;
		service: WorkshopService | null;
		onClose: () => void;
		onConfirmBooking: (details: { serviceTitle: string; vehiclePlate: string; date: string; customer: string }) => void;
	}

	let { open, service, onClose, onConfirmBooking }: Props = $props();

	const { form, errors, enhance, reset } = superForm<BookingInput>(
		defaults(
			{
				serviceTitle: 'Workshop Service',
				customer: '',
				vehiclePlate: 'T ',
				date: '2026-02-02',
				timeSlot: '09:00 AM - 10:30 AM',
				notes: ''
			},
			zod(bookingSchema as any) as any
		),
		{
			SPA: true,
			validators: zodClient(bookingSchema as any),
			validationMethod: 'oninput',
			resetForm: false,
			onUpdate({ form: f }) {
				if (!f.valid || !service) return;
				const data = f.data;

				onConfirmBooking({
					serviceTitle: service.title,
					vehiclePlate: data.vehiclePlate.trim(),
					date: data.date,
					customer: data.customer.trim()
				});

				reset();
				onClose();
			}
		}
	);

	// Sync serviceTitle if service changes
	$effect(() => {
		if (service?.title) {
			$form.serviceTitle = service.title;
		}
	});
</script>

{#if open && service}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
		<div class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10">
			<!-- Modal Header -->
			<div class="flex items-center justify-between border-b border-slate-100 pb-3">
				<div class="flex items-center gap-2">
					<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900 text-sky-400">
						<Wrench class="h-4 w-4" />
					</div>
					<h3 class="font-bold text-navy-900">Book Workshop Service</h3>
				</div>
				<button
					type="button"
					onclick={onClose}
					class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
				>
					<X class="h-4 w-4" />
				</button>
			</div>

			<!-- Service summary banner -->
			<div class="my-4 rounded-xl bg-slate-50 p-3.5 border border-slate-100 flex items-start justify-between">
				<div>
					<div class="font-bold text-slate-900 text-xs sm:text-sm">{service.title}</div>
					<div class="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5">
						<Clock class="h-3 w-3" />
						<span>Est. {service.estimatedMinutes} mins</span>
						<span>&bull;</span>
						<span>{service.category}</span>
					</div>
				</div>
				<div class="text-right">
					<div class="font-bold font-mono text-slate-900 text-xs sm:text-sm">
						{formatTZS(service.priceTZS)}
					</div>
				</div>
			</div>

			<!-- Booking Form with Superforms & Zod -->
			<form use:enhance method="POST" novalidate class="space-y-3 text-xs text-slate-700">
				<div>
					<label for="bookCustName" class="block font-bold text-slate-700 uppercase tracking-wider mb-1">
						Customer / Fleet Name <span class="text-rose-500">*</span>
					</label>
					<input
						id="bookCustName"
						name="customer"
						type="text"
						bind:value={$form.customer}
						placeholder="e.g. Tanzania Safari Logistics Ltd"
						class="w-full rounded-xl border px-3 py-2 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 transition {
							$errors.customer
								? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500/20'
								: 'border-slate-200 bg-slate-50/50 focus:border-navy-900 focus:ring-navy-900/10'
						}"
					/>
					{#if $errors.customer}
						<p class="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
							<AlertCircle class="h-3 w-3 shrink-0" />
							<span>{$errors.customer}</span>
						</p>
					{/if}
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<div>
						<label for="bookVehiclePlate" class="block font-bold text-slate-700 uppercase tracking-wider mb-1">
							Vehicle Plate / Reg <span class="text-rose-500">*</span>
						</label>
						<input
							id="bookVehiclePlate"
							name="vehiclePlate"
							type="text"
							bind:value={$form.vehiclePlate}
							placeholder="T 421 DKL"
							class="w-full rounded-xl border px-3 py-2 text-xs sm:text-sm text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 transition {
								$errors.vehiclePlate
									? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500/20'
									: 'border-slate-200 bg-slate-50/50 focus:border-navy-900 focus:ring-navy-900/10'
							}"
						/>
						{#if $errors.vehiclePlate}
							<p class="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
								<AlertCircle class="h-3 w-3 shrink-0" />
								<span>{$errors.vehiclePlate}</span>
							</p>
						{/if}
					</div>
					<div>
						<label for="bookDate" class="block font-bold text-slate-700 uppercase tracking-wider mb-1">
							Service Date <span class="text-rose-500">*</span>
						</label>
						<input
							id="bookDate"
							name="date"
							type="date"
							bind:value={$form.date}
							class="w-full rounded-xl border px-3 py-2 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 transition {
								$errors.date
									? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500/20'
									: 'border-slate-200 bg-slate-50/50 focus:border-navy-900 focus:ring-navy-900/10'
							}"
						/>
						{#if $errors.date}
							<p class="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
								<AlertCircle class="h-3 w-3 shrink-0" />
								<span>{$errors.date}</span>
							</p>
						{/if}
					</div>
				</div>

				<div>
					<label for="bookTimeSlot" class="block font-bold text-slate-700 uppercase tracking-wider mb-1">
						Available Time Slot
					</label>
					<select
						id="bookTimeSlot"
						name="timeSlot"
						bind:value={$form.timeSlot}
						class="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-navy-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy-900/10"
					>
						<option value="08:00 AM - 09:00 AM">08:00 AM - 09:00 AM</option>
						<option value="09:00 AM - 10:00 AM">09:00 AM - 10:00 AM (Recommended)</option>
						<option value="10:30 AM - 11:30 AM">10:30 AM - 11:30 AM</option>
						<option value="01:30 PM - 02:30 PM">01:30 PM - 02:30 PM</option>
						<option value="03:00 PM - 04:00 PM">03:00 PM - 04:00 PM</option>
					</select>
				</div>

				<!-- Action Buttons -->
				<div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
					<button
						type="button"
						onclick={onClose}
						class="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="inline-flex items-center gap-1.5 rounded-xl bg-navy-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-navy-800 transition active:scale-95 cursor-pointer"
					>
						<CheckCircle2 class="h-3.5 w-3.5 text-sky-400" />
						<span>Confirm Appointment</span>
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
