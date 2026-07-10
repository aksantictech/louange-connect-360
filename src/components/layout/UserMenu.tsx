"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, KeyRound, LogOut, Save, UserRound, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  avatar_url: string | null;
};

export default function UserMenu() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [open, setOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  const [fullName, setFullName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      const { data: authData } = await supabase.auth.getUser();

      const user = authData.user;

      if (!user) {
        router.push("/login");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, avatar_url")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile(data as Profile);
        setFullName(data.full_name || "");
      }
    }

    loadProfile();
  }, [router]);

  const initials =
    profile?.full_name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "LC";

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  async function uploadAvatar(file?: File) {
    if (!file || !profile) return;

    setMessage("");
    setErrorMessage("");
    setIsLoading(true);

    const extension = file.name.split(".").pop() || "jpg";
    const fileName = `${profile.id}-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("user-avatars")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      setIsLoading(false);
      setErrorMessage(uploadError.message);
      return;
    }

    const { data } = supabase.storage
      .from("user-avatars")
      .getPublicUrl(fileName);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: data.publicUrl })
      .eq("id", profile.id);

    setIsLoading(false);

    if (updateError) {
      setErrorMessage(updateError.message);
      return;
    }

    setProfile((current) =>
      current ? { ...current, avatar_url: data.publicUrl } : current
    );

    setMessage("Photo de profil mise à jour.");
  }

  async function updateProfile() {
    if (!profile) return;

    setMessage("");
    setErrorMessage("");
    setIsLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim() })
      .eq("id", profile.id);

    setIsLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setProfile((current) =>
      current ? { ...current, full_name: fullName.trim() } : current
    );

    setMessage("Profil mis à jour.");
    setProfileModalOpen(false);
  }

  async function updatePassword() {
    setMessage("");
    setErrorMessage("");

    if (newPassword.length < 6) {
      setErrorMessage("Le nouveau mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    setIsLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setNewPassword("");
    setPasswordModalOpen(false);
    setMessage("Mot de passe mis à jour.");
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-2 py-1.5 shadow-sm"
      >
        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-[var(--louange-purple)] text-sm font-black text-white">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.full_name || "Utilisateur"}
              className="h-full w-full object-cover"
            />
          ) : (
            initials
          )}
        </div>

        <div className="hidden text-left sm:block">
          <p className="text-sm font-bold text-gray-900">
            {profile?.full_name || "Administrateur"}
          </p>
          <p className="text-xs text-gray-500">
            {profile?.role || "Connecté"}
          </p>
        </div>
      </button>

      {open ? (
        <div className="absolute right-0 z-50 mt-3 w-72 rounded-3xl border border-gray-100 bg-white p-3 shadow-2xl">
          {message ? (
            <div className="mb-2 rounded-2xl bg-green-50 p-3 text-xs font-bold text-green-700">
              {message}
            </div>
          ) : null}

          {errorMessage ? (
            <div className="mb-2 rounded-2xl bg-red-50 p-3 text-xs font-bold text-red-700">
              {errorMessage}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50"
          >
            <Camera size={18} />
            Modifier la photo
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(event) => uploadAvatar(event.target.files?.[0])}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setProfileModalOpen(true);
            }}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50"
          >
            <UserRound size={18} />
            Modifier le profil
          </button>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setPasswordModalOpen(true);
            }}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50"
          >
            <KeyRound size={18} />
            Modifier le mot de passe
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold text-red-700 hover:bg-red-50"
          >
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      ) : null}

      {profileModalOpen ? (
        <Modal title="Modifier le profil" onClose={() => setProfileModalOpen(false)}>
          <label className="mb-2 block text-sm font-bold text-gray-800">
            Nom complet
          </label>
          <input
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none"
          />

          <button
            type="button"
            onClick={updateProfile}
            disabled={isLoading}
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[var(--louange-purple)] px-5 py-3 text-sm font-black text-white"
          >
            <Save size={18} />
            Enregistrer
          </button>
        </Modal>
      ) : null}

      {passwordModalOpen ? (
        <Modal
          title="Modifier le mot de passe"
          onClose={() => setPasswordModalOpen(false)}
        >
          <label className="mb-2 block text-sm font-bold text-gray-800">
            Nouveau mot de passe
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none"
          />

          <button
            type="button"
            onClick={updatePassword}
            disabled={isLoading}
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[var(--louange-purple)] px-5 py-3 text-sm font-black text-white"
          >
            <Save size={18} />
            Modifier
          </button>
        </Modal>
      ) : null}
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-black text-gray-950">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-gray-100 p-2 text-gray-600"
          >
            <X size={18} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}