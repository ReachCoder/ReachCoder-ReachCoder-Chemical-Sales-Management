import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  RefreshCw,
  Pencil,
  UserRound,
  ShieldCheck,
  Shield,
  UserCheck,
  UserX,
  KeyRound,
  X,
  Eye,
  EyeOff,
  LoaderCircle,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import api from "../services/api";

const EMPTY_FORM = {
  username: "",
  full_name: "",
  role: "STAFF",
  password: "",
};

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    "មានបញ្ហាក្នុងការភ្ជាប់ទៅ Server។ សូមព្យាយាមម្ដងទៀត។"
  );
}

function getList(response) {
  const payload = response?.data;
  const result = payload?.data ?? payload;
  return Array.isArray(result) ? result : [];
}

function getOne(response) {
  const payload = response?.data;
  return payload?.data ?? payload?.user ?? payload ?? {};
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function Modal({ title, subtitle, onClose, children, width = "max-w-lg" }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={`w-full ${width} max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl`}>
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-slate-800">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X size={19} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, required, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordUser, setPasswordUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [rowBusy, setRowBusy] = useState(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setPageError("");
    try {
      const response = await api.get("/users");
      setUsers(getList(response));
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        !keyword ||
        [user.username, user.full_name, user.role, String(user.id)]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" ? user.is_active === true : user.is_active === false);
      const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [users, search, statusFilter, roleFilter]);

  const stats = useMemo(
    () => ({
      total: users.length,
      active: users.filter((user) => user.is_active === true).length,
      inactive: users.filter((user) => user.is_active === false).length,
      admins: users.filter((user) => user.role === "ADMIN").length,
    }),
    [users]
  );

  function openCreate() {
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setShowPassword(false);
    setFormOpen(true);
  }

  function openEdit(user) {
    setEditingUser(user);
    setForm({
      username: user.username || "",
      full_name: user.full_name || "",
      role: user.role || "STAFF",
      password: "",
    });
    setFormOpen(true);
  }

  function closeForm() {
    if (saving) return;
    setFormOpen(false);
    setEditingUser(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setPageError("");
    setNotice("");

    const payload = {
      username: form.username.trim(),
      full_name: form.full_name.trim(),
      role: form.role,
    };

    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, payload);
        setNotice("បានកែប្រែព័ត៌មាន User ដោយជោគជ័យ។");
      } else {
        await api.post("/users", { ...payload, password: form.password });
        setNotice("បានបង្កើត User ថ្មីដោយជោគជ័យ។");
      }
      setFormOpen(false);
      setEditingUser(null);
      setForm(EMPTY_FORM);
      await loadUsers();
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(user) {
    const nextStatus = !user.is_active;
    const confirmed = window.confirm(
      `តើអ្នកពិតជាចង់${nextStatus ? "បើកដំណើរការ" : "បិទដំណើរការ"} គណនី ${user.username} មែនទេ?`
    );
    if (!confirmed) return;

    setRowBusy(user.id);
    setPageError("");
    setNotice("");
    try {
      await api.patch(`/users/${user.id}/status`, { is_active: nextStatus });
      setNotice(nextStatus ? "បានបើកគណនី User។" : "បានបិទគណនី User។");
      await loadUsers();
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setRowBusy(null);
    }
  }

  function openPassword(user) {
    setPasswordUser(user);
    setNewPassword("");
    setShowNewPassword(false);
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();
    if (!passwordUser) return;
    setSaving(true);
    setPageError("");
    setNotice("");
    try {
      await api.patch(`/users/${passwordUser.id}/password`, {
        new_password: newPassword,
      });
      setNotice(`បានប្តូរ Password របស់ ${passwordUser.username} ដោយជោគជ័យ។`);
      setPasswordUser(null);
      setNewPassword("");
    } catch (error) {
      setPageError(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">គ្រប់គ្រងអ្នកប្រើប្រាស់</h1>
          <p className="mt-1 text-sm text-slate-500">បង្កើត កែប្រែ និងគ្រប់គ្រងសិទ្ធិគណនី User</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={loadUsers}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus size={17} />
            បន្ថែម User
          </button>
        </div>
      </div>

      {pageError && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{pageError}</span>
          <button type="button" onClick={() => setPageError("")} className="ml-auto text-red-500 hover:text-red-700">
            <X size={17} />
          </button>
        </div>
      )}
      {notice && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 size={18} />
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice("")} className="ml-auto text-emerald-600 hover:text-emerald-800">
            <X size={17} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "User សរុប", value: stats.total, icon: UserRound, color: "blue" },
          { label: "កំពុងដំណើរការ", value: stats.active, icon: UserCheck, color: "emerald" },
          { label: "បានបិទ", value: stats.inactive, icon: UserX, color: "amber" },
          { label: "Admin", value: stats.admins, icon: ShieldCheck, color: "violet" },
        ].map((item) => {
          const Icon = item.icon;
          const tones = {
            blue: "bg-blue-50 text-blue-600",
            emerald: "bg-emerald-50 text-emerald-600",
            amber: "bg-amber-50 text-amber-600",
            violet: "bg-violet-50 text-violet-600",
          };
          return (
            <div key={item.label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">{item.label}</span>
                <span className={`rounded-xl p-2.5 ${tones[item.color]}`}><Icon size={19} /></span>
              </div>
              <p className="mt-3 text-2xl font-bold text-slate-800">{item.value}</p>
            </div>
          );
        })}
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
          <div className="relative min-w-0 flex-1">
            <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ស្វែងរកតាម Username, ឈ្មោះ ឬ Role..."
              className={`${inputClass} pl-10`}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className={inputClass}>
              <option value="ALL">Role ទាំងអស់</option>
              <option value="ADMIN">ADMIN</option>
              <option value="STAFF">STAFF</option>
            </select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className={inputClass}>
              <option value="ALL">ស្ថានភាពទាំងអស់</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4 font-semibold">User</th>
                <th className="px-5 py-4 font-semibold">Username</th>
                <th className="px-5 py-4 font-semibold">Role</th>
                <th className="px-5 py-4 font-semibold">ស្ថានភាព</th>
                <th className="px-5 py-4 font-semibold">ថ្ងៃបង្កើត</th>
                <th className="px-5 py-4 text-right font-semibold">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="6" className="px-5 py-14 text-center text-slate-500">
                  <LoaderCircle size={22} className="mx-auto mb-2 animate-spin text-blue-600" />
                  កំពុងទាញយកទិន្នន័យ...
                </td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan="6" className="px-5 py-14 text-center text-slate-500">
                  <UserRound size={28} className="mx-auto mb-2 text-slate-300" />
                  មិនមានទិន្នន័យ User ទេ
                </td></tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-700">
                          {(user.full_name || user.username || "U").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{user.full_name || "មិនទាន់មានឈ្មោះ"}</p>
                          <p className="text-xs text-slate-400">ID: {String(user.id)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-600">{user.username}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        user.role === "ADMIN" ? "bg-violet-50 text-violet-700" : "bg-slate-100 text-slate-600"
                      }`}>
                        {user.role === "ADMIN" ? <ShieldCheck size={13} /> : <Shield size={13} />}
                        {user.role || "STAFF"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        user.is_active ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${user.is_active ? "bg-emerald-500" : "bg-red-500"}`} />
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{formatDate(user.created_at)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button type="button" title="កែប្រែ User" onClick={() => openEdit(user)}
                          className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50"><Pencil size={16} /></button>
                        <button type="button" title="ប្តូរ Password" onClick={() => openPassword(user)}
                          className="rounded-lg p-2 text-violet-600 transition hover:bg-violet-50"><KeyRound size={16} /></button>
                        <button type="button" title={user.is_active ? "បិទ User" : "បើក User"}
                          disabled={rowBusy === user.id}
                          onClick={() => toggleStatus(user)}
                          className={`rounded-lg p-2 transition disabled:opacity-50 ${
                            user.is_active ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50"
                          }`}>
                          {rowBusy === user.id ? <LoaderCircle size={16} className="animate-spin" /> :
                            user.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
          បង្ហាញ {filteredUsers.length} ក្នុងចំណោម {users.length} Users
        </div>
      </section>

      {formOpen && (
        <Modal
          title={editingUser ? "កែប្រែ User" : "បង្កើត User ថ្មី"}
          subtitle={editingUser ? `កំពុងកែប្រែគណនី ${editingUser.username}` : "បញ្ចូលព័ត៌មានសម្រាប់គណនីថ្មី"}
          onClose={closeForm}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Full Name" required>
              <input required maxLength={100} value={form.full_name}
                onChange={(event) => setForm({ ...form, full_name: event.target.value })}
                placeholder="បញ្ចូលឈ្មោះពេញ" className={inputClass} />
            </Field>
            <Field label="Username" required>
              <input required minLength={3} maxLength={50} autoComplete="username"
                value={form.username}
                onChange={(event) => setForm({ ...form, username: event.target.value })}
                placeholder="បញ្ចូល Username" className={inputClass} />
            </Field>
            {!editingUser && (
              <Field label="Password" required hint="ត្រូវមានយ៉ាងហោចណាស់ 8 តួអក្សរ។">
                <div className="relative">
                  <input required minLength={8} autoComplete="new-password"
                    type={showPassword ? "text" : "password"} value={form.password}
                    onChange={(event) => setForm({ ...form, password: event.target.value })}
                    placeholder="បញ្ចូល Password" className={`${inputClass} pr-11`} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </Field>
            )}
            <Field label="Role" required>
              <select required value={form.role}
                onChange={(event) => setForm({ ...form, role: event.target.value })}
                className={inputClass}>
                <option value="STAFF">STAFF</option>
                <option value="ADMIN">ADMIN</option>
              </select>
              <span className="mt-1 block text-xs text-slate-400">
                ADMIN អាចគ្រប់គ្រង User; STAFF មានសិទ្ធិប្រើប្រាស់តាមការកំណត់របស់ប្រព័ន្ធ។
              </span>
            </Field>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button type="button" onClick={closeForm} disabled={saving}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                បោះបង់
              </button>
              <button type="submit" disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                {saving && <LoaderCircle size={16} className="animate-spin" />}
                {editingUser ? "រក្សាទុកការកែប្រែ" : "បង្កើត User"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {passwordUser && (
        <Modal title="ប្តូរ Password" subtitle={`គណនី: ${passwordUser.username}`} onClose={() => !saving && setPasswordUser(null)}>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <Field label="Password ថ្មី" required hint="ត្រូវមានយ៉ាងហោចណាស់ 8 តួអក្សរ។">
              <div className="relative">
                <input required minLength={8} autoComplete="new-password"
                  type={showNewPassword ? "text" : "password"} value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="បញ្ចូល Password ថ្មី" className={`${inputClass} pr-11`} />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showNewPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </Field>
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button type="button" onClick={() => setPasswordUser(null)} disabled={saving}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                បោះបង់
              </button>
              <button type="submit" disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60">
                {saving && <LoaderCircle size={16} className="animate-spin" />}
                ប្តូរ Password
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
