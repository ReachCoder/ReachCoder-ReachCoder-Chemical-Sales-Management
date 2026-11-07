

import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  CreditCard,
  Warehouse,
  BarChart3,
  UserCog,
  FlaskConical,
  X,
} from "lucide-react";

const menuItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Customers", path: "/customers", icon: Users },
  { label: "Products", path: "/products", icon: Package },
  { label: "Sales", path: "/sales", icon: ShoppingCart },
  { label: "Payments", path: "/payments", icon: CreditCard },
  { label: "Stock", path: "/stock", icon: Warehouse },
  { label: "Reports", path: "/reports", icon: BarChart3 },
  { label: "Users", path: "/users", icon: UserCog },
];

export default function Sidebar({ open, onClose }) {
  return (
    <>
      {open && (
        <button
          aria-label="Close sidebar overlay"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-900 text-white transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-slate-700 px-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-600 p-2">
              <FlaskConical size={24} />
            </div>
            <div>
              <h1 className="font-bold">Chemical Sales</h1>
              <p className="text-xs text-slate-400">Management System</p>
            </div>
          </div>

          <button onClick={onClose} className="lg:hidden">
            <X size={22} />
          </button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Main Menu
          </p>

          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/dashboard"}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`
                }
              >
                <Icon size={19} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-slate-700 p-4 text-xs text-slate-500">
          Chemical Sales System v1.0
        </div>
      </aside>
    </>
  );
}
