"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import {
  ADMIN_PERMISSION_OPTIONS,
  AdminPermission,
  useAdminAccess,
} from "@/lib/adminAccess";

interface AdminRoleEntry {
  id: string;
  roles: AdminPermission[];
  updatedAt?: string;
}

export default function AdminRolesPage() {
  const { lang, t } = useLanguage();
  const { user, userProfile, loading: authLoading } = useAuth();
  const { canAccess, loading: accessLoading, hasPermission } = useAdminAccess(userProfile);
  const canManageRoles = hasPermission("roles");

  const [entries, setEntries] = useState<AdminRoleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<AdminPermission[]>([]);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/roles");
      const list = await res.json();
      setEntries(list);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canAccess || !canManageRoles) return;
    loadEntries();
  }, [canAccess, canManageRoles]);

  const toggleRole = (role: AdminPermission) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((item) => item !== role) : [...prev, role]
    );
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    setSaving(true);
    const normalizedEmail = email.trim().toLowerCase();
    await fetch("/api/admin/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: normalizedEmail,
        roles: selectedRoles,
        updatedAt: new Date().toISOString(),
      }),
    });
    await loadEntries();
    setEmail("");
    setSelectedRoles([]);
    setSaving(false);
  };

  const handleEdit = (entry: AdminRoleEntry) => {
    setEmail(entry.id);
    setSelectedRoles(entry.roles || []);
  };

  const handleDelete = async (entryId: string) => {
    await fetch("/api/admin/roles", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: entryId }),
    });
    await loadEntries();
  };

  const permissionLabels = useMemo(
    () =>
      ADMIN_PERMISSION_OPTIONS.map((permission) => ({
        key: permission,
        label: t.adminRoles.permissions[permission],
      })),
    [t]
  );

  if (authLoading || accessLoading) {
    return (
      <div className="min-h-screen bg-[#f7f4ef] flex items-center justify-center">
        <p className="text-gray-600">{t.common.loading}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f7f4ef] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-[#efe7da] text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            {lang === "ar" ? "تسجيل الدخول مطلوب" : "Login required"}
          </h1>
          <p className="text-gray-600 mb-6">
            {lang === "ar" ? "يجب تسجيل الدخول للوصول للإدارة." : "Please log in to access admin."}
          </p>
          <Link
            href="/login"
            className="inline-flex px-6 py-3 rounded-full bg-[#c7a86a] text-black font-semibold"
          >
            {t.nav.login}
          </Link>
        </div>
      </div>
    );
  }

  if (!canAccess || !canManageRoles) {
    return (
      <div className="min-h-screen bg-[#f7f4ef] flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-[#efe7da] text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            {lang === "ar" ? "غير مصرح" : "Access denied"}
          </h1>
          <p className="text-gray-600 mb-6">
            {lang === "ar"
              ? "ليس لديك صلاحية للوصول إلى لوحة الإدارة."
              : "You do not have permission to access the admin panel."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f4ef] py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/admin"
            className="text-sm uppercase tracking-[0.3em] text-[#c7a86a] hover:underline"
          >
            {t.adminRoles.backToAdmin}
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mt-4">{t.adminRoles.title}</h1>
          <p className="text-gray-600 mt-2">{t.adminRoles.subtitle}</p>
        </div>

        <form
          onSubmit={handleSave}
          className="bg-white rounded-3xl shadow-xl p-6 border border-[#efe7da] space-y-4 mb-6"
        >
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t.adminRoles.email}
            className="border border-[#efe7da] rounded-full px-4 py-3 w-full"
            type="email"
            required
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {permissionLabels.map((permission) => (
              <label key={permission.key} className="flex items-center gap-2 text-gray-700">
                <input
                  type="checkbox"
                  checked={selectedRoles.includes(permission.key)}
                  onChange={() => toggleRole(permission.key)}
                />
                {permission.label}
              </label>
            ))}
          </div>
          <button
            type="submit"
            disabled={saving}
            className={`px-6 py-3 rounded-full font-semibold ${
              saving ? "bg-gray-300" : "bg-[#c7a86a] text-black hover:bg-[#b59659]"
            }`}
          >
            {saving ? t.adminRoles.saving : t.adminRoles.save}
          </button>
        </form>

        <div className="bg-white rounded-3xl shadow-xl p-6 border border-[#efe7da]">
          {loading ? (
            <p className="text-gray-600">{t.common.loading}</p>
          ) : entries.length === 0 ? (
            <p className="text-gray-600">{t.adminRoles.empty}</p>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="border border-[#efe7da] rounded-3xl p-4 flex flex-wrap items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-sm text-gray-500">{t.adminRoles.email}</p>
                    <p className="font-semibold text-gray-900">{entry.id}</p>
                    <p className="text-sm text-gray-600">
                      {entry.roles?.length
                        ? entry.roles
                            .filter((role): role is Exclude<AdminPermission, "owner"> => role !== "owner")
                            .map((role) => t.adminRoles.permissions[role])
                            .join(", ")
                        : t.adminRoles.noRoles}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(entry)}
                      className="px-4 py-2 rounded-full bg-[#111] text-white hover:bg-black"
                    >
                      {t.adminRoles.edit}
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="px-4 py-2 rounded-full bg-red-600 text-white hover:bg-red-700"
                    >
                      {t.adminRoles.delete}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
