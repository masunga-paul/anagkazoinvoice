<script lang="ts">
  import { Menu, X, ChevronRight, LogOut } from "lucide-svelte";
  import logoImg from "$lib/assets/logo.png";
  import type { User } from "$lib/types/auth";

  interface Props {
    activeNav?: string;
    currentUser?: User | null;
    onTabChange?: (tab: string) => void;
    onOpenLogin?: () => void;
    onLogout?: () => void;
  }

  let {
    activeNav = $bindable("Invoices"),
    currentUser = null,
    onTabChange,
    onOpenLogin,
    onLogout,
  }: Props = $props();

  let mobileMenuOpen = $state(false);

  // All Navigation items
  const allNavItems = [
    { id: "Dashboard", label: "Dashboard", adminOnly: true },
    { id: "Customers", label: "Customers", adminOnly: false },
    { id: "Services", label: "Products & Stocks", adminOnly: false },
    { id: "Invoices", label: "Invoices", adminOnly: false },
    { id: "PaymentDetails", label: "Payment Details", adminOnly: true },
    { id: "Reports", label: "Reports", adminOnly: true },
  ];

  // Filtered navigation items based on user role
  const visibleNavItems = $derived(
    !currentUser
      ? []
      : allNavItems.filter((item) => {
          if (item.adminOnly) {
            return currentUser?.role === "admin";
          }
          return true;
        }),
  );

  function selectTab(tab: string) {
    activeNav = tab;
    mobileMenuOpen = false;
    if (onTabChange) onTabChange(tab);
  }
</script>

<header
  class="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md"
>
  <div
    class="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 h-16"
  >
    <!-- Brand Logo -->
    <div class="flex items-center gap-3">
      <button
        type="button"
        onclick={() =>
          selectTab(currentUser?.role === "admin" ? "Dashboard" : "Invoices")}
        class="flex items-center gap-2.5 transition hover:opacity-90 text-left cursor-pointer"
      >
        <img
          src={logoImg}
          alt="Anagkazo Autoparts"
          class="h-10 w-auto max-w-[130px] sm:max-w-[150px] object-contain"
        />
        <div class="hidden sm:flex flex-col border-l border-slate-300 pl-3">
          <span class="text-xs sm:text-[13px] font-bold text-slate-600 leading-tight"
            >Official Invoicing Portal</span
          >
        </div>
      </button>
    </div>

    <!-- Center Navigation Menu (Desktop) -->
    {#if currentUser}
      <nav
        class="hidden md:flex items-center gap-1.5 rounded-full bg-slate-100/90 p-1.5 ring-1 ring-slate-200"
      >
        {#each visibleNavItems as item}
          <button
            type="button"
            onclick={() => selectTab(item.id)}
            class="rounded-full px-4 py-1.5 text-xs sm:text-[13px] font-bold transition-all duration-200 cursor-pointer {activeNav ===
            item.id
              ? 'bg-navy-900 text-white shadow-xs'
              : 'text-slate-700 hover:text-navy-950 hover:bg-slate-200/80'}"
          >
            {item.label}
          </button>
        {/each}
      </nav>
    {:else}{/if}

    <!-- Right Action Controls -->
    {#if currentUser}
      <div class="flex items-center gap-2.5 sm:gap-3">
        <!-- Authenticated User Profile & Logout -->
        <div
          class="hidden sm:flex items-center gap-2.5 bg-slate-50 border border-slate-300/90 rounded-xl px-3 py-1.5 shadow-2xs"
        >
          <div
            class="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr {currentUser.avatarBg} text-white font-black text-xs shadow-xs"
          >
            <span>{currentUser.initials}</span>
          </div>
          <div class="hidden lg:flex flex-col text-left">
            <div class="flex items-center gap-1.5">
              <span
                class="text-xs sm:text-[13px] font-extrabold text-slate-900 leading-tight truncate max-w-[130px]"
              >
                {currentUser.name}
              </span>
              {#if currentUser.role === "admin"}
                <span
                  class="rounded bg-navy-900 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white"
                >
                  Admin
                </span>
              {:else}
                <span
                  class="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-sky-800"
                >
                  Staff
                </span>
              {/if}
            </div>
            <span
              class="text-[11px] text-slate-600 font-medium leading-tight truncate max-w-[140px]"
            >
              {currentUser.email}
            </span>
          </div>
          <button
            type="button"
            onclick={() => onLogout?.()}
            class="ml-1 p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
            title="Sign Out"
          >
            <LogOut class="h-4 w-4" />
          </button>
        </div>

        <!-- Mobile Hamburger Toggle -->
        <button
          type="button"
          onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
          aria-label="Toggle Navigation Menu"
          class="flex md:hidden h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 cursor-pointer"
        >
          {#if mobileMenuOpen}
            <X class="h-5 w-5" />
          {:else}
            <Menu class="h-5 w-5" />
          {/if}
        </button>
      </div>
    {/if}
  </div>

  <!-- Mobile Menu Overlay -->
  {#if mobileMenuOpen && currentUser}
    <div
      class="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg animate-in slide-in-from-top-2"
    >
      <!-- Mobile User Profile Status -->
      <div
        class="flex items-center justify-between p-2.5 mb-2 rounded-xl bg-slate-50 border border-slate-200"
      >
        <div class="flex items-center gap-2">
          <div
            class="flex h-8 w-8 items-center justify-center rounded-lg bg-navy-900 text-white font-bold text-xs"
          >
            {currentUser.initials}
          </div>
          <div>
            <div class="text-xs font-bold text-slate-900">
              {currentUser.name}
            </div>
            <div class="text-[10px] text-slate-500">{currentUser.email}</div>
          </div>
        </div>
        <button
          type="button"
          onclick={() => {
            onLogout?.();
            mobileMenuOpen = false;
          }}
          class="text-xs text-rose-600 font-semibold px-2 py-1 bg-rose-50 rounded-lg hover:bg-rose-100"
        >
          Logout
        </button>
      </div>

      {#each visibleNavItems as item}
        <button
          type="button"
          onclick={() => selectTab(item.id)}
          class="w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition {activeNav ===
          item.id
            ? 'bg-navy-900 text-white'
            : 'text-slate-700 hover:bg-slate-100'}"
        >
          <span>{item.label}</span>
          <ChevronRight class="h-4 w-4 opacity-60" />
        </button>
      {/each}
    </div>
  {/if}
</header>
