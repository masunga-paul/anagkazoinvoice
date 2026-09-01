<script lang="ts">
  import MetricCard from "./MetricCard.svelte";
  import DeleteConfirmModal from "../common/DeleteConfirmModal.svelte";
  import StaffCredentialsModal from "../admin/StaffCredentialsModal.svelte";
  import type { TyreProductStock } from "$lib/data/mockData";
  import type { Customer } from "$lib/types/customer";
  import type { PaymentDetail } from "$lib/types/payment";
  import type { GeneratedInvoiceItem } from "../reports/GeneratedInvoicesAudit.svelte";
  import type { StaffCredentials, AdminCredentials } from "$lib/types/auth";
  import { formatTZS, formatDisplayDate } from "$lib/utils/format";
  import {
    Plus,
    FileText,
    Users,
    Package,
    BarChart3,
    AlertTriangle,
    ArrowUpRight,
    CircleDollarSign,
    Truck,
    ChevronRight,
    CheckCircle2,
    Clock,
    AlertCircle,
    ShieldCheck,
    Layers,
    Building2,
    Search,
    Trash2,
    RotateCcw,
    KeyRound,
    X,
  } from "lucide-svelte";

  interface Props {
    invoices?: GeneratedInvoiceItem[];
    stocks?: TyreProductStock[];
    customers?: Customer[];
    paymentDetails?: PaymentDetail[];
    onNavigateTab: (tab: string) => void;
    onSelectInvoiceCustomer?: (customerName: string) => void;
    onLoadInvoice?: (invoice: GeneratedInvoiceItem) => void;
    onDeleteInvoice?: (id: string) => void;
    onDeleteAllInvoices?: () => void;
    onDeleteAllData?: () => void;
    onResetAllData?: () => void;
    onAddPaymentDetail?: (detail: PaymentDetail) => void;
    onUpdatePaymentDetail?: (detail: PaymentDetail) => void;
    onDeletePaymentDetail?: (id: string) => void;
    onSetDefaultPaymentDetail?: (id: string) => void;
    onAdminSaved?: (creds: AdminCredentials) => void;
    onShowToast?: (
      message: string,
      type?: "success" | "error" | "info",
      action?: any,
      title?: string,
    ) => void;
  }

  let {
    invoices = [],
    stocks = [],
    customers = [],
    paymentDetails = [],
    onNavigateTab,
    onSelectInvoiceCustomer,
    onLoadInvoice,
    onDeleteInvoice,
    onDeleteAllInvoices,
    onDeleteAllData,
    onResetAllData,
    onAddPaymentDetail,
    onUpdatePaymentDetail,
    onDeletePaymentDetail,
    onSetDefaultPaymentDetail,
    onAdminSaved,
    onShowToast,
  }: Props = $props();

  // Search & Delete states for Recent Invoices
  let searchQuery = $state("");
  let selectedStatusFilter = $state<string>("All");
  let isDeleteModalOpen = $state(false);
  let isDeleteAllModalOpen = $state(false);
  let isResetAllDataModalOpen = $state(false);
  let isStaffCredentialsModalOpen = $state(false);
  let pendingDeleteInvoice = $state<GeneratedInvoiceItem | null>(null);

  function promptDeleteInvoice(inv: GeneratedInvoiceItem) {
    pendingDeleteInvoice = inv;
    isDeleteModalOpen = true;
  }

  function confirmDeleteInvoice() {
    if (!pendingDeleteInvoice) return;
    const inv = pendingDeleteInvoice;
    onDeleteInvoice?.(inv.id);
    onShowToast?.(
      `Invoice ${inv.id} (${inv.customer}) deleted from records.`,
      "info",
      "DELETE",
      "Invoice Deleted",
    );
    pendingDeleteInvoice = null;
    isDeleteModalOpen = false;
  }

  function confirmDeleteAllInvoices() {
    onDeleteAllInvoices?.();
    onShowToast?.(
      "All recent invoices have been deleted.",
      "info",
      "DELETE",
      "Invoices Cleared",
    );
    isDeleteAllModalOpen = false;
  }

  function confirmResetAllData() {
    if (onDeleteAllData) {
      onDeleteAllData();
    } else {
      onResetAllData?.();
    }
    isResetAllDataModalOpen = false;
  }

  // Filtered invoices based on search query and status filter
  const filteredInvoices = $derived(
    invoices.filter((inv) => {
      const matchesStatus =
        selectedStatusFilter === "All" || inv.status === selectedStatusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        inv.id.toLowerCase().includes(q) ||
        inv.customer.toLowerCase().includes(q) ||
        (inv.status && inv.status.toLowerCase().includes(q)) ||
        inv.amount.toString().includes(q);
      return matchesStatus && matchesSearch;
    }),
  );

  // Real-time calculated derived metrics from live props
  const totalInvoicesCount = $derived(invoices.length);
  const totalInvoicedAmount = $derived(
    invoices.reduce((acc, inv) => acc + (inv.amount || 0), 0),
  );
  const paidInvoicesCount = $derived(
    invoices.filter((i) => i.status === "Paid").length,
  );
  const pendingInvoicesCount = $derived(
    invoices.filter((i) => i.status === "Pending").length,
  );
  const overdueInvoicesCount = $derived(
    invoices.filter((i) => i.status === "Overdue").length,
  );

  const totalPaidAmount = $derived(
    invoices
      .filter((i) => i.status === "Paid")
      .reduce((acc, inv) => acc + (inv.amount || 0), 0),
  );
  const totalOutstandingAmount = $derived(
    invoices
      .filter((i) => i.status === "Pending" || i.status === "Overdue")
      .reduce((acc, inv) => acc + (inv.amount || 0), 0),
  );

  const totalStockUnits = $derived(
    stocks.reduce((acc, s) => acc + (s.stockQuantity || 0), 0),
  );
  const lowStockAlerts = $derived(
    stocks.filter((s) => (s.stockQuantity || 0) <= (s.reorderLevel || 10)),
  );
  const healthyStocks = $derived(
    stocks.filter((s) => (s.stockQuantity || 0) > (s.reorderLevel || 10)),
  );

  let stockFilter = $state<"all" | "instock" | "alerts">("all");
  const displayedDashboardStocks = $derived(
    stocks.filter((s) => {
      if (stockFilter === "instock")
        return (s.stockQuantity || 0) > (s.reorderLevel || 10);
      if (stockFilter === "alerts")
        return (s.stockQuantity || 0) <= (s.reorderLevel || 10);
      return true;
    }),
  );

  const topCustomers = $derived(
    [...customers]
      .sort((a, b) => (b.totalPurchases || 0) - (a.totalPurchases || 0))
      .slice(0, 4),
  );

  function handleInvoiceAction(inv: GeneratedInvoiceItem) {
    if (onLoadInvoice) {
      onLoadInvoice(inv);
    } else if (onSelectInvoiceCustomer) {
      onSelectInvoiceCustomer(inv.customer);
    }
    onNavigateTab("Invoices");
  }
