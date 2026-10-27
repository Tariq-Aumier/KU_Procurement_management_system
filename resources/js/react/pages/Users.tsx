import { useState, useEffect, type FormEvent } from "react";
import { useToast } from "../contexts/ToastContext";
import { useI18n } from "../contexts/I18nContext";
import { Button, Card, Input, Field, Modal, Badge, ConfirmModal, EmptyState, Select } from "../components/ui";
import type { Role } from "../types";
import { usersApi, type User as ApiUser } from "../api/users";

const ROLE_TONE: Record<string, "red" | "blue" | "slate" | "amber" | "green" | "violet"> = {
  admin: "red",
  procurement_user: "blue",
};

const ROLE_LABEL: Record<string, { fa: string; ps: string; en: string }> = {
  admin: { fa: "مدیر سیستم / System Administrator", ps: "سیستم ایډمن / System Administrator", en: "System Administrator" },
  procurement_user: { fa: "کاربر تدارکات / Procurement User", ps: "د تدارکاتو کاروونکی / Procurement User", en: "Procurement User" },
};

export default function Users() {
  const { toast } = useToast();
  const { lang } = useI18n();
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<ApiUser | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ApiUser | null>(null);
  const [resetPwd, setResetPwd] = useState<ApiUser | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const usersData = await usersApi.list();
      setUsers(usersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
      console.error('Data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-5">
      <Card className="p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{lang === "en" ? "System Users" : lang === "ps" ? "د سیستم کاروونکي" : "کاربران سیستم"}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">{lang === "en" ? "User management with role-based access control" : lang === "ps" ? "User management with role-based access control" : "User management with role-based access control"}</p>
        </div>
        <Button onClick={() => setCreating(true)} icon={<span>＋</span>}>{lang === "en" ? "New User" : lang === "ps" ? "نوی کاروونکی" : "کاربر جدید"}</Button>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600 dark:text-red-400 mb-2">{error}</p>
          <Button onClick={fetchData} variant="secondary" size="sm">
            {lang === "en" ? "Retry" : lang === "ps" ? "بیاښه کړه" : "تلاش مجدد"}
          </Button>
        </div>
      ) : (
      <Card>
        {users.length === 0 ? (
          <EmptyState icon="👥" title={lang === "en" ? "No users" : lang === "ps" ? "هیڅ کاروونکی نشته" : "هیچ کاربری وجود ندارد"} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-600 uppercase dark:bg-slate-900/50 dark:border-slate-700 dark:text-slate-400">
                <tr>
                  <th className="text-right px-4 py-3 font-semibold">{lang === "en" ? "User" : lang === "ps" ? "کاروونکی" : "کاربر"}</th>
                  <th className="text-right px-4 py-3 font-semibold">{lang === "en" ? "Email" : lang === "ps" ? "ایمیل" : "ایمیل"}</th>
                  <th className="text-right px-4 py-3 font-semibold">{lang === "en" ? "Role" : lang === "ps" ? "رول" : "نقش"}</th>
                  <th className="text-right px-4 py-3 font-semibold">{lang === "en" ? "Status" : lang === "ps" ? "حالت" : "وضعیت"}</th>
                  <th className="text-left px-4 py-3 font-semibold">{lang === "en" ? "Actions" : lang === "ps" ? "عملونه" : "عملیات"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white flex items-center justify-center text-xs font-bold uppercase">
                          {u.username.slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">{u.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-slate-300" dir="ltr">{u.email || "—"}</td>
                    <td className="px-4 py-3"><Badge tone={ROLE_TONE[u.role as Role] || "slate"}>{ROLE_LABEL[u.role as Role]?.[lang] || u.role}</Badge></td>
                    <td className="px-4 py-3">
                      {u.active ? <Badge tone="green">{lang === "en" ? "✓ Active" : lang === "ps" ? "✓ فعال" : "✓ فعال"}</Badge> : <Badge tone="slate">{lang === "en" ? "Inactive" : lang === "ps" ? "غیرفعال" : "غیرفعال"}</Badge>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <Button size="sm" variant="ghost" onClick={() => setEditing(u)}>{lang === "en" ? "Edit" : lang === "ps" ? "سمول" : "ویرایش"}</Button>
                        <Button size="sm" variant="ghost" onClick={() => setResetPwd(u)}>{lang === "en" ? "Password" : lang === "ps" ? "پټنوم" : "رمز عبور"}</Button>
                        <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20" onClick={() => setConfirmDelete(u)}>{lang === "en" ? "Delete" : lang === "ps" ? "حذف" : "حذف"}</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      )}

      {(creating || editing) && (
        <UserForm
          initial={editing ?? undefined}
          existingUsers={users}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSave={async (u, plainPwd) => {
            try {
              if (editing) {
                await usersApi.update(editing.id, u);
                toast(lang === "en" ? "User updated" : lang === "ps" ? "کاروونکی نوی شو" : "کاربر به‌روز شد", "success");
              } else {
                await usersApi.create({ ...u, password: plainPwd });
                toast(lang === "en" ? "User added" : lang === "ps" ? "کاروونکی اضافه شو" : "کاربر اضافه شد", "success");
              }
              await fetchData();
              setCreating(false); setEditing(null);
            } catch (err) {
              toast("Error saving user", "error");
            }
          }}
        />
      )}

      {resetPwd && (
        <ResetPasswordModal
          user={resetPwd}
          onClose={() => setResetPwd(null)}
          onSave={async (pwd) => {
            try {
              await usersApi.update(resetPwd.id, { password: pwd });
              toast(lang === "en" ? "Password changed" : lang === "ps" ? "پټنوم بدل شو" : "رمز عبور تغییر کرد", "success");
              setResetPwd(null);
            } catch (err) {
              toast("Error changing password", "error");
            }
          }}
        />
      )}

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={async () => {
          if (confirmDelete) {
            try {
              await usersApi.delete(confirmDelete.id);
              await fetchData();
              toast(lang === "en" ? "Deleted" : lang === "ps" ? "حذف شو" : "حذف شد", "info");
            } catch (err) {
              toast("Error deleting user", "error");
            }
          }
        }}
        title={lang === "en" ? "Confirm Delete" : lang === "ps" ? "د حذف تایید" : "تایید حذف"}
        message={lang === "en" ? `Are you sure you want to delete user "${confirmDelete?.username}"?` : lang === "ps" ? `آیا د "${confirmDelete?.username}" کاروونکي حذف کول غواړئ؟` : `آیا می‌خواهید کاربر "${confirmDelete?.username}" را حذف کنید؟`}
      />
    </div>
  );
}

function UserForm({ initial, existingUsers, onClose, onSave }: { initial?: ApiUser; existingUsers: ApiUser[]; onClose: () => void; onSave: (u: Partial<ApiUser>, plainPwd?: string) => Promise<void> }) {
  const { lang } = useI18n();
  const [form, setForm] = useState<Partial<ApiUser>>(
    initial ?? {
      username: "",
      name: "",
      email: "",
      role: "procurement_user",
      active: true,
    }
  );
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  function submit(e: FormEvent) {
    e.preventDefault();
    const err: Record<string, string> = {};
    if (!form.username?.trim()) err.username = lang === "en" ? "Required" : lang === "ps" ? "اړین" : "ضروری";
    else if (!/^[a-zA-Z0-9_]{3,}$/.test(form.username)) err.username = lang === "en" ? "Min 3 chars, letters/numbers/_ only" : lang === "ps" ? "لږ تر لږه ۳ حروف، یوازې حروف/شمېرې/_" : "حداقل ۳ حرف، فقط حروف/اعداد/_";
    else if (existingUsers.some((u) => u.username.toLowerCase() === form.username!.toLowerCase() && u.id !== initial?.id))
      err.username = lang === "en" ? "Username already exists" : lang === "ps" ? "دا نوم مخکې شته" : "این نام قبلاً وجود دارد";
    if (!form.name?.trim()) err.name = lang === "en" ? "Required" : lang === "ps" ? "اړین" : "ضروری";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) err.email = lang === "en" ? "Invalid email" : lang === "ps" ? "اشتباه ایمیل" : "ایمیل اشتباه";

    if (!initial) {
      if (pwd.length < 8) err.pwd = lang === "en" ? "Password must be at least 8 characters" : lang === "ps" ? "پټنوم باید لږ تر لږه ۸ توري وي" : "رمز عبور باید حداقل ۸ کاراکتر باشد";
      else if (!/[A-Z]/.test(pwd) || !/[a-z]/.test(pwd) || !/[0-9]/.test(pwd))
        err.pwd = lang === "en" ? "Password must contain uppercase, lowercase, and numbers" : lang === "ps" ? "پټنوم باید لوی او واړه حروف او یوه شمېره ولري" : "رمز عبور باید شامل حروف بزرگ، کوچک و اعداد باشد";
      if (pwd !== pwd2) err.pwd2 = lang === "en" ? "Passwords do not match" : lang === "ps" ? "پټنومونه سره نه برابرېږي" : "رمز عبورها مطابقت ندارند";
    }

    if (Object.keys(err).length) { setErrors(err); return; }
    onSave(form, initial ? undefined : pwd);
  }

  const pwdStrength = passwordStrength(pwd);
  const strengthColors = ["bg-red-500", "bg-amber-500", "bg-blue-500", "bg-emerald-500"];

  return (
    <Modal open onClose={onClose} title={initial ? (lang === "en" ? "Edit User" : lang === "ps" ? "د کاروونکي سمول" : "ویرایش کاربر") : (lang === "en" ? "New User" : lang === "ps" ? "نوی کاروونکی" : "کاربر جدید")} size="md"
      footer={<><Button variant="secondary" onClick={onClose}>{lang === "en" ? "Cancel" : lang === "ps" ? "کنسل" : "لغو"}</Button><Button onClick={submit as never}>{initial ? (lang === "en" ? "Save" : lang === "ps" ? "ثبت" : "ذخیره") : (lang === "en" ? "Add" : lang === "ps" ? "اضافه" : "اضافه")}</Button></>}
    >
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4" noValidate>
        <Field label={lang === "en" ? "Username" : lang === "ps" ? "د کارن نوم" : "نام کاربری"} required error={errors.username}>
          <Input dir="ltr" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} invalid={!!errors.username} disabled={!!initial} />
        </Field>
        <Field label={lang === "en" ? "Full name" : lang === "ps" ? "بشپړ نوم" : "نام کامل"} required error={errors.name}>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} invalid={!!errors.name} />
        </Field>
        <Field label={lang === "en" ? "Email" : lang === "ps" ? "ایمیل" : "ایمیل"} error={errors.email}>
          <Input dir="ltr" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} invalid={!!errors.email} />
        </Field>
        <Field label={lang === "en" ? "Role" : lang === "ps" ? "رول" : "نقش"} required>
          <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="procurement_user">{lang === "en" ? "Procurement User" : lang === "ps" ? "د تدارکاتو کاروونکی" : "کاربر تدارکات"}</option>
            <option value="admin">{lang === "en" ? "System Administrator" : lang === "ps" ? "سیستم ایډمن" : "مدیر سیستم"}</option>
          </Select>
        </Field>
        <div className="sm:col-span-2">
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            {lang === "en" ? "Active account" : lang === "ps" ? "فعال حساب" : "حساب فعال"}
          </label>
        </div>
        {!initial && (
          <>
            <Field label={lang === "en" ? "Password" : lang === "ps" ? "پټنوم" : "رمز عبور"} required error={errors.pwd} hint={lang === "en" ? "Min 8 chars, uppercase/lowercase/numbers" : lang === "ps" ? "لږ تر لږه ۸ توري، لوی/واړه حروف او شمېره" : "حداقل ۸ کاراکتر، حروف بزرگ/کوچک و اعداد"}>
              <Input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} invalid={!!errors.pwd} />
              {pwd && (
                <div className="flex gap-1 mt-1.5">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className={`h-1 flex-1 rounded-full ${i < pwdStrength ? strengthColors[pwdStrength - 1] : "bg-slate-200"}`} />
                  ))}
                </div>
              )}
            </Field>
            <Field label={lang === "en" ? "Confirm password" : lang === "ps" ? "بیا پټنوم" : "تکرار رمز عبور"} required error={errors.pwd2}>
              <Input type="password" value={pwd2} onChange={(e) => setPwd2(e.target.value)} invalid={!!errors.pwd2} />
            </Field>
          </>
        )}
      </form>
    </Modal>
  );
}

