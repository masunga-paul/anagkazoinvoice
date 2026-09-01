<script lang="ts">
  import {
    Lock,
    Mail,
    Eye,
    EyeOff,
    ShieldCheck,
    AlertCircle,
    Loader2,
    Sparkles,
    ArrowRight,
  } from "lucide-svelte";
  import logoImg from "$lib/assets/logo.png";
  import { loginWithNeon } from "$lib/auth/neonAuth";
  import { loginSchema, type LoginInput } from "$lib/schema/auth";
  import type { User } from "$lib/types/auth";
  import { superForm, defaults } from "sveltekit-superforms";
  import { zod, zodClient } from "sveltekit-superforms/adapters";

  interface Props {
    onSuccess: (user: User) => void;
  }

  let { onSuccess }: Props = $props();

  let showPassword = $state(false);
  let isLoading = $state(false);
  let errorMessage = $state("");

  const { form, errors, enhance, validateForm } = superForm<LoginInput>(
    defaults({ email: "", password: "" }, zod(loginSchema as any) as any),
    {
      SPA: true,
      validators: zodClient(loginSchema as any),
      validationMethod: "oninput",
      resetForm: false,
      async onUpdate({ form: f }) {
        if (!f.valid) return;
        const data = f.data;
        isLoading = true;
        errorMessage = "";

        try {
          const res = await loginWithNeon({
            email: f.data.email,
            password: f.data.password,
          });

          if (res.success && res.user) {
            onSuccess(res.user);
          } else {
            errorMessage =
              res.error ||
              "Authentication failed. Please verify your credentials.";
          }
        } catch {
          errorMessage = "Unable to connect to Neon authentication service.";
        } finally {
          isLoading = false;
        }
      },
    },
  );

  async function handleQuickLogin(userEmail: string, userPass: string) {
    $form.email = userEmail;
    $form.password = userPass;
    errorMessage = "";
    isLoading = true;

    try {
      const res = await loginWithNeon({ email: userEmail, password: userPass });
      if (res.success && res.user) {
        onSuccess(res.user);
      } else {
        errorMessage = res.error || "Quick login failed.";
      }
    } catch {
      errorMessage = "Authentication connection error.";
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="py-6 sm:py-12 max-w-xl mx-auto px-4 w-full flex flex-col items-center">
  <!-- Hero / Welcome Header -->
  <div class="text-center mb-6 w-full">
    <h1
      class="text-2xl sm:text-4xl font-extrabold tracking-tight text-navy-900"
    >
      Anagkazo Login Portal
    </h1>
  </div>

  <!-- Sign In Form Card -->
  <div
    class="w-full max-w-md rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xl flex flex-col justify-between"
  >
    <div>
      <div
        class="flex items-center justify-center pb-4 border-b border-slate-100 mb-5"
      >
        <div>
          <h2 class="text-2xl font-bold text-navy-900">Account Sign In</h2>
        </div>
      </div>

      {#if errorMessage}
        <div
          class="mb-4 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50/90 p-3 text-xs text-rose-700 animate-in fade-in"
        >
          <AlertCircle class="h-4 w-4 shrink-0 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      {/if}

      <form use:enhance method="POST" novalidate class="space-y-4">
        <!-- Email -->
        <div>
          <label
            for="gatewayEmail"
            class="block text-xs sm:text-[13px] font-black text-slate-800 uppercase tracking-wider mb-1.5"
          >
            Email Address <span class="text-rose-500">*</span>
          </label>
          <div class="relative">
            <Mail
              class="absolute top-1/2 left-3.5 -translate-y-1/2 h-4 w-4 text-slate-400"
            />
            <input
              id="gatewayEmail"
              name="email"
              type="email"
              bind:value={$form.email}
              placeholder="e.g. bmaganga32@gmail.com"
              class="w-full rounded-xl border py-2.5 pr-3 pl-10 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition {$errors.email
                ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500/20'
                : 'border-slate-300 bg-slate-50/50 focus:border-navy-900 focus:ring-navy-900/10'}"
            />
          </div>
          {#if $errors.email}
            <p
              class="text-xs font-semibold text-rose-600 mt-1 flex items-center gap-1"
            >
              <AlertCircle class="h-3.5 w-3.5 shrink-0" />
              <span>{$errors.email}</span>
            </p>
          {/if}
        </div>

        <!-- Password -->
        <div>
          <label
            for="gatewayPassword"
            class="block text-xs sm:text-[13px] font-black text-slate-800 uppercase tracking-wider mb-1.5"
          >
            Password <span class="text-rose-500">*</span>
          </label>
          <div class="relative">
            <Lock
              class="absolute top-1/2 left-3.5 -translate-y-1/2 h-4 w-4 text-slate-400"
            />
            <input
              id="gatewayPassword"
              name="password"
              type={showPassword ? "text" : "password"}
              bind:value={$form.password}
              placeholder="Enter your account password"
              class="w-full rounded-xl border py-2.5 pr-10 pl-10 text-xs sm:text-sm font-bold text-slate-900 font-mono placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition {$errors.password
                ? 'border-rose-400 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500/20'
                : 'border-slate-300 bg-slate-50/50 focus:border-navy-900 focus:ring-navy-900/10'}"
            />
            <button
              type="button"
              onclick={() => (showPassword = !showPassword)}
              class="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              tabindex="-1"
            >
              {#if showPassword}
                <EyeOff class="h-4 w-4" />
              {:else}
                <Eye class="h-4 w-4" />
              {/if}
            </button>
          </div>
          {#if $errors.password}
            <p
              class="text-xs font-semibold text-rose-600 mt-1 flex items-center gap-1"
            >
              <AlertCircle class="h-3.5 w-3.5 shrink-0" />
              <span>{$errors.password}</span>
            </p>
          {/if}
        </div>

        <!-- Submit Button -->
        <button
          type="submit"
          disabled={isLoading}
          class="w-full flex items-center justify-center gap-2 rounded-xl bg-navy-900 py-3 px-4 text-xs sm:text-sm font-bold text-white shadow-md transition hover:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-900/20 active:scale-[0.99] disabled:opacity-70 cursor-pointer"
        >
          {#if isLoading}
            <Loader2 class="h-4 w-4 animate-spin text-sky-400" />
            <span>Signing In...</span>
          {:else}
            <ShieldCheck class="h-4 w-4 text-sky-400" />
            <span>Sign In to Dashboard</span>
          {/if}
        </button>
      </form>
    </div>

    <!-- 1-Click Quick Demo Access -->
    <div class="mt-6 pt-4 border-t border-slate-100">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <!-- Standard User Quick Login -->

        <!-- Admin Quick Login -->
      </div>
    </div>
  </div>
</div>
