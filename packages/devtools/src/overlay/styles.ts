export const OVERLAY_STYLES = `
:host {
  all: initial;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 13px;
  color: #e2e8f0;
  z-index: 2147483647;
  position: fixed;
}

.panel {
  width: 320px;
  max-height: 480px;
  overflow-y: auto;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  padding: 0;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  cursor: move;
  user-select: none;
}

.header-title {
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #94a3b8;
}

.collapse-btn {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 14px;
  padding: 2px 6px;
  border-radius: 4px;
}

.collapse-btn:hover { background: rgba(255, 255, 255, 0.1); }

.body { padding: 12px 14px; }

.tier-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 99px;
  font-weight: 600;
  font-size: 12px;
  color: #fff;
}

.tier-high { background: #10b981; }
.tier-medium { background: #f59e0b; }
.tier-low { background: #ef4444; }

.section { margin-top: 12px; }

.section-title {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
  margin-bottom: 6px;
}

.probe-row {
  display: flex;
  justify-content: space-between;
  padding: 3px 0;
  font-size: 12px;
}

.probe-label { color: #94a3b8; }
.probe-value { color: #e2e8f0; font-family: monospace; }
.probe-unavailable { color: #475569; font-style: italic; }

.boundary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 0;
  font-size: 12px;
}

.boundary-name { color: #cbd5e1; }
.boundary-variant { font-family: monospace; font-size: 11px; }

.variant-high { color: #10b981; }
.variant-medium { color: #f59e0b; }
.variant-low { color: #ef4444; }
.variant-error { color: #f87171; font-weight: 600; }

.simulator {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.simulator select {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #e2e8f0;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
  width: 100%;
}

.simulator select:focus { outline: 1px solid #3b82f6; }

.reset-btn {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
  border-radius: 6px;
  padding: 4px 8px;
  font-size: 11px;
  cursor: pointer;
  margin-top: 6px;
  width: 100%;
}

.reset-btn:hover { background: rgba(239, 68, 68, 0.25); }

.collapsed .body { display: none; }
.collapsed .panel { width: auto; }

.caps-list { display: flex; flex-wrap: wrap; gap: 4px; }

.cap-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
}

.reasoning-item {
  font-size: 11px;
  color: #94a3b8;
  padding: 2px 0;
  font-family: monospace;
  word-break: break-word;
}
`;
