<script lang="ts">
  import type { InvoiceFormData } from "$lib/types/invoice";
  import {
    COMPANY_INFO,
    formatDisplayDate,
    formatNumber,
    formatTZS,
  } from "$lib/utils/format";
  import {
    Disc3,
    ShieldCheck,
    Building2,
    CreditCard,
    Download,
    Printer,
    Loader2,
  } from "lucide-svelte";
  import logoImg from "$lib/assets/logo.png";
  import stampImg from "$lib/assets/stamp.png";
  import { downloadInvoicePDF } from "$lib/utils/pdf";

  interface Props {
    form: InvoiceFormData;
    onExportPDF?: () => Promise<void> | void;
    onPrint?: () => void;
  }

  let { form, onExportPDF, onPrint }: Props = $props();

  let isDownloading = $state(false);

  async function handleDownloadPdf() {
    if (isDownloading) return;
    isDownloading = true;
    try {
      if (onExportPDF) {
        await onExportPDF();
      } else {
        await downloadInvoicePDF(
          "invoice-printable-area",
          `Invoice-${form.invoiceNumber || "INV-2026"}.pdf`,
        );
      }
    } finally {
      isDownloading = false;
    }
  }

  function handleTriggerPrint() {
    if (onPrint) {
      onPrint();
    } else if (typeof window !== "undefined") {
      window.print();
    }
  }

  // Derived calculations for invoice
  const subtotal = $derived(
    form.items.reduce(
      (acc, item) =>
        acc + (Number(item.qty) || 0) * (Number(item.unitPrice) || 0),
      0,
    ),
  );

  const discountAmount = $derived(Number(form.discount) || 0);

  const taxRate = $derived(Number(form.taxRate) || 0);

  const taxAmount = $derived(subtotal * (taxRate / 100));

  const grandTotal = $derived(Math.max(0, subtotal + taxAmount - discountAmount));

  // Dynamic receiving payment detail assigned to this invoice
  const activePayment = $derived.by(() => {
    if (form.paymentDetail) return form.paymentDetail;
    return {
      bankName: COMPANY_INFO.bankName,
      accountName: COMPANY_INFO.accountName,
      accountNumber: COMPANY_INFO.accountNumber,
      swiftCode: COMPANY_INFO.swiftCode,
      branch: COMPANY_INFO.branch,
      currency: "TZS" as const,
      accountType: "Corporate Bank" as const,
    };
  });
</script>

<div
  class="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 sm:p-6 lg:p-7 shadow-xs"
