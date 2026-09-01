<script lang="ts">
  import type {
    InvoiceFormData,
    InvoiceItem,
    InvoiceStatus,
  } from "$lib/types/invoice";
  import type { Customer } from "$lib/types/customer";
  import type { TyreProductStock } from "$lib/data/mockData";
  import type { PaymentDetail } from "$lib/types/payment";
  import { formatNumber, formatTZS, generateId } from "$lib/utils/format";
  import {
    findStockForItem,
    getMaxAvailableForLineItem,
    getEffectiveAvailableStock,
  } from "$lib/utils/inventory";
  import {
    Plus,
    Trash2,
    Calendar,
    HelpCircle,
    AlertCircle,
    CheckCircle2,
    Clock,
    AlertTriangle,
    UserCheck,
    Disc3,
    Package,
    Save,
    Building2,
    CreditCard,
    Smartphone,
  } from "lucide-svelte";

  interface Props {
    form: InvoiceFormData;
    errors: Record<string, string>;
    customers?: Customer[];
    stocks?: TyreProductStock[];
    paymentDetails?: PaymentDetail[];
    onStatusChange?: (status: InvoiceStatus) => void;
    onSaveInvoice?: () => void;
    onPresetSelect?: (presetData: Partial<InvoiceFormData>) => void;
    onResetForm?: () => void;
    onShowToast?: (
      message: string,
      type?: "success" | "error" | "info",
      action?: any,
      title?: string,
    ) => void;
  }

  let {
    form = $bindable(),
    errors,
    customers = [],
    stocks = [],
    paymentDetails = [],
    onStatusChange,
    onSaveInvoice,
    onPresetSelect,
    onResetForm,
    onShowToast,
  }: Props = $props();

  // Active selected payment detail (from form, or matched by ID, or fallback to default)
  const activePayment = $derived.by(() => {
    if (form.paymentDetail) return form.paymentDetail;
    if (form.paymentDetailId && paymentDetails.length > 0) {
      const found = paymentDetails.find((p) => p.id === form.paymentDetailId);
      if (found) return found;
    }
    if (paymentDetails.length > 0) {
      return paymentDetails.find((p) => p.isDefault) || paymentDetails[0];
    }
    return null;
  });

  // Ensure form.paymentDetail stays initialized with active selection
  $effect(() => {
    if (
      activePayment &&
      (!form.paymentDetail || form.paymentDetail.id !== activePayment.id)
    ) {
      form.paymentDetail = activePayment;
      form.paymentDetailId = activePayment.id;
    }
  });

  function handlePaymentDetailSelect(event: Event) {
    const select = event.target as HTMLSelectElement;
    const found = paymentDetails.find((p) => p.id === select.value);
    if (found) {
      form.paymentDetail = found;
      form.paymentDetailId = found.id;
      onShowToast?.(
        `Assigned "${found.bankName}" (${found.currency}) to invoice`,
        "info",
        "SELECT",
        "Payment Detail Selected",
      );
    }
  }

  // Quick helper for adding an item
  function addItem() {
    form.items = [
      ...form.items,
      {
        id: generateId(),
        description: "",
        qty: 1,
        unitPrice: 0,
      },
    ];
  }

  // Quick helper for removing an item
  function removeItem(index: number) {
    if (form.items.length > 1) {
      form.items = form.items.filter((_, i) => i !== index);
    } else {
      // If only one row, clear it instead of deleting the whole table
      form.items[0] = {
        id: generateId(),
        description: "",
        qty: 1,
        unitPrice: 0,
      };
    }
  }

  // Strict quantity change handler that enforces warehouse stock boundaries
  function handleQtyChange(item: InvoiceItem, event: Event) {
    const target = event.target as HTMLInputElement;
    const rawVal = target.value;
    if (rawVal === "") return;
    const val = Number(rawVal);
    const { stock, maxQty } = getMaxAvailableForLineItem(
      item,
      stocks,
      form.items,
    );

    if (stock && val > maxQty) {
      item.qty = maxQty;
      target.value = String(maxQty);
      onShowToast?.(
        `Cannot add more products than available stocks! Maximum available stock for "${stock.brand} ${stock.size}" is ${maxQty} unit(s).`,
        "error",
        "INFO",
        "Stock Limit Exceeded",
      );
      return;
    }

    if (val < 1) {
      item.qty = 1;
      target.value = "1";
    } else {
      item.qty = Math.floor(val);
    }
  }

  // Calculate subtotal, tax amount, and total for live display in form
  const subtotal = $derived(
    form.items.reduce(
      (acc, item) =>
        acc + (Number(item.qty) || 0) * (Number(item.unitPrice) || 0),
      0,
    ),
  );

  const discountAmount = $derived(Number(form.discount) || 0);

  const taxAmount = $derived(
    subtotal * ((Number(form.taxRate) || 0) / 100),
  );

  const calculatedTotal = $derived(
    Math.max(0, subtotal + taxAmount - discountAmount),
  );

  const selectedCustomerId = $derived(
    customers.find(
      (c) =>
        (c.companyName &&
          c.companyName.trim().toLowerCase() ===
            form.customerName.trim().toLowerCase()) ||
        c.name.trim().toLowerCase() ===
          form.customerName.trim().toLowerCase() ||
        (c.companyName &&
          form.customerName
            .toLowerCase()
            .includes(c.companyName.toLowerCase())) ||
        form.customerName.toLowerCase().includes(c.name.toLowerCase()),
    )?.id || "",
  );

  const paymentTermOptions = [
    "Net 7",
    "Net 14",
    "Due on Receipt",
    "Cash on Delivery (COD)",
    "50% Advance / 50% on Delivery",
  ];

  const statusOptions: {
    id: InvoiceStatus;
    label: string;
    activeClass: string;
    icon: any;
  }[] = [
    {
      id: "Paid",
      label: "Paid",
      activeClass: "bg-navy-900 text-white border-navy-900 shadow-xs",
      icon: CheckCircle2,
    },
    {
      id: "Pending",
      label: "Pending",
      activeClass: "bg-amber-500 text-white border-amber-500 shadow-xs",
      icon: Clock,
    },
    {
      id: "Overdue",
      label: "Overdue",
      activeClass: "bg-rose-600 text-white border-rose-600 shadow-xs",
      icon: AlertTriangle,
    },
  ];
