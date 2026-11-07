
import { Menu, Bell, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={23} />
        </button>

        <div>
          <h2 className="text-lg font-bold text-slate-800">
            Chemical Sales Management
          </h2>
          <p className="hidden text-xs text-slate-500 sm:block">
            Manage your business efficiently
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        <button
          className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell size={20} />
        </button>

        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-slate-800">
            {user?.full_name || user?.username}
          </p>
          <p className="text-xs text-slate-500">{user?.role}</p>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
        >
          <LogOut size={17} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
