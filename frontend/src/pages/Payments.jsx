
import { useEffect, useMemo, useState } from "react";
import {
  Plus, Search, RefreshCw, Wallet, X, Eye
} from "lucide-react";
import api from "../services/api";

const getList = (response) => {
  const data = response.data?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.payments)) return data.payments;
  if (Array.isArray(data?.sales)) return data.sales;
  return [];
};

function Payments() {
  const [payments, setPayments] = useState([]);
  const [sales, setSales] = useState([]);
  const [userId, setUserId] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const [saleId, setSaleId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("CASH");
  const [note, setNote] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [paymentRes, salesRes, userRes] = await Promise.all([
        api.get("/payments"),
        api.get("/sales"),
        api.get("/auth/me"),
      ]);

      setPayments(getList(paymentRes));
      setSales(getList(salesRes));

      const user = userRes.data?.user ??
        userRes.data?.data?.user ??
        userRes.data?.data;

      setUserId(user?.id?.toString() || "");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to load payment information"
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

  const getSaleNumber = (payment) =>
    payment.sales?.sale_number ||
    payment.sale?.sale_number ||
    `SALE-${payment.sale_id || "-"}`;

  const getCustomerName = (payment) =>
    payment.sales?.customers?.name ||
    payment.sales?.customer?.name ||
    payment.sale?.customers?.name ||
    payment.sale?.customer?.name ||
    "-";

  const getPaymentDate = (payment) => {
    const date = payment.payment_date || payment.created_at;
    return date ? new Date(date).toLocaleDateString() : "-";
  };

  const filteredPayments = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    if (!keyword) return payments;

    return payments.filter((payment) =>
      [
        getSaleNumber(payment),
        getCustomerName(payment),
        payment.payment_method,
      ].some((value) =>
        String(value || "").toLowerCase().includes(keyword)
      )
    );
  }, [payments, search]);

  const selectedSale = sales.find(
    (sale) => String(sale.id) === String(saleId)
  );

  const saleTotal = Number(
    selectedSale?.total_amount ?? selectedSale?.total ?? 0
  );

  const alreadyPaid = Number(
    selectedSale?.payments?.reduce(
      (sum, payment) => sum + Number(payment.amount_paid || 0),
      0
    ) ?? selectedSale?.total_paid ?? 0
  );

  const remaining = Math.max(0, saleTotal - alreadyPaid);

  const openModal = () => {
    setSaleId("");
    setAmount("");
    setMethod("CASH");
    setNote("");
    setError("");
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const paymentAmount = Number(amount);

    if (!saleId) {
      setError("Please select a sale");
      return;
    }

    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      setError("Please enter a valid payment amount");
      return;
    }

    if (paymentAmount > remaining) {
      setError("Payment amount cannot exceed remaining balance");
      return;
    }

    if (!userId) {
      setError("Unable to identify logged-in user. Please log in again.");
      return;
    }

    try {
      setSaving(true);

      await api.post("/payments", {
        sale_id: String(saleId),
        user_id: String(userId),
        amount_paid: paymentAmount,
        payment_method: method,
        note: note.trim(),
      });

      setShowModal(false);
      setMessage("Payment recorded successfully");
      await fetchData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to record payment"
      );
    } finally {
      setSaving(false);
    }
  };

  const totalPaid = payments.reduce(
    (sum, payment) => sum + Number(payment.amount_paid || 0),
    0
  );

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage customer payments and outstanding balances
          </p>
        </div>

        <button
          onClick={openModal}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          Record Payment
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
            <div className="rounded-xl bg-green-100 p-3 text-green-600">
              <Wallet size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Payments Received</p>
              <p className="text-2xl font-bold">
                {formatMoney(totalPaid)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
              <Wallet size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Payment Records</p>
              <p className="text-2xl font-bold">{payments.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Table */}
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-bold text-gray-900">Payment History</h2>

          <div className="flex gap-2">
            <div className="relative flex-1 sm:w-72">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search sale or customer..."
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
          <table className="w-full min-w-[750px] text-left text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-5 py-4 font-medium">Sale Number</th>
                <th className="px-5 py-4 font-medium">Customer</th>
                <th className="px-5 py-4 font-medium">Date</th>
                <th className="px-5 py-4 font-medium">Amount</th>
                <th className="px-5 py-4 font-medium">Method</th>
                <th className="px-5 py-4 text-right font-medium">Details</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    Loading payments...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500">
                    No payments found
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 font-medium text-blue-600">
                      {getSaleNumber(payment)}
                    </td>
                    <td className="px-5 py-4 text-gray-700">
                      {getCustomerName(payment)}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {getPaymentDate(payment)}
                    </td>
                    <td className="px-5 py-4 font-semibold text-green-600">
                      {formatMoney(payment.amount_paid)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700">
                        {payment.payment_method}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelectedPayment(payment)}
                        className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
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
          Showing {filteredPayments.length} of {payments.length} payments
        </div>
      </div>

      {/* Record Payment Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-8 w-full max-w-xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-5">
              <h2 className="text-lg font-bold">Record New Payment</h2>
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
                  Select Sale *
                </label>
                <select
                  value={saleId}
                  onChange={(e) => {
                    setSaleId(e.target.value);
                    setAmount("");
                  }}
                  className="w-full rounded-lg border px-3 py-2.5 text-sm"
                  required
                >
                  <option value="">Choose a sale</option>
                  {sales.map((sale) => {
                    const paid = Number(
                      sale.payments?.reduce(
                        (sum, p) => sum + Number(p.amount_paid || 0),
                        0
                      ) ?? sale.total_paid ?? 0
                    );

                    const total = Number(
                      sale.total_amount ?? sale.total ?? 0
                    );

                    return (
                      <option
                        key={sale.id}
                        value={sale.id}
                        disabled={total - paid <= 0}
                      >
                        {sale.sale_number || `SALE-${sale.id}`} —
                        {` ${formatMoney(total - paid)} remaining`}
                      </option>
                    );
                  })}
                </select>
              </div>

              {saleId && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Sale Total</span>
                    <strong>{formatMoney(saleTotal)}</strong>
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-gray-500">Already Paid</span>
                    <strong>{formatMoney(alreadyPaid)}</strong>
                  </div>
                  <div className="mt-2 flex justify-between border-t pt-2 text-sm">
                    <span className="font-semibold">Remaining Balance</span>
                    <strong className="text-orange-600">
                      {formatMoney(remaining)}
                    </strong>
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Payment Amount *
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0.01"
                  max={remaining}
                  step="0.01"
                  className="w-full rounded-lg border px-3 py-2.5 text-sm"
                  placeholder="Enter payment amount"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Payment Method *
                </label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2.5 text-sm"
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK">Bank Transfer</option>
                  <option value="QR">QR Payment</option>
                </select>
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
                  placeholder="Optional note..."
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
                  disabled={saving || !saleId || remaining <= 0}
                  className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Processing..." : "Confirm Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Details Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-5">
              <h2 className="font-bold">Payment Details</h2>
              <button
                onClick={() => setSelectedPayment(null)}
                className="rounded-lg p-2 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 p-5 text-sm">
              <p>
                <span className="text-gray-500">Sale: </span>
                <strong>{getSaleNumber(selectedPayment)}</strong>
              </p>
              <p>
                <span className="text-gray-500">Customer: </span>
                <strong>{getCustomerName(selectedPayment)}</strong>
              </p>
              <p>
                <span className="text-gray-500">Date: </span>
                <strong>{getPaymentDate(selectedPayment)}</strong>
              </p>
              <p>
                <span className="text-gray-500">Method: </span>
                <strong>{selectedPayment.payment_method}</strong>
              </p>
              <p>
                <span className="text-gray-500">Note: </span>
                {selectedPayment.note || "-"}
              </p>

              <div className="border-t pt-4">
                <p className="text-gray-500">Amount Paid</p>
                <p className="mt-1 text-2xl font-bold text-green-600">
                  {formatMoney(selectedPayment.amount_paid)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Payments;
