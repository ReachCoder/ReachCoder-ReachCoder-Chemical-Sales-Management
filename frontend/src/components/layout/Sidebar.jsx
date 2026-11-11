
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
  Droplets,
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
      {/* Mobile Overlay */}
      {open && (
        <button
          aria-label="Close sidebar overlay"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/5 bg-[#151515] text-white shadow-2xl transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-white/10 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-amber-600 text-white shadow-lg shadow-orange-500/20">
              <FlaskConical size={23} strokeWidth={2.3} />
            </div>

            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">
                Chemical Sales
              </h1>
              <p className="text-[10px] font-medium tracking-[2px] text-gray-500">
                MANAGEMENT SYSTEM
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close menu"
          >
            <X size={21} />
          </button>
        </div>

        {/* Menu */}
        <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-7">
          <p className="mb-4 px-3 text-[10px] font-bold uppercase tracking-[2px] text-gray-500">
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
                  `group flex items-center gap-3 rounded-xl px-4 py-3 text-[13px] font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-900/20"
                      : "text-gray-400 hover:bg-white/[0.07] hover:text-white"
                  }`
                }
              >
                <Icon
                  size={19}
                  strokeWidth={2}
                  className="shrink-0"
                />

                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar Information */}
        <div className="border-t border-white/10 p-4">
          <div className="rounded-2xl border border-white/5 bg-[#202020] p-4">
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/15 text-orange-400">
              <Droplets size={20} />
            </div>

            <h3 className="text-sm font-semibold text-white">
              Chemical Sales
            </h3>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              Manage your business in one place.
            </p>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-[10px] text-gray-500">
                System Version
              </span>

              <span className="rounded-md bg-white/5 px-2 py-1 text-[10px] font-medium text-orange-400">
                v1.0
              </span>
            </div>
          </div>

          <p className="mt-4 text-center text-[10px] text-gray-600">
            © {new Date().getFullYear()} Chemical Sales System
          </p>
        </div>
      </aside>
    </>
  );
}