</script>

<div class="space-y-6">
  <!-- Dashboard Header & Greeting Banner -->
  <div
    class="rounded-2xl border border-navy-800/80 bg-gradient-to-r from-navy-950 via-navy-900 to-navy-950 p-6 sm:p-8 text-white shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-6"
  >
    <div class="space-y-2">
      <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">
        Anagkazo Fleet Operations
      </h1>
      <p class="text-xs sm:text-sm text-slate-300 max-w-xl">
        Real-time commercial tyre sales overview, inventory replenishment
        alerts, and live electronic invoicing records.
      </p>
    </div>

    <!-- Action Buttons -->
    <div class="flex flex-wrap items-center gap-3 shrink-0">
      {#if onDeleteAllData || onResetAllData}
        <button
          type="button"
          onclick={() => (isResetAllDataModalOpen = true)}
          class="inline-flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-rose-300 shadow-xs hover:bg-rose-500/20 hover:text-rose-200 transition cursor-pointer"
          title="Delete all data from whole system & database to start fresh (customers, stocks, invoices, banking, reports)"
        >
          <Trash2 class="h-4 w-4 text-rose-400" />
          <span>Delete All Data</span>
        </button>
      {/if}

      <button
        type="button"
        onclick={() => (isStaffCredentialsModalOpen = true)}
        class="inline-flex items-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-sky-300 shadow-xs hover:bg-sky-500/20 hover:text-sky-200 transition cursor-pointer"
        title="Change staff login email and password"
      >
        <KeyRound class="h-4 w-4 text-sky-400" />
        <span>Security Credentials</span>
      </button>

      <button
        type="button"
        onclick={() => onNavigateTab("Invoices")}
        class="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2.5 text-xs sm:text-sm font-bold text-navy-950 shadow-md hover:bg-sky-400 transition active:scale-95 cursor-pointer"
      >
        <Plus class="h-4 w-4" />
        <span>Create Invoice</span>
      </button>

      <button
        type="button"
        onclick={() => onNavigateTab("Reports")}
        class="inline-flex items-center gap-2 rounded-xl border border-navy-700 bg-navy-800/80 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-navy-700 transition cursor-pointer"
      >
        <BarChart3 class="h-4 w-4 text-sky-400" />
        <span>Financial Reports</span>
      </button>
    </div>
  </div>

  <!-- 4 Key Performance Metric Cards (Synchronized in Real Time) -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
    <MetricCard
      title="Total Invoices Generated"
      value={`${totalInvoicesCount} Invoices`}
      trend={`${paidInvoicesCount} Paid • ${pendingInvoicesCount} Pending`}
      trendPositive={true}
      subtitle={`${formatTZS(totalInvoicedAmount)} total billed`}
      icon={FileText}
      iconBg="bg-navy-50"
      iconColor="text-navy-900"
    />

    <MetricCard
      title="Total Revenue Collected"
      value={formatTZS(totalPaidAmount)}
      trend={overdueInvoicesCount > 0
        ? `${overdueInvoicesCount} overdue`
        : "Zero overdue"}
      trendPositive={overdueInvoicesCount === 0}
      subtitle={`${formatTZS(totalOutstandingAmount)} outstanding`}
      icon={CircleDollarSign}
      iconBg="bg-emerald-50"
      iconColor="text-emerald-700"
    />

    <MetricCard
      title="Commercial Fleet Clients"
      value={`${customers.length} Accounts`}
      trend={`${customers.filter((c) => c.status === "Paid").length} accounts in good standing`}
      trendPositive={true}
      subtitle="Fleet & Logistics Partners"
      icon={Truck}
      iconBg="bg-blue-50"
      iconColor="text-blue-600"
    />

    <MetricCard
      title="Tyre Inventory Stock"
      value={`${totalStockUnits} Units`}
      trend={lowStockAlerts.length > 0
        ? `${lowStockAlerts.length} reorder alerts`
        : "All stocks healthy"}
      trendPositive={lowStockAlerts.length === 0}
      subtitle={`${stocks.length} commercial SKUs`}
      icon={Package}
      iconBg="bg-slate-100"
      iconColor="text-slate-900"
    />
  </div>

  <!-- Main Grid: Real-Time Recent Invoices & Stock Reorder Alerts -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
    <!-- Left (8 Cols): Recent Invoices Table (Real-Time Synced) -->
    <div class="lg:col-span-8 space-y-6">
      <div
        class="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs"
      >
        <div
          class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4 mb-4"
        >
          <div class="flex items-center gap-2.5">
            <div
              class="flex h-8 w-8 items-center justify-center rounded-xl bg-navy-900 text-white shadow-xs"
            >
              <FileText class="h-4 w-4 text-sky-400" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-base font-bold text-slate-900">
                  Recent Invoices
                </h2>
              </div>
              <p class="text-xs text-slate-500">
                Live electronic billing records issued to commercial fleet
                clients.
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            {#if invoices.length > 0 && onDeleteAllInvoices}
              <button
                type="button"
                onclick={() => (isDeleteAllModalOpen = true)}
                class="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1.5 rounded-lg transition cursor-pointer shadow-2xs"
                title="Delete all recent invoices"
              >
                <Trash2 class="h-3.5 w-3.5" />
                <span>Delete All</span>
              </button>
            {/if}
            <button
              type="button"
              onclick={() => onNavigateTab("Invoices")}
              class="inline-flex items-center gap-1 text-xs font-bold text-navy-900 hover:text-navy-700 bg-navy-50 hover:bg-navy-100 px-2.5 py-1.5 rounded-lg transition cursor-pointer shadow-2xs"
            >
              <span>New Invoice</span>
              <ArrowUpRight class="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <!-- Search Bar & Status Quick Filters -->
        <div
          class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4"
        >
          <!-- Search Box -->
          <div class="relative flex-1">
            <Search
              class="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400"
            />
            <input
              type="text"
              bind:value={searchQuery}
              placeholder="Search by invoice #, client name, status, or amount..."
              class="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-8 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-navy-500 focus:outline-hidden focus:ring-2 focus:ring-navy-500/10 transition"
            />
            {#if searchQuery}
              <button
                type="button"
                onclick={() => (searchQuery = "")}
                class="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition cursor-pointer"
                aria-label="Clear search"
              >
                <X class="h-3.5 w-3.5" />
              </button>
            {/if}
          </div>

          <!-- Status Quick Filter Pills -->
          <div class="flex items-center gap-1.5 overflow-x-auto shrink-0">
            {#each ["All", "Paid", "Pending", "Overdue"] as status}
              <button
                type="button"
                onclick={() => (selectedStatusFilter = status)}
                class="rounded-lg px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer {selectedStatusFilter ===
                status
                  ? 'bg-navy-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'}"
              >
                {status}
                {#if status !== "All"}
                  <span class="ml-1 opacity-75 text-[10px]">
                    ({invoices.filter((i) => i.status === status).length})
                  </span>
                {/if}
              </button>
            {/each}
          </div>
        </div>

        <div class="overflow-x-auto">
          {#if invoices.length === 0}
            <div class="py-12 text-center text-slate-400 space-y-3">
              <FileText class="h-10 w-10 mx-auto text-slate-300 stroke-[1.5]" />
              <p class="text-xs font-medium">No invoices found in database.</p>
              <button
                type="button"
                onclick={() => onNavigateTab("Invoices")}
                class="inline-flex items-center gap-1.5 rounded-xl bg-navy-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-navy-800 transition cursor-pointer"
              >
                <Plus class="h-3.5 w-3.5 text-sky-400" />
                <span>Create First Invoice</span>
              </button>
            </div>
          {:else if filteredInvoices.length === 0}
            <div class="py-10 text-center text-slate-400 space-y-2.5">
              <Search class="h-8 w-8 mx-auto text-slate-300 stroke-[1.5]" />
              <p class="text-xs font-medium text-slate-600">
                No invoices match your search query "{searchQuery}"
              </p>
              <button
                type="button"
                onclick={() => {
                  searchQuery = "";
                  selectedStatusFilter = "All";
                }}
                class="inline-flex items-center gap-1 text-xs font-bold text-navy-900 hover:underline cursor-pointer"
              >
                <span>Reset Search & Filters</span>
              </button>
            </div>
          {:else}
            <table class="w-full text-left text-xs sm:text-sm border-collapse min-w-[640px]">
              <thead>
                <tr
                  class="border-b-2 border-slate-200 text-xs font-black uppercase tracking-wider text-slate-700 bg-slate-50/70"
                >
                  <th class="py-3 px-3">Invoice #</th>
                  <th class="py-3 px-3">Customer</th>
                  <th class="py-3 px-3">Date</th>
                  <th class="py-3 px-3 text-right">Amount (TZS)</th>
                  <th class="py-3 px-3 text-center">Status</th>
                  <th class="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                {#each filteredInvoices as inv (inv.id)}
                  <tr class="hover:bg-slate-50/90 transition">
                    <td class="py-3.5 px-3 font-mono font-bold text-navy-950 text-xs sm:text-sm">
                      {inv.id}
                    </td>
                    <td class="py-3.5 px-3 font-bold text-slate-900 text-xs sm:text-sm">
                      {inv.customer}
                    </td>
                    <td class="py-3.5 px-3 text-slate-600 font-medium whitespace-nowrap text-xs">
                      {formatDisplayDate(inv.date)}
                    </td>
                    <td
                      class="py-3.5 px-3 text-right font-mono font-black text-slate-950 text-xs sm:text-sm"
                    >
                      {formatTZS(inv.amount)}
                    </td>
                    <td class="py-3.5 px-3 text-center">
                      <span
                        class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-extrabold {inv.status ===
                        'Paid'
                          ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-600/30'
                          : inv.status === 'Pending'
                            ? 'bg-amber-50 text-amber-800 ring-1 ring-amber-600/30'
                            : 'bg-rose-50 text-rose-800 ring-1 ring-rose-600/30'}"
                      >
                        {#if inv.status === "Paid"}
                          <CheckCircle2 class="mr-1 h-3.5 w-3.5 text-emerald-600" />
                        {:else if inv.status === "Pending"}
                          <Clock class="mr-1 h-3.5 w-3.5 text-amber-600" />
                        {:else}
                          <AlertCircle class="mr-1 h-3.5 w-3.5 text-rose-600" />
                        {/if}
                        {inv.status}
                      </span>
                    </td>
                    <td class="py-3.5 px-3 text-right whitespace-nowrap">
                      <div class="inline-flex items-center gap-1.5 justify-end">
                        <button
                          type="button"
                          onclick={() => handleInvoiceAction(inv)}
                          class="inline-flex items-center gap-1 text-xs font-bold text-navy-900 hover:text-navy-700 bg-navy-50 hover:bg-navy-100 px-3 py-1.5 rounded-lg transition cursor-pointer shadow-2xs"
                          title="View / Edit in Invoice Editor"
                        >
                          <span>View / Edit</span>
                          <ArrowUpRight class="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onclick={() => promptDeleteInvoice(inv)}
                          class="inline-flex items-center justify-center h-8 w-8 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition cursor-pointer shadow-2xs"
                          title="Delete invoice record"
                          aria-label="Delete invoice {inv.id}"
                        >
                          <Trash2 class="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          {/if}
        </div>
      </div>
    </div>

    <!-- Right (4 Cols): Live Stock Reorder Alerts & Commercial Fleet Accounts -->
    <div class="lg:col-span-4 space-y-6">
      <!-- Live Tyre Inventory Stock Section (Real-Time Available Units & Stock Breakdown) -->
      <div
        class="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4"
      >
        <div
          class="flex items-center justify-between border-b border-slate-100 pb-3"
        >
          <div class="flex items-center gap-2.5">
            <div
              class="flex h-8 w-8 items-center justify-center rounded-xl bg-navy-900 text-white shadow-xs"
            >
              <Package class="h-4 w-4 text-sky-400" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-sm font-bold text-slate-900">
                  Tyre Inventory Stock
                </h2>
              </div>
              <p class="text-xs text-slate-600 font-medium">
                Live warehouse stock units & availability
              </p>
            </div>
          </div>
          <div class="text-right">
            <div class="text-sm font-black text-navy-950 font-mono">
              {totalStockUnits}
            </div>
            <div class="text-xs text-slate-600 font-semibold">
              Available Units
            </div>
          </div>
        </div>

        <!-- Mini Summary Status Indicators -->
        <div class="grid grid-cols-3 gap-2 text-center">
          <div class="rounded-xl border border-slate-200 bg-slate-50 p-2.5">
            <div class="text-xs sm:text-sm font-black text-slate-900 font-mono">
              {stocks.length}
            </div>
            <div class="text-xs font-bold text-slate-600">Total SKUs</div>
          </div>
          <div
            class="rounded-xl border border-emerald-200 bg-emerald-50/70 p-2.5"
          >
            <div class="text-xs sm:text-sm font-black text-emerald-800 font-mono">
              {healthyStocks.length}
            </div>
            <div class="text-xs font-bold text-emerald-700">In Stock</div>
          </div>
          <div
            class="rounded-xl border {lowStockAlerts.length > 0
              ? 'border-amber-300 bg-amber-50/80'
              : 'border-slate-200 bg-slate-50'} p-2.5"
          >
            <div
              class="text-xs sm:text-sm font-black {lowStockAlerts.length > 0
                ? 'text-amber-800'
                : 'text-slate-900'} font-mono"
            >
              {lowStockAlerts.length}
            </div>
            <div
              class="text-xs font-bold {lowStockAlerts.length > 0
                ? 'text-amber-700'
                : 'text-slate-600'}"
            >
              Alerts
            </div>
          </div>
        </div>

        <!-- Filter Tabs -->
        <div class="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            type="button"
            onclick={() => (stockFilter = "all")}
            class="flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer {stockFilter ===
            'all'
              ? 'bg-white text-navy-950 shadow-2xs font-extrabold'
              : 'text-slate-600 hover:text-slate-900'}"
          >
            All ({stocks.length})
          </button>
          <button
            type="button"
            onclick={() => (stockFilter = "instock")}
            class="flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer {stockFilter ===
            'instock'
              ? 'bg-white text-emerald-800 shadow-2xs font-extrabold'
              : 'text-slate-600 hover:text-slate-900'}"
          >
            In Stock ({healthyStocks.length})
          </button>
          <button
            type="button"
            onclick={() => (stockFilter = "alerts")}
            class="flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer {stockFilter ===
            'alerts'
              ? 'bg-white text-amber-800 shadow-2xs font-extrabold'
              : 'text-slate-600 hover:text-slate-900'}"
          >
            Alerts ({lowStockAlerts.length})
          </button>
        </div>

        <!-- Live Stock Items List with Available Units & Progress Bars -->
        <div class="space-y-2.5 max-h-80 overflow-y-auto pr-0.5">
          {#if stocks.length === 0}
            <div
              class="rounded-xl border border-dashed border-slate-200 p-4 text-center"
            >
              <Package class="h-6 w-6 text-slate-300 mx-auto mb-1.5" />
              <p class="text-xs font-semibold text-slate-600">
                No Tyre Inventory
              </p>
              <p class="text-[11px] text-slate-400 mt-0.5">
                Add stock products in the Products & Stocks tab.
              </p>
            </div>
          {:else if displayedDashboardStocks.length === 0}
            <div
              class="rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-center"
            >
              <p class="text-xs text-slate-500">
                No products matching the selected filter.
              </p>
            </div>
          {:else}
            {#each displayedDashboardStocks as stock (stock.sku || stock.id)}
              {@const qty = stock.stockQuantity || 0}
              {@const reorder = stock.reorderLevel || 10}
              {@const isOut = qty === 0}
              {@const isLow = !isOut && qty <= reorder}
              {@const percent = Math.min(
                100,
                Math.round((qty / Math.max(50, reorder * 3)) * 100),
              )}
              <div
                class="rounded-xl border {isOut
                  ? 'border-rose-200/80 bg-rose-50/20'
                  : isLow
                    ? 'border-amber-200/80 bg-amber-50/20'
                    : 'border-slate-200/70 bg-white'} p-3 space-y-2 transition hover:shadow-2xs"
              >
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <div class="flex items-center gap-1.5 flex-wrap">
                      <span class="font-bold text-xs text-slate-900"
                        >{stock.brand} {stock.model}</span
                      >
                      <span
                        class="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded"
                        >{stock.size}</span
                      >
                    </div>
                    <div class="text-[10px] text-slate-400 mt-0.5 font-mono">
                      SKU: {stock.sku} &bull; {stock.location}
                    </div>
                  </div>
                  <div class="text-right shrink-0">
                    <div
                      class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-black font-mono {isOut
                        ? 'bg-rose-100 text-rose-700'
                        : isLow
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-800'}"
                    >
                      <span>{qty}</span>
                      <span
                        class="text-[9px] font-bold uppercase tracking-wider"
                        >Units</span
                      >
                    </div>
                    <div
                      class="text-[10px] text-slate-500 font-mono font-medium mt-0.5"
                    >
                      {formatTZS(stock.unitPriceTZS)}
                    </div>
                  </div>
                </div>

                <!-- Stock Available Bar & Status -->
                <div class="space-y-1">
                  <div class="flex items-center justify-between text-[10px]">
                    <span
                      class="font-medium {isOut
                        ? 'text-rose-600'
                        : isLow
                          ? 'text-amber-600'
                          : 'text-emerald-600'}"
                    >
                      {isOut
                        ? "Out of Stock"
                        : isLow
                          ? `Low Stock (Reorder ≤ ${reorder})`
                          : "Available in Stock"}
                    </span>
                    <span class="text-slate-400 font-mono"
                      >{qty} units available</span
                    >
                  </div>
                  <div
                    class="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden"
                  >
                    <div
                      class="h-full rounded-full transition-all duration-300 {isOut
                        ? 'bg-rose-500'
                        : isLow
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'}"
                      style="width: {percent}%"
                    ></div>
                  </div>
                </div>
              </div>
            {/each}
          {/if}
        </div>

        <button
          type="button"
          onclick={() => onNavigateTab("Services")}
          class="w-full rounded-xl border border-navy-200 bg-navy-50/60 py-2.5 text-center text-xs font-bold text-navy-900 hover:bg-navy-100/80 transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <span>Manage Full Warehouse Catalog</span>
          <ArrowUpRight class="h-3.5 w-3.5" />
        </button>
      </div>

      <!-- Top Commercial Fleet Accounts Card -->
      <div
        class="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs"
      >
        <div
          class="flex items-center justify-between border-b border-slate-100 pb-3 mb-3"
        >
          <div class="flex items-center gap-2">
            <div
              class="flex h-7 w-7 items-center justify-center rounded-lg bg-navy-50 text-navy-900"
            >
              <Truck class="h-4 w-4 text-sky-600" />
            </div>
            <h2 class="text-sm font-bold text-slate-900">Top Fleet Clients</h2>
          </div>
          <span
            class="text-[10px] font-bold text-navy-900 bg-navy-50 px-2 py-0.5 rounded-full"
          >
            {customers.length} Accounts
          </span>
        </div>

        <div class="space-y-3 text-xs">
          {#if topCustomers.length === 0}
            <p class="text-xs text-slate-400 text-center py-4">
              No customers registered yet.
            </p>
          {:else}
            {#each topCustomers as cust (cust.id)}
              <div class="flex items-start justify-between">
                <div>
                  <div class="font-bold text-slate-800">
                    {cust.companyName || cust.name}
                  </div>
                  <div class="text-[11px] text-slate-500">
                    {cust.customerType} &bull; {cust.city}
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-[11px] font-mono text-navy-900 font-bold">
                    {formatTZS(cust.totalPurchases || 0)}
                  </div>
                  <span
                    class="inline-block text-[10px] font-semibold {cust.status ===
                    'Paid'
                      ? 'text-emerald-600'
                      : cust.status === 'Pending'
                        ? 'text-amber-600'
                        : 'text-rose-600'}"
                  >
                    {cust.status}
                  </span>
                </div>
              </div>
            {/each}
          {/if}
        </div>

        <button
          type="button"
          onclick={() => onNavigateTab("Customers")}
          class="w-full mt-4 rounded-xl border border-slate-200 py-2 text-center text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
        >
          View Customer Directory
        </button>
      </div>

      <!-- Quick Navigation Feature Cards (Vertical Order below Top Fleet Clients) -->
      <div class="space-y-3">
        <button
          type="button"
          onclick={() => onNavigateTab("Customers")}
          class="w-full rounded-2xl border border-slate-200/90 bg-white p-4 text-left transition hover:border-navy-300 hover:shadow-xs group cursor-pointer flex items-center justify-between"
        >
          <div class="flex items-center gap-3.5 min-w-0">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-900 group-hover:scale-105 transition"
            >
              <Users class="h-4.5 w-4.5" />
            </div>
            <div class="min-w-0">
              <h3 class="text-xs font-bold text-slate-900 truncate">
                Customer Directory
              </h3>
              <p class="text-[11px] text-slate-500 truncate">
                Manage {customers.length} commercial fleet accounts
              </p>
            </div>
          </div>
          <ChevronRight
            class="h-4 w-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition ml-2"
          />
        </button>

        <button
          type="button"
          onclick={() => onNavigateTab("Services")}
          class="w-full rounded-2xl border border-slate-200/90 bg-white p-4 text-left transition hover:border-navy-300 hover:shadow-xs group cursor-pointer flex items-center justify-between"
        >
          <div class="flex items-center gap-3.5 min-w-0">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-900 group-hover:scale-105 transition"
            >
              <Package class="h-4.5 w-4.5" />
            </div>
            <div class="min-w-0">
              <h3 class="text-xs font-bold text-slate-900 truncate">
                Products & Stocks
              </h3>
              <p class="text-[11px] text-slate-500 truncate">
                Commercial tyre catalog & inventory
              </p>
            </div>
          </div>
          <ChevronRight
            class="h-4 w-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition ml-2"
          />
        </button>

        <button
          type="button"
          onclick={() => onNavigateTab("PaymentDetails")}
          class="w-full rounded-2xl border border-slate-200/90 bg-white p-4 text-left transition hover:border-navy-300 hover:shadow-xs group cursor-pointer flex items-center justify-between"
        >
          <div class="flex items-center gap-3.5 min-w-0">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700 group-hover:scale-105 transition"
            >
              <Building2 class="h-4.5 w-4.5" />
            </div>
            <div class="min-w-0">
              <h3 class="text-xs font-bold text-slate-900 truncate">
                Payment Details
              </h3>
              <p class="text-[11px] text-slate-500 truncate">
                {paymentDetails.length} receiving bank accounts configured
              </p>
            </div>
          </div>
          <ChevronRight
            class="h-4 w-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition ml-2"
          />
        </button>

        <button
          type="button"
          onclick={() => onNavigateTab("Reports")}
          class="w-full rounded-2xl border border-slate-200/90 bg-white p-4 text-left transition hover:border-navy-300 hover:shadow-xs group cursor-pointer flex items-center justify-between"
        >
          <div class="flex items-center gap-3.5 min-w-0">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-900 group-hover:scale-105 transition"
            >
              <BarChart3 class="h-4.5 w-4.5" />
            </div>
            <div class="min-w-0">
              <h3 class="text-xs font-bold text-slate-900 truncate">
                Financial Reports
              </h3>
              <p class="text-[11px] text-slate-500 truncate">
                Revenue trends & fiscal tax audit log
              </p>
            </div>
          </div>
          <ChevronRight
            class="h-4 w-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition ml-2"
          />
        </button>

        <button
          type="button"
          onclick={() => (isStaffCredentialsModalOpen = true)}
          class="w-full rounded-2xl border border-slate-200/90 bg-white p-4 text-left transition hover:border-sky-300 hover:shadow-xs group cursor-pointer flex items-center justify-between"
        >
          <div class="flex items-center gap-3.5 min-w-0">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700 group-hover:scale-105 transition"
            >
              <KeyRound class="h-4.5 w-4.5" />
            </div>
            <div class="min-w-0">
              <h3 class="text-xs font-bold text-slate-900 truncate">
                Staff Login Credentials
              </h3>
              <p class="text-[11px] text-slate-500 truncate">
                Manage login email & password for Baraka
              </p>
            </div>
          </div>
          <ChevronRight
            class="h-4 w-4 text-slate-400 shrink-0 group-hover:translate-x-0.5 transition ml-2"
          />
        </button>
      </div>
    </div>
  </div>
</div>

<!-- Deletion Confirmation Dialog Modal -->
<DeleteConfirmModal
  open={isDeleteModalOpen}
  title="Delete Invoice Record?"
  itemName={pendingDeleteInvoice
    ? `Invoice ${pendingDeleteInvoice.id} (${pendingDeleteInvoice.customer})`
    : "this invoice"}
  itemType="Invoice"
  description="This action will permanently delete this invoice record from the transaction database. This cannot be undone."
  confirmText="Yes, Delete Invoice"
  onConfirm={confirmDeleteInvoice}
  onClose={() => {
    isDeleteModalOpen = false;
    pendingDeleteInvoice = null;
  }}
/>

<!-- Delete All Invoices Confirmation Dialog Modal -->
<DeleteConfirmModal
  open={isDeleteAllModalOpen}
  title="Delete ALL Recent Invoices?"
  itemName={`${invoices.length} Invoices (${formatTZS(totalInvoicedAmount)})`}
  itemType="All Invoices"
  description="This will permanently delete all recent invoice records from the workspace, dashboard ledger, and transaction history. This action cannot be undone."
  confirmText="Yes, Delete All Invoices"
  onConfirm={confirmDeleteAllInvoices}
  onClose={() => {
    isDeleteAllModalOpen = false;
  }}
/>

<!-- Delete All System Data Confirmation Modal -->
<DeleteConfirmModal
  open={isResetAllDataModalOpen}
  title="Delete ALL System & Database Data?"
  itemType="Whole System & Database"
  itemName="Customers, Stocks, Invoices, Banking & Reports"
  description="This will permanently delete all customer accounts, tyre warehouse inventory stocks, corporate payment details, generated invoices, and analytics reports from the entire system and database so you can start completely fresh. Staff and Admin login credentials will be preserved. This cannot be undone."
  confirmText="Yes, Delete All Data"
  onConfirm={confirmResetAllData}
  onClose={() => {
    isResetAllDataModalOpen = false;
  }}
/>

<!-- Security Login Credentials Management Modal -->
<StaffCredentialsModal
  open={isStaffCredentialsModalOpen}
  onClose={() => (isStaffCredentialsModalOpen = false)}
  {onShowToast}
  {onAdminSaved}
/>

