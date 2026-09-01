<script lang="ts">
	import type { UserRole } from '$lib/types/auth';
	import { MOCK_TYRE_STOCKS, type TyreProductStock } from '$lib/data/mockData';
	import { formatTZS } from '$lib/utils/format';
	import AddProductModal from './AddProductModal.svelte';
	import EditProductModal from './EditProductModal.svelte';
	import DeleteConfirmModal from '../common/DeleteConfirmModal.svelte';
	import {
		Plus,
		Search,
		Disc3,
		Package,
		PackagePlus,
		Pencil,
		Trash2,
		AlertCircle
	} from 'lucide-svelte';

	interface Props {
		userRole?: UserRole | null;
		stocks?: TyreProductStock[];
		onAddServiceToInvoice: (service: { title: string; priceTZS: number; stockId?: string; sku?: string }) => void;
		onAddProduct?: (product: TyreProductStock) => void;
		onUpdateProduct?: (product: TyreProductStock) => void;
		onDeleteProduct?: (sku: string) => void;
		onDeleteAllProducts?: () => void;
		onShowToast: (message: string, type?: 'success' | 'error' | 'info', action?: any, title?: string) => void;
	}

	let {
		userRole = null,
		stocks = $bindable([]),
		onAddServiceToInvoice,
		onAddProduct,
		onUpdateProduct,
		onDeleteProduct,
		onDeleteAllProducts,
		onShowToast
	}: Props = $props();

	let selectedBrand = $state<string>('All');
	let searchQuery = $state('');

	let isAddProductModalOpen = $state(false);
	let isEditProductModalOpen = $state(false);
	let editingProduct = $state<TyreProductStock | null>(null);
	let isDeleteModalOpen = $state(false);
	let isDeleteAllModalOpen = $state(false);
	let pendingDeleteProduct = $state<TyreProductStock | null>(null);

	const brands = ['All', 'Michelin', 'Bridgestone', 'Pirelli', 'Goodyear', 'Continental', 'Dunlop'];

	const filteredStocks = $derived(
		stocks.filter((tyre) => {
			const matchesBrand = selectedBrand === 'All' || tyre.brand === selectedBrand;
			const q = searchQuery.toLowerCase().trim();
			const matchesSearch =
				!q ||
				tyre.brand.toLowerCase().includes(q) ||
				tyre.model.toLowerCase().includes(q) ||
				tyre.size.toLowerCase().includes(q) ||
				tyre.sku.toLowerCase().includes(q) ||
				tyre.application.toLowerCase().includes(q);
			return matchesBrand && matchesSearch;
		})
	);

	function addTyreToInvoice(tyre: TyreProductStock) {
		if (tyre.stockQuantity <= 0) {
			onShowToast(
				`Cannot add to invoice: "${tyre.brand} ${tyre.model}" (${tyre.size}) is Out of Stock (0 units remaining).`,
				'error',
				'INFO',
				'Stock Depleted'
			);
			return;
		}

		onAddServiceToInvoice({
			title: `${tyre.brand} ${tyre.model} (${tyre.size})`,
			priceTZS: tyre.unitPriceTZS,
			stockId: tyre.id,
			sku: tyre.sku
		});
		onShowToast(
			`Added 1 unit of "${tyre.brand} ${tyre.size}" to invoice. Remaining stock: ${tyre.stockQuantity - 1} units.`,
			'success',
			'CREATE',
			'Item Added'
		);
	}

	function handleAddProduct(newProduct: TyreProductStock) {
		stocks = [newProduct, ...stocks];
		onAddProduct?.(newProduct);
		onShowToast(
			`Product "${newProduct.brand} ${newProduct.model}" (${newProduct.size}) added to stock with ${newProduct.stockQuantity} units.`,
			'success',
			'CREATE',
			'Product Created'
		);
	}

	function promptEditProduct(tyre: TyreProductStock) {
		if (userRole !== 'admin') {
			onShowToast(
				'Only administrators are authorized to modify product stock records.',
				'error',
				'INFO',
				'Access Restricted'
			);
			return;
		}
		editingProduct = tyre;
		isEditProductModalOpen = true;
	}

	function handleUpdateProduct(updated: TyreProductStock) {
		stocks = stocks.map((s) => (s.id === updated.id || s.sku === updated.sku ? updated : s));
		onUpdateProduct?.(updated);
		onShowToast(
			`Product "${updated.brand} ${updated.model}" (${updated.size}) updated successfully.`,
			'success',
			'UPDATE',
			'Product Updated'
		);
		isEditProductModalOpen = false;
		editingProduct = null;
	}

	function promptDeleteProduct(tyre: TyreProductStock) {
		if (userRole !== 'admin') {
			onShowToast(
				'Only administrators are authorized to delete product stock records.',
				'error',
				'INFO',
				'Access Restricted'
			);
			return;
		}
		pendingDeleteProduct = tyre;
		isDeleteModalOpen = true;
	}

	function confirmDeleteProduct() {
		if (!pendingDeleteProduct || userRole !== 'admin') return;
		const tyre = pendingDeleteProduct;
		stocks = stocks.filter((s) => s.id !== tyre.id && s.sku !== tyre.sku);
		onDeleteProduct?.(tyre.id || tyre.sku);
		onShowToast(
			`Product "${tyre.brand} ${tyre.model}" (${tyre.size}) removed from inventory.`,
			'info',
			'DELETE',
			'Product Deleted'
		);
		pendingDeleteProduct = null;
	}

	function confirmDeleteAllProducts() {
		if (userRole !== 'admin') return;
		stocks = [];
		onDeleteAllProducts?.();
		onShowToast(
			'All tyre stock products have been deleted from inventory.',
			'info',
			'DELETE',
			'Inventory Cleared'
		);
		isDeleteAllModalOpen = false;
	}
