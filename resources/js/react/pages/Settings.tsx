import { useState, useEffect } from "react";
import { useI18n } from "../contexts/I18nContext";
import { useToast } from "../contexts/ToastContext";
import { Button, Card, Input, Field } from "../components/ui";
import { authApi, type User as ApiUser } from "../api/auth";

export default function Settings() {
  const { t } = useI18n();
  const { toast } = useToast();
  
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  const [curPwd, setCurPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [newPwd2, setNewPwd2] = useState("");
  const [pwdErr, setPwdErr] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      const user = await authApi.me();
      setCurrentUser(user);
      setFullName(user.fullName);
      setEmail(user.email || "");
    } catch (err) {
      console.error('Failed to fetch user:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  async function saveProfile() {
    try {
      setProfileLoading(true);
      const updatedUser = await authApi.updateProfile({ name: fullName, email: email || undefined });
      setCurrentUser(updatedUser);
      toast(t.profileUpdated, "success");
    } catch (err) {
      toast("Failed to update profile", "error");
    } finally {
      setProfileLoading(false);
    }
  }

  async function handleChangePassword() {
    setPwdErr("");
    if (newPwd.length < 8) { setPwdErr(t.passwordTooShort); return; }
    if (!/[A-Z]/.test(newPwd) || !/[a-z]/.test(newPwd) || !/[0-9]/.test(newPwd)) {
      setPwdErr(t.passwordRequirements); return;
    }
    if (newPwd !== newPwd2) { setPwdErr(t.passwordsNotMatch); return; }

    setPwdLoading(true);
    try {
      await authApi.changePassword({ currentPassword: curPwd, newPassword: newPwd, newPassword_confirmation: newPwd2 });
      setCurPwd(""); setNewPwd(""); setNewPwd2("");
      toast(t.passwordChanged, "success");
    } catch (err) {
      setPwdErr(err instanceof Error ? err.message : t.currentPasswordIncorrect);
    } finally {
      setPwdLoading(false);
    }
  }

  return (
    <div className="space-y-5 max-w-3xl">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div>
        </div>
      ) : (
      <>
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t.profileInfo}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t.profileInfoDesc}</p>
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={t.username}>
            <Input value={currentUser?.username ?? ""} disabled />
          </Field>
          <Field label={t.role}>
            <Input value={currentUser?.role ?? ""} disabled />
          </Field>
          <Field label={t.fullName} required>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </Field>
          <Field label={t.email}>
            <Input dir="ltr" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
        </div>
        <div className="mt-5 flex justify-end">
          <Button onClick={saveProfile} loading={profileLoading}>{t.save}</Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t.changePassword}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t.changePasswordDesc}</p>
        {pwdErr && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg px-3 py-2 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300">{pwdErr}</div>
        )}
        <div className="mt-5 space-y-4">
          <Field label={t.currentPassword} required>
            <Input type="password" value={curPwd} onChange={(e) => setCurPwd(e.target.value)} />
          </Field>
          <Field label={t.newPassword} required hint={t.newPasswordHint}>
            <Input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
          </Field>
          <Field label={t.confirmNewPassword} required>
            <Input type="password" value={newPwd2} onChange={(e) => setNewPwd2(e.target.value)} />
          </Field>
        </div>
        <div className="mt-5 flex justify-end">
          <Button onClick={handleChangePassword} loading={pwdLoading}>{t.changePasswordBtn}</Button>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t.aboutSystem}</h2>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <Info label={t.name} value={t.systemName} />
          <Info label={t.version} value="1.0.0" />
          <Info label={t.storage} value={t.storage} />
          <Info label={t.passwordSecurity} value="SHA-256 hashing + salt" />
          <Info label={t.sessionDuration} value={t.sessionDuration} />
          <Info label={t.maxLogRecords} value={t.maxLogRecords} />
        </div>
      </Card>
      </>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-slate-50 rounded-lg dark:bg-slate-800/50">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 mt-0.5">{value}</p>
    </div>
  );
}
