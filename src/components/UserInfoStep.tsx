import React, { useState } from 'react';
import {
  User,
  Phone,
  MapPin,
  Lock,
  ChevronRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { UserInfo } from '../types';
import { sound } from '../utils/audio';

interface UserInfoStepProps {
  initialInfo?: UserInfo;
  onComplete: (info: UserInfo) => void;
}

export const UserInfoStep: React.FC<UserInfoStepProps> = ({ initialInfo, onComplete }) => {
  const [formData, setFormData] = useState<UserInfo>(
    initialInfo || {
      name: '',
      phone: '',
      gender: 'Male',
      address: '',
    }
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) {
      errs.name = 'Please enter your full name.';
    }
    if (!formData.phone.trim()) {
      errs.phone = 'Please enter your phone number.';
    }
    if (!formData.gender) {
      errs.gender = 'Please select your gender.';
    }
    if (!formData.address.trim()) {
      errs.address = 'Please enter your address.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent double click
    if (!validate()) return;

    setIsSubmitting(true);
    sound.playSuccess();
    // Immediate callback to unlock and show report
    onComplete(formData);
  };

  return (
    <div className="h-[calc(100dvh-54px)] flex flex-col justify-center items-center bg-[#F6F9FA] font-['Outfit'] antialiased px-3 py-3 select-none overflow-hidden">
      <div className="w-full max-w-lg bg-white border border-[#DDE5E8] rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-[0_2px_12px_rgba(11,18,21,0.05)] flex flex-col justify-between my-auto gap-4">
        
        {/* Header */}
        <div className="border-b border-[#F1F5F9] pb-3">
          <div className="text-[11px] font-bold text-[#16A34A] uppercase tracking-wider">
            Step 4 of 5
          </div>
          <h1 className="text-base sm:text-xl font-bold text-[#0B1215] tracking-tight">
            Patient Information
          </h1>
          <p className="text-xs text-[#5A6B72] mt-0.5">
            Enter your details to generate your signed diagnostic report.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Name */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#2D3A40] flex justify-between">
              <span>Full Name *</span>
              {errors.name && <span className="text-[11px] text-[#DC2626] font-normal">{errors.name}</span>}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-[#8FA3AB] absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                placeholder="Rahul Ornob"
                className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs sm:text-sm text-[#0B1215] outline-none ${
                  errors.name ? 'border-[#DC2626] bg-[#FEF2F2]' : 'border-[#DDE5E8] focus:border-[#16A34A]'
                }`}
              />
            </div>
          </div>

          {/* Phone & Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[#2D3A40] flex justify-between">
                <span>Phone Number *</span>
                {errors.phone && <span className="text-[11px] text-[#DC2626] font-normal">{errors.phone}</span>}
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-[#8FA3AB] absolute left-3 top-3 pointer-events-none" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    setFormData({ ...formData, phone: e.target.value });
                    if (errors.phone) setErrors({ ...errors, phone: '' });
                  }}
                  placeholder="+91 98450 12345"
                  className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs sm:text-sm text-[#0B1215] outline-none ${
                    errors.phone ? 'border-[#DC2626] bg-[#FEF2F2]' : 'border-[#DDE5E8] focus:border-[#16A34A]'
                  }`}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-[#2D3A40] flex justify-between">
                <span>Gender *</span>
                {errors.gender && <span className="text-[11px] text-[#DC2626] font-normal">{errors.gender}</span>}
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {['Male', 'Female', 'Other'].map((g) => {
                  const isSel = formData.gender === g;
                  return (
                    <button
                      key={g}
                      type="button"
                      onClick={() => {
                        sound.playSelect();
                        setFormData({ ...formData, gender: g });
                        if (errors.gender) setErrors({ ...errors, gender: '' });
                      }}
                      className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center border cursor-pointer ${
                        isSel
                          ? 'bg-[#16A34A] text-white border-[#16A34A] shadow-xs'
                          : 'bg-white text-[#475569] border-[#DDE5E8] hover:bg-[#F6F9FA]'
                      }`}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#2D3A40] flex justify-between">
              <span>Address / City *</span>
              {errors.address && <span className="text-[11px] text-[#DC2626] font-normal">{errors.address}</span>}
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-[#8FA3AB] absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                value={formData.address}
                onChange={(e) => {
                  setFormData({ ...formData, address: e.target.value });
                  if (errors.address) setErrors({ ...errors, address: '' });
                }}
                placeholder="Indiranagar, Bangalore"
                className={`w-full pl-9 pr-3 py-2.5 rounded-xl border text-xs sm:text-sm text-[#0B1215] outline-none ${
                  errors.address ? 'border-[#DC2626] bg-[#FEF2F2]' : 'border-[#DDE5E8] focus:border-[#16A34A]'
                }`}
              />
            </div>
          </div>

          {/* Privacy note */}
          <div className="flex items-center gap-2 text-[11px] text-[#5A6B72] py-1">
            <Lock className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
            <span>Encrypted under Anarva Clinic clinical privacy standards.</span>
          </div>

          {/* Unlock Full Report Button (Executes once and disables to prevent double-clicks) */}
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer ${
                isSubmitting
                  ? 'bg-[#E2E8F0] text-[#94A3B8] cursor-not-allowed'
                  : 'bg-[#16A34A] hover:bg-[#15803D] active:scale-[0.99] text-white'
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Unlocking Report...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                  <span>Unlock Full Diagnostic Report</span>
                  <ChevronRight className="w-4 h-4 stroke-[2.5]" />
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
