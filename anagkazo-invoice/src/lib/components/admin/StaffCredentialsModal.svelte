<script lang="ts">
  import {
    X,
    KeyRound,
    Mail,
    Lock,
    Eye,
    EyeOff,
    ShieldCheck,
    UserCheck,
    Sparkles,
    RotateCcw,
    AlertCircle,
    CheckCircle2,
    Loader2,
    Building2,
    ShieldAlert,
    AlertTriangle,
    Crown,
    Users,
    LogOut,
  } from "lucide-svelte";
  import type { StaffCredentials, AdminCredentials } from "$lib/types/auth";
  import {
    getStoredStaffCredentials,
    saveStoredStaffCredentials,
    DEFAULT_STAFF_CREDENTIALS,
    getStoredAdminCredentials,
    saveStoredAdminCredentials,
    DEFAULT_ADMIN_CREDENTIALS,
  } from "$lib/utils/storage";

  interface Props {
    open: boolean;
    onClose: () => void;
    onSaved?: (creds: StaffCredentials) => void;
    onAdminSaved?: (creds: AdminCredentials) => void;
    onShowToast?: (
      message: string,
      type?: "success" | "error" | "info",
      action?: any,
      title?: string,
    ) => void;
  }

  let { open, onClose, onSaved, onAdminSaved, onShowToast }: Props = $props();

  let activeTab = $state<"admin" | "staff">("admin");

  // Admin Form State
  let currentAdmin = $state<AdminCredentials>(DEFAULT_ADMIN_CREDENTIALS);
  let adminEmail = $state(DEFAULT_ADMIN_CREDENTIALS.email);
  let adminPassword = $state("");
  let adminName = $state(DEFAULT_ADMIN_CREDENTIALS.name);
  let adminDepartment = $state(
    DEFAULT_ADMIN_CREDENTIALS.department || "Executive Management",
  );
  let showAdminPassword = $state(false);
  let isAdminSaving = $state(false);
  let adminErrorMessage = $state("");
  let adminSuccessMessage = $state("");

  // Staff Form State
  let currentStaff = $state<StaffCredentials>(DEFAULT_STAFF_CREDENTIALS);
  let staffEmail = $state(DEFAULT_STAFF_CREDENTIALS.email);
  let staffPassword = $state(DEFAULT_STAFF_CREDENTIALS.password);
  let staffName = $state(DEFAULT_STAFF_CREDENTIALS.name);
  let staffDepartment = $state(
    DEFAULT_STAFF_CREDENTIALS.department || "Sales & Workshop Operations",
  );
  let showStaffPassword = $state(false);
  let isStaffSaving = $state(false);
  let staffErrorMessage = $state("");
  let staffSuccessMessage = $state("");

  // Sync state when modal opens
  $effect(() => {
    if (open) {
      const latestAdmin = getStoredAdminCredentials();
      currentAdmin = latestAdmin;
      adminEmail = latestAdmin.email;
      adminPassword = "";
      adminName = latestAdmin.name || "Masunga Paul Maganga";
      adminDepartment = latestAdmin.department || "Executive Management";
      adminErrorMessage = "";
      adminSuccessMessage = "";
      showAdminPassword = false;
      isAdminSaving = false;

      const latestStaff = getStoredStaffCredentials();
      currentStaff = latestStaff;
      staffEmail = latestStaff.email;
      staffPassword = latestStaff.password;
      staffName = latestStaff.name || "Baraka Maganga";
      staffDepartment = latestStaff.department || "Sales & Workshop Operations";
      staffErrorMessage = "";
      staffSuccessMessage = "";
      showStaffPassword = false;
      isStaffSaving = false;
    }
  });

  function generateStrongPassword(target: "admin" | "staff") {
    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*";
    let pass = target === "admin" ? "Ank-Adm-" : "Ank-";
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (target === "admin") {
      adminPassword = pass;
      showAdminPassword = true;
      adminErrorMessage = "";
    } else {
      staffPassword = pass;
      showStaffPassword = true;
      staffErrorMessage = "";
    }
  }

  function resetStaffToDefaults() {
    staffEmail = DEFAULT_STAFF_CREDENTIALS.email;
    staffPassword = DEFAULT_STAFF_CREDENTIALS.password;
    staffName = DEFAULT_STAFF_CREDENTIALS.name;
    staffDepartment =
      DEFAULT_STAFF_CREDENTIALS.department || "Sales & Workshop Operations";
    staffErrorMessage = "";
    staffSuccessMessage =
      'Fields reset to default staff credentials. Click "Save Staff Credentials" to apply.';
  }

  async function handleSaveAdmin() {
    adminErrorMessage = "";
    adminSuccessMessage = "";

    const cleanEmail = adminEmail.trim().toLowerCase();
    const cleanPass = adminPassword.trim();
    const cleanName = adminName.trim();
    const cleanDept = adminDepartment.trim();

    if (!cleanEmail) {
      adminErrorMessage = "Administrator email address is required.";
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      adminErrorMessage = "Please enter a valid administrator email address.";
      return;
    }

    if (!cleanPass || cleanPass.length < 6) {
      adminErrorMessage =
        "New Administrator password must be at least 6 characters long.";
      return;
    }

    isAdminSaving = true;

    try {
      const updated = await saveStoredAdminCredentials({
        email: cleanEmail,
        password: cleanPass,
        name: cleanName || "Masunga Paul Maganga",
        department: cleanDept || "Executive Management",
      });

      currentAdmin = updated;
      adminSuccessMessage =
        "Administrator credentials updated! Logging out session...";

      onAdminSaved?.(updated);
      onShowToast?.(
        `Administrator credentials updated to ${updated.email}. You have been logged out. Please sign in with your new credentials.`,
        "success",
        "LOGOUT",
        "Admin Credentials Updated",
      );

      setTimeout(() => {
        onClose();
      }, 900);
    } catch (e: any) {
      adminErrorMessage =
        e?.message || "Failed to update administrator credentials in database.";
    } finally {
      isAdminSaving = false;
    }
  }

  async function handleSaveStaff() {
    staffErrorMessage = "";
    staffSuccessMessage = "";

    const cleanEmail = staffEmail.trim().toLowerCase();
    const cleanPass = staffPassword.trim();
    const cleanName = staffName.trim();
    const cleanDept = staffDepartment.trim();

    if (!cleanEmail) {
      staffErrorMessage = "Staff email address is required.";
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      staffErrorMessage = "Please enter a valid staff email address.";
      return;
    }

    if (cleanEmail === adminEmail.trim().toLowerCase()) {
      staffErrorMessage =
        "Staff email cannot be identical to the Administrator master email.";
      return;
    }

    if (!cleanPass || cleanPass.length < 6) {
      staffErrorMessage = "Staff password must be at least 6 characters long.";
      return;
    }

    isStaffSaving = true;

    try {
      const updated = saveStoredStaffCredentials({
        email: cleanEmail,
        password: cleanPass,
        name: cleanName || "Baraka Maganga",
        department: cleanDept || "Sales & Workshop Operations",
      });

      currentStaff = updated;
      staffSuccessMessage = `Staff credentials successfully updated for ${updated.name}!`;

      onSaved?.(updated);
      onShowToast?.(
        `Staff login credentials updated to ${updated.email}. Active staff sessions have been automatically logged out in real time.`,
        "success",
        "UPDATE",
        "Staff Credentials Updated",
      );

      setTimeout(() => {
        onClose();
      }, 900);
    } catch (e: any) {
      staffErrorMessage = e?.message || "Failed to save staff credentials.";
    } finally {
      isStaffSaving = false;
    }
  }
