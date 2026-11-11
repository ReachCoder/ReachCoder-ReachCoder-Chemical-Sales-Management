
import {
  Menu,
  Bell,
  LogOut,
  Search,
  ChevronDown,
  FlaskConical,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  const displayName =
    user?.full_name || user?.username || "Administrator";

  const initials = displayName
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between gap-3 border-b border-white/10 bg-[#191919] px-4 text-white shadow-lg sm:px-6 lg:px-8">

      {/* Left: Mobile Menu + Search */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          onClick={onMenuClick}
          className="shrink-0 rounded-xl p-2 text-gray-300 transition hover:bg-white/10 hover:text-white lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>

        <div className="hidden w-full max-w-[420px] items-center gap-3 rounded-xl border border-white/10 bg-[#242424] px-4 py-2.5 transition focus-within:border-orange-500/60 sm:flex">
          <Search size={18} className="shrink-0 text-gray-500" />

          <span className="truncate text-xs text-gray-500">
            Search customers, products, sales...
          </span>
        </div>

        <div className="flex items-center gap-2 sm:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500 text-white">
            <FlaskConical size={20} />
          </div>

          <span className="truncate text-sm font-bold">
            Chemical Sales
          </span>
        </div>
      </div>

      {/* Right: Notification + User */}
      <div className="flex shrink-0 items-center gap-3 sm:gap-5">

        {/* Notification */}
        <div className="relative flex h-10 w-10 items-center justify-center rounded-xl text-gray-300 transition hover:bg-white/10">
          <Bell size={20} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-[#191919] bg-orange-500" />
        </div>

        {/* Divider */}
        <div className="hidden h-9 w-px bg-white/10 sm:block" />

        {/* User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-orange-400/30 bg-gradient-to-br from-orange-400 to-amber-600 text-xs font-bold text-white">
            {initials}
          </div>

          <div className="hidden min-w-0 sm:block">
            <p className="max-w-[140px] truncate text-xs font-semibold text-white">
              {displayName}
            </p>

            <p className="mt-0.5 text-[10px] capitalize text-gray-500">
              {user?.role || "User"}
            </p>
          </div>

          <ChevronDown
            size={15}
            className="hidden text-gray-500 sm:block"
          />
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          title="Logout"
          aria-label="Logout"
          className="flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 px-3 text-gray-300 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut size={17} />
          <span className="hidden text-xs font-medium md:inline">
            Logout
          </span>
        </button>
      </div>
    </header>
  );
}
