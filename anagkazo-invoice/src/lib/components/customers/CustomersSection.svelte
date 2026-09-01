<script lang="ts">
  import type { Customer, CustomerType } from "$lib/types/customer";
  import type { UserRole } from "$lib/types/auth";
  import type { GeneratedInvoiceItem } from "$lib/components/reports/GeneratedInvoicesAudit.svelte";
  import { MOCK_CUSTOMERS } from "$lib/data/mockData";
  import { formatTZS } from "$lib/utils/format";
  import AddCustomerModal from "./AddCustomerModal.svelte";
  import DeleteConfirmModal from "../common/DeleteConfirmModal.svelte";
  import {
    Search,
    UserPlus,
    Users,
    Building2,
    Phone,
    Mail,
    MapPin,
    FileText,
    CreditCard,
    PlusCircle,
    ArrowRight,
    ShieldCheck,
    Trash2,
    Pencil
  } from "lucide-svelte";

  interface Props {
    userRole?: UserRole | null;
    customers?: Customer[];
    invoices?: GeneratedInvoiceItem[];
    onSelectCustomerForInvoice: (customer: Customer) => void;
    onAddCustomer?: (customer: Customer) => void;
    onUpdateCustomer?: (customer: Customer) => void;
    onDeleteCustomer?: (customerId: string) => void;
    onDeleteAllCustomers?: () => void;
    onShowToast?: (message: string, type?: 'success' | 'error' | 'info', action?: any, title?: string) => void;
  }

  let {
    userRole = null,
    customers = $bindable([]),
    invoices = [],
    onSelectCustomerForInvoice,
    onAddCustomer,
    onUpdateCustomer,
    onDeleteCustomer,
    onDeleteAllCustomers,
    onShowToast,
  }: Props = $props();

  let searchQuery = $state("");
  let selectedCategory = $state<string>("All");
  let isAddModalOpen = $state(false);
  let customerToEdit = $state<Customer | null>(null);
  let isDeleteModalOpen = $state(false);
  let isDeleteAllModalOpen = $state(false);
  let pendingDeleteCustomer = $state<Customer | null>(null);

  const categories = [
    "All",
    "Fleet & Logistics",
    "Corporate",
    "Retail / Private",
    "Government / NGO",
  ];

  // Filtered customers
  const filteredCustomers = $derived(
    customers.filter((cust) => {
      const matchesCategory =
        selectedCategory === "All" || cust.customerType === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        cust.name.toLowerCase().includes(q) ||
        cust.companyName?.toLowerCase().includes(q) ||
        cust.contactPerson.toLowerCase().includes(q) ||
        cust.phone.toLowerCase().includes(q) ||
        cust.city.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    }),
  );

  // Total active fleet clients
  const totalClientsCount = $derived(customers.length);

  // Total outstanding receivables
  const totalReceivables = $derived(
    customers.reduce((acc, c) => acc + (c.outstandingBalance || 0), 0),
  );

  // Customers who have at least one active invoice or lifetime billed purchases
  const invoicedCustomersCount = $derived(
    customers.filter((c) => {
      const cName = (c.name || '').toLowerCase().trim();
      const compName = (c.companyName || '').toLowerCase().trim();
      const hasInvoice = invoices.some((inv) => {
        const invCust = (inv.customer || '').toLowerCase().trim();
        return (cName && invCust === cName) || (compName && invCust === compName) || (compName && invCust.includes(compName));
      });
      return hasInvoice || (c.totalPurchases && c.totalPurchases > 0) || (c.outstandingBalance && c.outstandingBalance > 0);
    }).length
  );

  // Real-time Fleet Invoicing Rate percentage
  const fleetInvoicingRate = $derived.by(() => {
    if (totalClientsCount === 0 || invoices.length === 0) {
      return '0.0%';
    }
    const rate = (invoicedCustomersCount / totalClientsCount) * 100;
    return `${Math.min(100, Math.max(0, rate)).toFixed(1)}%`;
  });

  // Dynamic status subtitle for the Fleet Invoicing Rate card
  const fleetInvoicingSubtitle = $derived.by(() => {
    if (totalClientsCount === 0 && invoices.length === 0) {
      return 'No active accounts or invoices';
    }
    if (invoices.length === 0) {
      return 'No invoices generated yet';
    }
    if (totalClientsCount === 0) {
      return `${invoices.length} active ${invoices.length === 1 ? 'invoice' : 'invoices'} generated`;
    }
    return `${invoicedCustomersCount} of ${totalClientsCount} accounts billed (${invoices.length} ${invoices.length === 1 ? 'invoice' : 'invoices'})`;
  });

  function handleAddCustomer(newCust: Customer) {
    customers = [newCust, ...customers];
    onAddCustomer?.(newCust);
    onShowToast?.(
      `Customer "${newCust.companyName || newCust.name}" has been created and synced with directory.`,
      'success',
      'CREATE',
      'Customer Created'
    );
  }

  function handleUpdateCustomer(updatedCust: Customer) {
    customers = customers.map((c) => (c.id === updatedCust.id ? updatedCust : c));
    onUpdateCustomer?.(updatedCust);
    onShowToast?.(
      `Customer "${updatedCust.companyName || updatedCust.name}" updated & synchronized across system.`,
      'success',
      'EDIT',
      'Customer Updated'
    );
    customerToEdit = null;
  }

  function promptEditCustomer(cust: Customer) {
    customerToEdit = cust;
    isAddModalOpen = true;
  }

	function promptDeleteCustomer(cust: Customer) {
		if (userRole !== 'admin') {
			onShowToast?.(
				'Only administrators are authorized to delete customer records.',
				'error',
				'INFO',
				'Access Restricted'
			);
			return;
		}
		pendingDeleteCustomer = cust;
		isDeleteModalOpen = true;
	}

	function confirmDeleteCustomer() {
		if (!pendingDeleteCustomer || userRole !== 'admin') return;
		const cust = pendingDeleteCustomer;
		customers = customers.filter((c) => c.id !== cust.id);
		onDeleteCustomer?.(cust.id);
		onShowToast?.(
			`Customer "${cust.companyName || cust.name}" removed from directory.`,
			'info',
			'DELETE',
			'Customer Deleted'
		);
		pendingDeleteCustomer = null;
	}

	function confirmDeleteAllCustomers() {
		if (userRole !== 'admin') return;
		customers = [];
		onDeleteAllCustomers?.();
		onShowToast?.(
			'All customer records have been deleted from directory.',
			'info',
			'DELETE',
			'Customers Cleared'
		);
		isDeleteAllModalOpen = false;
	}
