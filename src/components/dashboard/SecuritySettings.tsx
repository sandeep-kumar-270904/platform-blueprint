import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, EyeOff, Eye, Mail, Download, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const SecuritySettings = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  
  // Email Change State
  const [newEmail, setNewEmail] = useState("");
  const [emailCurrentPassword, setEmailCurrentPassword] = useState("");
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordFields, setShowPasswordFields] = useState({ current: false, new: false, confirm: false });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Data Export & Deletion State
  const [exportLoading, setExportLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteEmailConfirm, setDeleteEmailConfirm] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  const isSocialOnly = user && !user.password && user.authProvider !== 'local';

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const getAuthToken = () => document.cookie.split(';').find(c => c.trim().startsWith('accessToken='))?.split('=')[1];

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    try {
      const token = getAuthToken();
      
      const res = await fetch(`${API_URL}/api/settings/request-email-change`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ newEmail, currentPassword: emailCurrentPassword })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to request email change");
      
      setEmailSuccess(true);
      setNewEmail("");
      setEmailCurrentPassword("");
      toast.success("Confirmation email sent to new address");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setEmailLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    setPasswordLoading(true);
    try {
      const token = getAuthToken();
      
      const res = await fetch(`${API_URL}/api/settings/change-password`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to change password");
      
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated successfully");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleExportData = async () => {
    setExportLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/api/settings/export-data`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to initiate data export");
      }
      
      toast.success("Preparing your download — we'll email you a link.");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteEmailConfirm !== user?.email) return;

    setDeleteLoading(true);
    try {
      const token = getAuthToken();
      const res = await fetch(`${API_URL}/api/settings/delete-account`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ email: deleteEmailConfirm })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Failed to delete account");
      }

      await signOut();
      toast.success("Your account has been deleted");
      navigate("/", { replace: true });
    } catch (error: any) {
      toast.error(error.message);
      setDeleteLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Email Settings */}
      <Card className="bg-[#FDFBF7] border-zinc-200 shadow-sm rounded-none">
        <CardHeader className="border-b border-zinc-100 pb-4">
          <CardTitle className="text-xl font-serif text-zinc-900 flex items-center gap-2">
            <Mail className="h-4 w-4 text-amber-600" />
            Change email
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Current Email</span>
            <p className="text-zinc-900 font-medium">{user?.email}</p>
          </div>

          <div aria-live="polite">
            {emailSuccess && (
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-4">
                <p className="text-amber-900 text-sm font-medium">Confirm your new email — check your inbox.</p>
              </div>
            )}
          </div>

          <form onSubmit={handleEmailChange} className="space-y-6">
            <div className="space-y-2 relative">
              <label htmlFor="newEmail" className="text-xs font-semibold uppercase tracking-wider text-zinc-500">New Email Address</label>
              <input
                id="newEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                className="w-full bg-transparent border-0 border-b-2 border-zinc-200 px-0 py-2 text-zinc-900 placeholder:text-zinc-300 focus:ring-0 focus:border-amber-500 outline-none transition-colors"
                placeholder="new@example.com"
              />
            </div>

            {!isSocialOnly && (
              <div className="space-y-2 relative">
                <label htmlFor="emailCurrentPassword" className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Current Password</label>
                <div className="relative">
                  <input
                    id="emailCurrentPassword"
                    type={showEmailPassword ? "text" : "password"}
                    value={emailCurrentPassword}
                    onChange={(e) => setEmailCurrentPassword(e.target.value)}
                    required
                    className="w-full bg-transparent border-0 border-b-2 border-zinc-200 px-0 py-2 pr-10 text-zinc-900 placeholder:text-zinc-300 focus:ring-0 focus:border-amber-500 outline-none transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    aria-label={showEmailPassword ? "Hide password" : "Show password"}
                    aria-pressed={showEmailPassword}
                    onClick={() => setShowEmailPassword(!showEmailPassword)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors p-2 outline-none focus-visible:text-amber-500 focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
                  >
                    {showEmailPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={emailLoading}
              className="bg-zinc-950 text-zinc-50 py-2.5 px-6 font-medium transition-all hover:bg-zinc-800 disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 border-b-[3px] border-amber-500 active:translate-y-[1px] active:border-b-2 text-sm"
            >
              {emailLoading ? "Updating..." : "Update email"}
            </button>
          </form>
        </CardContent>
      </Card>

      {/* Password Settings */}
      <Card className="bg-[#FDFBF7] border-zinc-200 shadow-sm rounded-none">
        <CardHeader className="border-b border-zinc-100 pb-4">
          <CardTitle className="text-xl font-serif text-zinc-900 flex items-center gap-2">
            <Shield className="h-4 w-4 text-amber-600" />
            {isSocialOnly ? "Set a password" : "Change password"}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handlePasswordChange} className="space-y-6">
            {!isSocialOnly && (
              <div className="space-y-2 relative">
                <label htmlFor="currentPassword" className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Current Password</label>
                <div className="relative">
                  <input
                    id="currentPassword"
                    type={showPasswordFields.current ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full bg-transparent border-0 border-b-2 border-zinc-200 px-0 py-2 pr-10 text-zinc-900 placeholder:text-zinc-300 focus:ring-0 focus:border-amber-500 outline-none transition-colors"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    aria-label={showPasswordFields.current ? "Hide current password" : "Show current password"}
                    aria-pressed={showPasswordFields.current}
                    onClick={() => setShowPasswordFields(prev => ({ ...prev, current: !prev.current }))}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors p-2 outline-none focus-visible:text-amber-500 focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
                  >
                    {showPasswordFields.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2 relative">
              <label htmlFor="newPassword" className="text-xs font-semibold uppercase tracking-wider text-zinc-500">New Password</label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showPasswordFields.new ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full bg-transparent border-0 border-b-2 border-zinc-200 px-0 py-2 pr-10 text-zinc-900 placeholder:text-zinc-300 focus:ring-0 focus:border-amber-500 outline-none transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  aria-label={showPasswordFields.new ? "Hide new password" : "Show new password"}
                  aria-pressed={showPasswordFields.new}
                  onClick={() => setShowPasswordFields(prev => ({ ...prev, new: !prev.new }))}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors p-2 outline-none focus-visible:text-amber-500 focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
                >
                  {showPasswordFields.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[11px] text-zinc-500 mt-1">Must be at least 6 characters long</p>
            </div>

            <div className="space-y-2 relative">
              <label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Confirm New Password</label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showPasswordFields.confirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full bg-transparent border-0 border-b-2 border-zinc-200 px-0 py-2 pr-10 text-zinc-900 placeholder:text-zinc-300 focus:ring-0 focus:border-amber-500 outline-none transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  aria-label={showPasswordFields.confirm ? "Hide confirm password" : "Show confirm password"}
                  aria-pressed={showPasswordFields.confirm}
                  onClick={() => setShowPasswordFields(prev => ({ ...prev, confirm: !prev.confirm }))}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors p-2 outline-none focus-visible:text-amber-500 focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
                >
                  {showPasswordFields.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div aria-live="polite">
                {newPassword && confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-amber-600 text-[11px] mt-1 font-medium">Passwords don't match</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={passwordLoading || (newPassword !== confirmPassword && newPassword !== "")}
              className="bg-zinc-950 text-zinc-50 py-2.5 px-6 font-medium transition-all hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-70 disabled:cursor-not-allowed border-b-[3px] border-amber-500 active:translate-y-[1px] active:border-b-2 text-sm"
            >
              {passwordLoading ? "Updating..." : isSocialOnly ? "Set password" : "Update password"}
            </button>
          </form>
        </CardContent>
      </Card>

      {/* Data Export & Account Deletion */}
      <Card className="bg-[#FDFBF7] border-zinc-200 shadow-sm rounded-none">
        <CardHeader className="border-b border-zinc-100 pb-4">
          <CardTitle className="text-xl font-serif text-zinc-900 flex items-center gap-2">
            <Download className="h-4 w-4 text-zinc-600" />
            Data export
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-sm text-zinc-600 mb-6">
            Download a complete JSON and CSV export of everything tied to your account across all modules (profile, applications, logs, notes, etc). This will be prepared in the background and emailed to you.
          </p>
          <button
            onClick={handleExportData}
            disabled={exportLoading}
            className="bg-white border-2 border-zinc-200 text-zinc-900 py-2.5 px-6 font-medium transition-all hover:bg-zinc-50 hover:border-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 disabled:opacity-70 text-sm"
          >
            {exportLoading ? "Requesting..." : "Download your data"}
          </button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="bg-[#FDFBF7] border-red-200 shadow-sm rounded-none">
        <CardHeader className="border-b border-red-100 pb-4">
          <CardTitle className="text-xl font-serif text-red-800 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            Delete account
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {!showDeleteConfirm ? (
            <div>
              <p className="text-sm text-zinc-600 mb-6">
                Permanently erase your account, active sessions, and all module data. This action is irreversible after the 14-day grace period.
              </p>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="bg-white border-2 border-red-200 text-red-700 py-2.5 px-6 font-medium transition-all hover:bg-red-50 hover:border-red-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 text-sm"
              >
                Delete account
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-red-50 border-l-4 border-red-500 p-4">
                <p className="text-red-900 text-sm font-medium mb-2">Proceed with caution</p>
                <p className="text-red-800 text-sm">
                  Your account, active sessions, and all data will be scheduled for permanent deletion. 
                  Your account will be permanently deleted in 14 days. Contact support before then if you change your mind.
                </p>
              </div>

              <form onSubmit={handleDeleteAccount} className="space-y-6">
                <div className="space-y-2 relative">
                  <label htmlFor="deleteEmailConfirm" className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Type your email to confirm
                  </label>
                  <input
                    id="deleteEmailConfirm"
                    type="email"
                    value={deleteEmailConfirm}
                    onChange={(e) => setDeleteEmailConfirm(e.target.value)}
                    required
                    className="w-full bg-transparent border-0 border-b-2 border-zinc-200 px-0 py-2 text-zinc-900 placeholder:text-zinc-300 focus:ring-0 focus:border-red-500 outline-none transition-colors"
                    placeholder={user?.email}
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteEmailConfirm("");
                    }}
                    className="bg-zinc-100 text-zinc-600 py-2.5 px-6 font-medium transition-all hover:bg-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={deleteLoading || deleteEmailConfirm !== user?.email}
                    className="bg-red-950 text-red-50 py-2.5 px-6 font-medium transition-all hover:bg-red-900 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 border-b-[3px] border-red-500 active:translate-y-[1px] active:border-b-2 text-sm"
                  >
                    {deleteLoading ? "Deleting..." : "Delete my account"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
