import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Offcanvas } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import logoImg from '../../assets/Gangadhara_logo.png';

const baseNavItems = [
  { label: 'Dashboard', path: '/', icon: 'bi-grid-1x2-fill' },
  { label: 'Farmers', path: '/farmers', icon: 'bi-person-lines-fill' },
  { label: 'Farmer Payments', path: '/farmer-payments', icon: 'bi-flower2' },
  { label: 'Customers / Exporters', path: '/customers', icon: 'bi-people-fill' },
  { label: 'Sales / Receipts', path: '/sales', icon: 'bi-cart-check-fill' },
  { label: 'Expenses', path: '/expenses', icon: 'bi-truck' },
  { label: 'Transactions', path: '/transactions', icon: 'bi-journal-text' },
  { label: 'Payment Reminders', path: '/reminders', icon: 'bi-bell-fill' },
  { label: 'Profit & Loss', path: '/profit-loss', icon: 'bi-calculator-fill' },
  { label: 'Reports', path: '/reports', icon: 'bi-file-earmark-bar-graph-fill' },
];

const settingsItems = [
  { label: 'User Management', path: '/users', icon: 'bi-person-gear' },
  { label: 'Expense Categories', path: '/settings/expense-categories', icon: 'bi-tags-fill' },
  { label: 'Payment Modes', path: '/settings/payment-modes', icon: 'bi-credit-card-2-front-fill' },
  { label: 'Backup & Restore', path: '/settings/backup', icon: 'bi-database-fill-gear' },
];

/* ─── Inline styles ─────────────────────────────────────── */
const S = {
  sidebar: (collapsed) => ({
    width: collapsed ? '72px' : '256px',
    minWidth: collapsed ? '72px' : '256px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(180deg, #0d1b2a 0%, #112240 50%, #0d1b2a 100%)',
    borderRight: '1px solid rgba(100,210,160,0.12)',
    transition: 'width 0.28s cubic-bezier(0.4,0,0.2,1), min-width 0.28s cubic-bezier(0.4,0,0.2,1)',
    overflow: 'hidden',
    position: 'relative',
  }),

  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '220px',
    background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(52,211,153,0.18) 0%, transparent 70%)',
    pointerEvents: 'none',
    zIndex: 0,
  },

  header: (collapsed) => ({
    height: '68px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: collapsed ? 'center' : 'space-between',
    padding: collapsed ? '0' : '0 16px 0 18px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    position: 'relative',
    zIndex: 1,
    flexShrink: 0,
  }),

  logoWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    overflow: 'hidden',
  },

  logoImg: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    objectFit: 'contain',
    background: '#fff',
    padding: '3px',
    boxShadow: '0 0 0 2px rgba(52,211,153,0.35)',
    flexShrink: 0,
  },

  logoText: {
    display: 'flex',
    flexDirection: 'column',
    lineHeight: 1.2,
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  },

  brandName: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#f0fdf4',
    letterSpacing: '0.3px',
  },

  brandSub: {
    fontSize: '10px',
    color: 'rgba(52,211,153,0.85)',
    fontWeight: 500,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },

  collapseBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.05)',
    color: 'rgba(255,255,255,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'all 0.2s',
  },

  nav: {
    flex: 1,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: '12px 0 8px',
    position: 'relative',
    zIndex: 1,
    scrollbarWidth: 'none',
  },

  section: {
    marginBottom: '4px',
  },

  sectionLabel: {
    fontSize: '9.5px',
    fontWeight: 700,
    color: 'rgba(52,211,153,0.6)',
    letterSpacing: '1.2px',
    textTransform: 'uppercase',
    padding: '14px 20px 6px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  },

  item: (active) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '9px 16px',
    margin: '1px 8px',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.18s ease',
    textDecoration: 'none',
    background: active
      ? 'linear-gradient(135deg, rgba(52,211,153,0.22) 0%, rgba(16,185,129,0.14) 100%)'
      : 'transparent',
    border: active ? '1px solid rgba(52,211,153,0.25)' : '1px solid transparent',
    boxShadow: active ? '0 2px 12px rgba(52,211,153,0.12)' : 'none',
    color: active ? '#34d399' : 'rgba(188,208,228,0.85)',
    fontWeight: active ? 600 : 400,
    fontSize: '13.5px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    position: 'relative',
  }),

  itemIcon: (active) => ({
    fontSize: '16px',
    flexShrink: 0,
    color: active ? '#34d399' : 'rgba(148,183,210,0.8)',
    transition: 'color 0.18s',
    width: '20px',
    textAlign: 'center',
  }),

  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    width: '3px',
    height: '60%',
    borderRadius: '0 2px 2px 0',
    background: 'linear-gradient(180deg, #34d399, #10b981)',
  },

  subMenuToggle: (active, open) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '9px 16px',
    margin: '1px 8px',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.18s ease',
    background: active && !open
      ? 'linear-gradient(135deg, rgba(52,211,153,0.22) 0%, rgba(16,185,129,0.14) 100%)'
      : open
        ? 'rgba(255,255,255,0.04)'
        : 'transparent',
    border: active && !open ? '1px solid rgba(52,211,153,0.25)' : '1px solid transparent',
    color: active || open ? '#34d399' : 'rgba(188,208,228,0.85)',
    fontWeight: active || open ? 600 : 400,
    fontSize: '13.5px',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  }),

  subPanel: (open) => ({
    overflow: 'hidden',
    maxHeight: open ? '300px' : '0',
    transition: 'max-height 0.28s cubic-bezier(0.4,0,0.2,1)',
    background: 'rgba(0,0,0,0.15)',
    margin: '0 8px',
    borderRadius: '0 0 10px 10px',
    borderLeft: '1px solid rgba(52,211,153,0.1)',
    borderRight: '1px solid rgba(52,211,153,0.1)',
    borderBottom: open ? '1px solid rgba(52,211,153,0.1)' : '1px solid transparent',
  }),

  subItem: (active) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 14px 8px 20px',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'all 0.15s',
    color: active ? '#34d399' : 'rgba(180,200,218,0.75)',
    fontWeight: active ? 600 : 400,
    fontSize: '12.5px',
    background: active ? 'rgba(52,211,153,0.1)' : 'transparent',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  }),

  divider: {
    height: '1px',
    background: 'rgba(255,255,255,0.05)',
    margin: '8px 16px',
  },

  footer: {
    padding: '12px 16px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    position: 'relative',
    zIndex: 1,
    flexShrink: 0,
  },

  footerAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #34d399, #059669)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    color: '#fff',
    fontWeight: 700,
    flexShrink: 0,
  },

  footerText: {
    overflow: 'hidden',
  },

  footerName: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#e2e8f0',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  footerSub: {
    fontSize: '10px',
    color: 'rgba(52,211,153,0.7)',
    fontWeight: 500,
  },
};

