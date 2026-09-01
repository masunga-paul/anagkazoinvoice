<script lang="ts">
  import {
    X,
    Lock,
    Mail,
    Eye,
    EyeOff,
    ShieldCheck,
    UserCheck,
    AlertCircle,
    Loader2,
  } from "lucide-svelte";
  import logoImg from "$lib/assets/logo.png";
  import { loginWithNeon } from "$lib/auth/neonAuth";
  import { loginSchema, type LoginInput } from "$lib/schema/auth";
  import type { User } from "$lib/types/auth";
  import { superForm, defaults } from "sveltekit-superforms";
  import { zod, zodClient } from "sveltekit-superforms/adapters";

  interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (user: User) => void;
  }

  let { isOpen, onClose, onSuccess }: Props = $props();

  let showPassword = $state(false);
  let isLoading = $state(false);
  let errorMessage = $state("");

  const { form, errors, enhance } = superForm<LoginInput>(
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
            onClose();
          } else {
            errorMessage =
              res.error ||
              "Authentication failed. Please check your credentials.";
          }
        } catch {
          errorMessage =
            "An error occurred connecting to authentication service.";
        } finally {
          isLoading = false;
        }
      },
    },
  );

</script>

{#if isOpen}
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
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
      class="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200 z-10"
    >
      <!-- Close Button -->
      <button
        type="button"
        onclick={onClose}
        aria-label="Close dialog"
        class="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
      >
        <X class="h-4 w-4" />
      </button>

      <!-- Logo & Title -->
      <div class="text-center pb-4 border-b border-slate-100">
        <img
          src={logoImg}
          alt="Anagkazo Autoparts"
          class="mx-auto h-11 w-auto object-contain mb-2.5"
        />
        <h3 class="text-base font-extrabold tracking-tight text-navy-900">
          Anagkazo Auth Portal
        </h3>
      </div>

      <!-- Error Alert -->
      {#if errorMessage}
        <div
          class="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-700 animate-in fade-in"
        >
          <AlertCircle class="h-4 w-4 shrink-0 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      {/if}

      <!-- Login Form -->
      <form use:enhance method="POST" novalidate class="mt-4 space-y-4">
        <!-- Email -->
        <div>
          <label
            for="loginEmail"
            class="block text-xs sm:text-[13px] font-black text-slate-800 uppercase tracking-wider mb-1.5"
          >
            Email Address <span class="text-rose-500">*</span>
          </label>
          <div class="relative">
            <Mail
              class="absolute top-1/2 left-3 -translate-y-1/2 h-4 w-4 text-slate-400"
            />
            <input
              id="loginEmail"
              name="email"
              type="email"
              bind:value={$form.email}
              placeholder="you@anagkazo.co.tz"
              class="w-full rounded-xl border py-2.5 pr-3 pl-9 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition {$errors.email
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
            for="loginPassword"
            class="block text-xs sm:text-[13px] font-black text-slate-800 uppercase tracking-wider mb-1.5"
          >
            Password <span class="text-rose-500">*</span>
          </label>
          <div class="relative">
            <Lock
              class="absolute top-1/2 left-3 -translate-y-1/2 h-4 w-4 text-slate-400"
            />
            <input
              id="loginPassword"
              name="password"
              type={showPassword ? "text" : "password"}
              bind:value={$form.password}
              placeholder="••••••••••••"
              class="w-full rounded-xl border py-2.5 pr-10 pl-9 text-xs sm:text-sm font-bold text-slate-900 font-mono placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition {$errors.password
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
          class="w-full flex items-center justify-center gap-2 rounded-xl bg-navy-900 py-3 px-4 text-xs sm:text-sm font-bold text-white shadow-sm transition hover:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-navy-900/20 active:scale-[0.99] disabled:opacity-70 cursor-pointer mt-1"
        >
          {#if isLoading}
            <Loader2 class="h-4 w-4 animate-spin text-sky-400" />
            <span>Authenticating with Neon...</span>
          {:else}
            <ShieldCheck class="h-4 w-4 text-sky-400" />
            <span>Sign In to Account</span>
          {/if}
        </button>
      </form>
    </div>
  </div>
{/if}
