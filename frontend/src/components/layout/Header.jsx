
import { useState } from "react";
import {
  Menu,
  Bell,
  LogOut,
  Search,
  ChevronDown,
  FlaskConical,
  X,
  ShieldAlert,
  CheckCircle2,
  UserRound,
  KeyRound,
  Loader2,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [loggingOut, setLoggingOut] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [logoutSuccess, setLogoutSuccess] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [passwordMessage, setPasswordMessage] = useState({
    type: "",
    text: "",
  });

  const displayName =
    user?.full_name || user?.username || "Administrator";

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // Logout
  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();

      setShowLogoutModal(false);
      setLogoutSuccess(true);

      setTimeout(() => {
        setLogoutSuccess(false);
      }, 3500);
    } catch (error) {
      console.error("Logout failed:", error);
      alert("Unable to logout. Please try again.");
    } finally {
      setLoggingOut(false);
    }
  };

  // Open Profile
  const openProfile = () => {
    setDropdownOpen(false);
    setShowProfileModal(true);
  };

  // Open Change Password
  const openPasswordModal = () => {
    setDropdownOpen(false);
    setPasswordMessage({ type: "", text: "" });
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setShowPasswordModal(true);
  };

  // Handle Password Input
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;

    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Change Password API
  const handleChangePassword = async (e) => {
    e.preventDefault();

    setPasswordMessage({ type: "", text: "" });

    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      setPasswordMessage({
        type: "error",
        text: "Please fill in all password fields.",
      });
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordMessage({
        type: "error",
        text: "New password must be at least 8 characters.",
      });
      return;
    }

    if (
      passwordForm.newPassword !== passwordForm.confirmPassword
    ) {
      setPasswordMessage({
        type: "error",
        text: "New passwords do not match.",
      });
      return;
    }

    try {
      setPasswordLoading(true);

      const response = await api.put("/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });

      setPasswordMessage({
        type: "success",
        text:
          response.data.message ||
          "Password changed successfully.",
      });

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      // Automatically logout after successful password change
      setTimeout(() => {
        logout();
      }, 1800);
    } catch (error) {
      console.error("Change Password Error:", error);

      setPasswordMessage({
        type: "error",
        text:
          error.response?.data?.message ||
          "Failed to change password. Please try again.",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const closePasswordModal = () => {
    if (passwordLoading) return;

    setShowPasswordModal(false);
    setPasswordMessage({ type: "", text: "" });
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between gap-3 border-b border-white/10 bg-[#191919] px-4 text-white shadow-lg sm:px-6 lg:px-8">

        {/* Left */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            onClick={onMenuClick}
            className="shrink-0 rounded-xl p-2 text-gray-300 transition hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          <div className="hidden w-full max-w-[420px] items-center gap-3 rounded-xl border border-white/10 bg-[#242424] px-4 py-2.5 sm:flex">
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

        {/* Right */}
        <div className="flex shrink-0 items-center gap-3 sm:gap-5">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl text-gray-300 hover:bg-white/10">
            <Bell size={20} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-[#191919] bg-orange-500" />
          </div>

          <div className="hidden h-9 w-px bg-white/10 sm:block" />

          {/* Profile Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-white/10 sm:gap-3"
              aria-expanded={dropdownOpen}
              aria-label="User profile menu"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-orange-400/30 bg-gradient-to-br from-orange-400 to-amber-600 text-xs font-bold text-white">
                {initials}
              </div>

              <div className="hidden min-w-0 text-left sm:block">
                <p className="max-w-[140px] truncate text-xs font-semibold text-white">
                  {displayName}
                </p>
                <p className="mt-0.5 text-[10px] capitalize text-gray-500">
                  {user?.role || "User"}
                </p>
              </div>

              <ChevronDown
                size={15}
                className={`hidden text-gray-400 transition-transform sm:block ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full z-50 mt-3 w-64 overflow-hidden rounded-2xl border border-gray-200 bg-white py-2 text-gray-800 shadow-2xl">

                <div className="border-b border-gray-100 px-4 py-3">
                  <p className="truncate text-sm font-bold">
                    {displayName}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {user?.username}
                  </p>
                </div>

                <button
                  onClick={openProfile}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm transition hover:bg-orange-50 hover:text-orange-600"
                >
                  <UserRound size={18} />
                  My Profile
                </button>

                <button
                  onClick={openPasswordModal}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm transition hover:bg-orange-50 hover:text-orange-600"
                >
                  <KeyRound size={18} />
                  Change Password
                </button>

                <div className="my-1 border-t border-gray-100" />

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    setShowLogoutModal(true);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-600 transition hover:bg-red-50"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Logout Success */}
      {logoutSuccess && (
        <div className="fixed right-5 top-20 z-[100] flex items-center gap-3 rounded-xl border border-green-200 bg-white px-5 py-4 text-gray-800 shadow-xl">
          <CheckCircle2 className="text-green-600" size={23} />
          <div>
            <p className="text-sm font-bold">
              Logout Successful
            </p>
            <p className="text-xs text-gray-500">
              You have successfully logged out.
            </p>
          </div>
        </div>
      )}

      {/* My Profile Modal */}
      {showProfileModal && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setShowProfileModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl bg-white p-6 text-gray-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold">My Profile</h2>
              <button
                onClick={() => setShowProfileModal(false)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
                aria-label="Close profile"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-6 flex flex-col items-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-600 text-2xl font-bold text-white">
                {initials}
              </div>
              <h3 className="mt-3 text-lg font-bold">
                {displayName}
              </h3>
              <span className="mt-1 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold capitalize text-orange-600">
                {user?.role || "User"}
              </span>
            </div>

            <div className="space-y-3 rounded-xl bg-gray-50 p-4">
              <div>
                <p className="text-xs text-gray-500">Full Name</p>
                <p className="mt-1 text-sm font-semibold">
                  {user?.full_name || "Not provided"}
                </p>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <p className="text-xs text-gray-500">Username</p>
                <p className="mt-1 text-sm font-semibold">
                  {user?.username || "Not provided"}
                </p>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <p className="text-xs text-gray-500">Role</p>
                <p className="mt-1 text-sm font-semibold">
                  {user?.role || "User"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={closePasswordModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="password-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 text-gray-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 id="password-title" className="text-lg font-bold">
                  Change Password
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  Keep your account secure.
                </p>
              </div>

              <button
                onClick={closePasswordModal}
                disabled={passwordLoading}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 disabled:opacity-50"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Current Password
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  autoComplete="current-password"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                  disabled={passwordLoading}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  New Password
                </label>
                <input
                  type="password"
                  name="newPassword"
                  autoComplete="new-password"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                  disabled={passwordLoading}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  placeholder="Enter new password (min. 8 characters)"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  autoComplete="new-password"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                  disabled={passwordLoading}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  placeholder="Confirm new password"
                />
              </div>

              {passwordMessage.text && (
                <div
                  className={`flex items-start gap-2 rounded-xl p-3 text-xs ${
                    passwordMessage.type === "success"
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {passwordMessage.type === "success" ? (
                    <CheckCircle2 size={17} className="shrink-0" />
                  ) : (
                    <ShieldAlert size={17} className="shrink-0" />
                  )}
                  <p>{passwordMessage.text}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={passwordLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {passwordLoading ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  <>
                    <KeyRound size={17} />
                    Update Password
                  </>
                )}
              </button>
            </form>

            {passwordMessage.type === "success" && (
              <p className="mt-3 text-center text-xs text-gray-500">
                You will be logged out automatically. Please login again
                using your new password.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => {
            if (!loggingOut) setShowLogoutModal(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-title"
            className="w-full max-w-[420px] rounded-2xl bg-white p-6 text-gray-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end">
              <button
                onClick={() => setShowLogoutModal(false)}
                disabled={loggingOut}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 disabled:opacity-50"
                aria-label="Close"
              >
                <X size={19} />
              </button>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                <ShieldAlert size={32} className="text-red-500" />
              </div>

              <h2 id="logout-title" className="text-xl font-bold">
                Are you sure?
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Are you sure you want to log out of your account?
                You will need to log in again to access the system.
              </p>

              <div className="mt-7 flex w-full gap-3">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  disabled={loggingOut}
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                >
                  <LogOut size={16} />
                  {loggingOut ? "Logging out..." : "Yes, Logout"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
