"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLanguage } from "@/context/LanguageContext";

interface AdminProduct {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  image: string;
  description: string;
  descriptionAr: string;
  category: string;
  categoryAr: string;
  inStock: boolean;
  createdAt: string;
}

const emptyProduct = {
  name: "",
  nameAr: "",
  price: 0,
  image: "",
  description: "",
  descriptionAr: "",
  category: "",
  categoryAr: "",
  inStock: true,
};

export default function AdminPage() {
  const { lang, t } = useLanguage();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyProduct);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyProduct);

  const productsRef = useMemo(() => collection(db, "products"), []);

  const loadProducts = async () => {
    setLoading(true);
    const snapshot = await getDocs(productsRef);
    const list = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<AdminProduct, "id">),
    }));
    setProducts(list);
    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setEditForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await addDoc(productsRef, {
      ...form,
      price: Number(form.price),
      createdAt: new Date().toISOString(),
    });
    setForm(emptyProduct);
    setSaving(false);
    await loadProducts();
  };

  const handleEdit = (product: AdminProduct) => {
    setEditingId(product.id);
    setEditForm({
      name: product.name,
      nameAr: product.nameAr,
      price: product.price,
      image: product.image,
      description: product.description,
      descriptionAr: product.descriptionAr,
      category: product.category,
      categoryAr: product.categoryAr,
      inStock: product.inStock,
    });
  };

  const handleUpdate = async (productId: string) => {
    setSaving(true);
    const productRef = doc(db, "products", productId);
    await updateDoc(productRef, {
      ...editForm,
      price: Number(editForm.price),
    });
    setEditingId(null);
    setSaving(false);
    await loadProducts();
  };

  const handleDelete = async (productId: string) => {
    await deleteDoc(doc(db, "products", productId));
    await loadProducts();
  };

  return (
    <div className="min-h-screen bg-[#f7f4ef] py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-[#c7a86a] mb-2">
            {lang === "ar" ? "الإدارة" : "Admin"}
          </p>
          <h1 className="text-4xl font-bold text-gray-900">
            {t.admin.title}
          </h1>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 mb-6 border border-[#efe7da]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                {lang === "ar" ? "بنرات الصفحة الرئيسية" : "Home Banners"}
              </h2>
              <p className="text-gray-600 text-sm mt-2">
                {lang === "ar"
                  ? "تحكم بصور البنرات الإعلانية من لوحة مخصصة."
                  : "Manage ad banner images from a dedicated panel."}
              </p>
            </div>
            <Link
              href="/admin/banners"
              className="inline-flex px-5 py-2 rounded-full bg-[#c7a86a] text-black font-semibold hover:bg-[#b59659] transition"
            >
              {lang === "ar" ? "فتح لوحة البنرات" : "Open banner panel"}
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 mb-10 border border-[#efe7da]">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            {t.admin.addProduct}
          </h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder={t.admin.nameEn}
              className="border border-[#efe7da] rounded-full px-4 py-3"
              required
            />
            <input
              name="nameAr"
              value={form.nameAr}
              onChange={handleChange}
              placeholder={t.admin.nameAr}
              className="border border-[#efe7da] rounded-full px-4 py-3"
              required
            />
            <input
              name="price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={handleChange}
              placeholder={t.admin.price}
              className="border border-[#efe7da] rounded-full px-4 py-3"
              required
            />
            <input
              name="image"
              value={form.image}
              onChange={handleChange}
              placeholder={t.admin.image}
              className="border border-[#efe7da] rounded-full px-4 py-3"
              required
            />
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder={t.admin.descriptionEn}
              className="border border-[#efe7da] rounded-3xl px-4 py-3 md:col-span-2"
              rows={2}
            />
            <textarea
              name="descriptionAr"
              value={form.descriptionAr}
              onChange={handleChange}
              placeholder={t.admin.descriptionAr}
              className="border border-[#efe7da] rounded-3xl px-4 py-3 md:col-span-2"
              rows={2}
            />
            <input
              name="category"
              value={form.category}
              onChange={handleChange}
              placeholder={t.admin.categoryEn}
              className="border border-[#efe7da] rounded-full px-4 py-3"
              required
            />
            <input
              name="categoryAr"
              value={form.categoryAr}
              onChange={handleChange}
              placeholder={t.admin.categoryAr}
              className="border border-[#efe7da] rounded-full px-4 py-3"
              required
            />
            <label className="flex items-center gap-2 text-gray-700">
              <input
                type="checkbox"
                name="inStock"
                checked={form.inStock}
                onChange={handleChange}
              />
              {t.admin.inStock}
            </label>
            <button
              type="submit"
              disabled={saving}
              className={`md:col-span-2 px-6 py-3 rounded-full font-semibold ${
                saving
                  ? "bg-gray-300"
                  : "bg-[#c7a86a] text-black hover:bg-[#b59659]"
              }`}
            >
              {saving ? t.common.loading : t.admin.save}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 border border-[#efe7da]">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            {t.admin.products}
          </h2>
          {loading ? (
            <p className="text-gray-600">{t.common.loading}</p>
          ) : products.length === 0 ? (
            <p className="text-gray-600">{t.admin.empty}</p>
          ) : (
            <div className="space-y-6">
              {products.map((product) => (
                <div key={product.id} className="border border-[#efe7da] rounded-3xl p-4">
                  {editingId === product.id ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        name="name"
                        value={editForm.name}
                        onChange={handleEditChange}
                        className="border border-[#efe7da] rounded-full px-4 py-3"
                      />
                      <input
                        name="nameAr"
                        value={editForm.nameAr}
                        onChange={handleEditChange}
                        className="border border-[#efe7da] rounded-full px-4 py-3"
                      />
                      <input
                        name="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={editForm.price}
                        onChange={handleEditChange}
                        className="border border-[#efe7da] rounded-full px-4 py-3"
                      />
                      <input
                        name="image"
                        value={editForm.image}
                        onChange={handleEditChange}
                        className="border border-[#efe7da] rounded-full px-4 py-3"
                      />
                      <textarea
                        name="description"
                        value={editForm.description}
                        onChange={handleEditChange}
                        className="border border-[#efe7da] rounded-3xl px-4 py-3 md:col-span-2"
                        rows={2}
                      />
                      <textarea
                        name="descriptionAr"
                        value={editForm.descriptionAr}
                        onChange={handleEditChange}
                        className="border border-[#efe7da] rounded-3xl px-4 py-3 md:col-span-2"
                        rows={2}
                      />
                      <input
                        name="category"
                        value={editForm.category}
                        onChange={handleEditChange}
                        className="border border-[#efe7da] rounded-full px-4 py-3"
                      />
                      <input
                        name="categoryAr"
                        value={editForm.categoryAr}
                        onChange={handleEditChange}
                        className="border border-[#efe7da] rounded-full px-4 py-3"
                      />
                      <label className="flex items-center gap-2 text-gray-700">
                        <input
                          type="checkbox"
                          name="inStock"
                          checked={editForm.inStock}
                          onChange={handleEditChange}
                        />
                        {t.admin.inStock}
                      </label>
                      <div className="flex gap-2 md:col-span-2">
                        <button
                          onClick={() => handleUpdate(product.id)}
                          disabled={saving}
                          className={`px-4 py-2 rounded-full ${
                            saving
                              ? "bg-gray-300"
                              : "bg-[#c7a86a] text-black hover:bg-[#b59659]"
                          }`}
                        >
                          {t.admin.update}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-4 py-2 rounded-full bg-[#f7f4ef] hover:bg-[#efe7da]"
                        >
                          {t.admin.cancel}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {lang === "ar" ? product.nameAr : product.name}
                        </p>
                        <p className="text-sm text-gray-600">${product.price}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="px-4 py-2 rounded-full bg-[#111] text-white hover:bg-black"
                        >
                          {t.admin.edit}
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="px-4 py-2 rounded-full bg-red-600 text-white hover:bg-red-700"
                        >
                          {t.admin.delete}
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
