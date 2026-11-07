
import { useEffect, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, RefreshCw, Search, Package } from "lucide-react";
import api from "../services/api";

function Stock() {
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [movementType, setMovementType] = useState("IN");
  const [form, setForm] = useState({
    product_id: "",
    quantity: "",
    note: "",
  });

  const getData = (response) => {
    const data = response?.data?.data ?? response?.data;
    return Array.isArray(data)
      ? data
      : data?.movements ?? data?.products ?? data?.items ?? [];
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [movementRes, productRes] = await Promise.all([
        api.get("/stock/movements"),
        api.get("/products"),
      ]);

      setMovements(getData(movementRes));
      setProducts(getData(productRes));
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "មិនអាចទាញយកទិន្នន័យស្តុកបានទេ។"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!form.product_id || !form.quantity || Number(form.quantity) <= 0) {
      setError("សូមជ្រើសរើសផលិតផល និងបញ្ចូលចំនួនឱ្យបានត្រឹមត្រូវ។");
      return;
    }

    try {
      setSaving(true);

      const userRes = await api.get("/auth/me");
      const userData = userRes.data?.user ??
        userRes.data?.data?.user ??
        userRes.data?.data;

      const userId = userData?.id;

      if (!userId) {
        throw new Error("មិនអាចរកឃើញ User ID បានទេ។");
      }

      const payload = {
        product_id: String(form.product_id),
        user_id: String(userId),
        quantity: Number(form.quantity),
        note: form.note,
      };

      const endpoint =
        movementType === "IN" ? "/stock/in" : "/stock/out";

      const response = await api.post(endpoint, payload);

      setMessage(
        response.data?.message ||
        (movementType === "IN"
          ? "បញ្ចូលស្តុកបានជោគជ័យ!"
          : "ដកស្តុកបានជោគជ័យ!")
      );

      setForm({ product_id: "", quantity: "", note: "" });
      await fetchData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "មានបញ្ហាក្នុងការរក្សាទុកទិន្នន័យ។"
      );
    } finally {
      setSaving(false);
    }
  };

  const filteredMovements = movements.filter((item) => {
    const productName =
      item.products?.name ??
      item.product?.name ??
      "";

    const keyword = search.toLowerCase();

    return (
      productName.toLowerCase().includes(keyword) ||
      String(item.movement_type ?? "").toLowerCase().includes(keyword) ||
      String(item.note ?? "").toLowerCase().includes(keyword)
    );
  });

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleString("en-GB");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Stock Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            គ្រប់គ្រងការបញ្ចូល និងដកស្តុកផលិតផល
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Messages */}
      {message && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Stock Form */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          Stock Transaction
        </h2>

        <div className="mb-5 flex gap-3">
          <button
            type="button"
            onClick={() => setMovementType("IN")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
              movementType === "IN"
                ? "bg-green-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <ArrowDownToLine size={17} />
            Stock In
          </button>

          <button
            type="button"
            onClick={() => setMovementType("OUT")}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${
              movementType === "OUT"
                ? "bg-orange-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <ArrowUpFromLine size={17} />
            Stock Out
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Product
            </label>
            <select
              name="product_id"
              value={form.product_id}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500"
            >
              <option value="">Select Product</option>
              {products.map((product) => (
                <option key={String(product.id)} value={String(product.id)}>
                  {product.name} ({product.sku})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Quantity
            </label>
            <input
              type="number"
              name="quantity"
              min="1"
              step="1"
              value={form.quantity}
              onChange={handleChange}
              required
              placeholder="Enter quantity"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Note
            </label>
            <textarea
              name="note"
              rows="3"
              value={form.note}
              onChange={handleChange}
              placeholder="Enter transaction note..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className={`flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60 ${
                movementType === "IN"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-orange-600 hover:bg-orange-700"
              }`}
            >
              {movementType === "IN" ? (
                <ArrowDownToLine size={18} />
              ) : (
                <ArrowUpFromLine size={18} />
              )}
              {saving
                ? "Saving..."
                : movementType === "IN"
                ? "Add Stock"
                : "Remove Stock"}
            </button>
          </div>
        </form>
      </div>

      {/* Movement History */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 p-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Stock Movement History
            </h2>
            <p className="text-sm text-gray-500">
              ប្រវត្តិនៃការបញ្ចូល និងដកស្តុក
            </p>
          </div>

          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 sm:w-64"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[750px] text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-5 py-3 font-semibold">No.</th>
                <th className="px-5 py-3 font-semibold">Product</th>
                <th className="px-5 py-3 font-semibold">Type</th>
                <th className="px-5 py-3 font-semibold">Quantity</th>
                <th className="px-5 py-3 font-semibold">User</th>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Note</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-5 py-10 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-5 py-10 text-center text-gray-500">
                    <Package className="mx-auto mb-2 text-gray-400" size={30} />
                    No stock movements found.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((item, index) => {
                  const type = String(item.movement_type ?? "").toUpperCase();
                  const productName =
                    item.products?.name ??
                    item.product?.name ??
                    "Unknown Product";
                  const username =
                    item.users?.username ??
                    item.user?.username ??
                    item.users?.full_name ??
                    item.user?.full_name ??
                    "-";

                  return (
                    <tr key={String(item.id ?? index)} className="hover:bg-gray-50">
                      <td className="px-5 py-3">{index + 1}</td>
                      <td className="px-5 py-3 font-medium text-gray-800">
                        {productName}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            type === "IN"
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {type || "-"}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-semibold">
                        {item.quantity ?? "-"}
                      </td>
                      <td className="px-5 py-3">{username}</td>
                      <td className="px-5 py-3 text-gray-500">
                        {formatDate(item.created_at ?? item.movement_date)}
                      </td>
                      <td className="max-w-xs truncate px-5 py-3 text-gray-500">
                        {item.note || "-"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Stock;
