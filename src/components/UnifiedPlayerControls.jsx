import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

const EMPTY_STATE = {
  ready: false,
  paused: true,
  currentTime: 0,
  duration: 0,
  volume: 1,
  muted: false,
  playbackRate: 1,
  subtitles: [],
  activeSubtitle: -1,
};

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = String(total % 60).padStart(2, "0");
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${secs}`
    : `${minutes}:${secs}`;
}

function IconButton({ label, children, ...props }) {
  return (
    <button
      type="button"
      className="unified-player__icon-btn"
      aria-label={label}
      title={label}
      {...props}
    >
      {children}
    </button>
  );
}

function PlayPauseIcon({ paused }) {
  return paused ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M7 4.8v14.4L19 12 7 4.8Z" fill="currentColor" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 5h4v14H6V5Zm8 0h4v14h-4V5Z" fill="currentColor" />
    </svg>
  );
}

function VolumeIcon({ muted, volume }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 9v6h4l5 4V5L8 9H4Z" fill="currentColor" />
      {muted || volume === 0 ? (
        <path d="m16 9 5 6m0-6-5 6" fill="none" stroke="currentColor" strokeWidth="1.8" />
      ) : (
        <path d="M16 8.2a5 5 0 0 1 0 7.6M18.8 5.5a9 9 0 0 1 0 13" fill="none" stroke="currentColor" strokeWidth="1.7" />
      )}
    </svg>
  );
}

function FullscreenIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export default function UnifiedPlayerControls({
  webviewRef,
  active,
  sourceKey,
  externalSubtitles = [],
  onFullscreen,
}) {
  const [player, setPlayer] = useState(EMPTY_STATE);
  const [seeking, setSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);
  const [openMenu, setOpenMenu] = useState(null);
  const [selectedExternal, setSelectedExternal] = useState(null);
  const rootRef = useRef(null);

  const getWebContentsId = useCallback(() => {
    try {
      return webviewRef.current?.getWebContentsId?.() ?? null;
    } catch {
      return null;
    }
  }, [webviewRef]);

  const refresh = useCallback(async () => {
    if (!active || !window.electron?.getUnifiedPlayerState) return;
    const id = getWebContentsId();
    if (!Number.isInteger(id)) return;
    try {
      const state = await window.electron.getUnifiedPlayerState(id);
      if (state) setPlayer((previous) => ({ ...previous, ...state }));
    } catch {}
  }, [active, getWebContentsId]);

  const control = useCallback(
    async (command) => {
      const id = getWebContentsId();
      if (!Number.isInteger(id) || !window.electron?.controlUnifiedPlayer) return false;
      try {
        const result = await window.electron.controlUnifiedPlayer(id, command);
        window.setTimeout(refresh, 80);
        return result;
      } catch {
        return false;
      }
    },
    [getWebContentsId, refresh],
  );

  useEffect(() => {
    if (!active) {
      setPlayer(EMPTY_STATE);
      return undefined;
    }
    refresh();
    const interval = window.setInterval(refresh, 650);
    return () => window.clearInterval(interval);
  }, [active, refresh, sourceKey]);

  useEffect(() => {
    setOpenMenu(null);
    setSelectedExternal(null);
    setPlayer(EMPTY_STATE);
  }, [sourceKey]);

  useEffect(() => {
    if (!openMenu) return undefined;
    const close = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpenMenu(null);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [openMenu]);

  useEffect(() => {
    if (!active) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && document.documentElement.hasAttribute("data-player-fullscreen")) {
        onFullscreen?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [active, onFullscreen]);

  const nativeLanguages = useMemo(
    () => new Set((player.subtitles || []).map((track) => track.language?.toLowerCase()).filter(Boolean)),
    [player.subtitles],
  );
  const extraSubtitles = useMemo(() => {
    const seen = new Set();
    return externalSubtitles.filter((subtitle) => {
      if (!subtitle?.url) return false;
      const key = `${subtitle.lang || "unknown"}:${subtitle.url}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return !nativeLanguages.has(String(subtitle.lang || "").toLowerCase());
    });
  }, [externalSubtitles, nativeLanguages]);

  if (!active || !player.ready) return null;

  const displayedTime = seeking ? seekValue : player.currentTime;
  const subtitleCount = (player.subtitles?.length || 0) + extraSubtitles.length;

  return (
    <div className="unified-player" ref={rootRef}>
      <input
        className="unified-player__timeline"
        type="range"
        min="0"
        max={Math.max(player.duration || 0, 0.01)}
        step="0.1"
        value={Math.min(displayedTime || 0, player.duration || 0)}
        aria-label="Seek"
        style={{ "--progress": `${player.duration > 0 ? (displayedTime / player.duration) * 100 : 0}%` }}
        onPointerDown={() => setSeeking(true)}
        onChange={(event) => setSeekValue(Number(event.target.value))}
        onPointerUp={(event) => {
          const seconds = Number(event.currentTarget.value);
          setSeeking(false);
          setSeekValue(seconds);
          control({ action: "seek-to", seconds });
        }}
      />
      <div className="unified-player__row">
        <IconButton
          label={player.paused ? "Play" : "Pause"}
          onClick={() => control({ action: "toggle-play" })}
        >
          <PlayPauseIcon paused={player.paused} />
        </IconButton>
        <button
          type="button"
          className="unified-player__skip"
          aria-label="Rewind 10 seconds"
          title="Rewind 10 seconds"
          onClick={() => control({ action: "seek-relative", seconds: -10 })}
        >
          <span aria-hidden="true">↶</span><b>10</b>
        </button>
        <button
          type="button"
          className="unified-player__skip"
          aria-label="Forward 10 seconds"
          title="Forward 10 seconds"
          onClick={() => control({ action: "seek-relative", seconds: 10 })}
        >
          <span aria-hidden="true">↷</span><b>10</b>
        </button>
        <div className="unified-player__volume">
          <IconButton
            label={player.muted ? "Unmute" : "Mute"}
            onClick={() => control({ action: "toggle-mute" })}
          >
            <VolumeIcon muted={player.muted} volume={player.volume} />
          </IconButton>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={player.muted ? 0 : player.volume}
            aria-label="Volume"
            onChange={(event) => control({ action: "set-volume", volume: Number(event.target.value) })}
          />
        </div>
        <span className="unified-player__time">
          {formatTime(displayedTime)} <span>/</span> {formatTime(player.duration)}
        </span>
        <div className="unified-player__spacer" />
        <div className="unified-player__menu-wrap">
          <button
            type="button"
            className={`unified-player__text-btn${openMenu === "subtitles" ? " is-active" : ""}`}
            aria-haspopup="menu"
            aria-expanded={openMenu === "subtitles"}
            onClick={() => setOpenMenu((menu) => (menu === "subtitles" ? null : "subtitles"))}
          >
            SUB <span>{subtitleCount}</span>
          </button>
          {openMenu === "subtitles" && (
            <div className="unified-player__menu" role="menu" aria-label="Subtitles">
              <div className="unified-player__menu-title">Subtitles</div>
              <button
                type="button"
                className={player.activeSubtitle === -1 && !selectedExternal ? "is-selected" : ""}
                onClick={() => {
                  setSelectedExternal(null);
                  control({ action: "set-subtitle", index: -1 });
                  setOpenMenu(null);
                }}
              >
                <span>Off</span><i>{player.activeSubtitle === -1 && !selectedExternal ? "✓" : ""}</i>
              </button>
              {(player.subtitles || []).map((track) => (
                <button
                  type="button"
                  key={`native-${track.index}-${track.language}-${track.label}`}
                  className={player.activeSubtitle === track.index && !selectedExternal ? "is-selected" : ""}
                  onClick={() => {
                    setSelectedExternal(null);
                    control({ action: "set-subtitle", index: track.index });
                    setOpenMenu(null);
                  }}
                >
                  <span>{track.label}</span>
                  <small>{track.language}</small>
                  <i>{player.activeSubtitle === track.index && !selectedExternal ? "✓" : ""}</i>
                </button>
              ))}
              {extraSubtitles.map((subtitle) => (
                <button
                  type="button"
                  key={`external-${subtitle.lang}-${subtitle.url}`}
                  className={selectedExternal === subtitle.url ? "is-selected" : ""}
                  onClick={async () => {
                    const ok = await control({
                      action: "load-external-subtitle",
                      url: subtitle.url,
                      label: subtitle.lang || "Subtitle",
                      language: subtitle.lang || "",
                    });
                    if (ok) setSelectedExternal(subtitle.url);
                    setOpenMenu(null);
                  }}
                >
                  <span>{subtitle.lang || "Subtitle"}</span><small>captured</small>
                  <i>{selectedExternal === subtitle.url ? "✓" : ""}</i>
                </button>
              ))}
              {subtitleCount === 0 && <div className="unified-player__menu-empty">No subtitles exposed by this source</div>}
            </div>
          )}
        </div>
        <div className="unified-player__menu-wrap">
          <button
            type="button"
            className={`unified-player__text-btn${openMenu === "speed" ? " is-active" : ""}`}
            aria-haspopup="menu"
            aria-expanded={openMenu === "speed"}
            onClick={() => setOpenMenu((menu) => (menu === "speed" ? null : "speed"))}
          >
            {player.playbackRate}x
          </button>
          {openMenu === "speed" && (
            <div className="unified-player__menu unified-player__menu--speed" role="menu" aria-label="Playback speed">
              <div className="unified-player__menu-title">Playback speed</div>
              {PLAYBACK_RATES.map((rate) => (
                <button
                  type="button"
                  key={rate}
                  className={player.playbackRate === rate ? "is-selected" : ""}
                  onClick={() => {
                    control({ action: "set-rate", rate });
                    setOpenMenu(null);
                  }}
                >
                  <span>{rate === 1 ? "Normal" : `${rate}x`}</span>
                  <i>{player.playbackRate === rate ? "✓" : ""}</i>
                </button>
              ))}
            </div>
          )}
        </div>
        <IconButton label="Fullscreen" onClick={onFullscreen}>
          <FullscreenIcon />
        </IconButton>
      </div>
    </div>
  );
}
