
import { useEffect, useMemo, useState } from "react";
import {
  Plus, Search, Pencil, Package, RefreshCw,
  X, Ban, Boxes, CheckCircle
} from "lucide-react";
import api from "../services/api";

const emptyForm = {
  name: "",
  sku: "",
  description: "",
  price: "",
  stock_quantity: "",
};

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/products");
      const result = response.data.data;

      setProducts(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load products"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    if (!keyword) return products;

    return products.filter((product) =>
      [product.name, product.sku, product.description]
        .some((value) =>
          String(value || "").toLowerCase().includes(keyword)
        )
    );
  }, [products, search]);

  const openAddModal = () => {
    setEditingProduct(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);

    setForm({
      name: product.name || "",
      sku: product.sku || "",
      description: product.description || "",
      price: product.price ?? "",
      stock_quantity: product.stock_quantity ?? "",
    });

    setError("");
    setShowModal(true);
  };

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.sku.trim()) {
      setError("Product name and SKU are required");
      return;
    }

    if (Number(form.price) < 0 || Number(form.stock_quantity) < 0) {
      setError("Price and stock cannot be negative");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim(),
        description: form.description.trim() || null,
        price: Number(form.price),
        stock_quantity: Number(form.stock_quantity),
      };

      if (editingProduct) {
        await api.put(
          `/products/${editingProduct.id}`,
          payload
        );
        setMessage("Product updated successfully");
      } else {
        await api.post("/products", payload);
        setMessage("Product created successfully");
      }

      setShowModal(false);
      setForm(emptyForm);
      setEditingProduct(null);

      await fetchProducts();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to save product"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (product) => {
    if (!product.is_active) return;

    const confirmed = window.confirm(
      `Deactivate product "${product.name}"?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      await api.delete(`/products/${product.id}`);

      setMessage("Product deactivated successfully");
      await fetchProducts();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to deactivate product"
      );
    }
  };

  const handleActivate = async (product) => {
  try {
    await api.put(`/products/${product.id}`, {
      is_active: true,
    });

    alert("Product activated successfully!");

    fetchProducts();
  } catch (error) {
    console.error("Activate product error:", error);

    alert(
      error.response?.data?.message ||
      "Failed to activate product."
    );
  }
};

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  const activeCount = products.filter(
    (product) => product.is_active
  ).length;

  const totalStock = products.reduce(
    (sum, product) =>
      sum + Number(product.stock_quantity || 0),
    0
  );

  const formatMoney = (value) =>
    `$${Number(value || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Products
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your chemical products and inventory
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          Add Product
        </button>
      </div>

      {/* Messages */}
      {message && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {message}
        </div>
      )}

      {error && !showModal && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-purple-100 p-3 text-purple-600">
              <Package size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Products</p>
              <p className="text-2xl font-bold">{products.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-green-100 p-3 text-green-600">
              <Boxes size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Stock Quantity</p>
              <p className="text-2xl font-bold">
                {totalStock.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-gray-900">Product List</h2>
            <p className="mt-1 text-xs text-gray-500">
              {activeCount} active products
            </p>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1 sm:w-72">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or SKU..."
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <button
              onClick={fetchProducts}
              className="rounded-lg border px-3 text-gray-600 hover:bg-gray-50"
              title="Refresh"
            >
              <RefreshCw size={17} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-5 py-4 font-medium">Product</th>
                <th className="px-5 py-4 font-medium">SKU</th>
                <th className="px-5 py-4 font-medium">Price</th>
                <th className="px-5 py-4 font-medium">Stock</th>
                <th className="px-5 py-4 font-medium">Status</th>
                <th className="px-5 py-4 text-right font-medium">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    Loading products...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    No products found
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">
                        {product.name}
                      </p>
                      <p className="mt-1 max-w-xs truncate text-xs text-gray-500">
                        {product.description || "-"}
                      </p>
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {product.sku}
                    </td>

                    <td className="px-5 py-4 font-medium text-gray-900">
                      {formatMoney(product.price)}
                    </td>

                    <td className="px-5 py-4 text-gray-700">
                      {Number(product.stock_quantity || 0).toLocaleString()}
                    </td>

                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                        product.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}>
                        {product.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(product)}
                          className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                          title="Edit"
                        >
                          <Pencil size={17} />
                        </button>

                        {product.is_active ? (
                          <button
                            onClick={() => handleDeactivate(product)}
                            title="Deactivate"
                            className="text-red-600 hover:text-red-800"
                          >
                            <Ban size={17} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivate(product)}
                            title="Activate"
                            className="text-green-600 hover:text-green-800"
                          >
                            <CheckCircle size={17} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t px-5 py-3 text-xs text-gray-500">
          Showing {filteredProducts.length} of {products.length} products
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-8 w-full max-w-xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-5">
              <h2 className="text-lg font-bold text-gray-900">
                {editingProduct ? "Edit Product" : "Add New Product"}
              </h2>

              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Product Name *
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Chemical Solution A"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  SKU *
                </label>
                <input
                  name="sku"
                  value={form.sku}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="CHEM-001"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Price *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className={inputClass}
                    placeholder="25.50"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Stock Quantity *
                  </label>
                  <input
                    type="number"
                    name="stock_quantity"
                    value={form.stock_quantity}
                    onChange={handleChange}
                    min="0"
                    step="1"
                    className={inputClass}
                    placeholder="100"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows="3"
                  className={inputClass}
                  placeholder="Product description..."
                />
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingProduct
                    ? "Update Product"
                    : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Products;