/* ─── NavItem ───────────────────────────────────────────── */
function NavItem({ item, collapsed, onClick }) {
  const location = useLocation();
  const active = item.path === '/'
    ? location.pathname === '/'
    : location.pathname.startsWith(item.path);

  return (
    <NavLink
      to={item.path}
      onClick={onClick}
      style={S.item(active)}
      title={collapsed ? item.label : undefined}
      className="sidebar-nav-item"
    >
      {active && <span style={S.activeIndicator} />}
      <i className={`bi ${item.icon}`} style={S.itemIcon(active)} />
      {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
    </NavLink>
  );
}

/* ─── SettingsSubMenu ───────────────────────────────────── */
function SettingsSubMenu({ collapsed, onClick }) {
  const location = useLocation();
  const isSettingsActive =
    location.pathname.startsWith('/settings') || location.pathname === '/users';

  const [open, setOpen] = useState(isSettingsActive);

  const handleToggle = () => {
    if (!collapsed) setOpen((o) => !o);
  };

  return (
    <div style={S.section}>
      <div
        style={S.subMenuToggle(isSettingsActive, open)}
        onClick={handleToggle}
        title={collapsed ? 'Settings' : undefined}
        className="sidebar-nav-item"
      >
        {isSettingsActive && !open && <span style={S.activeIndicator} />}
        <i className="bi bi-gear-fill" style={S.itemIcon(isSettingsActive || open)} />
        {!collapsed && (
          <>
            <span style={{ flex: 1 }}>Settings</span>
            <i
              className={`bi bi-chevron-${open ? 'up' : 'down'}`}
              style={{ fontSize: '11px', color: 'rgba(148,183,210,0.6)', transition: 'transform 0.2s' }}
            />
          </>
        )}
      </div>

      {!collapsed && (
        <div style={S.subPanel(open)}>
          {settingsItems.map((item) => {
            const active = location.pathname === item.path ||
              location.pathname.startsWith(item.path + '/');
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClick}
                style={S.subItem(active)}
                className="sidebar-sub-item"
              >
                <i className={`bi ${item.icon}`} style={{ fontSize: '13px', width: '16px', textAlign: 'center' }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── SidebarContent ────────────────────────────────────── */
export function SidebarContent({ collapsed, onToggleCollapse, onLinkClick }) {
  const { isAdmin, user } = useAuth();
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.[0]?.toUpperCase() ?? 'U';

  return (
    <div style={S.sidebar(collapsed)}>
      {/* Ambient top glow */}
      <div style={S.glow} />

      {/* Header */}
      <div style={S.header(collapsed)}>
        <div style={S.logoWrap}>
          <img src={logoImg} alt="Logo" style={S.logoImg} />
          {!collapsed && (
            <div style={S.logoText}>
              <span style={S.brandName}>Gangadhara</span>
              <span style={S.brandSub}>Nursery</span>
            </div>
          )}
        </div>

        {!collapsed && (
          <button
            style={S.collapseBtn}
            onClick={onToggleCollapse}
            title="Collapse Sidebar"
            className="d-none d-lg-flex"
          >
            <i className="bi bi-chevron-left" style={{ fontSize: '11px' }} />
          </button>
        )}

        {collapsed && onToggleCollapse && (
          <button
            style={{ ...S.collapseBtn, margin: '0 auto', display: 'none' }}
            onClick={onToggleCollapse}
            title="Expand"
            className="d-none d-lg-flex"
          />
        )}
      </div>

      {/* Navigation */}
      <nav style={S.nav} className="sidebar-scroll">
        {/* Main nav */}
        <div style={S.section}>
          {!collapsed && <div style={S.sectionLabel}>Main Menu</div>}
          {baseNavItems.map((item) => (
            <NavItem key={item.path} item={item} collapsed={collapsed} onClick={onLinkClick} />
          ))}
        </div>

        {isAdmin && (
          <>
            <div style={S.divider} />
            {!collapsed && <div style={S.sectionLabel}>Administration</div>}
            <SettingsSubMenu collapsed={collapsed} onClick={onLinkClick} />
          </>
        )}
      </nav>

      {/* Footer user strip */}
      {!collapsed && (
        <div style={S.footer}>
          <div style={S.footerAvatar}>{initials}</div>
          <div style={S.footerText}>
            <div style={S.footerName}>{user?.name || user?.email || 'User'}</div>
            <div style={S.footerSub}>{isAdmin ? 'Administrator' : 'Staff'}</div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Sidebar (Desktop + Mobile) ───────────────────────── */
export default function Sidebar({ collapsed, onToggleCollapse, showMobile, onHideMobile }) {
  return (
    <>
      {/* Desktop sidebar */}
      <div
        className="d-none d-lg-flex position-fixed top-0 bottom-0 start-0 z-3"
        style={{
          width: collapsed ? '72px' : '256px',
          transition: 'width 0.28s cubic-bezier(0.4,0,0.2,1)',
          flexDirection: 'column',
        }}
        onMouseEnter={(e) => {
          const btn = e.currentTarget.querySelector('.collapse-btn-hover');
          if (btn) btn.style.opacity = '1';
        }}
        onMouseLeave={(e) => {
          const btn = e.currentTarget.querySelector('.collapse-btn-hover');
          if (btn) btn.style.opacity = '0';
        }}
      >
        <SidebarContent collapsed={collapsed} onToggleCollapse={onToggleCollapse} />

        {/* Floating expand button when collapsed */}
        {collapsed && (
          <button
            className="collapse-btn-hover d-none d-lg-flex"
            onClick={onToggleCollapse}
            title="Expand Sidebar"
            style={{
              position: 'absolute',
              right: '-12px',
              top: '68px',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              border: '1px solid rgba(52,211,153,0.4)',
              background: '#112240',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              opacity: 0,
              transition: 'opacity 0.2s',
              fontSize: '10px',
              zIndex: 10,
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            }}
          >
            <i className="bi bi-chevron-right" />
          </button>
        )}
      </div>

      {/* Mobile Offcanvas */}
      <Offcanvas
        show={showMobile}
        onHide={onHideMobile}
        className="d-lg-none p-0"
        style={{ width: '260px', background: 'transparent', border: 'none' }}
      >
        <Offcanvas.Body className="p-0" style={{ overflow: 'hidden' }}>
          <SidebarContent collapsed={false} onLinkClick={onHideMobile} />
        </Offcanvas.Body>
      </Offcanvas>

      {/* Hover interaction CSS */}
      <style>{`
        .sidebar-nav-item:hover {
          background: rgba(52,211,153,0.08) !important;
          color: #ffffff !important;
          border-color: rgba(52,211,153,0.15) !important;
        }
        .sidebar-nav-item:hover i {
          color: #34d399 !important;
        }
        .sidebar-sub-item:hover {
          background: rgba(52,211,153,0.12) !important;
          color: #ffffff !important;
        }
        .sidebar-scroll::-webkit-scrollbar { width: 0px; }
      `}</style>
    </>
  );
}