</script>

<div class="space-y-6">
	<!-- Products & Stocks Top Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
				Products & Stock Inventory
			</h1>
			<p class="text-xs sm:text-sm text-slate-500 mt-0.5">
				Commercial tyre stocks, live warehouse quantities, unit pricing, and catalog management.
			</p>
		</div>

		<div class="flex items-center gap-2 sm:gap-2.5">
			{#if userRole === 'admin'}
				{#if stocks.length > 0}
					<button
						type="button"
						onclick={() => (isDeleteAllModalOpen = true)}
						class="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-600 shadow-2xs transition hover:bg-rose-100 hover:text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 cursor-pointer"
						title="Delete all products from inventory"
					>
						<Trash2 class="h-4 w-4" />
						<span>Delete All</span>
					</button>
				{/if}
				<button
					type="button"
					onclick={() => (isAddProductModalOpen = true)}
					class="inline-flex items-center gap-1.5 rounded-xl bg-navy-900 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-navy-800 transition active:scale-95 cursor-pointer"
				>
					<PackagePlus class="h-4 w-4 text-sky-400" />
					<span>+ Add Product / Stock</span>
				</button>
			{:else}
				<span class="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100/80 text-slate-600 px-3.5 py-2 text-xs font-semibold">
					<Package class="h-4 w-4 text-slate-400" />
					<span>Stock Catalog ({stocks.length} Items)</span>
				</span>
			{/if}
		</div>
	</div>

	<!-- Tyre Stocks Inventory Section -->
	<div class="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs space-y-4">
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
			<div class="relative w-full sm:w-80">
				<Search class="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search brand, size, model, SKU..."
					class="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-900/10"
				/>
			</div>

			<div class="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
				{#each brands as b}
					<button
						type="button"
						onclick={() => (selectedBrand = b)}
						class="rounded-full px-3 py-1.5 text-xs font-semibold transition cursor-pointer {
							selectedBrand === b
								? 'bg-navy-900 text-white shadow-xs'
								: 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-navy-900'
						}"
					>
						{b}
					</button>
				{/each}
			</div>
		</div>

		<!-- Stocks Table / Cards Grid -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 pt-2">
			{#if filteredStocks.length === 0}
				<div class="col-span-full py-12 text-center text-slate-400 text-xs italic">
					No tyre products found matching "{searchQuery}".
				</div>
			{:else}
				{#each filteredStocks as tyre (tyre.id)}
					<div class="rounded-2xl border border-slate-300/90 bg-white p-5 flex flex-col justify-between transition hover:border-navy-400 hover:shadow-xs group">
						<div class="space-y-3">
							<!-- Card Top: SKU and Brand -->
							<div class="flex items-center justify-between">
								<span class="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-0.5 text-xs font-mono font-bold text-slate-800 ring-1 ring-inset ring-slate-200">
									{tyre.sku}
								</span>
								<span class="inline-flex items-center rounded-full bg-navy-900 px-3 py-0.5 text-xs font-extrabold text-white">
									{tyre.brand}
								</span>
							</div>

							<!-- Title & Tyre Size -->
							<div>
								<h3 class="text-base sm:text-lg font-black text-navy-950 group-hover:text-sky-600 transition leading-snug">
									{tyre.model}
								</h3>
								<div class="inline-block font-mono text-xs sm:text-sm font-extrabold text-slate-900 bg-slate-100 rounded-md px-2.5 py-0.5 mt-1 border border-slate-200">
									Size: {tyre.size}
								</div>
								<p class="text-xs sm:text-sm text-slate-600 font-medium mt-1.5 leading-relaxed">
									{tyre.application}
								</p>
							</div>

							<!-- Stock Quantity Indicator -->
							<div class="flex items-center justify-between pt-2.5 text-xs sm:text-sm border-t border-slate-200">
								<div class="flex items-center gap-1.5">
									<span class="inline-block h-2.5 w-2.5 rounded-full {
										tyre.stockQuantity === 0
											? 'bg-rose-500 animate-pulse'
											: tyre.stockQuantity <= (tyre.reorderLevel || 10)
											? 'bg-amber-500'
											: 'bg-emerald-500'
									}"></span>
									<span class="font-extrabold {
										tyre.stockQuantity === 0
											? 'text-rose-700'
											: tyre.stockQuantity <= (tyre.reorderLevel || 10)
											? 'text-amber-800'
											: 'text-slate-900'
									}">
										{#if tyre.stockQuantity === 0}
											Out of Stock (0 Available)
										{:else}
											{tyre.stockQuantity} Available in Stock
										{/if}
									</span>
								</div>
								<span class="text-xs text-slate-600 font-mono font-semibold">{tyre.location}</span>
							</div>
						</div>

						<!-- Price & Action -->
						<div class="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
							<div>
								<span class="block text-xs uppercase font-extrabold text-slate-600 tracking-wider">
									Unit Price
								</span>
								<div class="text-base sm:text-lg font-black font-mono text-navy-950">
									{formatTZS(tyre.unitPriceTZS)}
								</div>
							</div>

							<div class="flex items-center gap-1.5">
								<button
									type="button"
									disabled={tyre.stockQuantity <= 0}
									onclick={() => addTyreToInvoice(tyre)}
									class="inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-extrabold transition {
										tyre.stockQuantity <= 0
											? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
											: 'bg-navy-900 text-white shadow-xs hover:bg-navy-800 active:scale-95 cursor-pointer'
									}"
									title={tyre.stockQuantity <= 0 ? 'Out of stock - cannot add to invoice' : 'Add this tyre to the current invoice'}
								>
									{#if tyre.stockQuantity <= 0}
										<AlertCircle class="h-4 w-4 text-rose-400" />
										<span>Out of Stock</span>
									{:else}
										<Plus class="h-4 w-4 text-sky-400" />
										<span>Add to Invoice</span>
									{/if}
								</button>
								{#if userRole === 'admin'}
									<button
										type="button"
										onclick={() => promptEditProduct(tyre)}
										class="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-navy-900 hover:bg-slate-100 hover:border-slate-300 transition cursor-pointer"
										title="Edit product details & stock"
									>
										<Pencil class="h-3.5 w-3.5" />
									</button>
								{/if}
								{#if userRole === 'admin' && onDeleteProduct}
									<button
										type="button"
										onclick={() => promptDeleteProduct(tyre)}
										class="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition cursor-pointer"
										title="Remove tyre from inventory"
									>
										<Trash2 class="h-3.5 w-3.5" />
									</button>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			{/if}
		</div>
	</div>
</div>

<!-- Add Product & Stock Modal -->
<AddProductModal
	open={isAddProductModalOpen}
	onClose={() => (isAddProductModalOpen = false)}
	onAddProduct={handleAddProduct}
/>

<!-- Edit Product & Stock Modal -->
<EditProductModal
	open={isEditProductModalOpen}
	product={editingProduct}
	onClose={() => {
		isEditProductModalOpen = false;
		editingProduct = null;
	}}
	onUpdateProduct={handleUpdateProduct}
/>

<!-- Delete Product Confirmation Modal -->
<DeleteConfirmModal
	open={isDeleteModalOpen}
	title="Are you sure you want to delete this product?"
	itemType="Product Stock"
	itemName={pendingDeleteProduct ? `${pendingDeleteProduct.brand} ${pendingDeleteProduct.model} (${pendingDeleteProduct.size})` : undefined}
	description="This will permanently delete this tyre product line and all warehouse stock records from the active inventory."
	confirmText="Yes, Delete Product"
	onConfirm={confirmDeleteProduct}
	onClose={() => (isDeleteModalOpen = false)}
/>

<!-- Delete All Products Confirmation Modal -->
<DeleteConfirmModal
	open={isDeleteAllModalOpen}
	title="Delete ALL Inventory Products & Stocks?"
	itemType="Entire Warehouse Inventory"
	itemName={`${stocks.length} Commercial Tyre SKUs (${stocks.reduce((acc, s) => acc + (s.stockQuantity || 0), 0)} Total Units)`}
	description="This will permanently delete all tyre product lines, warehouse stock levels, commercial SKUs, and pricing records from the inventory catalog. This action cannot be undone."
	confirmText="Yes, Delete All Products"
	onConfirm={confirmDeleteAllProducts}
	onClose={() => (isDeleteAllModalOpen = false)}
/>
