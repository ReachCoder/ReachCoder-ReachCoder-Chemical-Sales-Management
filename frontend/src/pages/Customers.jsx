
import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Users,
  X,
  RefreshCw,
} from "lucide-react";
import api from "../services/api";

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  address: "",
  telegram_chat_id: "",
  note: "",
};

function Customers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/customers");
      const result = response.data.data;

      setCustomers(Array.isArray(result) ? result : []);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to load customers"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    if (!keyword) return customers;

    return customers.filter((customer) =>
      [
        customer.name,
        customer.phone,
        customer.email,
        customer.address,
      ].some((value) =>
        String(value || "").toLowerCase().includes(keyword)
      )
    );
  }, [customers, search]);

  const openAddModal = () => {
    setEditingCustomer(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  };

  const openEditModal = (customer) => {
    setEditingCustomer(customer);
    setForm({
      name: customer.name || "",
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
      telegram_chat_id: customer.telegram_chat_id || "",
      note: customer.note || "",
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

    if (!form.name.trim()) {
      setError("Customer name is required");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        address: form.address.trim() || null,
        telegram_chat_id: form.telegram_chat_id.trim() || null,
        note: form.note.trim() || null,
      };

      if (editingCustomer) {
        await api.put(
          `/customers/${editingCustomer.id}`,
          payload
        );
        setMessage("Customer updated successfully");
      } else {
        await api.post("/customers", payload);
        setMessage("Customer created successfully");
      }

      setShowModal(false);
      setForm(emptyForm);
      setEditingCustomer(null);
      await fetchCustomers();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to save customer"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (customer) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${customer.name}?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setMessage("");

      await api.delete(`/customers/${customer.id}`);

      setMessage("Customer deleted successfully");
      await fetchCustomers();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to delete customer. This customer may have sales history."
      );
    }
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Customers
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your chemical business customers
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          Add Customer
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

      {/* Customer Summary */}
      <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">
              Total Customers
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {customers.length}
            </p>
          </div>
        </div>
      </div>

      {/* Customer Table */}
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-bold text-gray-900">
            Customer List
          </h2>

          <div className="flex gap-2">
            <div className="relative flex-1 sm:w-72">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customers..."
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <button
              onClick={fetchCustomers}
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
                <th className="px-5 py-4 font-medium">Customer</th>
                <th className="px-5 py-4 font-medium">Phone</th>
                <th className="px-5 py-4 font-medium">Email</th>
                <th className="px-5 py-4 font-medium">Address</th>
                <th className="px-5 py-4 text-right font-medium">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    Loading customers...
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    No customers found
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 font-medium text-gray-900">
                      {customer.name}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {customer.phone || "-"}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {customer.email || "-"}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {customer.address || "-"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEditModal(customer)}
                          className="rounded-lg p-2 text-blue-600 hover:bg-blue-50"
                          title="Edit"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          onClick={() => handleDelete(customer)}
                          className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t px-5 py-3 text-xs text-gray-500">
          Showing {filteredCustomers.length} of {customers.length} customers
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-8 w-full max-w-2xl rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-5">
              <h2 className="text-lg font-bold text-gray-900">
                {editingCustomer ? "Edit Customer" : "Add New Customer"}
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
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Customer Name *
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Enter customer name"
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Enter phone number"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Address
                </label>
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Enter address"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Telegram Chat ID
                </label>
                <input
                  name="telegram_chat_id"
                  value={form.telegram_chat_id}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Optional Telegram Chat ID"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Note
                </label>
                <textarea
                  name="note"
                  value={form.note}
                  onChange={handleChange}
                  rows="3"
                  className={inputClass}
                  placeholder="Additional information..."
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
                    : editingCustomer
                    ? "Update Customer"
                    : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Customers;
