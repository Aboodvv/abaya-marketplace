"use client";

import { useEffect, useMemo, useState } from "react";
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
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          {t.admin.title}
        </h1>

        <div className="bg-white rounded-lg shadow p-6 mb-10">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            {t.admin.addProduct}
          </h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder={t.admin.nameEn}
              className="border rounded-lg px-4 py-2"
              required
            />
            <input
              name="nameAr"
              value={form.nameAr}
              onChange={handleChange}
              placeholder={t.admin.nameAr}
              className="border rounded-lg px-4 py-2"
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
              className="border rounded-lg px-4 py-2"
              required
            />
            <input
              name="image"
              value={form.image}
              onChange={handleChange}
              placeholder={t.admin.image}
              className="border rounded-lg px-4 py-2"
              required
            />
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder={t.admin.descriptionEn}
              className="border rounded-lg px-4 py-2 md:col-span-2"
              rows={2}
            />
            <textarea
              name="descriptionAr"
              value={form.descriptionAr}
              onChange={handleChange}
              placeholder={t.admin.descriptionAr}
              className="border rounded-lg px-4 py-2 md:col-span-2"
              rows={2}
            />
            <input
              name="category"
              value={form.category}
              onChange={handleChange}
              placeholder={t.admin.categoryEn}
              className="border rounded-lg px-4 py-2"
              required
            />
            <input
              name="categoryAr"
              value={form.categoryAr}
              onChange={handleChange}
              placeholder={t.admin.categoryAr}
              className="border rounded-lg px-4 py-2"
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
              className={`md:col-span-2 px-6 py-3 rounded-lg font-semibold ${
                saving ? "bg-gray-400" : "bg-gray-900 text-white hover:bg-gray-800"
              }`}
            >
              {saving ? t.common.loading : t.admin.save}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
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
                <div key={product.id} className="border rounded-lg p-4">
                  {editingId === product.id ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        name="name"
                        value={editForm.name}
                        onChange={handleEditChange}
                        className="border rounded-lg px-4 py-2"
                      />
                      <input
                        name="nameAr"
                        value={editForm.nameAr}
                        onChange={handleEditChange}
                        className="border rounded-lg px-4 py-2"
                      />
                      <input
                        name="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={editForm.price}
                        onChange={handleEditChange}
                        className="border rounded-lg px-4 py-2"
                      />
                      <input
                        name="image"
                        value={editForm.image}
                        onChange={handleEditChange}
                        className="border rounded-lg px-4 py-2"
                      />
                      <textarea
                        name="description"
                        value={editForm.description}
                        onChange={handleEditChange}
                        className="border rounded-lg px-4 py-2 md:col-span-2"
                        rows={2}
                      />
                      <textarea
                        name="descriptionAr"
                        value={editForm.descriptionAr}
                        onChange={handleEditChange}
                        className="border rounded-lg px-4 py-2 md:col-span-2"
                        rows={2}
                      />
                      <input
                        name="category"
                        value={editForm.category}
                        onChange={handleEditChange}
                        className="border rounded-lg px-4 py-2"
                      />
                      <input
                        name="categoryAr"
                        value={editForm.categoryAr}
                        onChange={handleEditChange}
                        className="border rounded-lg px-4 py-2"
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
                          className={`px-4 py-2 rounded-lg ${
                            saving
                              ? "bg-gray-400"
                              : "bg-gray-900 text-white hover:bg-gray-800"
                          }`}
                        >
                          {t.admin.update}
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300"
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
                          className="px-4 py-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600"
                        >
                          {t.admin.edit}
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
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
