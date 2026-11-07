
import { useEffect, useMemo, useState } from "react";
import {
  Plus, Search, ShoppingCart, RefreshCw, X,
  Trash2, Eye
} from "lucide-react";
import api from "../services/api";

const getList = (response) => {
  const data = response.data?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.sales)) return data.sales;
  if (Array.isArray(data?.customers)) return data.customers;
  if (Array.isArray(data?.products)) return data.products;
  return [];
};

function Sales() {
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [userId, setUserId] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);

  const [customerId, setCustomerId] = useState("");
  const [note, setNote] = useState("");
  const [cart, setCart] = useState([]);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState(1);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [salesRes, customersRes, productsRes, userRes] =
        await Promise.all([
          api.get("/sales"),
          api.get("/customers"),
          api.get("/products"),
          api.get("/auth/me"),
        ]);

      setSales(getList(salesRes));
      setCustomers(getList(customersRes));
      setProducts(getList(productsRes).filter((p) => p.is_active));

      const userData = userRes.data?.user ?? userRes.data?.data?.user
        ?? userRes.data?.data;

      setUserId(userData?.id?.toString() || "");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to load sales information"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatMoney = (value) =>
    `$${Number(value || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const totalAmount = useMemo(
    () =>
      cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      ),
    [cart]
  );

  const filteredSales = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    if (!keyword) return sales;

    return sales.filter((sale) =>
      [
        sale.sale_number,
        sale.customers?.name,
        sale.customer?.name,
      ].some((value) =>
        String(value || "").toLowerCase().includes(keyword)
      )
    );
  }, [sales, search]);

  const openModal = () => {
    setCustomerId("");
    setNote("");
    setCart([]);
    setProductId("");
    setQuantity(1);
    setError("");
    setShowModal(true);
  };

  const addProduct = () => {
    setError("");

    if (!productId) {
      setError("Please select a product");
      return;
    }

    const product = products.find(
      (p) => String(p.id) === String(productId)
    );

    if (!product) return;

    const qty = Number(quantity);
    const stock = Number(product.stock_quantity || 0);

    if (!Number.isInteger(qty) || qty <= 0) {
      setError("Quantity must be a positive whole number");
      return;
    }

    const existing = cart.find(
      (item) => String(item.product_id) === String(product.id)
    );

    const newQuantity = qty + (existing?.quantity || 0);

    if (newQuantity > stock) {
      setError(`Not enough stock for ${product.name}. Available: ${stock}`);
      return;
    }

    if (existing) {
      setCart((prev) =>
        prev.map((item) =>
          String(item.product_id) === String(product.id)
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    } else {
      setCart((prev) => [
        ...prev,
        {
          product_id: String(product.id),
          name: product.name,
          price: Number(product.price),
          quantity: qty,
          stock,
        },
      ]);
    }

    setProductId("");
    setQuantity(1);
  };

  const updateQuantity = (id, value) => {
    const qty = Number(value);
    const item = cart.find(
      (row) => String(row.product_id) === String(id)
    );

    if (!item || !Number.isInteger(qty) || qty < 1 || qty > item.stock) {
      return;
    }

    setCart((prev) =>
      prev.map((row) =>
        String(row.product_id) === String(id)
          ? { ...row, quantity: qty }
          : row
      )
    );
  };

  const removeItem = (id) => {
    setCart((prev) =>
      prev.filter((item) => String(item.product_id) !== String(id))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!customerId) {
      setError("Please select a customer");
      return;
    }

    if (cart.length === 0) {
      setError("Please add at least one product");
      return;
    }

    if (!userId) {
      setError("Unable to identify the logged-in user. Please log in again.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        customer_id: String(customerId),
        user_id: String(userId),
        items: cart.map((item) => ({
          product_id: String(item.product_id),
          quantity: item.quantity,
        })),
        note: note.trim(),
      };

      await api.post("/sales", payload);

      setShowModal(false);
      setMessage("Sale created successfully");
      await fetchData();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to create sale"
      );
    } finally {
      setSaving(false);
    }
  };

  const getSaleCustomer = (sale) =>
    sale.customers?.name ||
    sale.customer?.name ||
    "-";

  const getSaleTotal = (sale) =>
    sale.total_amount ?? sale.total ?? 0;

  const getSaleDate = (sale) => {
    const date = sale.created_at || sale.sale_date;
    return date ? new Date(date).toLocaleDateString() : "-";
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage sales transactions
          </p>
        </div>

        <button
          onClick={openModal}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          Create Sale
        </button>
      </div>

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
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
              <ShoppingCart size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Transactions</p>
              <p className="text-2xl font-bold">{sales.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-green-100 p-3 text-green-600">
              <ShoppingCart size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Sales Revenue</p>
              <p className="text-2xl font-bold">
                {formatMoney(
                  sales.reduce(
                    (sum, sale) => sum + Number(getSaleTotal(sale)),
                    0
                  )
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-bold text-gray-900">Sales History</h2>

          <div className="flex gap-2">
            <div className="relative flex-1 sm:w-72">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search sale number or customer..."
                className="w-full rounded-lg border py-2 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <button
              onClick={fetchData}
              className="rounded-lg border px-3 text-gray-600 hover:bg-gray-50"
              title="Refresh"
            >
              <RefreshCw size={17} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-5 py-4 font-medium">Sale Number</th>
                <th className="px-5 py-4 font-medium">Customer</th>
                <th className="px-5 py-4 font-medium">Date</th>
                <th className="px-5 py-4 font-medium">Total Amount</th>
                <th className="px-5 py-4 text-right font-medium">Details</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    Loading sales...
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    No sales found
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 font-medium text-blue-600">
                      {sale.sale_number || `SALE-${sale.id}`}
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {getSaleCustomer(sale)}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {getSaleDate(sale)}
                    </td>
                    <td className="px-5 py-4 font-semibold text-gray-900">
                      {formatMoney(getSaleTotal(sale))}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelectedSale(sale)}
                        className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                        title="View details"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t px-5 py-3 text-xs text-gray-500">
          Showing {filteredSales.length} of {sales.length} transactions
        </div>
      </div>

      {/* Create Sale Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-8 w-full max-w-3xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-5">
              <h2 className="text-lg font-bold">Create New Sale</h2>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-5">
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Select Customer *
                </label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm"
                  required
                >
                  <option value="">Choose a customer</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-lg border p-4">
                <h3 className="mb-3 font-semibold">Add Products</h3>

                <div className="grid gap-3 sm:grid-cols-[1fr_120px_auto]">
                  <select
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    className="rounded-lg border px-3 py-2.5 text-sm"
                  >
                    <option value="">Choose a product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name} — {formatMoney(product.price)} (Stock: {product.stock_quantity})
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="rounded-lg border px-3 py-2.5 text-sm"
                    placeholder="Quantity"
                  />

                  <button
                    type="button"
                    onClick={addProduct}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.product_id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-gray-50 p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatMoney(item.price)} each
                        </p>
                      </div>

                      <input
                        type="number"
                        min="1"
                        max={item.stock}
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(item.product_id, e.target.value)
                        }
                        className="w-20 rounded-lg border px-2 py-1.5 text-sm"
                      />

                      <p className="w-24 text-right font-semibold">
                        {formatMoney(item.price * item.quantity)}
                      </p>

                      <button
                        type="button"
                        onClick={() => removeItem(item.product_id)}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  ))}

                  {cart.length === 0 && (
                    <p className="py-4 text-center text-sm text-gray-400">
                      No products added yet
                    </p>
                  )}
                </div>

                <div className="mt-4 flex justify-between border-t pt-4">
                  <span className="font-semibold">Total Amount</span>
                  <span className="text-xl font-bold text-blue-600">
                    {formatMoney(totalAmount)}
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Note
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows="2"
                  className="w-full rounded-lg border px-3 py-2.5 text-sm"
                  placeholder="Optional sale note..."
                />
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border px-4 py-2 text-sm"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving || cart.length === 0}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Processing..." : "Confirm Sale"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sale Details Modal */}
      {selectedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-8 w-full max-w-xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-5">
              <h2 className="font-bold">Sale Details</h2>
              <button
                onClick={() => setSelectedSale(null)}
                className="rounded-lg p-2 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 p-5 text-sm">
              <p>
                <span className="text-gray-500">Sale Number: </span>
                <strong>{selectedSale.sale_number || selectedSale.id}</strong>
              </p>
              <p>
                <span className="text-gray-500">Customer: </span>
                <strong>{getSaleCustomer(selectedSale)}</strong>
              </p>
              <p>
                <span className="text-gray-500">Date: </span>
                <strong>{getSaleDate(selectedSale)}</strong>
              </p>

              <div className="border-t pt-3">
                <h3 className="mb-2 font-semibold">Items</h3>

                {(selectedSale.sale_items || selectedSale.items || []).map(
                  (item, index) => (
                    <div
                      key={item.id || index}
                      className="flex justify-between gap-3 border-b py-2"
                    >
                      <span>
                        {item.products?.name || item.product?.name || "Product"}
                        {" × "}
                        {item.quantity}
                      </span>
                      <span>
                        {formatMoney(
                          item.subtotal ??
                          Number(item.unit_price || 0) * Number(item.quantity || 0)
                        )}
                      </span>
                    </div>
                  )
                )}
              </div>

              <div className="flex justify-between border-t pt-3 text-base font-bold">
                <span>Total</span>
                <span>{formatMoney(getSaleTotal(selectedSale))}</span>
              </div>

              <p className="text-gray-500">
                Note: {selectedSale.note || "-"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Sales;