</script>

<div class="space-y-6">
  <!-- Top Customer Header & Metrics -->
  <div
    class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
  >
    <div>
      <h1
        class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900"
      >
        Customer Directory
      </h1>
      <p class="text-xs sm:text-sm text-slate-500 mt-0.5">
        Manage commercial fleet partners, logistics contracts, and billing
        terms.
      </p>
    </div>

    <div class="flex items-center gap-2 sm:gap-3">
      {#if userRole === "admin"}
        {#if customers.length > 0}
          <button
            type="button"
            onclick={() => (isDeleteAllModalOpen = true)}
            class="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-bold text-rose-600 shadow-2xs transition hover:bg-rose-100 hover:text-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500/20 cursor-pointer"
            title="Delete all customer records"
          >
            <Trash2 class="h-4 w-4" />
            <span>Delete All</span>
          </button>
        {/if}
        <button
          type="button"
          onclick={() => (isAddModalOpen = true)}
          class="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-900 cursor-pointer"
        >
          <UserPlus class="h-4 w-4 text-sky-400" />
          <span>Add Customer</span>
        </button>
      {/if}
    </div>
  </div>

  <!-- Summary KPI Bar (Admin Only) -->
  {#if userRole === "admin"}
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div
        class="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs"
      >
        <span
          class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1"
        >
          Total Active Clients
        </span>
        <div class="text-xl font-extrabold text-slate-900 font-mono">
          {customers.length} {customers.length === 1 ? 'Account' : 'Accounts'}
        </div>
        <span class="text-[11px] text-slate-500 mt-1 block"
          >{customers.length > 0 ? 'Dar es Salaam & Upcountry' : 'No active accounts'}</span
        >
      </div>

      <div
        class="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs"
      >
        <span
          class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1"
        >
          Total Receivables Outstanding
        </span>
        <div class="text-xl font-extrabold text-amber-600 font-mono">
          {formatTZS(totalReceivables)}
        </div>
        <span class="text-[11px] text-slate-500 mt-1 block"
          >{customers.length > 0 ? `Across ${customers.length} client ${customers.length === 1 ? 'account' : 'accounts'}` : 'No outstanding balances'}</span
        >
      </div>

      <div
        class="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs"
      >
        <span
          class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1"
        >
          Fleet Invoicing Rate
        </span>
        <div class="text-xl font-extrabold text-navy-900 font-mono">
          {fleetInvoicingRate} Active
        </div>
        <span class="text-[11px] text-slate-500 mt-1 block"
          >{fleetInvoicingSubtitle}</span
        >
      </div>
    </div>
  {/if}

  <!-- Filter Controls & Search -->
  <div
    class="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs space-y-4"
  >
    <div
      class="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
    >
      <!-- Search Bar -->
      <div class="relative w-full sm:w-80">
        <Search
          class="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
        />
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Search by company, name, phone..."
          class="w-full rounded-xl border border-slate-200 bg-slate-50/60 pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-900/10"
        />
      </div>

      <!-- Category Tabs -->
      <div
        class="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0"
      >
        {#each categories as cat}
          <button
            type="button"
            onclick={() => (selectedCategory = cat)}
            class="rounded-full px-3 py-1.5 text-xs font-semibold transition cursor-pointer {selectedCategory ===
            cat
              ? 'bg-navy-900 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-navy-900'}"
          >
            {cat}
          </button>
        {/each}
      </div>
    </div>

    <!-- Customers Table -->
    <div class="overflow-x-auto">
      <table class="w-full text-left text-xs sm:text-sm border-collapse">
        <thead>
          <tr
            class="border-b-2 border-slate-200 text-xs font-black uppercase tracking-wider text-slate-700 bg-slate-100/70"
          >
            <th class="py-3 px-3">Customer / Company</th>
            <th class="py-3 px-3">Contact & Phone</th>
            <th class="py-3 px-3">Account Type</th>
            <th class="py-3 px-3 text-right">Outstanding (TZS)</th>
            <th class="py-3 px-3 text-center">Payment Term</th>
            <th class="py-3 px-3 text-center">Status</th>
            <th class="py-3 px-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          {#if filteredCustomers.length === 0}
            <tr>
              <td
                colspan="7"
                class="py-8 text-center text-slate-500 text-xs sm:text-sm italic font-medium"
              >
                No customers found matching "{searchQuery}".
              </td>
            </tr>
          {:else}
            {#each filteredCustomers as customer (customer.id)}
              <tr class="hover:bg-slate-50/90 transition">
                <!-- Customer Name & Address -->
                <td class="py-3.5 px-3">
                  <div class="font-black text-slate-950 text-xs sm:text-sm">
                    {customer.name}
                  </div>
                  <div
                    class="flex items-center gap-1 text-xs text-slate-600 font-medium mt-0.5"
                  >
                    <MapPin class="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span class="truncate max-w-[220px]"
                      >{customer.address}</span
                    >
                  </div>
                </td>

                <!-- Contact Person & Phone -->
                <td class="py-3.5 px-3">
                  <div class="font-bold text-slate-900 text-xs sm:text-sm">
                    {customer.contactPerson}
                  </div>
                  <div class="text-xs text-slate-700 font-mono font-semibold mt-0.5">
                    {customer.phone}
                  </div>
                </td>

                <!-- Category Pill -->
                <td class="py-3.5 px-3">
                  <span
                    class="inline-flex items-center rounded-lg bg-slate-200/80 px-2.5 py-0.5 text-xs font-bold text-slate-800"
                  >
                    {customer.customerType}
                  </span>
                </td>

                <!-- Outstanding Balance -->
                <td class="py-3.5 px-3 text-right font-mono">
                  {#if customer.outstandingBalance > 0}
                    <span class="font-black text-amber-700 text-xs sm:text-sm">
                      {formatTZS(customer.outstandingBalance)}
                    </span>
                  {:else}
                    <span class="font-black text-emerald-800 text-xs sm:text-sm">
                      {formatTZS(customer.totalPurchases || 0)}
                    </span>
                  {/if}
                </td>

                <!-- Payment Term -->
                <td class="py-3.5 px-3 text-center">
                  <span
                    class="font-mono text-slate-800 font-bold text-xs sm:text-sm"
                  >
                    {customer.paymentTerms}
                  </span>
                </td>

                <!-- Status -->
                <td class="py-3.5 px-3 text-center">
                  <span
                    class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-extrabold {customer.status ===
                    'Paid'
                      ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-700/30'
                      : customer.status === 'Pending'
                      ? 'bg-amber-50 text-amber-800 ring-1 ring-amber-700/30'
                      : 'bg-rose-50 text-rose-800 ring-1 ring-rose-600/30'}"
                  >
                    {customer.status}
                  </span>
                </td>

                <!-- 1-Click Invoice, Edit & Delete Actions -->
                <td class="py-3.5 px-3 text-right">
                  <div class="inline-flex items-center gap-1.5 justify-end">
                    <button
                      type="button"
                      onclick={() => onSelectCustomerForInvoice(customer)}
                      class="inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-3 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-navy-800 transition cursor-pointer"
                      title="Create Invoice for this customer"
                    >
                      <FileText class="h-3.5 w-3.5 text-sky-400" />
                      <span>Invoice</span>
                    </button>
                    {#if userRole === 'admin'}
                      <button
                        type="button"
                        onclick={() => promptEditCustomer(customer)}
                        class="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-navy-900 hover:bg-slate-100 hover:border-slate-300 transition cursor-pointer"
                        title="Edit customer account details"
                      >
                        <Pencil class="h-3.5 w-3.5" />
                      </button>
                    {/if}
                    {#if userRole === 'admin' && onDeleteCustomer}
                      <button
                        type="button"
                        onclick={() => promptDeleteCustomer(customer)}
                        class="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition cursor-pointer"
                        title="Delete customer from directory"
                      >
                        <Trash2 class="h-3.5 w-3.5" />
                      </button>
                    {/if}
                  </div>
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>
  </div>
</div>

<!-- Add / Edit Customer Modal Dialog -->
<AddCustomerModal
  open={isAddModalOpen}
  customerToEdit={customerToEdit}
  onClose={() => {
    isAddModalOpen = false;
    customerToEdit = null;
  }}
  onAddCustomer={handleAddCustomer}
  onUpdateCustomer={handleUpdateCustomer}
/>

<!-- Delete Customer Confirmation Modal -->
<DeleteConfirmModal
  open={isDeleteModalOpen}
  title="Are you sure you want to delete this customer?"
  itemType="Customer Account"
  itemName={pendingDeleteCustomer ? (pendingDeleteCustomer.companyName || pendingDeleteCustomer.name) : undefined}
  description="This will permanently delete this client account, contract terms, and records from the active customer directory."
  confirmText="Yes, Delete Customer"
  onConfirm={confirmDeleteCustomer}
  onClose={() => isDeleteModalOpen = false}
/>

<!-- Delete All Customers Confirmation Modal -->
<DeleteConfirmModal
  open={isDeleteAllModalOpen}
  title="Delete ALL Customer Records?"
  itemType="All Customers"
  itemName={`${customers.length} Fleet Customer Accounts (${formatTZS(totalReceivables)} Outstanding)`}
  description="This will permanently delete all customer accounts, commercial billing terms, contact records, and profiles from the active directory. This action cannot be undone."
  confirmText="Yes, Delete All Customers"
  onConfirm={confirmDeleteAllCustomers}
  onClose={() => isDeleteAllModalOpen = false}
/>
