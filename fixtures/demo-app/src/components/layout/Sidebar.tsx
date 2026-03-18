import { NavLink } from 'react-router-dom';
import { TierIndicator } from './TierIndicator';

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h1>Adaptive</h1>
        <p>Demo Application</p>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" end>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          Dashboard
        </NavLink>

        <NavLink to="/3d">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path d="M8 8V15M8 8L14 4.5M8 8L2 4.5" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          3D Explorer
        </NavLink>

        <NavLink to="/editor">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M11.5 1.5L14.5 4.5L5 14H2V11L11.5 1.5Z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path d="M9.5 3.5L12.5 6.5" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          Editor
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <TierIndicator />
      </div>
    </aside>
  );
}
