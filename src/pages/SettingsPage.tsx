import React from 'react';
import { Settings as SettingsIcon, Bell, Shield, Palette } from 'lucide-react';

export function SettingsPage() {
  return (
    <div className="h-full w-full bg-[#0a0a0a] overflow-y-auto custom-scrollbar p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon size={24} className="text-app-accent" />
            <h1 className="text-[24px] font-app-bold text-white uppercase tracking-wide">
              Settings
            </h1>
          </div>
          <p className="text-app-muted text-[13px]">
            Customize your experience
          </p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Notifications */}
          <SettingsSection title="Notifications">
            <div className="flex items-center justify-between py-3 border-b border-[#222]">
              <div>
                <div className="text-white text-[14px]">Round Alerts</div>
                <div className="text-[11px] text-app-muted">Get notified when entry opens</div>
              </div>
              <Toggle enabled={true} />
            </div>
            <div className="flex items-center justify-between py-3 border-b border-[#222]">
              <div>
                <div className="text-white text-[14px]">Elimination Alerts</div>
                <div className="text-[11px] text-app-muted">Notify when you're eliminated</div>
              </div>
              <Toggle enabled={true} />
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <div className="text-white text-[14px]">Season Updates</div>
                <div className="text-[11px] text-app-muted">Season ranking updates</div>
              </div>
              <Toggle enabled={false} />
            </div>
          </SettingsSection>

          {/* Privacy */}
          <SettingsSection title="Privacy & Security">
            <div className="flex items-center justify-between py-3 border-b border-[#222]">
              <div>
                <div className="text-white text-[14px]">Show Online Status</div>
                <div className="text-[11px] text-app-muted">Let others see when you're active</div>
              </div>
              <Toggle enabled={true} />
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <div className="text-white text-[14px]">Public Profile</div>
                <div className="text-[11px] text-app-muted">Make your stats visible</div>
              </div>
              <Toggle enabled={true} />
            </div>
          </SettingsSection>

          {/* Display */}
          <SettingsSection title="Display">
            <div className="flex items-center justify-between py-3">
              <div>
                <div className="text-white text-[14px]">Dark Mode</div>
                <div className="text-[11px] text-app-muted">Always on</div>
              </div>
              <Toggle enabled={true} />
            </div>
          </SettingsSection>
        </div>

        {/* App Info */}
        <div className="mt-8 p-4 bg-[#111] border border-[#222]">
          <div className="text-[11px] text-app-muted text-center">
            RumbleX v0.1.30 • Built with React & Tailwind
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#111] border border-[#222]">
      <div className="p-4 border-b border-[#222]">
        <h2 className="text-[14px] font-app-bold text-white uppercase">{title}</h2>
      </div>
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}

function Toggle({ enabled }: { enabled: boolean }) {
  return (
    <button className={`w-11 h-6 rounded-full transition-colors relative ${
      enabled ? 'bg-app-accent' : 'bg-[#333]'
    }`}>
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
        enabled ? 'left-6' : 'left-1'
      }`} />
    </button>
  );
}
