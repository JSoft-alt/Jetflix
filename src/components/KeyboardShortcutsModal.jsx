// Keyboard Shortcuts reference modal
export default function KeyboardShortcutsModal({ onClose }) {
  const shortcuts = [
    { keys: ["Ctrl", "F"], desc: "Open search" },
    { keys: ["Ctrl", "K"], desc: "Search on a page" },
    { keys: ["Esc"], desc: "Close search / modal" },
    { keys: ["Ctrl", "Z"], desc: "Navigate back" },
    { keys: ["Ctrl", "R"], desc: "Reload app" },
    { keys: ["?"], desc: "Show this shortcuts overview" },
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 5000,
        background: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          padding: "36px 40px",
          minWidth: 380,
          maxWidth: 480,
          width: "90%",
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 28,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 22,
              letterSpacing: 1,
              color: "var(--text)",
            }}
          >
            KEYBOARD SHORTCUTS
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "1px solid var(--border)",
              borderRadius: 6,
              color: "var(--text3)",
              cursor: "pointer",
              fontSize: 18,
              lineHeight: 1,
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        {/* Shortcut rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {shortcuts.map(({ keys, desc }, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                padding: "10px 14px",
                background: "var(--surface2)",
                border: "1px solid var(--border)",
                borderRadius: 8,
              }}
            >
              <span style={{ fontSize: 14, color: "var(--text2)" }}>
                {desc}
              </span>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                {keys.map((k, j) => (
                  <kbd
                    key={j}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "3px 9px",
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      borderBottom: "2px solid rgba(255,255,255,0.12)",
                      borderRadius: 5,
                      fontSize: 12,
                      fontWeight: 600,
                      color: "var(--text)",
                      fontFamily: "monospace",
                      minWidth: 28,
                    }}
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 12,
            fontSize: 12,
            color: "var(--text3)",
            textAlign: "center",
          }}
        >
          Press{" "}
          <kbd
            style={{
              fontSize: 11,
              padding: "1px 5px",
              background: "var(--surface2)",
              border: "1px solid var(--border)",
              borderRadius: 3,
            }}
          >
            ?
          </kbd>{" "}
          or{" "}
          <kbd
            style={{
              fontSize: 11,
              padding: "1px 5px",
              background: "var(--surface2)",
              border: "1px solid var(--border)",
              borderRadius: 3,
            }}
          >
            Esc
          </kbd>{" "}
          to close
        </div>
      </div>
    </div>
  );
}
