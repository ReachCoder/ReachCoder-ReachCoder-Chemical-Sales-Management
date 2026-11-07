
import { useEffect, useState } from "react";
import api from "../services/api";
import {
  Users,
  Package,
  ShoppingCart,
  Wallet,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/dashboard");

      // Extract actual dashboard data
      setDashboard(response.data.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Failed to load dashboard data"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const summary = dashboard?.summary;

  const formatMoney = (value) =>
    `$${Number(value || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const cards = [
    {
      title: "Total Customers",
      value: summary?.total_customers ?? 0,
      icon: Users,
      color: "bg-blue-100 text-blue-600",
    },
    {
      title: "Active Products",
      value: summary?.total_products ?? 0,
      icon: Package,
      color: "bg-purple-100 text-purple-600",
    },
    {
      title: "Total Sales",
      value: summary?.total_sales ?? 0,
      icon: ShoppingCart,
      color: "bg-green-100 text-green-600",
    },
    {
      title: "Total Revenue",
      value: formatMoney(summary?.total_revenue),
      icon: Wallet,
      color: "bg-orange-100 text-orange-600",
    },
  ];

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        Loading dashboard...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="mb-4 text-red-600">{error}</p>
        <button
          onClick={fetchDashboard}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500">
            Overview of your chemical sales business
          </p>
        </div>

        <button
          onClick={fetchDashboard}
          className="flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm hover:bg-gray-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {card.title}
                </p>
                <div className={`rounded-xl p-3 ${card.color}`}>
                  <Icon size={21} />
                </div>
              </div>

              <h2 className="mt-4 text-2xl font-bold text-gray-900">
                {card.value}
              </h2>
            </div>
          );
        })}
      </div>

      {/* Business Overview */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="mb-5 text-lg font-bold text-gray-900">
            Business Overview
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-500">
                Payments Received
              </p>
              <p className="mt-2 text-xl font-bold text-green-600">
                {formatMoney(summary?.total_payments)}
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <p className="text-sm text-gray-500">
                Remaining Balance
              </p>
              <p className="mt-2 text-xl font-bold text-orange-600">
                {formatMoney(summary?.remaining_balance)}
              </p>
            </div>
          </div>
        </div>

        {/* Stock Alert */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-orange-500" size={20} />
            <h2 className="font-bold text-gray-900">
              Stock Alert
            </h2>
          </div>

          <p className="mt-4 text-3xl font-bold text-orange-600">
            {summary?.low_stock_products ?? 0}
          </p>

          <p className="text-sm text-gray-500">
            Products with low stock
          </p>

          <p className="mt-3 text-xs text-gray-400">
            Low stock threshold: {dashboard?.low_stock_threshold ?? 10}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
