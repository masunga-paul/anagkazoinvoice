<script lang="ts">
	import type { TyreProductStock } from '$lib/data/mockData';
	import { productSchema } from '$lib/schema/product';
	import { X, Pencil, AlertCircle, Package } from 'lucide-svelte';

	interface Props {
		open: boolean;
		product: TyreProductStock | null;
		onClose: () => void;
		onUpdateProduct: (product: TyreProductStock) => void;
	}

	let { open, product, onClose, onUpdateProduct }: Props = $props();

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

	// Populate form fields whenever the active editing product changes
	$effect(() => {
		if (product && open) {
			brand = product.brand || 'Michelin';
			model = product.model || '';
			size = product.size || '';
			sku = product.sku || '';
			application = product.application || 'SUV & 4x4 Land Cruiser';
			unitPriceTZS = product.unitPriceTZS ?? 0;
			stockQuantity = product.stockQuantity ?? 0;
			reorderLevel = product.reorderLevel ?? 10;
			location = product.location || 'Warehouse Bay A-1';
			formErrors = {};
		}
	});

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

	function handleBrandChange(e: Event) {
		const target = e.target as HTMLSelectElement;
		brand = target.value;
	}

	function handleSubmit(e: Event) {
		e.preventDefault();
		if (!product) return;

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

		const updatedProduct: TyreProductStock = {
			...product,
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

		onUpdateProduct(updatedProduct);
		onClose();
	}
</script>

{#if open && product}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in">
		<div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10 max-h-[90vh] overflow-y-auto">
			<!-- Modal Header -->
			<div class="flex items-center justify-between border-b border-slate-100 pb-3">
				<div class="flex items-center gap-2.5">
					<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-navy-900 text-white shadow-xs">
						<Pencil class="h-4 w-4 text-sky-400" />
					</div>
					<div>
						<h3 class="font-extrabold text-navy-900 text-sm sm:text-base">
							Edit Product & Stock Details
						</h3>
						<p class="text-[11px] text-slate-500">
							Update specifications, warehouse inventory counts, pricing, or storage bay.
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

			<!-- Form Content -->
			<form onsubmit={handleSubmit} novalidate class="py-4 space-y-3.5 text-xs text-slate-700">
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<!-- Brand Selection -->
					<div>
						<label for="editProdBrand" class="block font-bold text-slate-700 uppercase tracking-wider mb-1">
							Brand <span class="text-rose-500">*</span>
						</label>
						<select
							id="editProdBrand"
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
						<label for="editProdModel" class="block font-bold text-slate-700 uppercase tracking-wider mb-1">
							Model Name <span class="text-rose-500">*</span>
						</label>
						<input
							id="editProdModel"
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
						<label for="editProdSize" class="block font-bold text-slate-700 uppercase tracking-wider mb-1">
							Tyre Size <span class="text-rose-500">*</span>
						</label>
						<input
							id="editProdSize"
							name="size"
							type="text"
							bind:value={size}
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
						<label for="editProdSku" class="block font-bold text-slate-700 uppercase tracking-wider mb-1">
							Stock SKU Code <span class="text-rose-500">*</span>
						</label>
						<input
							id="editProdSku"
							name="sku"
							type="text"
							bind:value={sku}
							placeholder="e.g. MICH-315-80-R22-5"
							class="w-full rounded-xl border px-3 py-2 text-xs sm:text-sm text-slate-900 font-mono uppercase focus:bg-white focus:outline-none focus:ring-2 transition {
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
					<label for="editProdApplication" class="block font-bold text-slate-700 uppercase tracking-wider mb-1">
						Recommended Vehicle Application <span class="text-rose-500">*</span>
					</label>
					<select
						id="editProdApplication"
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
						<label for="editProdPrice" class="block font-bold text-slate-700 uppercase tracking-wider mb-1">
							Unit Price (TZS) <span class="text-rose-500">*</span>
						</label>
						<input
							id="editProdPrice"
							name="unitPriceTZS"
							type="number"
							min="1000"
							step="5000"
							bind:value={unitPriceTZS}
							placeholder="750000"
							class="w-full rounded-xl border px-3 py-2 text-xs sm:text-sm font-mono text-slate-900 text-right focus:bg-white focus:outline-none focus:ring-2 transition {
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

					<!-- Warehouse Stock Quantity -->
					<div>
						<label for="editProdStock" class="block font-bold text-slate-700 uppercase tracking-wider mb-1">
							Stock QTY <span class="text-rose-500">*</span>
						</label>
						<input
							id="editProdStock"
							name="stockQuantity"
							type="number"
							min="0"
							step="1"
							bind:value={stockQuantity}
							placeholder="24"
							class="w-full rounded-xl border px-3 py-2 text-xs sm:text-sm font-bold text-slate-900 text-center focus:bg-white focus:outline-none focus:ring-2 transition {
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
						<label for="editProdReorder" class="block font-bold text-slate-700 uppercase tracking-wider mb-1">
							Reorder Alert QTY
						</label>
						<input
							id="editProdReorder"
							name="reorderLevel"
							type="number"
							min="1"
							step="1"
							bind:value={reorderLevel}
							placeholder="10"
							class="w-full rounded-xl border px-3 py-2 text-xs sm:text-sm font-mono text-slate-900 text-center focus:bg-white focus:outline-none focus:ring-2 transition {
								formErrors.reorderLevel
									? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500/20'
									: 'border-slate-200 bg-slate-50/50 focus:border-navy-900 focus:ring-navy-900/10'
							}"
						/>
						{#if formErrors.reorderLevel}
							<p class="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
								<AlertCircle class="h-3 w-3 shrink-0" />
								<span>{formErrors.reorderLevel}</span>
							</p>
						{/if}
					</div>
				</div>

				<!-- Warehouse Location / Bay -->
				<div>
					<label for="editProdLocation" class="block font-bold text-slate-700 uppercase tracking-wider mb-1">
						Warehouse Bay Location <span class="text-rose-500">*</span>
					</label>
					<input
						id="editProdLocation"
						name="location"
						type="text"
						bind:value={location}
						placeholder="e.g. Warehouse Bay A-1, Heavy Rack 3"
						class="w-full rounded-xl border px-3 py-2 text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 transition {
							formErrors.location
								? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500/20'
								: 'border-slate-200 bg-slate-50/50 focus:border-navy-900 focus:ring-navy-900/10'
						}"
					/>
					{#if formErrors.location}
						<p class="text-[11px] font-semibold text-rose-600 mt-1 flex items-center gap-1">
							<AlertCircle class="h-3 w-3 shrink-0" />
							<span>{formErrors.location}</span>
						</p>
					{/if}
				</div>

				<!-- Action Buttons -->
				<div class="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
					<button
						type="button"
						onclick={onClose}
						class="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
					>
						Cancel
					</button>
					<button
						type="submit"
						class="inline-flex items-center gap-1.5 rounded-xl bg-navy-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-navy-800 transition active:scale-95 cursor-pointer"
					>
						<Pencil class="h-3.5 w-3.5 text-sky-400" />
						<span>Save Changes</span>
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
