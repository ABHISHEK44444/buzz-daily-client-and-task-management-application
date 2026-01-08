import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Button } from './Button';
import { PhoneInput } from './PhoneInput';
import { Modal } from './Modal';
import { apiFetch } from '../services/api.ts';

interface ProfileViewProps {
  user: UserProfile;
  onUpdateUser: (updatedUser: UserProfile) => void;
  onLogout: () => void;
}

const HIERARCHY_LEVELS = [
  'Supervisor',
  'World Team',
  'Active World Team',
  'GET',
  'GET 2000',
  'Millionaire Team',
  'Millionaire Team 7500',
  'President Team',
  'Chairman Club',
  'Founder Circle'
];

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onUpdateUser, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UserProfile>(user);
  const [isTestingWhatsApp, setIsTestingWhatsApp] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Visibility states for password fields
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' });
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const inputClasses = "block w-full rounded-lg border-slate-300 bg-white text-slate-800 px-4 py-2.5 focus:border-accent focus:ring-accent transition-colors shadow-sm text-sm disabled:bg-slate-50 disabled:text-slate-500";
  const labelClasses = "block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5";

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser(formData);
    setIsEditing(false);
  };

  const handlePasswordChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (passwordForm.new !== passwordForm.confirm) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (passwordForm.new.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }

    try {
      await apiFetch('/api/user/password', user.email, {
        method: 'PATCH',
        body: JSON.stringify({
          currentPassword: passwordForm.current,
          newPassword: passwordForm.new,
        }),
      });
      
      alert("Password updated successfully.");
      setIsChangingPassword(false);
      setPasswordForm({ current: '', new: '', confirm: '' });
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      // You might want to refresh user data here if `passwordLastChanged` is important
    } catch (err: any) {
      setPasswordError(err.message || "An unknown error occurred during password update.");
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatarUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const testWhatsAppConnection = () => {
    if (!formData.phone) {
        alert("Please set a phone number first!");
        return;
    }
    setIsTestingWhatsApp(true);
    setTimeout(() => {
        setIsTestingWhatsApp(false);
        const cleanNumber = formData.phone?.replace(/\D/g, '') || '';
        const msg = encodeURIComponent("🚀 BizTrack Test: Your WhatsApp report connection is configured correctly! You will receive daily outreach lists at the set time.");
        window.open(`https://wa.me/${cleanNumber}?text=${msg}`, '_blank');
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto pb-12 animate-fade-in">
      {/* Profile Header Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6 relative">
        <div className="h-32 bg-gradient-to-r from-primary to-slate-800 w-full relative">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
        </div>
        
        <div className="px-8 pb-6 flex flex-col sm:flex-row items-center sm:items-center -mt-12 gap-6 relative">
            <div className="relative group">
                <div className="w-24 h-24 rounded-full border-4 border-white bg-white shadow-xl overflow-hidden flex items-center justify-center">
                    {formData.avatarUrl ? (
                        <img src={formData.avatarUrl} alt={formData.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 text-3xl font-black">
                            {formData.name.charAt(0)}
                        </div>
                    )}
                </div>
                {isEditing && (
                    <>
                        <label htmlFor="avatar-upload" className="absolute inset-0 flex items-center justify-center bg-black/50 text-white rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                            <i className="fa-solid fa-camera text-xl"></i>
                        </label>
                        <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </>
                )}
            </div>
            
            <div className="flex-1 text-center sm:text-left pt-12 sm:pt-14">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">{user.name}</h2>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
                    <span className="flex items-center gap-1.5"><i className="fa-solid fa-award text-accent"></i> {user.role}</span>
                    <span className="flex items-center gap-1.5"><i className="fa-solid fa-calendar-check text-slate-300"></i> Joined {user.joinedDate}</span>
                </div>
            </div>

            <div className="flex items-center gap-3 pt-4 sm:pt-14">
                {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)} variant="secondary" className="shadow-sm font-bold">
                        <i className="fa-solid fa-user-gear mr-2"></i> Update Profile
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button onClick={() => { setIsEditing(false); setFormData(user); }} variant="ghost">Cancel</Button>
                        <Button onClick={handleSave} variant="primary">Confirm Changes</Button>
                    </div>
                )}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
              {/* Profile Details */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 pb-2 border-b border-slate-50 flex items-center gap-2">
                      <i className="fa-solid fa-id-card-clip text-accent"></i> Core Identity
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-1">
                          <label className={labelClasses}>Legal Name</label>
                          <input 
                              type="text" 
                              value={formData.name} 
                              disabled={!isEditing}
                              onChange={(e) => setFormData({...formData, name: e.target.value})}
                              className={inputClasses}
                          />
                      </div>
                      <div className="space-y-1">
                          <label className={labelClasses}>Primary Email</label>
                          <input 
                              type="email" 
                              value={formData.email} 
                              disabled
                              className={inputClasses}
                          />
                          <p className="text-[10px] text-slate-400 italic">Used for individual data isolation.</p>
                      </div>
                      <div className="space-y-1">
                          <label className={labelClasses}>Contact Number (for WhatsApp Reports)</label>
                          <PhoneInput 
                              value={formData.phone || ''} 
                              disabled={!isEditing}
                              onChange={(val) => setFormData({...formData, phone: val})}
                          />
                          <p className="text-[10px] text-slate-400 italic">Reports will be sent here daily.</p>
                      </div>
                      <div className="space-y-1">
                          <label className={labelClasses}>Professional Level</label>
                          <select 
                              value={formData.role} 
                              disabled={!isEditing}
                              onChange={(e) => setFormData({...formData, role: e.target.value})}
                              className={inputClasses}
                          >
                              {HIERARCHY_LEVELS.map(level => (
                                  <option key={level} value={level}>{level}</option>
                              ))}
                          </select>
                      </div>
                  </div>
              </div>

              {/* Security & Login Section */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <div className="flex justify-between items-center mb-6 pb-2 border-b border-slate-50">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <i className="fa-solid fa-shield-halved text-slate-400"></i> Security & Login
                    </h3>
                    <button 
                      onClick={() => {
                        setPasswordForm({ current: '', new: '', confirm: '' });
                        setPasswordError(null);
                        setIsChangingPassword(true);
                      }}
                      className="text-xs font-bold text-accent hover:underline focus:outline-none"
                    >
                      Change Password
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6">
                      <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-900 mb-1">Password</p>
                          <p className="text-sm text-slate-500">Last changed {user.passwordLastChanged || 'Never'}</p>
                      </div>
                      <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-900 mb-1">Last Login</p>
                          <div className="flex items-center justify-between sm:justify-start sm:gap-4">
                            <p className="text-sm text-slate-500">{user.lastLogin}</p>
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wide rounded-full border border-emerald-100">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active Account
                            </span>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Reminders / Outreach automation */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 pb-2 border-b border-slate-50 flex items-center gap-2">
                      <i className="fa-brands fa-whatsapp text-emerald-500"></i> Outreach Automation
                  </h3>
                  <div className="space-y-6">
                      <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 flex items-start gap-4">
                          <div className="w-10 h-10 bg-white text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-emerald-100">
                               <i className="fa-brands fa-whatsapp text-xl"></i>
                          </div>
                          <div className="text-xs text-slate-600 leading-relaxed">
                               <p className="font-bold text-slate-900 mb-0.5">Automated Admin Reporting</p>
                               <p>Structured daily agendas containing client names and call descriptions are uniquely prepared for your admin account.</p>
                          </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div className="space-y-1">
                              <label className={labelClasses}>Report Generation Time</label>
                              <input 
                                  type="time" 
                                  value={formData.agendaReminderTime || ''} 
                                  disabled={!isEditing}
                                  onChange={(e) => setFormData({...formData, agendaReminderTime: e.target.value})}
                                  className={inputClasses}
                              />
                          </div>
                      </div>
                      
                      {!isEditing && (
                          <div className="flex justify-start">
                              <Button 
                                onClick={testWhatsAppConnection} 
                                variant="secondary" 
                                isLoading={isTestingWhatsApp}
                                className="text-xs h-9"
                              >
                                  <i className="fa-brands fa-whatsapp mr-2 text-emerald-600"></i>
                                  Test WhatsApp Report
                              </Button>
                          </div>
                      )}
                  </div>
              </div>
          </div>

          <div className="space-y-6">
               <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                   <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Account Metadata</h3>
                   <ul className="space-y-4">
                       <li className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                           <span className="text-slate-500 font-bold uppercase text-[10px]">Business Tier</span>
                           <span className="font-black text-primary bg-slate-100 px-2 py-0.5 rounded text-xs">{user.role}</span>
                       </li>
                       <li className="flex justify-between items-center text-sm border-b border-slate-50 pb-2">
                           <span className="text-slate-500 font-bold uppercase text-[10px]">Data Isolation</span>
                           <span className="font-black text-emerald-600 text-xs">ENABLED</span>
                       </li>
                       <li className="flex justify-between items-center text-sm">
                           <span className="text-slate-500 font-bold uppercase text-[10px]">Last Check-in</span>
                           <span className="font-medium text-slate-900 text-xs">{user.lastLogin}</span>
                       </li>
                   </ul>
               </div>

               <div className="bg-red-50/50 rounded-2xl border border-red-100 p-6 shadow-sm">
                   <h3 className="text-xs font-black text-red-800 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <i className="fa-solid fa-lock text-red-400"></i> Protected Zone
                   </h3>
                   <p className="text-[11px] text-slate-500 mb-5 leading-relaxed">
                       Securely terminate your current session. All business data is uniquely tied to your profile.
                   </p>
                   <Button 
                    type="button" 
                    onClick={() => {
                        onLogout();
                    }} 
                    variant="danger" 
                    className="w-full shadow-lg shadow-red-500/10 font-black py-3 active:scale-[0.98] transition-all"
                   >
                       <i className="fa-solid fa-right-from-bracket mr-2"></i> End Session
                   </Button>
               </div>
          </div>
      </div>

      {/* Change Password Modal */}
      <Modal 
        isOpen={isChangingPassword} 
        onClose={() => setIsChangingPassword(false)} 
        title="Update Account Security"
      >
        <form onSubmit={handlePasswordChangeSubmit} className="space-y-5 pt-2">
          {passwordError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg flex items-start gap-2">
              <i className="fa-solid fa-circle-exclamation mt-0.5"></i>
              <span>{passwordError}</span>
            </div>
          )}
          <p className="text-sm text-slate-500">Protect your business environment with a strong security token.</p>
          
          <div className="space-y-1">
            <label className={labelClasses}>Current Password</label>
            <div className="relative">
              <input 
                type={showCurrentPassword ? "text" : "password"} 
                required
                placeholder="Enter current password"
                className={`${inputClasses} pr-10`}
                value={passwordForm.current}
                onChange={(e) => setPasswordForm({...passwordForm, current: e.target.value})}
              />
              <button 
                type="button" 
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                <i className={`fa-solid ${showCurrentPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className={labelClasses}>New Password</label>
            <div className="relative">
              <input 
                type={showNewPassword ? "text" : "password"} 
                required
                placeholder="Min 8 characters"
                className={`${inputClasses} pr-10`}
                value={passwordForm.new}
                onChange={(e) => setPasswordForm({...passwordForm, new: e.target.value})}
              />
              <button 
                type="button" 
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                <i className={`fa-solid ${showNewPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className={labelClasses}>Confirm New Password</label>
            <div className="relative">
              <input 
                type={showConfirmPassword ? "text" : "password"} 
                required
                placeholder="Re-type new password"
                className={`${inputClasses} pr-10`}
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm({...passwordForm, confirm: e.target.value})}
              />
              <button 
                type="button" 
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <i className={`fa-solid ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'} text-sm`}></i>
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button variant="ghost" type="button" onClick={() => setIsChangingPassword(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Update Password</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
