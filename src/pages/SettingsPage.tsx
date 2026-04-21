import React, { useState } from 'react';
import { Settings as SettingsIcon, Bell, Shield, Palette, User, Edit2, Check, X } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

export function SettingsPage() {
  const userHandle = useGameStore(state => state.userHandle);
  const updateUserHandle = useGameStore(state => state.updateUserHandle);
  
  const [isEditing, setIsEditing] = useState(false);
  const [newHandle, setNewHandle] = useState(userHandle);

  const handleSave = () => {
    if (newHandle.trim()) {
      updateUserHandle(newHandle.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setNewHandle(userHandle);
    setIsEditing(false);
  };

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
          {/* Profile - New Section */}
          <SettingsSection title="Profile">
            <div className="py-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-app-accent" />
                  <span className="text-white text-[14px]">Display Name</span>
                </div>
                {!isEditing && (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1 text-app-accent text-[11px] hover:text-white transition-colors"
                  >
                    <Edit2 size={12} />
                    Edit
                  </button>
                )}
              </div>
              
              {isEditing ? (
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={newHandle}
                    onChange={(e) => setNewHandle(e.target.value)}
                    placeholder="Enter your nickname"
                    className="flex-1 bg-[#0a0a0a] border border-app-border text-white px-3 py-2 text-[13px] focus:outline-none focus:border-app-accent"
                    maxLength={20}
                  />
                  <button
                    onClick={handleSave}
                    className="px-3 py-2 bg-app-accent text-black hover:bg-white transition-colors"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-3 py-2 bg-[#222] text-white hover:bg-[#333] transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="text-app-muted text-[13px] font-app-mono bg-[#0a0a0a] px-3 py-2 border border-app-border">
                  {userHandle}
                </div>
              )}
              <div className="text-[10px] text-app-muted mt-1">
                This name will be displayed in the arena feed and leaderboards
              </div>
            </div>
          </SettingsSection>

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
            RumbleX v0.1.40 • Built with React & Tailwind
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
