<script lang="ts">
  import type { User } from "$lib/types/auth";
  import logoImg from "$lib/assets/logo.png";
  import { COMPANY_INFO } from "$lib/utils/format";
  import {
    Building2,
    Phone,
    Mail,
    MapPin,
    FileText,
    Users,
    Disc3,
    BarChart3,
    CreditCard,
    ShieldCheck,
    LayoutDashboard,
    ArrowUp,
    KeyRound,
    Lock,
    CheckCircle2,
    Sparkles,
  } from "lucide-svelte";

  interface Props {
    currentUser?: User | null;
    activeTab?: string;
    onNavigateTab?: (tab: string) => void;
    onOpenLogin?: () => void;
    onOpenStaffCredentials?: () => void;
    onLogout?: () => void;
  }

  let {
    currentUser = null,
    activeTab = "Invoices",
    onNavigateTab,
    onOpenLogin,
    onOpenStaffCredentials,
    onLogout,
  }: Props = $props();

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const currentYear = new Date().getFullYear();
</script>

<footer
  class="no-print mt-16 w-full border-t border-slate-800/80 bg-gradient-to-b from-[#0a1526] via-[#08101e] to-[#040811] text-slate-300"
>
  <!-- Top Accent Glow Bar -->
  <div
    class="h-1 w-full bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 opacity-80"
  ></div>

  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
    <!-- 4-Column Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
      <!-- Col 1: Company Profile & Certifications -->
      <div class="space-y-4">
        <div class="flex items-center gap-3">
          <div
            class="rounded-xl bg-white/95 p-1.5 shadow-sm ring-1 ring-white/10"
          >
            <img
              src={logoImg}
              alt="Anagkazo Autoparts"
              class="h-8 w-auto object-contain"
            />
          </div>
          <div>
            <h3
              class="font-black text-white text-base sm:text-lg tracking-tight leading-snug"
            >
              {COMPANY_INFO.name}
            </h3>
            <p class="text-xs text-sky-400 font-bold tracking-wide">
              Official Invoicing & Tyre ERP
            </p>
          </div>
        </div>

        <p class="text-xs sm:text-sm text-slate-300 leading-relaxed font-medium">
          {COMPANY_INFO.tagline}. Leading distributor of heavy commercial truck
          tyres, bus radials, OTR, and passenger vehicle tyres in Tanzania.
        </p>

        <!-- Tax & Compliance Badges -->
        <div
          class="rounded-xl border border-slate-700 bg-slate-900/90 p-3.5 space-y-2 text-xs sm:text-sm"
        >
          <div class="flex items-center justify-between text-xs sm:text-[13px]">
            <span class="text-slate-300 font-semibold">TIN Number:</span>
            <span class="font-mono font-black text-sky-300"
              >{COMPANY_INFO.tin}</span
            >
          </div>
          <div class="flex items-center justify-between text-xs sm:text-[13px]">
            <span class="text-slate-300 font-semibold">VRN Number:</span>
            <span class="font-mono font-black text-sky-300"
              >{COMPANY_INFO.vrn}</span
            >
          </div>
          <div
            class="pt-2 border-t border-slate-700/80 flex items-center gap-1.5 text-xs text-emerald-400 font-bold"
          >
            <span class="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse"
            ></span>
            <span>TRA EFD & VAT (18%) Compliant</span>
          </div>
        </div>
      </div>

      <!-- Col 2: Fast Portal Navigation -->
      <div class="space-y-3">
        <h4
          class="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-100 flex items-center gap-2"
        >
          <Sparkles class="h-4 w-4 text-sky-400" />
          <span>Portal Navigation</span>
        </h4>

        <ul class="space-y-1.5 text-xs sm:text-sm">
          {#if currentUser?.role === "admin"}
            <li>
              <button
                type="button"
                onclick={() => onNavigateTab?.("Dashboard")}
                class="w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-left transition hover:bg-slate-800/80 hover:text-white cursor-pointer {activeTab ===
                'Dashboard'
                  ? 'bg-sky-500/20 text-sky-300 font-extrabold border-l-2 border-sky-400'
                  : 'text-slate-300 font-semibold'}"
              >
                <div class="flex items-center gap-2">
                  <LayoutDashboard class="h-4 w-4 text-sky-400" />
                  <span>Executive Dashboard</span>
                </div>
                <span
                  class="text-[10px] rounded px-1.5 py-0.5 bg-sky-500/20 text-sky-300 font-extrabold"
                  >Admin</span
                >
              </button>
            </li>
          {/if}

          <li>
            <button
              type="button"
              onclick={() => onNavigateTab?.("Invoices")}
              class="w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-left transition hover:bg-slate-800/80 hover:text-white cursor-pointer {activeTab ===
              'Invoices'
                ? 'bg-sky-500/20 text-sky-300 font-extrabold border-l-2 border-sky-400'
                : 'text-slate-300 font-semibold'}"
            >
              <div class="flex items-center gap-2">
                <FileText class="h-4 w-4 text-sky-400" />
                <span>Invoices & Fleet Billing</span>
              </div>
            </button>
          </li>

          <li>
            <button
              type="button"
              onclick={() => onNavigateTab?.("Customers")}
              class="w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-left transition hover:bg-slate-800/80 hover:text-white cursor-pointer {activeTab ===
              'Customers'
                ? 'bg-sky-500/20 text-sky-300 font-extrabold border-l-2 border-sky-400'
                : 'text-slate-300 font-semibold'}"
            >
              <div class="flex items-center gap-2">
                <Users class="h-4 w-4 text-sky-400" />
                <span>Commercial Customers</span>
              </div>
            </button>
          </li>

          <li>
            <button
              type="button"
              onclick={() => onNavigateTab?.("Services")}
              class="w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-left transition hover:bg-slate-800/80 hover:text-white cursor-pointer {activeTab ===
              'Services'
                ? 'bg-sky-500/20 text-sky-300 font-extrabold border-l-2 border-sky-400'
                : 'text-slate-300 font-semibold'}"
            >
              <div class="flex items-center gap-2">
                <Disc3 class="h-4 w-4 text-sky-400" />
                <span>Tyre Inventory & Stocks</span>
              </div>
            </button>
          </li>

          {#if currentUser?.role === "admin"}
            <li>
              <button
                type="button"
                onclick={() => onNavigateTab?.("PaymentDetails")}
                class="w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-left transition hover:bg-slate-800/80 hover:text-white cursor-pointer {activeTab ===
                'PaymentDetails'
                  ? 'bg-sky-500/20 text-sky-300 font-extrabold border-l-2 border-sky-400'
                  : 'text-slate-300 font-semibold'}"
              >
                <div class="flex items-center gap-2">
                  <CreditCard class="h-4 w-4 text-sky-400" />
                  <span>Banking & Payment Accounts</span>
                </div>
                <span
                  class="text-[10px] rounded px-1.5 py-0.5 bg-sky-500/20 text-sky-300 font-extrabold"
                  >Admin</span
                >
              </button>
            </li>

            <li>
              <button
                type="button"
                onclick={() => onNavigateTab?.("Reports")}
                class="w-full flex items-center justify-between rounded-lg px-2.5 py-2 text-left transition hover:bg-slate-800/80 hover:text-white cursor-pointer {activeTab ===
                'Reports'
                  ? 'bg-sky-500/20 text-sky-300 font-extrabold border-l-2 border-sky-400'
                  : 'text-slate-300 font-semibold'}"
              >
                <div class="flex items-center gap-2">
                  <BarChart3 class="h-4 w-4 text-sky-400" />
                  <span>Financial & Sales Reports</span>
                </div>
                <span
                  class="text-[10px] rounded px-1.5 py-0.5 bg-sky-500/20 text-sky-300 font-extrabold"
                  >Admin</span
                >
              </button>
            </li>
          {/if}
        </ul>
      </div>

      <!-- Col 3: Contact & Warehouse HQ -->
      <div class="space-y-3">
        <h4
          class="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-100 flex items-center gap-2"
        >
          <Building2 class="h-4 w-4 text-sky-400" />
          <span>Warehouse & Contacts</span>
        </h4>

        <div class="space-y-2.5 text-xs sm:text-sm text-slate-300">
          <div class="flex items-start gap-2.5">
            <MapPin class="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
            <span
              >{COMPANY_INFO.address}, {COMPANY_INFO.city}, {COMPANY_INFO.country}</span
            >
          </div>

          <div class="flex items-center gap-2.5">
            <Phone class="h-4 w-4 text-sky-400 shrink-0" />
            <span class="font-mono text-slate-200 font-bold">{COMPANY_INFO.phone}</span>
          </div>

          <div class="flex items-center gap-2.5">
            <Mail class="h-4 w-4 text-sky-400 shrink-0" />
            <span class="text-slate-200 font-medium">{COMPANY_INFO.email}</span>
          </div>

          <div
            class="pt-2 border-t border-slate-700 text-xs text-slate-300"
          >
            <div class="text-slate-200 font-extrabold">
              Primary Banking Partner:
            </div>
            <div class="font-mono text-slate-300 font-semibold">
              {COMPANY_INFO.bankName} • {COMPANY_INFO.branch}
            </div>
          </div>
        </div>
      </div>

      <!-- Col 4: Active Session & Role Status -->
      <div class="space-y-3">
        <h4
          class="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-100 flex items-center gap-2"
        >
          <ShieldCheck class="h-4 w-4 text-sky-400" />
          <span>Security & Session</span>
        </h4>

        {#if currentUser}
          <div
            class="rounded-xl border border-slate-700 bg-slate-900/90 p-3.5 space-y-3 shadow-sm"
          >
            <div class="flex items-center gap-2.5">
              <div
                class="h-9 w-9 rounded-xl flex items-center justify-center font-black text-xs {currentUser.role ===
                'admin'
                  ? 'bg-indigo-500/30 text-indigo-200 ring-1 ring-indigo-500/40'
                  : 'bg-emerald-500/30 text-emerald-200 ring-1 ring-emerald-500/40'}"
              >
                {currentUser.role === "admin" ? "AD" : "ST"}
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-1.5">
                  <span class="font-black text-white text-xs sm:text-sm truncate"
                    >{currentUser.name}</span
                  >
                  <span
                    class="rounded px-1.5 py-0.5 text-[10px] font-black uppercase {currentUser.role ===
                    'admin'
                      ? 'bg-indigo-400/30 text-indigo-200'
                      : 'bg-emerald-400/30 text-emerald-200'}"
                  >
                    {currentUser.role === "admin" ? "Admin" : "Staff"}
                  </span>
                </div>
                <div class="text-xs text-slate-300 truncate font-mono font-medium">
                  {currentUser.email}
                </div>
              </div>
            </div>

            <div class="border-t border-slate-700 pt-2 flex flex-col gap-1.5">
              {#if currentUser.role === "admin" && onOpenStaffCredentials}
                <button
                  type="button"
                  onclick={onOpenStaffCredentials}
                  class="w-full flex items-center justify-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-100 hover:bg-slate-700 hover:text-white transition cursor-pointer"
                >
                  <KeyRound class="h-3.5 w-3.5 text-sky-400" />
                  <span>Security Credentials</span>
                </button>
              {/if}

              {#if onLogout}
                <button
                  type="button"
                  onclick={onLogout}
                  class="w-full flex items-center justify-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/20 px-3 py-2 text-xs font-bold text-rose-200 hover:bg-rose-500/30 hover:text-rose-100 transition cursor-pointer"
                >
                  <span>Sign Out Session</span>
                </button>
              {/if}
            </div>
          </div>
        {:else}
          <div
            class="rounded-xl border border-slate-700 bg-slate-900/90 p-4 space-y-2.5 text-center shadow-sm"
          >
            <div
              class="flex h-8 w-8 mx-auto items-center justify-center rounded-lg bg-slate-800 text-slate-300"
            >
              <Lock class="h-4 w-4" />
            </div>
            <div class="text-xs sm:text-sm font-black text-slate-100">
              Session Unauthenticated
            </div>
            <p class="text-xs text-slate-300 font-medium">
              Sign in with Admin or Staff credentials to access the workspace.
            </p>
            {#if onOpenLogin}
              <button
                type="button"
                onclick={onOpenLogin}
                class="w-full rounded-lg bg-sky-500 px-3.5 py-2 text-xs sm:text-sm font-bold text-navy-950 hover:bg-sky-400 transition cursor-pointer shadow-xs"
              >
                Sign In
              </button>
            {/if}
          </div>
        {/if}
      </div>
    </div>

    <!-- Bottom Copyright & Back to Top Row -->
    <div
      class="mt-12 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm text-slate-300"
    >
      <div class="flex flex-wrap items-center gap-2 text-center sm:text-left">
        <span
          >&copy; {currentYear}
          {COMPANY_INFO.name} Limited. All rights reserved.</span
        >
        <span class="hidden sm:inline text-slate-600">•</span>
        <span class="text-slate-400"
          >Developed by <a href="https://www.designhub.co.tz" class="underline hover:text-sky-300">DesignHub</a></span
        >
      </div>

      <div class="flex items-center gap-4">
        <button
          type="button"
          onclick={scrollToTop}
          class="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs sm:text-sm font-bold text-slate-200 hover:bg-slate-800 hover:text-white transition cursor-pointer shadow-xs"
          title="Scroll back to top of page"
        >
          <span>Back to Top</span>
          <ArrowUp class="h-4 w-4 text-sky-400" />
        </button>
      </div>
    </div>
  </div>
</footer>
