
import { useCallback, useEffect, useState } from "react";
import api from "../services/api";

import {
  Users,
  Package,
  ShoppingCart,
  Wallet,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  CreditCard,
  CalendarDays,
  ArrowUpRight,
  CircleDollarSign,
} from "lucide-react";

function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/dashboard");
      setDashboard(response.data.data);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to load dashboard data"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const summary = dashboard?.summary;

  const formatMoney = (value) =>
    `$${Number(value || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatNumber = (value) =>
    Number(value || 0).toLocaleString("en-US");

  const cards = [
    {
      title: "Total Revenue",
      value: formatMoney(summary?.total_revenue),
      icon: Wallet,
      dark: true,
    },
    {
      title: "Total Customers",
      value: formatNumber(summary?.total_customers),
      icon: Users,
      color: "bg-orange-100 text-orange-600",
    },
    {
      title: "Active Products",
      value: formatNumber(summary?.total_products),
      icon: Package,
      color: "bg-yellow-100 text-yellow-700",
    },
    {
      title: "Total Sales",
      value: formatNumber(summary?.total_sales),
      icon: ShoppingCart,
      color: "bg-green-100 text-green-600",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f3] p-6">
        <div className="mx-auto max-w-7xl animate-pulse space-y-6">
          <div className="h-12 w-64 rounded-xl bg-gray-200" />
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-36 rounded-2xl bg-gray-200"
              />
            ))}
          </div>
          <div className="h-64 rounded-2xl bg-gray-200" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#f5f5f3] p-6">
        <div className="w-full max-w-md rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
          <AlertTriangle
            size={40}
            className="mx-auto mb-4 text-red-500"
          />
          <h2 className="text-lg font-bold text-gray-900">
            Unable to Load Dashboard
          </h2>
          <p className="mt-2 text-sm text-red-500">{error}</p>

          <button
            onClick={fetchDashboard}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-700"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f3] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">

        {/* Header */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Sales Dashboard
              </h1>
            </div>

            <p className="mt-1 text-sm text-gray-500">
              Monitor your chemical business performance and activities.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-600 shadow-sm">
              <CalendarDays size={17} className="text-gray-500" />
              {new Date().toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </div>

            <button
              onClick={fetchDashboard}
              className="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card, index) => {
            const Icon = card.icon;

            return (
              <div
                key={card.title}
                className={`group relative overflow-hidden rounded-2xl border p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-md ${
                  card.dark
                    ? "border-gray-900 bg-[#191919] text-white"
                    : "border-gray-100 bg-white text-gray-900"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p
                      className={`text-sm font-medium ${
                        card.dark ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {card.title}
                    </p>

                    <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
                      {card.value}
                    </h2>
                  </div>

                  <div
                    className={`rounded-xl p-3 ${
                      card.dark
                        ? "bg-[#33302a] text-[#f5ae36]"
                        : card.color
                    }`}
                  >
                    <Icon size={22} />
                  </div>
                </div>

                <div className="mt-5 flex items-center gap-2">
                  <span
                    className={`flex items-center gap-1 text-xs font-semibold ${
                      card.dark ? "text-green-400" : "text-green-600"
                    }`}
                  >
                    <TrendingUp size={14} />
                    Live data
                  </span>

                  <span
                    className={`text-xs ${
                      card.dark ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    From your database
                  </span>
                </div>

                {index === 0 && (
                  <div className="pointer-events-none absolute -bottom-8 -right-5 h-28 w-28 rounded-full bg-orange-400/10 blur-2xl" />
                )}
              </div>
            );
          })}
        </div>

        {/* Business Overview */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Business Overview
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Financial summary of your chemical business
                </p>
              </div>

              <div className="rounded-xl bg-orange-50 p-3 text-orange-600">
                <CircleDollarSign size={22} />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">

              {/* Payments Received */}
              <div className="rounded-xl border border-gray-100 bg-[#f8f8f7] p-5 transition hover:border-green-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-500">
                    Payments Received
                  </p>

                  <div className="rounded-lg bg-green-100 p-2 text-green-600">
                    <Wallet size={19} />
                  </div>
                </div>

                <p className="mt-4 text-2xl font-bold text-green-600">
                  {formatMoney(summary?.total_payments)}
                </p>

                <p className="mt-2 text-xs text-gray-400">
                  Total amount received
                </p>
              </div>

              {/* Remaining Balance */}
              <div className="rounded-xl border border-gray-100 bg-[#f8f8f7] p-5 transition hover:border-orange-200">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-500">
                    Remaining Balance
                  </p>

                  <div className="rounded-lg bg-orange-100 p-2 text-orange-600">
                    <CreditCard size={19} />
                  </div>
                </div>

                <p className="mt-4 text-2xl font-bold text-orange-600">
                  {formatMoney(summary?.remaining_balance)}
                </p>

                <p className="mt-2 text-xs text-gray-400">
                  Outstanding customer balance
                </p>
              </div>
            </div>

            {/* Revenue information */}
            <div className="mt-5 rounded-xl bg-[#191919] p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">
                    Total Business Revenue
                  </p>
                  <p className="mt-2 text-2xl font-bold">
                    {formatMoney(summary?.total_revenue)}
                  </p>
                </div>

                <div className="rounded-xl bg-white/10 p-3 text-orange-400">
                  <TrendingUp size={24} />
                </div>
              </div>
            </div>
          </div>

          {/* Stock Alert */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Stock Alert
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Inventory monitoring
                </p>
              </div>

              <div className="rounded-xl bg-orange-100 p-3 text-orange-600">
                <AlertTriangle size={22} />
              </div>
            </div>

            <div className="mt-8">
              <p className="text-5xl font-bold tracking-tight text-orange-500">
                {formatNumber(summary?.low_stock_products)}
              </p>

              <p className="mt-2 text-sm font-medium text-gray-600">
                Products with low stock
              </p>
            </div>

            <div className="mt-6 rounded-xl bg-orange-50 p-4">
              <p className="text-xs font-medium text-orange-700">
                Low Stock Threshold
              </p>

              <p className="mt-1 text-2xl font-bold text-orange-600">
                {dashboard?.low_stock_threshold ?? 10}
              </p>

              <p className="mt-1 text-xs text-orange-500">
                Units or less
              </p>
            </div>

            <div className="mt-5 flex items-center gap-2 text-xs text-gray-400">
              <span className="h-2 w-2 rounded-full bg-orange-500" />
              Inventory status from database
            </div>
          </div>
        </div>

        {/* Bottom Information */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
                <Users size={22} />
              </div>

              <div>
                <h3 className="font-bold text-gray-900">
                  Customer Management
                </h3>
                <p className="text-sm text-gray-500">
                  Manage your chemical business customers
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm text-gray-500">
              Total registered customers
            </p>

            <p className="mt-1 text-2xl font-bold text-gray-900">
              {formatNumber(summary?.total_customers)}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-purple-100 p-3 text-purple-600">
                <Package size={22} />
              </div>

              <div>
                <h3 className="font-bold text-gray-900">
                  Product Management
                </h3>
                <p className="text-sm text-gray-500">
                  Monitor your available products
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm text-gray-500">
              Total active products
            </p>

            <p className="mt-1 text-2xl font-bold text-gray-900">
              {formatNumber(summary?.total_products)}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pb-4 pt-2 text-center text-xs text-gray-400">
          Chemical Sales Management System © {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
