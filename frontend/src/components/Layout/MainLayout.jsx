import React, { useState } from 'react';
import Sidebar from './Sidebar';
import TopNavbar from './TopNavbar';
import { Container } from 'react-bootstrap';

export default function MainLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  const toggleCollapse = () => setCollapsed((prev) => !prev);

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
        showMobile={showMobileSidebar}
        onHideMobile={() => setShowMobileSidebar(false)}
      />

      <div
        className="flex-grow-1 p-0 d-flex flex-column min-vh-100"
        style={{
          marginLeft: collapsed ? '72px' : '256px',
          transition: 'margin-left 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* On mobile screens, remove left margin */}
        <style>
          {`
            @media (max-width: 991.98px) {
              .flex-grow-1 {
                margin-left: 0 !important;
              }
            }
          `}
        </style>
        <TopNavbar
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
          onToggleMobileMenu={() => setShowMobileSidebar(true)}
        />
        <main className="flex-grow-1 p-3 p-md-4">
          <Container fluid className="px-0">
            {children}
          </Container>
        </main>

        <footer className="py-3 px-4 border-top bg-white text-muted small mt-auto d-print-none">
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2">
            <div>
              © {new Date().getFullYear()} <strong className="text-dark">Gangadhara Nursery</strong> — All Rights Reserved
            </div>
            <div className="fw-semibold" style={{ color: '#059669' }}>
              Developed by <span className="text-dark fw-bold">Ramesh Ayyala</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
