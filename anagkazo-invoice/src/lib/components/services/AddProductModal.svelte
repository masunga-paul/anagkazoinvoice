<script lang="ts">
	import type { TyreProductStock } from '$lib/data/mockData';
	import { productSchema } from '$lib/schema/product';
	import { X, PackagePlus, AlertCircle } from 'lucide-svelte';

	interface Props {
		open: boolean;
		onClose: () => void;
		onAddProduct: (product: TyreProductStock) => void;
	}

	let { open, onClose, onAddProduct }: Props = $props();

	let brand = $state('Michelin');
	let model = $state('');
	let size = $state('');
	let sku = $state('');
	let application = $state('SUV & 4x4 Land Cruiser');
	let unitPriceTZS = $state<number | ''>(750000);
	let stockQuantity = $state<number | ''>(24);
	let reorderLevel = $state<number | ''>(10);
	let location = $state('Warehouse Bay A-1');

	let formErrors = $state<Record<string, string>>({});

	const brandOptions = [
		'Michelin',
		'Bridgestone',
		'Pirelli',
		'Goodyear',
		'Continental',
		'Dunlop',
		'Hankook',
		'Yokohama',
		'Maxxis',
		'Sailun'
	];

	const applicationOptions = [
		'SUV & 4x4 Land Cruiser',
		'Commercial Prime Mover / Trailer',
		'Highway Long Distance Haulage',
		'Mining & Heavy Dump Truck',
		'Luxury SUV & 4WD Safari',
		'Crossover & Passenger Car',
		'Logging & Rough Terrain Hauling',
		'Light Commercial Van / Minibus'
	];

	function handleSizeInput(e: Event) {
		const target = e.target as HTMLInputElement;
		size = target.value;
		if (brand && size && (!sku || sku.includes('-'))) {
			const brandPrefix = brand.substring(0, 4).toUpperCase();
			const cleanSize = size.replace(/[^a-zA-Z0-9]/g, '-').toUpperCase();
			sku = `${brandPrefix}-${cleanSize}`;
		}
	}

	function handleBrandChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		brand = target.value;
		if (brand && size && (!sku || sku.includes('-'))) {
			const brandPrefix = brand.substring(0, 4).toUpperCase();
			const cleanSize = size.replace(/[^a-zA-Z0-9]/g, '-').toUpperCase();
			sku = `${brandPrefix}-${cleanSize}`;
		}
	}

	function resetForm() {
		brand = 'Michelin';
		model = '';
		size = '';
		sku = '';
		application = 'SUV & 4x4 Land Cruiser';
		unitPriceTZS = 750000;
		stockQuantity = 24;
		reorderLevel = 10;
		location = 'Warehouse Bay A-1';
		formErrors = {};
	}

	function handleSubmit(e: Event) {
		e.preventDefault();
		const rawData = {
			brand: brand.trim(),
			model: model.trim(),
			size: size.trim(),
			sku: sku.trim().toUpperCase(),
			application: application.trim(),
			unitPriceTZS: Number(unitPriceTZS) || 0,
			stockQuantity: Number(stockQuantity) || 0,
			reorderLevel: Number(reorderLevel) || 10,
			location: location.trim() || 'Warehouse Bay A-1'
		};

		const result = productSchema.safeParse(rawData);
		if (!result.success) {
			const errs: Record<string, string> = {};
			for (const issue of result.error.issues) {
				const path = issue.path.join('.');
				errs[path] = issue.message;
			}
			formErrors = errs;
			return;
		}

		formErrors = {};
		const validData = result.data;
		const qty = Number(validData.stockQuantity) || 0;
		const reorder = Number(validData.reorderLevel) || 10;

		const newProduct: TyreProductStock = {
			id: 'TYR-' + Math.floor(100 + Math.random() * 900),
			sku: validData.sku.trim().toUpperCase(),
			brand: validData.brand.trim(),
			model: validData.model.trim(),
			size: validData.size.trim(),
			application: validData.application.trim(),
			unitPriceTZS: Number(validData.unitPriceTZS) || 0,
			stockQuantity: qty,
			reorderLevel: reorder,
			location: validData.location?.trim() || 'Warehouse Bay A-1',
			status: qty === 0 ? 'Out of Stock' : (qty <= reorder ? 'Low Stock' : 'In Stock')
		};

		onAddProduct(newProduct);
		resetForm();
		onClose();
	}
