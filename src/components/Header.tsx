import React, { useState } from 'react';
import { ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import { sound } from '../utils/audio';
import { AnarvaLogo } from './AnarvaLogo';

export const Header: React.FC = () => {
  const [muted, setMuted] = useState(!sound.enabled);

  const toggleMute = () => {
    sound.enabled = !sound.enabled;
    setMuted(!sound.enabled);
    if (sound.enabled) {
      sound.playSelect();
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#DDE5E8] shadow-[0_1px_2px_rgba(11,18,21,0.03)] px-3 sm:px-6 py-2 sm:py-2.5">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
        <a
          href="https://www.anarvaclinic.com/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5A6B72] hover:text-[#0B1215] transition-colors"
          title="Back to Anarva Clinic website"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back to clinic</span>
        </a>
        <AnarvaLogo size="sm" />

        <button
          type="button"
          onClick={toggleMute}
          className="p-1.5 rounded-lg text-[#5A6B72] hover:text-[#0B1215] hover:bg-[#F6F9FA] transition-colors border border-transparent hover:border-[#DDE5E8] cursor-pointer"
          title={muted ? 'Unmute sounds' : 'Mute sounds'}
          aria-label={muted ? 'Unmute sound effects' : 'Mute sound effects'}
        >
          {muted ? <VolumeX className="w-4 h-4 text-[#8FA3AB]" /> : <Volume2 className="w-4 h-4 text-[#16A34A]" />}
        </button>
      </div>
    </header>
  );
};