function ResetPasswordModal({ user, onClose, onSave }: { user: ApiUser; onClose: () => void; onSave: (pwd: string) => Promise<void> }) {
  const { lang } = useI18n();
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [err, setErr] = useState("");

  async function submit() {
    if (pwd.length < 8) { setErr(lang === "en" ? "Password must be at least 8 characters" : lang === "ps" ? "پټنوم باید لږ تر لږه ۸ توري وي" : "رمز عبور باید حداقل ۸ کاراکتر باشد"); return; }
    if (!/[A-Z]/.test(pwd) || !/[a-z]/.test(pwd) || !/[0-9]/.test(pwd)) { setErr(lang === "en" ? "Password must contain uppercase/lowercase/numbers" : lang === "ps" ? "پټنوم باید لوی/واړه حروف او شمېره ولري" : "رمز عبور باید شامل حروف بزرگ/کوچک و اعداد باشد"); return; }
    if (pwd !== pwd2) { setErr(lang === "en" ? "Passwords do not match" : lang === "ps" ? "پټنومونه سره نه برابرېږي" : "رمز عبورها مطابقت ندارند"); return; }
    await onSave(pwd);
  }

  return (
    <Modal open onClose={onClose} title={`${lang === "en" ? "Change password" : lang === "ps" ? "د پټنوم بدلون" : "تغییر رمز عبور"} - ${user.username}`} size="sm"
      footer={<><Button variant="secondary" onClick={onClose}>{lang === "en" ? "Cancel" : lang === "ps" ? "کنسل" : "لغو"}</Button><Button onClick={submit as never}>{lang === "en" ? "Save" : lang === "ps" ? "ثبت" : "ذخیره"}</Button></>}
    >
      <div className="space-y-3">
        {err && <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg px-3 py-2">{err}</div>}
        <Field label={lang === "en" ? "New password" : lang === "ps" ? "نوی پټنوم" : "رمز عبور جدید"} required><Input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} /></Field>
        <Field label={lang === "en" ? "Confirm password" : lang === "ps" ? "بیا پټنوم" : "تکرار رمز عبور"} required><Input type="password" value={pwd2} onChange={(e) => setPwd2(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}

function passwordStrength(pwd: string): number {
  let s = 0;
  if (pwd.length >= 8) s++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return s;
}