>
  <!-- Preview Panel Header -->
  <div class="mb-4 flex items-center justify-between no-print">
    <div class="flex items-center gap-2">
      <span class="inline-flex h-2 w-2 rounded-full bg-navy-900"></span>
      <h2 class="text-base font-bold text-navy-900">Preview</h2>
      <span
        class="rounded-full bg-slate-200/80 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600"
      >
        A4 Document
      </span>
    </div>

    <!-- Action Buttons: Download PDF & Print -->
    <div class="flex items-center gap-2">
      <!-- Download PDF Button -->
      <button
        type="button"
        onclick={handleDownloadPdf}
        disabled={isDownloading}
        class="inline-flex items-center gap-1.5 rounded-xl bg-navy-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-900/20 active:scale-95 disabled:opacity-75 cursor-pointer"
        title="Download invoice PDF to your device"
      >
        {#if isDownloading}
          <Loader2 class="h-3.5 w-3.5 text-sky-400 animate-spin" />
          <span>Downloading...</span>
        {:else}
          <Download class="h-3.5 w-3.5 text-sky-400" />
          <span>Download PDF</span>
        {/if}
      </button>

      <!-- Print Button -->
      <button
        type="button"
        onclick={handleTriggerPrint}
        class="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900/10 active:scale-95 cursor-pointer"
        title="Print physical invoice"
      >
        <Printer class="h-3.5 w-3.5 text-slate-600" />
        <span>Print</span>
      </button>
    </div>
  </div>

  <!-- Physical Paper Simulation Container -->
  <div
    id="invoice-printable-area"
    class="invoice-paper relative overflow-hidden mx-auto w-full max-w-[620px] rounded-xl border border-slate-200/80 bg-white p-4 sm:p-8 md:p-10 shadow-md transition-all duration-300 text-slate-800"
  >
    <!-- Subtle Center Watermark Logo -->
    <div
      class="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden select-none z-0"
    >
      <img
        src={logoImg}
        alt=""
        class="w-80 sm:w-96 max-w-full opacity-[0.045] object-contain rotate-[-12deg]"
      />
    </div>

    <!-- Paper Header: Brand Logo & Title -->
    <div
      class="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between border-b border-slate-200 pb-5 gap-3.5 sm:gap-0"
    >
      <div class="flex items-center gap-3 sm:gap-3.5">
        <img
          src={logoImg}
          alt="Anagkazo Autoparts"
          class="h-11 sm:h-15 w-auto object-contain max-w-[130px] sm:max-w-[170px]"
        />
        <div class="border-l-2 border-slate-300 pl-2.5 sm:pl-3">
          <h3
            class="text-xs sm:text-base font-extrabold tracking-tight text-navy-950 leading-tight"
          >
            {COMPANY_INFO.name}
          </h3>
          <p class="text-[11px] sm:text-xs font-semibold text-slate-600">
            {COMPANY_INFO.tagline}
          </p>
          <p class="text-[11px] sm:text-xs text-slate-600 font-mono font-medium mt-0.5">
            TIN: <strong class="text-slate-900">{COMPANY_INFO.tin}</strong>
            &bull; TEL: <strong class="text-slate-900">0789345040</strong>
          </p>
        </div>
      </div>

      <div class="text-left sm:text-right flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
        <span
          class="inline-block rounded-md bg-navy-900 px-3.5 py-1 text-xs sm:text-sm font-black text-white tracking-wider"
        >
          INVOICE
        </span>
        <div
          class="text-xs sm:text-sm font-extrabold text-slate-900 sm:mt-1.5 font-mono"
        >
          #{form.invoiceNumber || "INV-2026-0842"}
        </div>
      </div>
    </div>

    <!-- Meta Grid (Issue Date, Due Date, Payment Terms) -->
    <div class="grid grid-cols-3 gap-2 sm:gap-3 border-b border-slate-200 py-3 sm:py-4 text-xs">
      <div>
        <span
          class="block text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider"
        >
          Issue Date
        </span>
        <span
          class="font-extrabold text-slate-900 text-[11px] sm:text-sm mt-0.5 block"
        >
          {formatDisplayDate(form.issueDate)}
        </span>
      </div>
      <div>
        <span
          class="block text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider"
        >
          Due Date
        </span>
        <span
          class="font-extrabold text-slate-900 text-[11px] sm:text-sm mt-0.5 block"
        >
          {formatDisplayDate(form.dueDate)}
        </span>
      </div>
      <div>
        <span
          class="block text-[10px] sm:text-xs font-bold text-slate-600 uppercase tracking-wider"
        >
          Terms
        </span>
        <span
          class="font-extrabold text-slate-900 text-[11px] sm:text-sm mt-0.5 block"
        >
          {form.paymentTerms || "Net 30 Days"}
        </span>
      </div>
    </div>

    <!-- Bill Parties Grid (Billed By & Billed To) -->
    <div
      class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 border-b border-slate-200 py-4 text-xs"
    >
      <!-- Billed By -->
      <div>
        <span
          class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1"
        >
          Billed by
        </span>
        <div class="font-black text-slate-950 text-sm sm:text-base">
          {COMPANY_INFO.name}
        </div>
        <div
          class="text-slate-700 leading-relaxed text-xs sm:text-[13px] mt-0.5 font-medium"
        >
          {COMPANY_INFO.address}<br />
          {COMPANY_INFO.city}, {COMPANY_INFO.country}<br />
          <span class="text-slate-600 font-bold">TIN:</span>
          <span class="font-bold text-slate-900">{COMPANY_INFO.tin}</span>
          &bull; <span class="text-slate-600 font-bold">VRN:</span>
          <span class="font-bold text-slate-900">{COMPANY_INFO.vrn}</span>
        </div>
      </div>

      <!-- Billed To -->
      <div>
        <span
          class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1"
        >
          Billed to
        </span>
        <div class="font-black text-slate-950 text-sm sm:text-base">
          {form.customerName || "Customer Name"}
        </div>
        <div
          class="text-slate-700 leading-relaxed text-xs sm:text-[13px] mt-0.5 whitespace-pre-line font-medium"
        >
          {form.billingAddress || "Samora Avenue, Dar es Salaam, Tanzania"}
        </div>
      </div>
    </div>

    <!-- Items Table -->
    <div class="py-4 overflow-x-auto">
      <table class="w-full text-left text-xs sm:text-sm border-collapse min-w-[340px]">
        <thead>
          <tr
            class="border-b-2 border-slate-300 text-xs font-black uppercase tracking-wider text-slate-700"
          >
            <th class="py-2.5 pr-2">Item</th>
            <th class="py-2.5 px-2 text-center">QTY</th>
            <th class="py-2.5 px-2 text-right">Cost</th>
            <th class="py-2.5 pl-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200">
          {#if form.items.length === 0}
            <tr>
              <td
                colspan="4"
                class="py-6 text-center text-slate-500 italic text-xs"
              >
                No line items added yet.
              </td>
            </tr>
          {:else}
            {#each form.items as item (item.id)}
              <tr class="text-slate-800">
                <td class="py-3 pr-2 align-top">
                  <span
                    class="font-bold text-slate-950 block text-xs sm:text-sm"
                  >
                    {item.description || "Untitled Tyre / Service"}
                  </span>
                </td>
                <td
                  class="py-3 px-2 text-center align-top text-slate-900 font-bold text-xs sm:text-sm"
                >
                  {item.qty || 1}
                </td>
                <td
                  class="py-3 px-2 text-right align-top text-slate-800 font-mono font-semibold text-xs sm:text-sm"
                >
                  {formatTZS(item.unitPrice)}
                </td>
                <td
                  class="py-3 pl-2 text-right align-top font-black text-navy-950 font-mono text-xs sm:text-sm"
                >
                  {formatTZS(
                    (Number(item.qty) || 0) * (Number(item.unitPrice) || 0),
                  )}
                </td>
              </tr>
            {/each}
          {/if}
        </tbody>
      </table>
    </div>

    <!-- Financials & Bank Details Grid -->
    <div
      class="border-t-2 border-slate-300 pt-4 grid grid-cols-1 sm:grid-cols-12 gap-5 text-xs sm:text-sm"
    >
      <!-- Bank Details (Left Side) -->
      <div
        class="sm:col-span-6 rounded-xl bg-slate-50 p-4 border border-slate-200 text-xs flex flex-col justify-between"
      >
        <div>
          <div
            class="flex items-center justify-between font-extrabold text-slate-900 mb-2"
          >
            <div class="flex items-center gap-1.5">
              <Building2 class="h-4 w-4 text-slate-700" />
              <span class="text-xs sm:text-sm">Payment Details</span>
            </div>
            <span
              class="rounded bg-navy-900 text-white font-mono text-[10px] font-bold px-2 py-0.5"
            >
              {activePayment.currency || "TZS"}
            </span>
          </div>
          <div class="space-y-1 text-slate-700 text-xs sm:text-[13px]">
            <div class="flex justify-between">
              <span class="text-slate-600 font-medium">Bank / Provider:</span>
              <span class="font-bold text-slate-950"
                >{activePayment.bankName}</span
              >
            </div>
            <div class="flex justify-between">
              <span class="text-slate-600 font-medium">Account Name:</span>
              <span class="font-bold text-slate-950"
                >{activePayment.accountName}</span
              >
            </div>
            <div class="flex justify-between">
              <span class="text-slate-600 font-medium">Account / Till No:</span>
              <span
                class="font-black text-navy-950 font-mono bg-slate-200/80 px-2 py-0.5 rounded"
                >{activePayment.accountNumber}</span
              >
            </div>
            {#if activePayment.swiftCode && activePayment.swiftCode !== "N/A"}
              <div class="flex justify-between">
                <span class="text-slate-600 font-medium">Swift:</span>
                <span class="font-mono font-bold text-slate-900"
                  >{activePayment.swiftCode}</span
                >
              </div>
            {/if}
            {#if activePayment.branch}
              <div class="flex justify-between">
                <span class="text-slate-600 font-medium">Branch:</span>
                <span class="text-slate-900 font-semibold"
                  >{activePayment.branch}</span
                >
              </div>
            {/if}
          </div>
        </div>
        <div
          class="mt-3 pt-2 border-t border-slate-200 flex items-center gap-1 text-xs font-bold text-navy-900"
        >
          <ShieldCheck class="h-3.5 w-3.5 text-sky-600" />
          <span
            >{activePayment.accountType || "Official Corporate Account"}</span
          >
        </div>
      </div>

      <!-- Totals Breakdown (Right Side) -->
      <div class="sm:col-span-6 space-y-2 text-xs sm:text-sm">
        <div class="flex items-center justify-between text-slate-700">
          <span class="font-semibold">Subtotal</span>
          <span class="font-mono font-bold text-slate-900"
            >{formatTZS(subtotal)}</span
          >
        </div>

        <div class="flex items-center justify-between text-slate-700">
          <span class="font-semibold">Tax (VAT {taxRate}%)</span>
          <span class="font-mono font-bold text-slate-900"
            >{formatTZS(taxAmount)}</span
          >
        </div>

        {#if discountAmount > 0}
          <div class="flex items-center justify-between text-sky-700 font-bold">
            <span>Discount</span>
            <span class="font-mono">- {formatTZS(discountAmount)}</span>
          </div>
        {/if}

        <div
          class="border-t-2 border-slate-300 pt-2 flex items-center justify-between text-sm sm:text-base font-black text-navy-950"
        >
          <span>Total</span>
          <span class="font-mono text-base sm:text-lg text-navy-950 font-black"
            >{formatTZS(grandTotal)}</span
          >
        </div>
      </div>
    </div>

    <!-- Notes Footer -->
    {#if form.notes}
      <div class="mt-6 border-t border-slate-200 pt-3">
        <span
          class="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1"
        >
          Notes
        </span>
        <p
          class="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line italic font-medium"
        >
          {form.notes}
        </p>
      </div>
    {/if}

    <!-- Official Authorization & Company Stamp -->
    <div
      class="mt-6 pt-4 border-t-2 border-slate-300 flex items-end justify-between gap-4 relative z-10"
    >
      <!-- Signatory Line with Handwritten Signature -->
      <div class="space-y-1 pb-1">
        <span
          class="block text-xs font-bold text-slate-600 uppercase tracking-wider"
        >
          Authorized Signature & Confirmation
        </span>
        <!-- Handwritten Signature Font for Joseph Matemba -->
        <div class="relative pt-1.5">
          <div
            class="font-signature text-2xl sm:text-3xl text-navy-950 font-bold italic tracking-wide select-none leading-none -mb-1 transform -rotate-2"
          >
            Joseph Matemba
          </div>
          <div
            class="h-0.5 border-b-2 border-dashed border-slate-400 w-48 mt-1"
          ></div>
        </div>
        <div class="text-xs text-slate-800 font-bold pt-1">
          <span class="text-navy-950 font-black"></span>Managing Director
        </div>
        <span class="block text-[11px] text-slate-600 font-semibold">
          For: Anagikazo Company Limited
        </span>
      </div>

      <!-- Official Rubber Stamp Image -->
      <div class="flex flex-col items-center select-none">
        <div class="relative">
          <img
            src={stampImg}
            alt="Official Stamp - Anagikazo Company Limited"
            class="h-28 w-28 sm:h-32 sm:w-32 object-contain drop-shadow-xs -rotate-6 transition-transform duration-300 hover:rotate-0 hover:scale-105"
          />
        </div>
        <span
          class="text-[10px] font-black uppercase tracking-wider text-navy-950/80 mt-0.5"
        >
          Official Company Seal
        </span>
      </div>
    </div>

    <!-- Verification Footer Watermark -->
    <div
      class="mt-6 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 font-medium"
    >
      <span>Anagikazo Company Limited &bull; Dar es Salaam</span>
      <span>Generated via Electronic Invoicing System</span>
    </div>
  </div>
</div>
