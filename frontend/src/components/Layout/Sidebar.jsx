import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Sidebar as ProSidebar, Menu, MenuItem } from 'react-pro-sidebar';
import { Offcanvas, Button } from 'react-bootstrap';
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

export function SidebarContent({ collapsed, onToggleCollapse, onLinkClick }) {
  const location = useLocation();
  const { isAdmin } = useAuth();

  // Dynamically include Users Management if user is ADMIN
  const navItems = isAdmin
    ? [
        ...baseNavItems.slice(0, 8),
        { label: 'User Management', path: '/users', icon: 'bi-person-gear' },
        ...baseNavItems.slice(8),
      ]
    : baseNavItems;

  return (
    <div className="d-flex flex-column h-100 bg-dark text-white">
      {/* Header Logo Section - ONLY LOGO */}
      <div
        className="d-flex align-items-center justify-content-between px-3 border-bottom border-secondary"
        style={{ height: '70px' }}
      >
        <div className="d-flex align-items-center justify-content-center flex-grow-1">
          <img
            src={logoImg}
            alt="Gangadhara Nursery Logo"
            className="rounded shadow-sm"
            style={{ width: '42px', height: '42px', objectFit: 'contain', backgroundColor: '#ffffff', padding: '3px' }}
          />
        </div>

        {/* Collapse Toggle Button for Desktop */}
        <Button
          variant="link"
          className="text-white-50 p-0 ms-2 d-none d-lg-block border-0 shadow-none"
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <i className={`bi ${collapsed ? 'bi-chevron-right fs-5' : 'bi-chevron-left fs-5'}`}></i>
        </Button>
      </div>

      {/* Menu List using react-pro-sidebar */}
      <div className="flex-grow-1 overflow-auto py-2">
        <ProSidebar
          collapsed={collapsed}
          backgroundColor="transparent"
          rootStyles={{
            border: 'none',
            color: '#ffffff',
            width: collapsed ? '80px' : '250px',
            minWidth: collapsed ? '80px' : '250px',
          }}
        >
          <Menu
            menuItemStyles={{
              button: ({ active }) => ({
                backgroundColor: active ? '#198754' : 'transparent',
                color: active ? '#ffffff' : '#a0aec0',
                fontWeight: active ? '700' : '500',
                borderRadius: '6px',
                margin: '3px 10px',
                padding: '10px 14px',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: active ? '#198754' : 'rgba(255, 255, 255, 0.08)',
                  color: '#ffffff',
                },
              }),
            }}
          >
            {navItems.map((item) => {
              const isActive = item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);

              return (
                <MenuItem
                  key={item.path}
                  active={isActive}
                  component={<NavLink to={item.path} onClick={onLinkClick} />}
                  icon={<i className={`bi ${item.icon} fs-5`}></i>}
                >
                  {!collapsed && item.label}
                </MenuItem>
              );
            })}
          </Menu>
        </ProSidebar>
      </div>

      {/* Footer copyright */}
      {!collapsed && (
        <div className="p-3 border-top border-secondary text-secondary small text-center">
          <span>Gangadhara Nursery &copy; {new Date().getFullYear()}</span>
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ collapsed, onToggleCollapse, showMobile, onHideMobile }) {
  return (
    <>
      {/* Desktop React Pro Sidebar */}
      <div
        className="d-none d-lg-block position-fixed top-0 bottom-0 start-0 z-3 bg-dark shadow-sm"
        style={{
          width: collapsed ? '80px' : '250px',
          transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <SidebarContent collapsed={collapsed} onToggleCollapse={onToggleCollapse} />
      </div>

      {/* Mobile Offcanvas Sidebar */}
      <Offcanvas show={showMobile} onHide={onHideMobile} className="bg-dark text-white d-lg-none" style={{ width: '270px' }}>
        <Offcanvas.Header closeButton closeVariant="white">
          <Offcanvas.Title className="fw-bold">Menu</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0">
          <SidebarContent collapsed={false} onLinkClick={onHideMobile} />
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}
