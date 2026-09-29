import React from 'react';
import { Stethoscope } from 'lucide-react';

interface AppFooterProps {
  onOpenDoctorPortal: () => void;
}

export const AppFooter: React.FC<AppFooterProps> = ({ onOpenDoctorPortal }) => (
  <footer className="bg-white border-t border-[#DDE5E8] px-3 sm:px-6 py-3">
    <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
      <p className="text-[11px] sm:text-xs text-[#5A6B72] leading-relaxed">
        © {new Date().getFullYear()} Anarva Clinic · AI screening support, not a medical diagnosis.
      </p>

      <nav className="flex items-center gap-3">
        <a
          href="/"
          className="text-[11px] sm:text-xs font-semibold text-[#5A6B72] hover:text-[#0B1215] transition-colors"
        >
          Clinic Website
        </a>
        <button
          type="button"
          onClick={onOpenDoctorPortal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#DDE5E8] text-[11px] sm:text-xs font-bold text-[#0F172A] hover:bg-[#F6F9FA] transition-colors cursor-pointer"
        >
          <Stethoscope className="w-3.5 h-3.5 text-[#16A34A]" />
          <span>Doctor Panel</span>
        </button>
      </nav>
    </div>
  </footer>
);