</script>

{#if open}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
		<div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10 max-h-[90vh] overflow-y-auto">
			<!-- Modal Header -->
			<div class="flex items-center justify-between border-b border-slate-100 pb-3">
				<div class="flex items-center gap-2.5">
					<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-900 text-white shadow-xs">
						<PackagePlus class="h-4 w-4 text-sky-400" />
					</div>
					<div>
						<h3 class="font-extrabold text-navy-900 text-sm sm:text-base">
							Add New Tyre Stock / Product
						</h3>
						<p class="text-[11px] text-slate-500">
							Create a new commercial tyre product and set initial inventory count.
						</p>
					</div>
				</div>
				<button
					type="button"
					onclick={onClose}
					class="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
					aria-label="Close dialog"
				>
					<X class="h-4 w-4" />
				</button>
			</div>

			<!-- Form Content: Fast & Instant Response with Svelte 5 Runes -->
			<form onsubmit={handleSubmit} novalidate class="py-4 space-y-3.5 text-xs text-slate-700">
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<!-- Brand Selection -->
					<div>
						<label for="prodBrand" class="block font-bold text-slate-700 uppercase tracking-wider mb-1">
							Brand <span class="text-rose-500">*</span>
						</label>
						<select
							id="prodBrand"
							name="brand"
							bind:value={brand}
							onchange={handleBrandChange}
							class="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-navy-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy-900/10 cursor-pointer"
						>
							{#each brandOptions as b}
								<option value={b}>{b}</option>
							{/each}
						</select>
						{#if formErrors.brand}
							<p class="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
								<AlertCircle class="h-3 w-3 shrink-0" />
								<span>{formErrors.brand}</span>
							</p>
						{/if}
					</div>

					<!-- Model Name -->
					<div>
						<label for="prodModel" class="block font-bold text-slate-700 uppercase tracking-wider mb-1">
							Model Name <span class="text-rose-500">*</span>
						</label>
						<input
							id="prodModel"
							name="model"
							type="text"
							bind:value={model}
							placeholder="e.g. X Multiway 3D or Primacy SUV"
							class="w-full rounded-xl border px-3 py-2 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 transition {
								formErrors.model
									? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500/20'
									: 'border-slate-200 bg-slate-50/50 focus:border-navy-900 focus:ring-navy-900/10'
							}"
						/>
						{#if formErrors.model}
							<p class="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
								<AlertCircle class="h-3 w-3 shrink-0" />
								<span>{formErrors.model}</span>
							</p>
						{/if}
					</div>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<!-- Size -->
					<div>
						<label for="prodSize" class="block font-bold text-slate-700 uppercase tracking-wider mb-1">
							Tyre Size <span class="text-rose-500">*</span>
						</label>
						<input
							id="prodSize"
							name="size"
							type="text"
							value={size}
							oninput={handleSizeInput}
							placeholder="e.g. 315/80 R22.5"
							class="w-full rounded-xl border px-3 py-2 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 transition {
								formErrors.size
									? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500/20'
									: 'border-slate-200 bg-slate-50/50 focus:border-navy-900 focus:ring-navy-900/10'
							}"
						/>
						{#if formErrors.size}
							<p class="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
								<AlertCircle class="h-3 w-3 shrink-0" />
								<span>{formErrors.size}</span>
							</p>
						{/if}
					</div>

					<!-- SKU -->
					<div>
						<label for="prodSku" class="block font-bold text-slate-700 uppercase tracking-wider mb-1">
							Stock SKU Code <span class="text-rose-500">*</span>
						</label>
						<input
							id="prodSku"
							name="sku"
							type="text"
							bind:value={sku}
							placeholder="e.g. MICH-315-80R22"
							class="w-full rounded-xl border px-3 py-2 text-xs sm:text-sm text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 transition {
								formErrors.sku
									? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500/20'
									: 'border-slate-200 bg-slate-50/50 focus:border-navy-900 focus:ring-navy-900/10'
							}"
						/>
						{#if formErrors.sku}
							<p class="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
								<AlertCircle class="h-3 w-3 shrink-0" />
								<span>{formErrors.sku}</span>
							</p>
						{/if}
					</div>
				</div>

				<!-- Application Category -->
				<div>
					<label for="prodApp" class="block font-bold text-slate-700 uppercase tracking-wider mb-1">
						Vehicle Application Category <span class="text-rose-500">*</span>
					</label>
					<select
						id="prodApp"
						name="application"
						bind:value={application}
						class="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-navy-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy-900/10 cursor-pointer"
					>
						{#each applicationOptions as app}
							<option value={app}>{app}</option>
						{/each}
					</select>
					{#if formErrors.application}
						<p class="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
							<AlertCircle class="h-3 w-3 shrink-0" />
							<span>{formErrors.application}</span>
						</p>
					{/if}
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
					<!-- Unit Price (TZS) -->
					<div>
						<label for="prodPrice" class="block font-bold text-slate-700 uppercase tracking-wider mb-1">
							Price (TZS) <span class="text-rose-500">*</span>
						</label>
						<input
							id="prodPrice"
							name="unitPriceTZS"
							type="number"
							step="10000"
							bind:value={unitPriceTZS}
							placeholder="750000"
							class="w-full rounded-xl border px-3 py-2 text-xs sm:text-sm text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 transition {
								formErrors.unitPriceTZS
									? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500/20'
									: 'border-slate-200 bg-slate-50/50 focus:border-navy-900 focus:ring-navy-900/10'
							}"
						/>
						{#if formErrors.unitPriceTZS}
							<p class="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
								<AlertCircle class="h-3 w-3 shrink-0" />
								<span>{formErrors.unitPriceTZS}</span>
							</p>
						{/if}
					</div>

					<!-- Initial Stock -->
					<div>
						<label for="prodQty" class="block font-bold text-slate-700 uppercase tracking-wider mb-1">
							Initial Stock <span class="text-rose-500">*</span>
						</label>
						<input
							id="prodQty"
							name="stockQuantity"
							type="number"
							bind:value={stockQuantity}
							placeholder="24"
							class="w-full rounded-xl border px-3 py-2 text-xs sm:text-sm text-slate-900 font-mono focus:bg-white focus:outline-none focus:ring-2 transition {
								formErrors.stockQuantity
									? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500/20'
									: 'border-slate-200 bg-slate-50/50 focus:border-navy-900 focus:ring-navy-900/10'
							}"
						/>
						{#if formErrors.stockQuantity}
							<p class="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
								<AlertCircle class="h-3 w-3 shrink-0" />
								<span>{formErrors.stockQuantity}</span>
							</p>
						{/if}
					</div>

					<!-- Reorder Level -->
					<div>
						<label for="prodReorder" class="block font-bold text-slate-700 uppercase tracking-wider mb-1">
							Reorder Alert
						</label>
						<input
							id="prodReorder"
							name="reorderLevel"
							type="number"
							bind:value={reorderLevel}
							placeholder="10"
							class="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs sm:text-sm text-slate-900 font-mono focus:border-navy-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy-900/10"
						/>
					</div>
				</div>

				<!-- Warehouse Location -->
				<div>
					<label for="prodLoc" class="block font-bold text-slate-700 uppercase tracking-wider mb-1">
						Warehouse Storage Location
					</label>
					<input
						id="prodLoc"
						name="location"
						type="text"
						bind:value={location}
						placeholder="e.g. Warehouse Bay C-4 or Yard Heavy Zone"
						class="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs sm:text-sm text-slate-900 focus:border-navy-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy-900/10"
					/>
				</div>

				<!-- Footer Buttons -->
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
						class="inline-flex items-center gap-1.5 rounded-xl bg-navy-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-navy-800 transition active:scale-95 cursor-pointer"
					>
						<PackagePlus class="h-3.5 w-3.5 text-sky-400" />
						<span>Save & Add Stock</span>
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