</script>

<div
  class="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-7 shadow-xs"
>
  <!-- Panel Header -->
  <div class="mb-6 border-b border-slate-100 pb-4">
    <h2 class="text-base font-bold text-slate-900">Invoice Details</h2>
    <p class="text-xs text-slate-500">
      Fill in the customer information and tyre stock line items.
    </p>
  </div>

  <div class="space-y-5">
    <!-- Customer Name & Quick Picker -->
    <div class="space-y-2">
      {#if customers && customers.length > 0}
        <div class="rounded-xl border border-sky-200 bg-sky-50/70 p-3">
          <div class="flex items-center justify-between gap-2 mb-1.5">
            <label
              for="quickCustSelect"
              class="text-xs sm:text-sm font-extrabold text-navy-950 flex items-center gap-1.5"
            >
              <UserCheck class="h-4 w-4 text-sky-600" />
              <span>Select Existing Client ({customers.length} Accounts):</span>
            </label>
          </div>
          <select
            id="quickCustSelect"
            value={selectedCustomerId}
            onchange={(e) => {
              const selectedId = (e.target as HTMLSelectElement).value;
              if (!selectedId) return;
              const found = customers.find((c) => c.id === selectedId);
              if (found) {
                form.customerName = found.companyName || found.name;
                form.billingAddress = `${found.address}, ${found.city}, Tanzania (Tel: ${found.phone})`;
                if (found.paymentTerms) form.paymentTerms = found.paymentTerms;
              }
            }}
            class="w-full rounded-lg border border-sky-300 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 font-bold focus:border-navy-900 focus:outline-none cursor-pointer"
          >
            <option value="">-- Choose fleet / commercial client --</option>
            {#each customers as c (c.id)}
              <option value={c.id}
                >{c.companyName || c.name} &bull; {c.customerType}</option
              >
            {/each}
          </select>
        </div>
      {/if}

      <div>
        <div class="flex items-center justify-between">
          <label
            for="customerName"
            class="block text-xs sm:text-[13px] font-extrabold text-slate-800 uppercase tracking-wider mb-1.5"
          >
            Customer Name <span class="text-rose-500">*</span>
          </label>
          {#if errors["customerName"]}
            <span
              class="text-xs sm:text-sm font-bold text-rose-600 flex items-center gap-1"
            >
              <AlertCircle class="h-3.5 w-3.5" />
              {errors["customerName"]}
            </span>
          {/if}
        </div>
        <input
          id="customerName"
          type="text"
          bind:value={form.customerName}
          placeholder="e.g. Tanzania Safari Logistics Ltd / PT Nusantara Digital Solusi"
          class="w-full rounded-xl border px-3.5 py-2.5 text-sm sm:text-base font-semibold text-slate-900 placeholder:text-slate-400 transition focus:outline-none focus:ring-2 {errors[
            'customerName'
          ]
            ? 'border-rose-300 bg-rose-50/20 focus:border-rose-500 focus:ring-rose-500/20'
            : 'border-slate-300 bg-white focus:border-slate-900 focus:ring-slate-900/10'}"
        />
      </div>
    </div>

    <!-- Billing Address -->
    <div>
      <div class="flex items-center justify-between">
        <label
          for="billingAddress"
          class="block text-xs sm:text-[13px] font-extrabold text-slate-800 uppercase tracking-wider mb-1.5"
        >
          Billing Address <span class="text-rose-500">*</span>
        </label>
        {#if errors["billingAddress"]}
          <span
            class="text-xs sm:text-sm font-bold text-rose-600 flex items-center gap-1"
          >
            <AlertCircle class="h-3.5 w-3.5" />
            {errors["billingAddress"]}
          </span>
        {/if}
      </div>
      <input
        id="billingAddress"
        type="text"
        bind:value={form.billingAddress}
        placeholder="e.g. Samora Avenue, Clock Tower, P.O. Box 4521, Dar es Salaam, Tanzania"
        class="w-full rounded-xl border px-3.5 py-2.5 text-sm sm:text-base font-semibold text-slate-900 placeholder:text-slate-400 transition focus:outline-none focus:ring-2 {errors[
          'billingAddress'
        ]
          ? 'border-rose-300 bg-rose-50/20 focus:border-rose-500 focus:ring-rose-500/20'
          : 'border-slate-300 bg-white focus:border-slate-900 focus:ring-slate-900/10'}"
      />
    </div>

    <!-- Invoice Status Selector -->
    <div
      class="rounded-xl border border-slate-300/90 bg-slate-50/90 p-4 space-y-2.5"
    >
      <div class="flex items-center justify-between">
        <span
          class="block text-xs sm:text-[13px] font-extrabold text-slate-800 uppercase tracking-wider"
        >
          Invoice Payment Status <span class="text-rose-500">*</span>
        </span>
      </div>

      <div class="grid grid-cols-3 gap-2 sm:gap-3">
        {#each statusOptions as opt}
          <button
            type="button"
            onclick={() => {
              form.status = opt.id;
              onStatusChange?.(opt.id);
            }}
            class="flex items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs sm:text-sm font-black transition-all duration-200 cursor-pointer border {form.status ===
            opt.id
              ? opt.activeClass
              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-950'}"
          >
            <opt.icon class="h-4 w-4 shrink-0" />
            <span>{opt.label}</span>
          </button>
        {/each}
      </div>
    </div>

    <!-- Dates & Payment Terms (3-Column Grid) -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
      <!-- Issue Date -->
      <div>
        <label
          for="issueDate"
          class="block text-xs sm:text-[13px] font-extrabold text-slate-800 uppercase tracking-wider mb-1.5"
        >
          Issue Date <span class="text-rose-500">*</span>
        </label>
        <div class="relative">
          <input
            id="issueDate"
            type="date"
            bind:value={form.issueDate}
            class="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 transition focus:border-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-900/10 cursor-pointer"
          />
        </div>
      </div>

      <!-- Due Date -->
      <div>
        <label
          for="dueDate"
          class="block text-xs sm:text-[13px] font-extrabold text-slate-800 uppercase tracking-wider mb-1.5"
        >
          Due Date <span class="text-rose-500">*</span>
        </label>
        <div class="relative">
          <input
            id="dueDate"
            type="date"
            bind:value={form.dueDate}
            class="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 transition focus:border-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-900/10 cursor-pointer"
          />
        </div>
      </div>

      <!-- Payment Terms -->
      <div>
        <label
          for="paymentTerms"
          class="block text-xs sm:text-[13px] font-extrabold text-slate-800 uppercase tracking-wider mb-1.5"
        >
          Payment Terms <span class="text-rose-500">*</span>
        </label>
        <select
          id="paymentTerms"
          bind:value={form.paymentTerms}
          class="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 transition focus:border-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-900/10 cursor-pointer"
        >
          {#each paymentTermOptions as term}
            <option value={term}>{term}</option>
          {/each}
        </select>
      </div>
    </div>

    <!-- Items Details Table -->
    <div class="pt-2">
      <div class="flex items-center justify-between mb-2">
        <span
          class="block text-xs sm:text-[13px] font-extrabold text-slate-800 uppercase tracking-wider"
        >
          Items Details <span class="text-rose-500">*</span>
        </span>
        <span class="text-xs font-bold text-slate-600">
          {form.items.length}
          {form.items.length === 1 ? "line item" : "line items"}
        </span>
      </div>

      <!-- Table Header -->
      <div
        class="hidden sm:grid sm:grid-cols-12 gap-2 rounded-lg bg-slate-100 px-3 py-2.5 text-xs font-black text-slate-700 uppercase tracking-wider border border-slate-200"
      >
        <div class="col-span-4">Item Description</div>
        <div class="col-span-2 text-center">QTY</div>
        <div class="col-span-3 text-right">Cost (TZS)</div>
        <div class="col-span-2 text-right">Amount (TZS)</div>
        <div class="col-span-1 text-center"></div>
      </div>

      <!-- Items List -->
      <div class="space-y-2.5 mt-2">
        {#each form.items as item, index (item.id)}
          {@const stockInfo = getMaxAvailableForLineItem(
            item,
            stocks,
            form.items,
          )}
          <div
            class="grid grid-cols-1 sm:grid-cols-12 gap-2 rounded-xl border border-slate-300/90 bg-white p-3 sm:p-2 sm:items-center transition hover:border-slate-400 shadow-2xs"
          >
            <!-- Description -->
            <div class="sm:col-span-4">
              <span
                class="block sm:hidden text-xs font-bold text-slate-600 uppercase mb-1"
                >Item Description</span
              >
              <input
                type="text"
                bind:value={item.description}
                placeholder="e.g. Michelin 265/65R17 Primacy SUV Tyre"
                class="w-full rounded-lg border border-slate-300 bg-slate-50/70 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-950 placeholder:text-slate-400 focus:border-navy-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy-900/10"
              />
              {#if stockInfo.stock}
                <div class="mt-1 flex items-center gap-1.5 text-[11px]">
                  <span
                    class="inline-flex items-center gap-1 font-bold {stockInfo.currentRemaining ===
                    0
                      ? 'text-rose-600'
                      : stockInfo.currentRemaining <=
                          (stockInfo.stock.reorderLevel || 10)
                        ? 'text-amber-700'
                        : 'text-sky-700'}"
                  >
                    <Package class="h-3.5 w-3.5" />
                    <span
                      >Warehouse Stock: {stockInfo.stock.stockQuantity} total &bull;
                      {stockInfo.currentRemaining} remaining</span
                    >
                  </span>
                </div>
              {/if}
            </div>

            <!-- QTY with Stock Boundary Enforcer -->
            <div class="sm:col-span-2">
              <div class="flex items-center justify-between sm:hidden mb-1">
                <span class="text-xs font-bold text-slate-600 uppercase"
                  >QTY</span
                >
                {#if stockInfo.stock}
                  <span class="text-xs text-sky-700 font-bold"
                    >Max {stockInfo.maxQty}</span
                  >
                {/if}
              </div>
              <div class="relative">
                <input
                  type="number"
                  min="1"
                  max={stockInfo.stock ? stockInfo.maxQty : undefined}
                  step="1"
                  value={item.qty}
                  oninput={(e) => handleQtyChange(item, e)}
                  class="w-full rounded-lg border px-2.5 py-2 text-xs sm:text-sm font-black text-slate-950 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:bg-white focus:outline-none focus:ring-2 {stockInfo.stock &&
                  item.qty >= stockInfo.maxQty
                    ? 'border-amber-300 bg-amber-50/40 focus:border-amber-500 focus:ring-amber-500/20'
                    : 'border-slate-300 bg-slate-50/70 focus:border-navy-900 focus:ring-navy-900/10'}"
                />
              </div>
              {#if stockInfo.stock}
                <div
                  class="hidden sm:block text-center mt-0.5 text-[10px] font-bold {item.qty >=
                  stockInfo.maxQty
                    ? 'text-amber-700'
                    : 'text-slate-500'}"
                >
                  Max: {stockInfo.maxQty}
                </div>
              {/if}
            </div>

            <!-- Unit Cost (TZS) -->
            <div class="sm:col-span-3">
              <span
                class="block sm:hidden text-xs font-bold text-slate-600 uppercase mb-1"
                >Unit Cost (TZS)</span
              >
              <div class="relative">
                <input
                  type="number"
                  min="0"
                  step="1000"
                  bind:value={item.unitPrice}
                  placeholder="0"
                  class="w-full rounded-lg border border-slate-300 bg-slate-50/70 px-2.5 py-2 text-xs sm:text-sm font-mono font-bold text-slate-950 text-right [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:border-navy-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-navy-900/10"
                />
              </div>
            </div>

            <!-- Calculated Line Amount (Read-only) -->
            <div class="sm:col-span-2">
              <span
                class="block sm:hidden text-xs font-bold text-slate-600 uppercase mb-1"
                >Amount (TZS)</span
              >
              <div
                class="flex items-center justify-end rounded-lg bg-slate-100 px-2 py-2 text-xs sm:text-sm font-black font-mono text-navy-950 text-right truncate"
              >
                {formatNumber(
                  (Number(item.qty) || 0) * (Number(item.unitPrice) || 0),
                )}
              </div>
            </div>

            <!-- Delete Button -->
            <div
              class="flex items-center justify-end sm:justify-center sm:col-span-1"
            >
              <button
                type="button"
                onclick={() => removeItem(index)}
                aria-label="Remove item"
                class="rounded-lg p-1.5 text-slate-500 transition hover:bg-rose-50 hover:text-rose-600 focus:outline-none cursor-pointer"
                title="Delete Row"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
          </div>
        {/each}
      </div>

      <!-- Add Item & Quick Tyre Picker Row -->
      <div class="mt-3 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onclick={addItem}
          class="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-slate-400 bg-slate-50 px-4 py-2.5 text-xs sm:text-sm font-black text-slate-800 transition hover:border-navy-800 hover:bg-slate-100 hover:text-navy-950 focus:outline-none cursor-pointer"
        >
          <Plus class="h-4 w-4 text-slate-700" />
          <span>Add Blank Item</span>
        </button>

        {#if stocks && stocks.length > 0}
          <div class="flex items-center gap-2">
            <select
              onchange={(e) => {
                const target = e.target as HTMLSelectElement;
                const stockId = target.value;
                if (!stockId) return;
                const found = stocks.find((s) => s.id === stockId);
                if (found) {
                  const available = getEffectiveAvailableStock(
                    found,
                    form.items,
                  );
                  if (available <= 0) {
                    onShowToast?.(
                      `Cannot add "${found.brand} ${found.size}" to invoice: 0 units remaining in stock.`,
                      "error",
                      "INFO",
                      "Out of Stock",
                    );
                    target.value = "";
                    return;
                  }

                  // If only 1 item and it's empty, replace it, else push new item
                  if (
                    form.items.length === 1 &&
                    !form.items[0].description.trim() &&
                    form.items[0].unitPrice === 0
                  ) {
                    form.items[0] = {
                      id: generateId(),
                      description: `${found.brand} ${found.model} (${found.size})`,
                      qty: 1,
                      unitPrice: found.unitPriceTZS,
                      stockId: found.id,
                      sku: found.sku,
                    };
                  } else {
                    form.items = [
                      ...form.items,
                      {
                        id: generateId(),
                        description: `${found.brand} ${found.model} (${found.size})`,
                        qty: 1,
                        unitPrice: found.unitPriceTZS,
                        stockId: found.id,
                        sku: found.sku,
                      },
                    ];
                  }
                  onShowToast?.(
                    `Added "${found.brand} ${found.size}" to invoice. Remaining stock: ${available - 1} units.`,
                    "success",
                    "CREATE",
                    "Product Added",
                  );
                }
                target.value = "";
              }}
              class="rounded-xl border border-sky-200 bg-sky-50/60 px-3 py-2 text-xs font-semibold text-navy-900 focus:border-navy-900 focus:outline-none cursor-pointer"
            >
              <option value=""
                >+ Insert Tyre Stock ({stocks.length} commercial SKUs)...</option
              >
              {#each stocks as s}
                {@const avail = getEffectiveAvailableStock(s, form.items)}
                <option value={s.id} disabled={avail <= 0}>
                  {s.brand}
                  {s.model} - {s.size} ({formatTZS(s.unitPriceTZS)} | {avail > 0
                    ? `${avail} in stock`
                    : "OUT OF STOCK"})
                </option>
              {/each}
            </select>
          </div>
        {/if}
      </div>
    </div>

    <!-- Financials Row (Discount, Tax 18%, Total) -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
      <!-- Discount -->
      <div>
        <label
          for="discount"
          class="block text-xs sm:text-[13px] font-extrabold text-slate-800 uppercase tracking-wider mb-1.5"
        >
          Discount (TZS)
        </label>
        <div class="relative">
          <input
            id="discount"
            type="number"
            min="0"
            step="5000"
            bind:value={form.discount}
            class="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm sm:text-base font-bold font-mono text-slate-900 text-right focus:border-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-900/10"
          />
        </div>
      </div>

      <!-- Tax % (Tanzania VAT 18%) -->
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <label
            for="taxRate"
            class="block text-xs sm:text-[13px] font-extrabold text-slate-800 uppercase tracking-wider"
          >
            Tax (VAT {form.taxRate}%)
          </label>
        </div>
        <div class="relative">
          <input
            id="taxRate"
            type="number"
            min="0"
            max="100"
            step="1"
            bind:value={form.taxRate}
            class="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm sm:text-base font-bold font-mono text-slate-900 text-right focus:border-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-900/10"
          />
        </div>
      </div>

      <!-- Calculated Total (Read-only) -->
      <div>
        <span
          class="block text-xs sm:text-[13px] font-extrabold text-slate-800 uppercase tracking-wider mb-1.5"
        >
          Total (TZS)
        </span>
        <div
          class="flex items-center justify-end rounded-xl border border-navy-900/20 bg-slate-100 px-3.5 py-2.5 text-base sm:text-lg font-black font-mono text-navy-950 shadow-2xs"
        >
          {formatNumber(calculatedTotal)}
        </div>
      </div>
    </div>

    <!-- Receiving Payment Details & Bank Account Selector -->
    <div
      class="rounded-2xl border border-slate-300/90 bg-slate-50/80 p-4 sm:p-5 space-y-3 shadow-2xs"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <div
            class="flex h-8 w-8 items-center justify-center rounded-xl bg-navy-900 text-sky-400"
          >
            <Building2 class="h-4 w-4" />
          </div>
          <div>
            <label
              for="paymentDetailSelect"
              class="block text-xs sm:text-sm font-extrabold text-slate-900 uppercase tracking-wider"
            >
              Receiving Payment Detail / Bank Account *
            </label>
            <p class="text-xs text-slate-600 font-medium">
              Select which bank account or payment method this customer should pay to.
            </p>
          </div>
        </div>
        {#if activePayment}
          <span
            class="rounded-md bg-navy-900 text-white font-mono text-xs font-black px-2.5 py-0.5"
          >
            {activePayment.currency || "TZS"}
          </span>
        {/if}
      </div>

      <select
        id="paymentDetailSelect"
        value={activePayment?.id || ""}
        onchange={handlePaymentDetailSelect}
        class="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-bold text-navy-950 focus:border-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-900/10 cursor-pointer"
      >
        {#if paymentDetails.length === 0}
          <option value="">No payment accounts configured</option>
        {:else}
          {#each paymentDetails as pay}
            <option value={pay.id}>
              {pay.bankName} - {pay.accountNumber} ({pay.currency}{pay.isDefault
                ? " - Default"
                : ""})
            </option>
          {/each}
        {/if}
      </select>

      <!-- Active Selected Payment Detail Summary Card -->
      {#if activePayment}
        <div
          class="rounded-xl border border-slate-300 bg-white p-3.5 text-xs sm:text-sm space-y-2 shadow-2xs"
        >
          <div class="flex items-center justify-between text-slate-800">
            <span class="text-slate-600 font-bold text-xs">Bank / Provider:</span>
            <span class="font-extrabold text-slate-950"
              >{activePayment.bankName}</span
            >
          </div>
          <div class="flex items-center justify-between text-slate-800">
            <span class="text-slate-600 font-bold text-xs">Account Name:</span>
            <span class="font-bold text-slate-900"
              >{activePayment.accountName}</span
            >
          </div>
          <div class="flex items-center justify-between text-slate-800">
            <span class="text-slate-600 font-bold text-xs">Account / Till No:</span>
            <span
              class="font-black text-navy-950 font-mono bg-slate-100 px-2.5 py-0.5 rounded text-xs sm:text-sm"
              >{activePayment.accountNumber}</span
            >
          </div>
          {#if activePayment.swiftCode && activePayment.swiftCode !== "N/A"}
            <div class="flex items-center justify-between text-slate-800">
              <span class="text-slate-600 font-bold text-xs">Swift Code:</span>
              <span class="font-mono font-bold text-slate-900"
                >{activePayment.swiftCode}</span
              >
            </div>
          {/if}
          {#if activePayment.branch}
            <div class="flex items-center justify-between text-slate-800">
              <span class="text-slate-600 font-bold text-xs">Branch:</span>
              <span class="text-slate-700 font-semibold">{activePayment.branch}</span>
            </div>
          {/if}
        </div>
      {/if}
    </div>

    <!-- Notes to Customer -->
    <div>
      <label
        for="notes"
        class="block text-xs sm:text-[13px] font-extrabold text-slate-800 uppercase tracking-wider mb-1.5"
      >
        Notes to Customer
      </label>
      <textarea
        id="notes"
        rows="3"
        bind:value={form.notes}
        placeholder="Thank you for your business. Please complete the payment before the due date..."
        class="w-full rounded-xl border border-slate-300 bg-white p-3.5 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 transition focus:border-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-900/10 resize-none"
      ></textarea>
    </div>

    <!-- Update & Sync Customer Dashboard Action Button -->
    {#if onSaveInvoice}
      <div
        class="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200"
      >
        <p class="text-xs text-slate-600 font-medium">
          Edits reflect directly on customer records and invoice history.
        </p>
        <button
          type="button"
          onclick={onSaveInvoice}
          class="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm transition hover:bg-navy-800 active:scale-95 cursor-pointer"
        >
          <Save class="h-4 w-4 text-sky-400" />
          <span>Update & Sync Customer Dashboard</span>
        </button>
      </div>
    {/if}
  </div>
</div>
