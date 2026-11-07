import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  CreditCard,
  Users,
  Package,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import api from "../services/api";

const today = new Date();
const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

const toDateInput = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatMoney = (value) =>
  Number(value ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleDateString("en-GB");
};

// Supports both { data: { ... } } and { data: { data: { ... } } } API responses.
const getReportData = (response) =>
  response?.data?.data ?? response?.data ?? {};

function Reports() {
  const [activeTab, setActiveTab] = useState("sales");
  const [from, setFrom] = useState(toDateInput(firstDay));
  const [to, setTo] = useState(toDateInput(today));

  const [salesReport, setSalesReport] = useState({});
  const [paymentReport, setPaymentReport] = useState({});
  const [customerReport, setCustomerReport] = useState({});
  const [stockReport, setStockReport] = useState({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchReports = useCallback(async () => {
    if (from > to) {
      setError("កាលបរិច្ឆេទចាប់ផ្តើមមិនអាចធំជាងកាលបរិច្ឆេទបញ្ចប់បានទេ។");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const params = { from, to };
      const results = await Promise.allSettled([
        api.get("/sales-report", { params }),
        api.get("/payment-report", { params }),
        api.get("/customer-report", { params }),
        api.get("/stock-report"),
      ]);

      const setters = [
        setSalesReport,
        setPaymentReport,
        setCustomerReport,
        setStockReport,
      ];
      const names = [
        "Sales Report",
        "Payment Report",
        "Customer Report",
        "Stock Report",
      ];
      const failures = [];

      results.forEach((result, index) => {
        if (result.status === "fulfilled") {
          setters[index](getReportData(result.value));
        } else {
          failures.push(names[index]);
          setters[index]({});
          console.error(`${names[index]} request failed:`, result.reason);
        }
      });

      if (failures.length) {
        setError(`មិនអាចទាញយកទិន្នន័យបាន៖ ${failures.join(", ")}`);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "មិនអាចទាញយករបាយការណ៍បានទេ។"
      );
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const tabs = [
    { id: "sales", label: "Sales Report", icon: BarChart3 },
    { id: "payments", label: "Payment Report", icon: CreditCard },
    { id: "customers", label: "Customer Report", icon: Users },
    { id: "stock", label: "Stock Report", icon: Package },
  ];

  // Sales Report API mapping
  const sales = salesReport.summary ?? {};
  const dailySales = salesReport.dailySales ?? [];
  const topProducts = salesReport.topProducts ?? [];
  const recentSales = salesReport.recentSales ?? [];

  // Payment Report API mapping (response fields are at the root)
  const payments = paymentReport.summary ?? {};
  const paymentMethods = paymentReport.payment_methods ?? [];
  const outstandingSales = paymentReport.outstanding_sales ?? [];
  const recentPayments = paymentReport.recent_payments ?? [];

  // Customer Report API mapping (response fields are at the root)
  const customers = customerReport.summary ?? {};
  const topCustomers = customerReport.top_customers ?? [];
  const customerDetails = customerReport.customer_details ?? [];
  const recentPurchases = customerReport.recent_purchases ?? [];

  // Stock Report API mapping
  const stockProducts = stockReport.products ?? {};
  const stockStatus = stockReport.stockStatus ?? {};
  const stockMovements = stockReport.movements ?? {};
  const recentMovements = stockReport.recentMovements ?? [];

  const Card = ({ title, value, icon: Icon, color = "blue" }) => {
    const colors = {
      blue: "bg-blue-50 text-blue-600",
      green: "bg-green-50 text-green-600",
      orange: "bg-orange-50 text-orange-600",
      purple: "bg-purple-50 text-purple-600",
    };

    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{title}</p>
          <div className={`rounded-lg p-2 ${colors[color]}`}>
            <Icon size={20} />
          </div>
        </div>
        <p className="mt-3 text-2xl font-bold text-gray-800">{value ?? 0}</p>
      </div>
    );
  };

  const Table = ({ columns, rows, empty = "No data found." }) => (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[650px] text-left text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            {columns.map((column) => (
              <th key={column.label} className="px-5 py-3 font-semibold">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-5 py-10 text-center text-gray-500"
              >
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr
                key={String(row.id ?? row.sale_id ?? row.customer_id ?? index)}
                className="hover:bg-gray-50"
              >
                {columns.map((column) => (
                  <td key={column.label} className="px-5 py-3 text-gray-700">
                    {column.render
                      ? column.render(row)
                      : row[column.key] ?? "-"}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  const Section = ({ title, children }) => (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 p-5">
        <h2 className="font-semibold text-gray-800">{title}</h2>
      </div>
      {children}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
        <p className="mt-1 text-sm text-gray-500">
          របាយការណ៍ការលក់ ការទូទាត់ អតិថិជន និងស្តុក
        </p>
      </div>

      {/* Date Filter */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            From Date
          </label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            To Date
          </label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500"
          />
        </div>

        <button
          onClick={fetchReports}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          {loading ? "Loading..." : "Apply Filter"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium ${
              activeTab === id
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </div>

      {/* SALES REPORT */}
      {activeTab === "sales" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card title="Total Sales" value={sales.totalSales ?? 0} icon={BarChart3} />
            <Card
              title="Total Revenue"
              value={`$${formatMoney(sales.totalRevenue)}`}
              icon={TrendingUp}
              color="green"
            />
            <Card
              title="Average Sale"
              value={`$${formatMoney(sales.averageSale)}`}
              icon={CreditCard}
              color="purple"
            />
            <Card
              title="Items Sold"
              value={sales.totalItemsSold ?? 0}
              icon={Package}
              color="orange"
            />
          </div>

          <Section title="Daily Sales">
            <Table
              columns={[
                { label: "Date", render: (r) => formatDate(r.date) },
                { label: "Total Sales", key: "totalSales" },
                { label: "Revenue", render: (r) => `$${formatMoney(r.revenue)}` },
              ]}
              rows={dailySales}
            />
          </Section>

          <Section title="Top Selling Products">
            <Table
              columns={[
                { label: "Product", key: "product_name" },
                { label: "Quantity Sold", key: "quantity_sold" },
                { label: "Revenue", render: (r) => `$${formatMoney(r.revenue)}` },
              ]}
              rows={topProducts}
            />
          </Section>

          <Section title="Recent Sales">
            <Table
              columns={[
                { label: "Sale Number", key: "sale_number" },
                { label: "Customer", key: "customer_name" },
                { label: "Amount", render: (r) => `$${formatMoney(r.total_amount)}` },
                { label: "Date", render: (r) => formatDate(r.created_at) },
              ]}
              rows={recentSales}
            />
          </Section>
        </div>
      )}

      {/* PAYMENT REPORT */}
      {activeTab === "payments" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card
              title="Total Paid"
              value={`$${formatMoney(payments.total_paid)}`}
              icon={CreditCard}
              color="green"
            />
            <Card
              title="Total Payments"
              value={payments.total_payments ?? 0}
              icon={BarChart3}
            />
            <Card
              title="Outstanding"
              value={`$${formatMoney(payments.total_outstanding)}`}
              icon={TrendingUp}
              color="orange"
            />
            <Card
              title="Unpaid Sales"
              value={payments.unpaid_sales ?? 0}
              icon={CreditCard}
              color="purple"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card
              title="Partially Paid Sales"
              value={payments.partially_paid_sales ?? 0}
              icon={CreditCard}
              color="orange"
            />
            <Card
              title="Fully Paid Sales"
              value={payments.fully_paid_sales ?? 0}
              icon={TrendingUp}
              color="green"
            />
          </div>

          <Section title="Payment Methods">
            <Table
              columns={[
                { label: "Payment Method", key: "payment_method" },
                {
                  label: "Total Amount",
                  render: (r) => `$${formatMoney(r.total_amount)}`,
                },
                { label: "Transactions", key: "total_transactions" },
              ]}
              rows={paymentMethods}
            />
          </Section>

          <Section title="Outstanding Sales">
            <Table
              columns={[
                { label: "Sale ID", render: (r) => `#${r.sale_id}` },
                { label: "Customer", key: "customer" },
                { label: "Total Amount", render: (r) => `$${formatMoney(r.total_amount)}` },
                { label: "Paid Amount", render: (r) => `$${formatMoney(r.paid_amount)}` },
                { label: "Balance", render: (r) => `$${formatMoney(r.balance)}` },
                { label: "Date", render: (r) => formatDate(r.created_at) },
              ]}
              rows={outstandingSales}
            />
          </Section>

          <Section title="Recent Payments">
            <Table
              columns={[
                { label: "Payment ID", key: "id" },
                { label: "Sale ID", render: (r) => `#${r.sale_id}` },
                { label: "Customer", key: "customer" },
                { label: "Amount", render: (r) => `$${formatMoney(r.amount_paid)}` },
                { label: "Method", key: "payment_method" },
                { label: "Received By", key: "received_by" },
                { label: "Date", render: (r) => formatDate(r.payment_date) },
              ]}
              rows={recentPayments}
            />
          </Section>
        </div>
      )}

      {/* CUSTOMER REPORT */}
      {activeTab === "customers" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card
              title="Total Customers"
              value={customers.total_customers ?? 0}
              icon={Users}
            />
            <Card
              title="Active Customers"
              value={customers.active_customers ?? 0}
              icon={TrendingUp}
              color="green"
            />
            <Card
              title="Customers Without Purchases"
              value={customers.customers_without_purchases ?? 0}
              icon={Users}
              color="orange"
            />
            <Card
              title="Total Sales"
              value={customers.total_sales ?? 0}
              icon={BarChart3}
            />
            <Card
              title="Total Revenue"
              value={`$${formatMoney(customers.total_revenue)}`}
              icon={TrendingUp}
              color="green"
            />
            <Card
              title="Total Paid"
              value={`$${formatMoney(customers.total_paid)}`}
              icon={CreditCard}
              color="purple"
            />
            <Card
              title="Outstanding"
              value={`$${formatMoney(customers.total_outstanding)}`}
              icon={CreditCard}
              color="orange"
            />
          </div>

          <Section title="Top Customers">
            <Table
              columns={[
                { label: "Customer", key: "customer_name" },
                { label: "Total Sales", key: "total_sales" },
                { label: "Total Purchased", render: (r) => `$${formatMoney(r.total_purchased)}` },
                { label: "Total Paid", render: (r) => `$${formatMoney(r.total_paid)}` },
                { label: "Outstanding", render: (r) => `$${formatMoney(r.outstanding_balance)}` },
                { label: "Last Purchase", render: (r) => formatDate(r.last_purchase) },
              ]}
              rows={topCustomers}
            />
          </Section>

          <Section title="Customer Details">
            <Table
              columns={[
                { label: "Customer ID", key: "customer_id" },
                { label: "Customer", key: "customer_name" },
                { label: "Total Sales", key: "total_sales" },
                { label: "Total Purchased", render: (r) => `$${formatMoney(r.total_purchased)}` },
                { label: "Total Paid", render: (r) => `$${formatMoney(r.total_paid)}` },
                { label: "Outstanding", render: (r) => `$${formatMoney(r.outstanding_balance)}` },
                { label: "Last Purchase", render: (r) => formatDate(r.last_purchase) },
              ]}
              rows={customerDetails}
            />
          </Section>

          <Section title="Recent Purchases">
            <Table
              columns={[
                { label: "Sale ID", render: (r) => `#${r.sale_id}` },
                { label: "Customer", key: "customer_name" },
                { label: "Amount", render: (r) => `$${formatMoney(r.total_amount)}` },
                { label: "Date", render: (r) => formatDate(r.created_at) },
              ]}
              rows={recentPurchases}
            />
          </Section>
        </div>
      )}

      {/* STOCK REPORT */}
      {activeTab === "stock" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card
              title="Total Products"
              value={stockProducts.total ?? 0}
              icon={Package}
            />
            <Card
              title="Active Products"
              value={stockProducts.active ?? 0}
              icon={TrendingUp}
              color="green"
            />
            <Card
              title="Low Stock"
              value={stockStatus.lowStockCount ?? 0}
              icon={BarChart3}
              color="orange"
            />
            <Card
              title="Out of Stock"
              value={stockStatus.outOfStockCount ?? 0}
              icon={Package}
              color="purple"
            />
          </div>

          <Section title="Stock Summary">
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
              <div>
                <p className="text-sm text-gray-500">Total Stock Quantity</p>
                <p className="mt-1 text-xl font-bold text-gray-800">
                  {stockProducts.totalStock ?? 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Stock In Transactions</p>
                <p className="mt-1 text-xl font-bold text-green-600">
                  {stockMovements.IN?.transactions ?? 0}
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    (Qty: {stockMovements.IN?.quantity ?? 0})
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Stock Out Transactions</p>
                <p className="mt-1 text-xl font-bold text-orange-600">
                  {stockMovements.OUT?.transactions ?? 0}
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    (Qty: {stockMovements.OUT?.quantity ?? 0})
                  </span>
                </p>
              </div>
            </div>
          </Section>

          <Section title="Low Stock Products">
            <Table
              columns={[
                { label: "Product", key: "name" },
                { label: "SKU", key: "sku" },
                { label: "Stock Quantity", key: "stock_quantity" },
              ]}
              rows={stockStatus.lowStockProducts ?? []}
            />
          </Section>

          <Section title="Out of Stock Products">
            <Table
              columns={[
                { label: "Product", key: "name" },
                { label: "SKU", key: "sku" },
                { label: "Stock Quantity", key: "stock_quantity" },
              ]}
              rows={stockStatus.outOfStockProducts ?? []}
            />
          </Section>

          <Section title="Recent Stock Movements">
            <Table
              columns={[
                { label: "Product", render: (r) => r.products?.name ?? "-" },
                { label: "SKU", render: (r) => r.products?.sku ?? "-" },
                {
                  label: "Type",
                  render: (r) => (
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        r.movement_type === "IN"
                          ? "bg-green-100 text-green-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {r.movement_type}
                    </span>
                  ),
                },
                { label: "Quantity", key: "quantity" },
                { label: "Stock Before", key: "stock_before" },
                { label: "Stock After", key: "stock_after" },
                {
                  label: "User",
                  render: (r) =>
                    r.users?.full_name ?? r.users?.username ?? "-",
                },
                { label: "Date", render: (r) => formatDate(r.created_at) },
                { label: "Note", key: "note" },
              ]}
              rows={recentMovements}
            />
          </Section>
        </div>
      )}
    </div>
  );
}

export default Reports;
