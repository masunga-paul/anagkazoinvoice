<script lang="ts">
  import RevenueChart from "./RevenueChart.svelte";
  import BrandShareChart from "./BrandShareChart.svelte";
  import PaymentStatusChart from "./PaymentStatusChart.svelte";
  import TopCustomersChart from "./TopCustomersChart.svelte";
  import TopProductsChart from "./TopProductsChart.svelte";
  import GeneratedInvoicesAudit, {
    type GeneratedInvoiceItem,
  } from "./GeneratedInvoicesAudit.svelte";
  import type { Customer } from "$lib/types/customer";
  import type { TyreProductStock } from "$lib/data/mockData";
  import type { MonthlyRevenue, BrandShare, TopProduct, InvoiceStatusMetric } from "$lib/types/report";
  import { formatTZS } from "$lib/utils/format";
  import {
    Download,
    Printer,
    TrendingUp,
    Calendar,
    Sparkles,
    FileSpreadsheet,
    Award,
    BarChart3,
    FileText,
    Users,
    Disc3,
    PieChart,
  } from "lucide-svelte";

  interface Props {
    customers?: Customer[];
    stocks?: TyreProductStock[];
    invoices?: GeneratedInvoiceItem[];
    onLoadInvoice?: (invoice: GeneratedInvoiceItem) => void;
    onDeleteInvoice?: (id: string) => void;
    onDeleteAllInvoices?: () => void;
    onShowToast: (
      message: string,
      type?: "success" | "error" | "info",
      action?: any,
      title?: string,
    ) => void;
  }

  let {
    customers = [],
    stocks = [],
    invoices = [],
    onLoadInvoice,
    onDeleteInvoice,
    onDeleteAllInvoices,
    onShowToast,
  }: Props = $props();

  // Helper to parse dates reliably
  function parseInvoiceDate(dStr?: string): Date | null {
    if (!dStr) return null;
    try {
      const parts = dStr.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const d = parseInt(parts[2], 10);
        const dateObj = new Date(y, m, d);
        if (!isNaN(dateObj.getTime())) return dateObj;
      }
      const dateObj = new Date(dStr);
      if (!isNaN(dateObj.getTime())) return dateObj;
    } catch {}
    return null;
  }

  // Dynamic calendar date helpers
  const now = new Date();
  const currentMonthIdx = now.getMonth();
  const currentYear = now.getFullYear();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const shortMonthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];

  const currentMonthName = monthNames[currentMonthIdx];
  const prevMonthDate = new Date(currentYear, currentMonthIdx - 1, 1);
  const prevMonthName = monthNames[prevMonthDate.getMonth()];
  const prevMonthYear = prevMonthDate.getFullYear();

  const thisMonthLabel = `This Month (${currentMonthName} ${currentYear})`;
  const lastMonthLabel = `Last Month (${prevMonthName} ${prevMonthYear})`;

  const timeframes = [
    thisMonthLabel,
    lastMonthLabel,
    "Last 3 Months (Quarter)",
    "Last 6 Months",
    "Last 12 Months",
    `Year-to-Date (${currentYear})`,
    "All Time"
  ];

  let selectedTimeframe = $state("Last 12 Months");
  let activeReportSubTab = $state<
    "all" | "customers" | "products" | "invoices"
  >("all");

  // Dynamic filter for active invoices based on timeframe dropdown
  const filteredInvoices = $derived.by<GeneratedInvoiceItem[]>(() => {
    if (!invoices || invoices.length === 0) return [];
    if (selectedTimeframe === "All Time") return invoices;

    const today = new Date();
    return invoices.filter((inv) => {
      const d = parseInvoiceDate(inv.date) || parseInvoiceDate(inv.createdAt);
      if (!d) return true;

      if (selectedTimeframe === thisMonthLabel) {
        return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
      }
      if (selectedTimeframe === lastMonthLabel) {
        return d.getMonth() === prevMonthDate.getMonth() && d.getFullYear() === prevMonthDate.getFullYear();
      }
      if (selectedTimeframe === "Last 3 Months (Quarter)") {
        const cutoff = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
        return d >= cutoff;
      }
      if (selectedTimeframe === "Last 6 Months") {
        const cutoff = new Date(today.getTime() - 180 * 24 * 60 * 60 * 1000);
        return d >= cutoff;
      }
      if (selectedTimeframe === "Last 12 Months") {
        const cutoff = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
        return d >= cutoff;
      }
      if (selectedTimeframe.startsWith("Year-to-Date")) {
        return d.getFullYear() === today.getFullYear();
      }
      return true;
    });
  });

  // Dynamic KPI calculations from filtered invoices
  const totalInvoicedRevenue = $derived(
    filteredInvoices.reduce((acc, inv) => acc + (Number(inv.amount) || 0), 0)
  );

  const totalPaidRevenue = $derived(
    filteredInvoices
      .filter((i) => i.status === "Paid")
      .reduce((acc, inv) => acc + (Number(inv.amount) || 0), 0)
  );

  const totalVATCollected = $derived(
    Math.round((totalInvoicedRevenue * 0.18) / 1.18)
  );

  const paidInvoicesCount = $derived(
    filteredInvoices.filter((i) => i.status === "Paid").length
  );

  const settlementRate = $derived(
    filteredInvoices.length > 0
      ? ((paidInvoicesCount / filteredInvoices.length) * 100).toFixed(1)
      : "0.0"
  );

  const avgPerBill = $derived(
    filteredInvoices.length > 0
      ? Math.round(totalInvoicedRevenue / filteredInvoices.length)
      : 0
  );

  // Dynamic Monthly Revenue Data derived from Invoices & active timeframe
  const monthlyRevenueData = $derived.by<MonthlyRevenue[]>(() => {
    // Generate the appropriate monthly buckets depending on the selected timeframe
    const buckets: { month: string; shortMonth: string; targetMonth: number; targetYear: number }[] = [];
    const today = new Date();

    let countMonths = 12;
    if (selectedTimeframe === "Last 3 Months (Quarter)") countMonths = 3;
    else if (selectedTimeframe === "Last 6 Months") countMonths = 6;
    else if (selectedTimeframe === "Last 12 Months" || selectedTimeframe === "All Time") countMonths = 12;
    else if (selectedTimeframe.startsWith("Year-to-Date")) countMonths = today.getMonth() + 1;
    else if (selectedTimeframe === thisMonthLabel || selectedTimeframe === lastMonthLabel) countMonths = 1;

    if (countMonths === 1) {
      const targetM = selectedTimeframe === lastMonthLabel ? prevMonthDate.getMonth() : today.getMonth();
      const targetY = selectedTimeframe === lastMonthLabel ? prevMonthDate.getFullYear() : today.getFullYear();
      buckets.push({
        month: `${monthNames[targetM]} ${targetY}`,
        shortMonth: shortMonthNames[targetM],
        targetMonth: targetM,
        targetYear: targetY
      });
    } else {
      for (let i = countMonths - 1; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const m = d.getMonth();
        const y = d.getFullYear();
        buckets.push({
          month: `${shortMonthNames[m]} ${y}`,
          shortMonth: shortMonthNames[m],
          targetMonth: m,
          targetYear: y
        });
      }
    }

    return buckets.map((b) => {
      const matched = filteredInvoices.filter((inv) => {
        const d = parseInvoiceDate(inv.date) || parseInvoiceDate(inv.createdAt);
        if (!d) return false;
        return d.getMonth() === b.targetMonth && d.getFullYear() === b.targetYear;
      });
      const rev = matched.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
      return {
        month: b.month,
        shortMonth: b.shortMonth,
        invoicesCount: matched.length,
        revenue: rev,
        target: Math.round(rev > 0 ? rev * 1.15 : 0)
      };
    });
  });

  // Dynamic Top Products Data derived from filtered Invoices
  const topProductsData = $derived.by<TopProduct[]>(() => {
    if (filteredInvoices.length === 0) return [];
    const productMap = new Map<
      string,
      { name: string; unitsSold: number; revenueTZS: number; category: string; trend: string }
    >();

    for (const inv of filteredInvoices) {
      if (inv.items && Array.isArray(inv.items)) {
        for (const item of inv.items) {
          if (!item.description || !item.description.trim()) continue;
          const key = item.description.trim();
          const existing = productMap.get(key) || {
            name: key,
            unitsSold: 0,
            revenueTZS: 0,
            category: "Commercial Radial",
            trend: "+12%"
          };
          existing.unitsSold += Number(item.qty) || 1;
          existing.revenueTZS += (Number(item.qty) || 1) * (Number(item.unitPrice) || 0);
          productMap.set(key, existing);
        }
      }
    }
    return Array.from(productMap.values())
      .sort((a, b) => b.revenueTZS - a.revenueTZS)
      .slice(0, 5);
  });

  // Dynamic Brand Share Data derived from filtered Invoices
  const brandShareData = $derived.by<BrandShare[]>(() => {
    if (filteredInvoices.length === 0) return [];
    const brandColors: Record<string, string> = {
      Michelin: "#0f2038",
      Pirelli: "#0284c7",
      Bridgestone: "#d97706",
      Continental: "#475569",
      Dunlop: "#94a3b8",
      Sailun: "#10b981",
    };

    const brandMap = new Map<
      string,
      { brand: string; unitsSold: number; revenueTZS: number }
    >();

    for (const inv of filteredInvoices) {
      if (inv.items && Array.isArray(inv.items)) {
        for (const item of inv.items) {
          const desc = item.description || "";
          let detectedBrand = "Other";
          for (const b of [
            "Michelin",
            "Pirelli",
            "Bridgestone",
            "Continental",
            "Dunlop",
            "Sailun",
            "Yokohama",
            "Goodyear",
          ]) {
            if (desc.toLowerCase().includes(b.toLowerCase())) {
              detectedBrand = b;
              break;
            }
          }
          const existing = brandMap.get(detectedBrand) || {
            brand: detectedBrand,
            unitsSold: 0,
            revenueTZS: 0,
          };
          existing.unitsSold += Number(item.qty) || 1;
          existing.revenueTZS +=
            (Number(item.qty) || 1) * (Number(item.unitPrice) || 0);
          brandMap.set(detectedBrand, existing);
        }
      }
    }

    const totalUnits =
      Array.from(brandMap.values()).reduce((sum, b) => sum + b.unitsSold, 0) || 1;

    return Array.from(brandMap.values())
      .map((b) => ({
        brand: b.brand,
        percentage: Math.round((b.unitsSold / totalUnits) * 100),
        unitsSold: b.unitsSold,
        revenueTZS: b.revenueTZS,
        color: brandColors[b.brand] || "#64748b",
      }))
      .sort((a, b) => b.unitsSold - a.unitsSold);
  });

  // Dynamic Payment Status Metrics derived from filtered Invoices
  const paymentStatusData = $derived.by<InvoiceStatusMetric[]>(() => {
    const total =
      filteredInvoices.reduce((sum, i) => sum + (Number(i.amount) || 0), 0) || 1;
    const paidInvs = filteredInvoices.filter((i) => i.status === "Paid");
    const pendingInvs = filteredInvoices.filter((i) => i.status === "Pending");
    const overdueInvs = filteredInvoices.filter((i) => i.status === "Overdue");

    const paidAmt = paidInvs.reduce(
      (sum, i) => sum + (Number(i.amount) || 0),
      0
    );
    const pendingAmt = pendingInvs.reduce(
      (sum, i) => sum + (Number(i.amount) || 0),
      0
    );
    const overdueAmt = overdueInvs.reduce(
      (sum, i) => sum + (Number(i.amount) || 0),
      0
    );

    if (filteredInvoices.length === 0) {
      return [
        {
          status: "Paid",
          percentage: 0,
          totalAmountTZS: 0,
          count: 0,
          color: "#0f2038",
        },
        {
          status: "Pending",
          percentage: 0,
          totalAmountTZS: 0,
          count: 0,
          color: "#d97706",
        },
        {
          status: "Overdue",
          percentage: 0,
          totalAmountTZS: 0,
          count: 0,
          color: "#e11d48",
        },
      ];
    }

    return [
      {
        status: "Paid",
        percentage: Math.round((paidAmt / total) * 100),
        totalAmountTZS: paidAmt,
        count: paidInvs.length,
        color: "#0f2038",
      },
      {
        status: "Pending",
        percentage: Math.round((pendingAmt / total) * 100),
        totalAmountTZS: pendingAmt,
        count: pendingInvs.length,
        color: "#d97706",
      },
      {
        status: "Overdue",
        percentage: Math.round((overdueAmt / total) * 100),
        totalAmountTZS: overdueAmt,
        count: overdueInvs.length,
        color: "#e11d48",
      },
    ];
  });

  // Dynamic Top Customers calculated from filtered invoices
  const dynamicCustomersForReports = $derived.by<Customer[]>(() => {
    if (customers.length === 0) return [];
    if (filteredInvoices.length === 0) {
      return customers.map((c) => ({ ...c, totalPurchases: 0, invoicesCount: 0 }));
    }
    return customers.map((c) => {
      const cName = c.name.toLowerCase().trim();
      const cComp = (c.companyName || '').toLowerCase().trim();
      const matched = filteredInvoices.filter((inv) => {
        const invCust = (inv.customer || '').toLowerCase().trim();
        return invCust === cName || (cComp && invCust === cComp) || invCust.includes(cName) || (cComp && invCust.includes(cComp));
      });
      const periodPurchases = matched.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0);
      return {
        ...c,
        totalPurchases: periodPurchases,
        invoicesCount: matched.length
      };
    });
  });

  function handleExportCSV() {
    // CSV generation & download
    const csvContent =
      "Month,InvoicesCount,RevenueTZS,TargetTZS\n" +
      monthlyRevenueData
        .map(
          (r) => `${r.month},${r.invoicesCount},${r.revenue},${r.target}`
        )
        .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `anagkazo_financial_report_${selectedTimeframe.replace(/\s+/g, '_').toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onShowToast?.("Exported financial reports CSV successfully.");
  }

  function handlePrintReport() {
    window.print();
  }
</script>

<div class="space-y-6">
  <!-- Reports Header & Export Toolbar -->
  <div
    class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
  >
    <div>
      <h1
        class="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900"
      >
        Executive Financial & Tyre Sales Reports
      </h1>
      <p class="text-xs sm:text-sm text-slate-500 mt-0.5">
        Executive performance metrics, monthly invoicing trends, top buying
        customers, and top selling tyre models.
      </p>
    </div>

    <!-- Action Controls -->
    <div class="flex flex-wrap items-center gap-2.5">
      <!-- Timeframe Selector -->
      <select
        bind:value={selectedTimeframe}
        class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs focus:border-navy-900 focus:outline-none cursor-pointer"
      >
        {#each timeframes as tf}
          <option value={tf}>{tf}</option>
        {/each}
      </select>

      <!-- Print Report -->
      <button
        type="button"
        onclick={handlePrintReport}
        class="inline-flex items-center gap-1.5 rounded-xl bg-navy-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-navy-800 transition cursor-pointer"
      >
        <Printer class="h-4 w-4" />
        <span>Print Report</span>
      </button>
    </div>
  </div>

  <!-- 4 Key Reporting Summary KPI Cards (Calculated Dynamically from Real System Data) -->
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <div
      class="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs"
    >
      <span
        class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1"
      >
        Total Invoiced Revenue
      </span>
      <div class="text-xl sm:text-2xl font-extrabold text-navy-900 font-mono">
        {formatTZS(totalInvoicedRevenue)}
      </div>
      <div
        class="mt-2 flex items-center gap-1 text-[11px] text-navy-800 font-semibold"
      >
        <TrendingUp class="h-3.5 w-3.5 text-sky-600" />
        <span>{formatTZS(totalPaidRevenue)} collected</span>
      </div>
    </div>

    <div
      class="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs"
    >
      <span
        class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1"
      >
        Tanzania VAT (18%) Collected
      </span>
      <div class="text-xl sm:text-2xl font-extrabold text-navy-900 font-mono">
        {formatTZS(totalVATCollected)}
      </div>
      <div class="mt-2 text-[11px] text-slate-500">
        TIN 104-982-415 compliant
      </div>
    </div>

    <div
      class="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs"
    >
      <span
        class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1"
      >
        Total Generated Invoices
      </span>
      <div class="text-xl sm:text-2xl font-extrabold text-navy-900 font-mono">
        {filteredInvoices.length} Invoices
      </div>
      <div class="mt-2 text-[11px] text-slate-500">
        Avg {formatTZS(avgPerBill)} per fleet bill
      </div>
    </div>

    <div
      class="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs"
    >
      <span
        class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1"
      >
        Fleet Payment Settlement Rate
      </span>
      <div class="text-xl sm:text-2xl font-extrabold text-navy-900 font-mono">
        {settlementRate}%
      </div>
      <div class="mt-2 text-[11px] text-slate-500">
        {paidInvoicesCount} of {filteredInvoices.length} settled
      </div>
    </div>
  </div>

  <!-- Report Sub-Navigation Tabs -->
  <div class="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
    <button
      type="button"
      onclick={() => (activeReportSubTab = "all")}
      class="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer {activeReportSubTab ===
      'all'
        ? 'bg-navy-900 text-white shadow-xs'
        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}"
    >
      <BarChart3 class="h-3.5 w-3.5" />
      <span>All Reports & Analytics</span>
    </button>

    <button
      type="button"
      onclick={() => (activeReportSubTab = "customers")}
      class="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer {activeReportSubTab ===
      'customers'
        ? 'bg-navy-900 text-white shadow-xs'
        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}"
    >
      <Users class="h-3.5 w-3.5" />
      <span>Top Buying Customers Chart ({dynamicCustomersForReports.length})</span>
    </button>

    <button
      type="button"
      onclick={() => (activeReportSubTab = "products")}
      class="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer {activeReportSubTab ===
      'products'
        ? 'bg-navy-900 text-white shadow-xs'
        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}"
    >
      <Disc3 class="h-3.5 w-3.5" />
      <span>Top Sold Products Chart ({topProductsData.length})</span>
    </button>

    <button
      type="button"
      onclick={() => (activeReportSubTab = "invoices")}
      class="flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition cursor-pointer {activeReportSubTab ===
      'invoices'
        ? 'bg-navy-900 text-white shadow-xs'
        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}"
    >
      <FileText class="h-3.5 w-3.5" />
      <span>Total Generated Invoices ({filteredInvoices.length})</span>
    </button>
  </div>

  <!-- Report Views -->
  {#if activeReportSubTab === "all" || activeReportSubTab === "customers"}
    <!-- Top Buying Customers Ranking Chart -->
    <TopCustomersChart customers={dynamicCustomersForReports} />
  {/if}

  {#if activeReportSubTab === "all" || activeReportSubTab === "products"}
    <!-- Top Sold Products Chart -->
    <TopProductsChart products={topProductsData} />
  {/if}

  {#if activeReportSubTab === "all"}
    <!-- Main Monthly Invoicing Chart -->
    <RevenueChart data={monthlyRevenueData} />

    <!-- 2-Column Split: Brand Share Donut & Invoice Aging Status -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
      <BrandShareChart brands={brandShareData} />
      <PaymentStatusChart metrics={paymentStatusData} />
    </div>
  {/if}

  {#if activeReportSubTab === "all" || activeReportSubTab === "invoices"}
    <!-- Total Generated Invoices Audit & History Ledger -->
    <GeneratedInvoicesAudit
      invoices={filteredInvoices}
      {onLoadInvoice}
      {onDeleteInvoice}
      {onDeleteAllInvoices}
      {onShowToast}
    />
  {/if}
</div>