</script>

{#if open}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
  >
    <!-- Backdrop -->
    <div
      class="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in"
      onclick={onClose}
      role="button"
      tabindex="0"
      onkeydown={(e) => e.key === "Escape" && onClose()}
      aria-label="Close modal overlay"
    ></div>

    <!-- Modal Container -->
    <div
      class="relative w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-200 z-10 my-8"
    >
      <!-- Modal Header -->
      <div
        class="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-950 p-5 sm:p-6 text-white relative"
      >
        <button
          type="button"
          onclick={onClose}
          aria-label="Close dialog"
          class="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
        >
          <X class="h-4 w-4" />
        </button>

        <div class="flex items-center gap-3">
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 shadow-xs"
          >
            <KeyRound class="h-5 w-5" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h2 class="text-base sm:text-lg font-bold text-white">
                Security & Login Credentials
              </h2>
              <span
                class="rounded-full bg-sky-500/20 px-2 py-0.5 text-[10px] font-extrabold text-sky-300 border border-sky-500/30"
              >
                Security Center
              </span>
            </div>
            <p class="text-xs text-slate-300 mt-0.5">
              Manage master administrator and operational staff access
              credentials.
            </p>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div
          class="flex items-center gap-2 mt-5 border-b border-navy-800/80 -mb-2 pb-2"
        >
          <button
            type="button"
            onclick={() => (activeTab = "admin")}
            class="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-extrabold transition cursor-pointer {activeTab ===
            'admin'
              ? 'bg-sky-500 text-navy-950 shadow-xs'
              : 'text-slate-200 hover:text-white hover:bg-white/10'}"
          >
            <Crown class="h-4 w-4" />
            <span>Administrator Account</span>
            <span
              class="rounded bg-navy-950/60 px-1.5 py-0.5 text-[10px] font-black text-white"
            >
              Admin
            </span>
          </button>

          <button
            type="button"
            onclick={() => (activeTab = "staff")}
            class="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-extrabold transition cursor-pointer {activeTab ===
            'staff'
              ? 'bg-sky-500 text-navy-950 shadow-xs'
              : 'text-slate-200 hover:text-white hover:bg-white/10'}"
          >
            <Users class="h-4 w-4" />
            <span>Staff Member Account</span>
            <span
              class="rounded bg-navy-950/60 px-1.5 py-0.5 text-[10px] font-black text-white"
            >
              Staff
            </span>
          </button>
        </div>
      </div>

      <!-- TAB 1: ADMINISTRATOR CREDENTIALS -->
      {#if activeTab === "admin"}
        <!-- Active Admin Profile Banner -->
        <div
          class="bg-slate-50 border-b border-slate-200 px-5 sm:px-6 py-3.5 flex items-center justify-between gap-3"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-navy-950 to-navy-800 text-white font-black text-xs shadow-xs border border-navy-700"
            >
              MP
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-xs sm:text-sm font-black text-slate-950 truncate"
                  >{currentAdmin.name || "Masunga Paul Maganga"}</span
                >
                <span
                  class="rounded bg-sky-100 px-2 py-0.5 text-[10px] font-black text-sky-900 border border-sky-200"
                >
                  MASTER ADMIN
                </span>
              </div>
              <p class="text-xs text-slate-600 truncate font-mono font-semibold">
                Current Login: {currentAdmin.email}
              </p>
            </div>
          </div>

          <span
            class="shrink-0 text-xs font-bold text-slate-700 bg-white border border-slate-300 px-2.5 py-1 rounded-lg"
          >
            Full Access
          </span>
        </div>

        <!-- Admin Form Content -->
        <div class="p-5 sm:p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {#if adminErrorMessage}
            <div
              class="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs sm:text-sm font-semibold text-rose-800 animate-in fade-in"
            >
              <AlertCircle class="h-4 w-4 shrink-0 text-rose-600" />
              <span>{adminErrorMessage}</span>
            </div>
          {/if}

          {#if adminSuccessMessage}
            <div
              class="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs sm:text-sm font-semibold text-emerald-800 animate-in fade-in"
            >
              <CheckCircle2 class="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{adminSuccessMessage}</span>
            </div>
          {/if}

          <!-- Admin Name -->
          <div>
            <label
              for="adminName"
              class="block text-xs sm:text-[13px] font-black text-slate-800 uppercase tracking-wider mb-1.5"
            >
              Administrator Full Name
            </label>
            <div class="relative">
              <Crown
                class="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
              />
              <input
                id="adminName"
                type="text"
                bind:value={adminName}
                placeholder="e.g. Masunga Paul Maganga"
                class="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-900/10"
              />
            </div>
          </div>

          <!-- Admin Email Address -->
          <div>
            <label
              for="adminEmail"
              class="block text-xs sm:text-[13px] font-black text-slate-800 uppercase tracking-wider mb-1.5"
            >
              Administrator Login Email <span class="text-rose-500">*</span>
            </label>
            <div class="relative">
              <Mail
                class="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
              />
              <input
                id="adminEmail"
                type="email"
                bind:value={adminEmail}
                placeholder="e.g. masungapaulmaganga@gmail.com"
                class="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 font-mono placeholder:text-slate-400 focus:border-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-900/10"
              />
            </div>
            <p class="text-xs text-slate-600 font-medium mt-1">
              This email will be used to authenticate into the Executive Master Portal.
            </p>
          </div>

          <!-- Admin Password -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label
                for="adminPassword"
                class="block text-xs sm:text-[13px] font-black text-slate-800 uppercase tracking-wider"
              >
                New Administrator Password <span class="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onclick={() => generateStrongPassword("admin")}
                class="inline-flex items-center gap-1 text-xs font-bold text-sky-700 hover:text-sky-900 hover:underline cursor-pointer"
              >
                <Sparkles class="h-3.5 w-3.5 text-sky-600" />
                <span>Generate Strong Password</span>
              </button>
            </div>
            <div class="relative">
              <Lock
                class="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
              />
              <input
                id="adminPassword"
                type={showAdminPassword ? "text" : "password"}
                bind:value={adminPassword}
                placeholder="Enter new administrator password (min 6 chars)"
                class="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-10 py-2.5 text-xs sm:text-sm font-bold text-slate-900 font-mono placeholder:text-slate-400 focus:border-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-900/10"
              />
              <button
                type="button"
                onclick={() => (showAdminPassword = !showAdminPassword)}
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                aria-label={showAdminPassword
                  ? "Hide password"
                  : "Show password"}
              >
                {#if showAdminPassword}
                  <EyeOff class="h-4 w-4" />
                {:else}
                  <Eye class="h-4 w-4" />
                {/if}
              </button>
            </div>
            {#if adminPassword}
              <div class="flex items-center gap-2 mt-1.5">
                <div
                  class="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden"
                >
                  <div
                    class="h-full rounded-full transition-all duration-300 {adminPassword.length <
                    6
                      ? 'w-1/3 bg-rose-500'
                      : adminPassword.length < 10
                        ? 'w-2/3 bg-amber-500'
                        : 'w-full bg-emerald-500'}"
                  ></div>
                </div>
                <span
                  class="text-xs font-bold {adminPassword.length < 6
                    ? 'text-rose-600'
                    : adminPassword.length < 10
                      ? 'text-amber-600'
                      : 'text-emerald-600'}"
                >
                  {adminPassword.length < 6
                    ? "Too Short"
                    : adminPassword.length < 10
                      ? "Good"
                      : "Strong"}
                </span>
              </div>
            {/if}
          </div>
        </div>

        <!-- Modal Footer Actions for Admin -->
        <div
          class="bg-slate-50 border-t border-slate-200 px-5 sm:px-6 py-4 flex items-center justify-end gap-3"
        >
          <button
            type="button"
            onclick={onClose}
            class="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onclick={handleSaveAdmin}
            disabled={isAdminSaving}
            class="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs hover:bg-navy-800 transition active:scale-95 disabled:opacity-60 cursor-pointer"
          >
            {#if isAdminSaving}
              <Loader2 class="h-4 w-4 animate-spin text-sky-400" />
              <span>Updating Database & Logging Out...</span>
            {:else}
              <CheckCircle2 class="h-4 w-4 text-sky-400" />
              <span>Save Admin Credentials</span>
            {/if}
          </button>
        </div>
      {/if}

      <!-- TAB 2: STAFF CREDENTIALS -->
      {#if activeTab === "staff"}
        <!-- Active Staff Profile Banner -->
        <div
          class="bg-slate-50 border-b border-slate-200 px-5 sm:px-6 py-3.5 flex items-center justify-between gap-3"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-sky-700 to-navy-900 text-white font-black text-xs shadow-xs"
            >
              BM
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-xs sm:text-sm font-black text-slate-950 truncate"
                  >{currentStaff.name || "Baraka Maganga"}</span
                >
                <span
                  class="rounded bg-slate-200 px-2 py-0.5 text-[10px] font-black text-slate-800"
                >
                  STAFF
                </span>
              </div>
              <p class="text-xs text-slate-600 truncate font-mono font-semibold">
                Active: {currentStaff.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onclick={resetStaffToDefaults}
            class="shrink-0 inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:text-navy-950 hover:bg-slate-100 transition cursor-pointer"
            title="Restore default demo credentials"
          >
            <RotateCcw class="h-3.5 w-3.5 text-slate-500" />
            <span>Defaults</span>
          </button>
        </div>

        <!-- Staff Form Content -->
        <div class="p-5 sm:p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {#if staffErrorMessage}
            <div
              class="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs sm:text-sm font-semibold text-rose-800 animate-in fade-in"
            >
              <AlertCircle class="h-4 w-4 shrink-0 text-rose-600" />
              <span>{staffErrorMessage}</span>
            </div>
          {/if}

          {#if staffSuccessMessage}
            <div
              class="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs sm:text-sm font-semibold text-emerald-800 animate-in fade-in"
            >
              <CheckCircle2 class="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{staffSuccessMessage}</span>
            </div>
          {/if}

          <!-- Staff Name -->
          <div>
            <label
              for="staffName"
              class="block text-xs sm:text-[13px] font-black text-slate-800 uppercase tracking-wider mb-1.5"
            >
              Staff Member Name
            </label>
            <div class="relative">
              <UserCheck
                class="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
              />
              <input
                id="staffName"
                type="text"
                bind:value={staffName}
                placeholder="Staff Full Name"
                class="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3.5 py-2.5 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-900/10"
              />
            </div>
          </div>

          <!-- Staff Email Address -->
          <div>
            <label
              for="staffEmail"
              class="block text-xs sm:text-[13px] font-black text-slate-800 uppercase tracking-wider mb-1.5"
            >
              Staff Login Email <span class="text-rose-500">*</span>
            </label>
            <div class="relative">
              <Mail
                class="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
              />
              <input
                id="staffEmail"
                type="email"
                bind:value={staffEmail}
                placeholder="e.g. bmaganga32@gmail.com"
                class="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3.5 py-2.5 text-xs sm:text-sm font-bold text-slate-900 font-mono placeholder:text-slate-400 focus:border-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-900/10"
              />
            </div>
            <p class="text-xs text-slate-600 font-medium mt-1">
              This email will be required when the staff member logs in.
            </p>
          </div>

          <!-- Staff Password -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <label
                for="staffPassword"
                class="block text-xs sm:text-[13px] font-black text-slate-800 uppercase tracking-wider"
              >
                New Staff Password <span class="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onclick={() => generateStrongPassword("staff")}
                class="inline-flex items-center gap-1 text-xs font-bold text-sky-700 hover:text-sky-900 hover:underline cursor-pointer"
              >
                <Sparkles class="h-3.5 w-3.5 text-sky-600" />
                <span>Generate Password</span>
              </button>
            </div>
            <div class="relative">
              <Lock
                class="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
              />
              <input
                id="staffPassword"
                type={showStaffPassword ? "text" : "password"}
                bind:value={staffPassword}
                placeholder="Minimum 6 characters"
                class="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-10 py-2.5 text-xs sm:text-sm font-bold text-slate-900 font-mono placeholder:text-slate-400 focus:border-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-900/10"
              />
              <button
                type="button"
                onclick={() => (showStaffPassword = !showStaffPassword)}
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                aria-label={showStaffPassword
                  ? "Hide password"
                  : "Show password"}
              >
                {#if showStaffPassword}
                  <EyeOff class="h-4 w-4" />
                {:else}
                  <Eye class="h-4 w-4" />
                {/if}
              </button>
            </div>
            {#if staffPassword}
              <div class="flex items-center gap-2 mt-1.5">
                <div
                  class="h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden"
                >
                  <div
                    class="h-full rounded-full transition-all duration-300 {staffPassword.length <
                    6
                      ? 'w-1/3 bg-rose-500'
                      : staffPassword.length < 10
                        ? 'w-2/3 bg-amber-500'
                        : 'w-full bg-emerald-500'}"
                  ></div>
                </div>
                <span
                  class="text-xs font-bold {staffPassword.length < 6
                    ? 'text-rose-600'
                    : staffPassword.length < 10
                      ? 'text-amber-600'
                      : 'text-emerald-600'}"
                >
                  {staffPassword.length < 6
                    ? "Too Short"
                    : staffPassword.length < 10
                      ? "Good"
                      : "Strong"}
                </span>
              </div>
            {/if}
          </div>

          <!-- Department & Access Scope Notice -->

          <div class="flex items-center gap-1.5 font-bold text-sky-950"></div>
        </div>

        <!-- Modal Footer Actions for Staff -->
        <div
          class="bg-slate-50 border-t border-slate-200/80 px-5 sm:px-6 py-4 flex items-center justify-end gap-3"
        >
          <button
            type="button"
            onclick={onClose}
            class="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onclick={handleSaveStaff}
            disabled={isStaffSaving}
            class="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-navy-800 transition active:scale-95 disabled:opacity-60 cursor-pointer"
          >
            {#if isStaffSaving}
              <Loader2 class="h-3.5 w-3.5 animate-spin text-sky-400" />
              <span>Saving Changes...</span>
            {:else}
              <CheckCircle2 class="h-3.5 w-3.5 text-sky-400" />
              <span>Save Staff Credentials</span>
            {/if}
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}
