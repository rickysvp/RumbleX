import { useEffect, useState } from 'react';

interface VersionInfo {
  version: string;
  name: string;
  channel: string;
  releaseDate: string;
}

export function VersionBadge() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);

  useEffect(() => {
    // Fetch version info from version.json
    fetch('/version.json')
      .then(res => res.json())
      .then(data => setVersionInfo(data))
      .catch(() => {
        // Fallback if version.json is not available
        setVersionInfo({
          version: '0.1.0',
          name: 'RumbleX',
          channel: 'alpha',
          releaseDate: '2026-04-19'
        });
      });
  }, []);

  if (!versionInfo) return null;

  const channelColors: Record<string, string> = {
    alpha: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    beta: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    stable: 'bg-green-500/20 text-green-300 border-green-500/30',
    dev: 'bg-orange-500/20 text-orange-300 border-orange-500/30'
  };

  const channelColor = channelColors[versionInfo.channel] || channelColors.dev;

  return (
    <div className="fixed bottom-2 right-2 z-50 flex items-center gap-2 px-3 py-1.5 rounded-lg border backdrop-blur-sm bg-black/40 text-xs">
      <span className="font-medium text-white/80">{versionInfo.name}</span>
      <span className="text-white/50">|</span>
      <span className="font-mono text-white/70">v{versionInfo.version}</span>
      <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider border ${channelColor}`}>
        {versionInfo.channel}
      </span>
    </div>
  );
}

export function VersionDisplay() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [changelog, setChangelog] = useState<Record<string, { date: string; changes: string[] }> | null>(null);

  useEffect(() => {
    fetch('/version.json')
      .then(res => res.json())
      .then(data => {
        setVersionInfo(data);
        setChangelog(data.changelog);
      })
      .catch(() => {
        setVersionInfo({
          version: '0.1.0',
          name: 'RumbleX',
          channel: 'alpha',
          releaseDate: '2026-04-19'
        });
      });
  }, []);

  if (!versionInfo) return null;

  return (
    <div className="p-4 rounded-xl bg-black/40 border border-white/10 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-white">{versionInfo.name}</h2>
          <p className="text-sm text-white/50">Version {versionInfo.version}</p>
        </div>
        <div className="text-right">
          <span className="px-2 py-1 rounded bg-white/10 text-xs uppercase tracking-wider text-white/70">
            {versionInfo.channel}
          </span>
          <p className="text-xs text-white/40 mt-1">Released {versionInfo.releaseDate}</p>
        </div>
      </div>

      {changelog && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-white/80">Changelog</h3>
          {Object.entries(changelog)
            .sort(([a], [b]) => b.localeCompare(a))
            .slice(0, 3)
            .map(([version, info]) => (
              <div key={version} className="p-3 rounded-lg bg-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm text-white/90">v{version}</span>
                  <span className="text-xs text-white/40">{info.date}</span>
                </div>
                <ul className="space-y-1">
                  {info.changes.map((change, idx) => (
                    <li key={idx} className="text-xs text-white/60 flex items-start gap-2">
                      <span className="text-white/30">•</span>
                      {change}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
