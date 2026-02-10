"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useAdminAccess } from "@/lib/adminAccess";

interface CustomerProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  createdAt?: string;
}

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

export default function AdminCustomersPage() {
  const { lang, t } = useLanguage();
  const { user, userProfile, loading: authLoading } = useAuth();
  const { canAccess, loading: accessLoading, hasPermission } = useAdminAccess(userProfile);
  const canManageCustomers = hasPermission("customers");

  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<CustomerProfile>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!canAccess || !canManageCustomers) return;
    const loadCustomers = async () => {
      setLoading(true);
      const snapshot = await getDocs(query(collection(db, "users"), orderBy("createdAt", "desc")));
      const list = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Omit<CustomerProfile, "id">),
      }));
      setCustomers(list);
      setLoading(false);
    };

    loadCustomers();
  }, [canAccess, canManageCustomers]);

  const filteredCustomers = useMemo(() => {
    const queryText = search.trim().toLowerCase();
    return customers.filter((customer) => {
      if (!queryText) return true;
      const name = customer.name?.toLowerCase() || "";
      const email = customer.email?.toLowerCase() || "";
      const phone = customer.phone?.toLowerCase() || "";
      return name.includes(queryText) || email.includes(queryText) || phone.includes(queryText);
    });
  }, [customers, search]);

  const handleEdit = (customer: CustomerProfile) => {
    setEditingId(customer.id);
    setEditForm({
      name: customer.name,
      phone: customer.phone || "",
      city: customer.city || "",
      address: customer.address || "",
    });
  };

  const handleSave = async (customerId: string) => {
    setSaving(true);
    await updateDoc(doc(db, "users", customerId), {
      name: editForm.name || "",
      phone: editForm.phone || "",
      city: editForm.city || "",
      address: editForm.address || "",
      updatedAt: new Date().toISOString(),
    });
    setCustomers((prev) =>
      prev.map((customer) =>
        customer.id === customerId ? { ...customer, ...editForm } : customer
      )
    );
    setEditingId(null);
    setSaving(false);
  };

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

  if (!canAccess || !canManageCustomers) {
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/admin"
            className="text-sm uppercase tracking-[0.3em] text-[#c7a86a] hover:underline"
          >
            {t.adminCustomers.backToAdmin}
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mt-4">{t.adminCustomers.title}</h1>
          <p className="text-gray-600 mt-2">{t.adminCustomers.subtitle}</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 border border-[#efe7da] mb-6">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t.adminCustomers.search}
            className="border border-[#efe7da] rounded-full px-4 py-2 w-full md:w-80"
          />
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 border border-[#efe7da]">
          {loading ? (
            <p className="text-gray-600">{t.common.loading}</p>
          ) : filteredCustomers.length === 0 ? (
            <p className="text-gray-600">{t.adminCustomers.empty}</p>
          ) : (
            <div className="space-y-4">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="border border-[#efe7da] rounded-3xl p-4 flex flex-wrap items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-sm text-gray-500">{t.adminCustomers.name}</p>
                    <p className="font-semibold text-gray-900">{customer.name}</p>
                    <p className="text-sm text-gray-600">{customer.email}</p>
                    <p className="text-sm text-gray-600">{customer.phone || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">{t.adminCustomers.address}</p>
                    <p className="text-sm text-gray-600">{customer.city || "-"}</p>
                    <p className="text-sm text-gray-600">{customer.address || "-"}</p>
                    <p className="text-sm text-gray-600">
                      {t.adminCustomers.createdAt}: {formatDate(customer.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(customer)}
                      className="px-4 py-2 rounded-full bg-[#111] text-white hover:bg-black"
                    >
                      {t.adminCustomers.edit}
                    </button>
                  </div>

                  {editingId === customer.id && (
                    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <input
                        value={editForm.name || ""}
                        onChange={(event) =>
                          setEditForm((prev) => ({ ...prev, name: event.target.value }))
                        }
                        className="border border-[#efe7da] rounded-full px-4 py-2"
                        placeholder={t.adminCustomers.name}
                      />
                      <input
                        value={editForm.phone || ""}
                        onChange={(event) =>
                          setEditForm((prev) => ({ ...prev, phone: event.target.value }))
                        }
                        className="border border-[#efe7da] rounded-full px-4 py-2"
                        placeholder={t.adminCustomers.phone}
                      />
                      <input
                        value={editForm.city || ""}
                        onChange={(event) =>
                          setEditForm((prev) => ({ ...prev, city: event.target.value }))
                        }
                        className="border border-[#efe7da] rounded-full px-4 py-2"
                        placeholder={t.adminCustomers.city}
                      />
                      <input
                        value={editForm.address || ""}
                        onChange={(event) =>
                          setEditForm((prev) => ({ ...prev, address: event.target.value }))
                        }
                        className="border border-[#efe7da] rounded-full px-4 py-2"
                        placeholder={t.adminCustomers.address}
                      />
                      <div className="flex gap-2 md:col-span-2">
                        <button
                          onClick={() => handleSave(customer.id)}
                          disabled={saving}
                          className={`px-4 py-2 rounded-full ${
                            saving
                              ? "bg-gray-300"
                              : "bg-[#c7a86a] text-black hover:bg-[#b59659]"
                          }`}
                        >
                          {t.adminCustomers.save}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-4 py-2 rounded-full bg-[#f7f4ef] hover:bg-[#efe7da]"
                        >
                          {t.adminCustomers.cancel}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
