"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

function getRedirectPath(role?: string | null) {
  switch (role) {
    case "super_admin":
    case "admin_central":
    case "pasteur_visionnaire":
      return "/central/dashboard";

    case "coordonnateur_finances":
      return "/central/finances";

    case "logisticien":
      return "/central/assets";

    case "cellule":
    case "pasteur_cellule":
    case "secretaire_cellule":
    case "tresorier_cellule":
      return "/cell/dashboard";

    default:
      return "/central/dashboard";
  }
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResetLoading, setIsResetLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");
    setIsLoading(true);

    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

    if (authError) {
      setIsLoading(false);
      setErrorMessage(
        "Identifiants invalides. Vérifie que l’utilisateur existe dans Supabase Auth et que le mot de passe est correct."
      );
      return;
    }

    const userId = authData.user?.id;

    if (!userId) {
      setIsLoading(false);
      setErrorMessage("Connexion réussie, mais utilisateur introuvable.");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, access_level, status")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      setIsLoading(false);
      setErrorMessage(
        "Utilisateur connecté, mais aucun profil n’est associé dans la table profiles."
      );
      return;
    }

    if (profile.status !== "active") {
      await supabase.auth.signOut();
      setIsLoading(false);
      setErrorMessage("Ce compte est désactivé. Contacte l’administrateur.");
      return;
    }

    const redirectPath = getRedirectPath(profile.role || profile.access_level);

    setIsLoading(false);
    router.push(redirectPath);
    router.refresh();
  }

  async function handleResetPassword() {
    setMessage("");
    setErrorMessage("");

    if (!email.trim()) {
      setErrorMessage(
        "Entre d’abord ton email pour recevoir le lien de réinitialisation."
      );
      return;
    }

    setIsResetLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/login`,
    });

    setIsResetLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessage("Un lien de réinitialisation a été envoyé à ton adresse email.");
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[var(--louange-purple-dark)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#f2b70555,transparent_30%),radial-gradient(circle_at_bottom_right,#6d42d955,transparent_35%)]" />

      <div className="relative grid min-h-screen lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden items-center justify-center p-10 text-white lg:flex">
          <div className="max-w-xl">
            <div className="mb-8 flex h-28 w-28 items-center justify-center rounded-3xl bg-white p-3 shadow-2xl louange-logo-animated">
              <Image
                src="/logo-louange.png"
                alt="Logo Église La Louange"
                width={110}
                height={110}
                className="h-full w-full object-contain"
                priority
              />
            </div>

            <p className="text-sm font-black uppercase tracking-[0.35em] text-[var(--louange-gold)]">
              Louange Connect 360
            </p>

            <h1 className="mt-4 text-5xl font-black leading-tight">
              Gestion mondiale des cellules, finances et patrimoine.
            </h1>

            <p className="mt-5 text-lg leading-8 text-white/80">
              Une plateforme simple pour connecter les cellules, suivre les
              activités, consolider les finances et donner une vue globale au
              leadership.
            </p>

            <Link
              href="https://www.egliselalouange.com/"
              target="_blank"
              className="mt-8 inline-flex rounded-2xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-black text-white transition hover:bg-white hover:text-[var(--louange-purple)]"
            >
              Voir le site officiel
            </Link>
          </div>
        </section>

        <section className="flex items-center justify-center p-5">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-6 shadow-2xl">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--louange-bg)] p-2 shadow louange-logo-animated">
                <Image
                  src="/logo-louange.png"
                  alt="Logo Église La Louange"
                  width={80}
                  height={80}
                  className="h-full w-full object-contain"
                  priority
                />
              </div>

              <h2 className="text-3xl font-black text-gray-950">
                Connexion
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Accès sécurisé à Louange Connect 360
              </p>
            </div>

            {errorMessage ? (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
                {errorMessage}
              </div>
            ) : null}

            {message ? (
              <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
                {message}
              </div>
            ) : null}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-800">
                  Email
                </label>
                <div className="flex items-center rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <Mail size={18} className="text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="email@exemple.com"
                    required
                    className="ml-2 w-full bg-transparent text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-800">
                  Mot de passe
                </label>
                <div className="flex items-center rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <Lock size={18} className="text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Mot de passe"
                    required
                    className="ml-2 w-full bg-transparent text-sm outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="text-gray-500"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResetPassword}
                disabled={isResetLoading}
                className="text-sm font-bold text-[var(--louange-purple)] hover:underline"
              >
                {isResetLoading ? "Envoi en cours..." : "Mot de passe oublié ?"}
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-2xl bg-[var(--louange-purple)] px-6 py-3 text-sm font-black text-white shadow-lg transition hover:bg-[var(--louange-purple-dark)] disabled:opacity-60"
              >
                {isLoading ? "Connexion..." : "Se connecter"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}