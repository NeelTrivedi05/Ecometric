import React from 'react';
import BrandLogo from '../../../BrandLogo';
import { LayersTwo01, XClose } from '@untitledui/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useStudio } from '../../../../context/StudioContext';

export function SidebarNavigationSlim({ items = [], footerItems = [], className = '' }) {
  const { activePhase, setActivePhase, isSidebarOpen, setIsSidebarOpen } = useStudio();
  const navigate = useNavigate();
  const { projectId } = useParams();

  const activateItem = (item) => {
    if (item.id) setActivePhase(item.id);
    if (item.id && projectId) {
      navigate(`/app/projects/${projectId}/${item.id}`);
    } else if (item.href && item.href !== '#') {
      navigate(item.href);
    }
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const handleFooter = (item) => {
    if (item.label === 'Settings') navigate('/console');
    if (item.label === 'Support') item.onClick?.();
  };

  return (
    <aside className={`studio-sidebar untitled-sidebar ${isSidebarOpen ? 'mobile-open' : ''} ${className}`} aria-label="Primary navigation">
      <div className="untitled-sidebar-brand">
        <span className="untitled-sidebar-brand-mark"><BrandLogo /></span>
        <span>EcoMetric</span>
      </div>
      <nav className="untitled-sidebar-nav">
        {items.map((item, index) => {
          if (item.divider) return <div className="untitled-sidebar-divider" key={`divider-${index}`} role="separator" />;
          const Icon = item.icon;
          const isActive = item.id ? activePhase === item.id : item.href === window.location.pathname;
          return (
            <div className="untitled-sidebar-group" key={item.label}>
              <button type="button" className={`untitled-sidebar-item ${isActive ? 'active' : ''}`} onClick={() => activateItem(item)} aria-current={isActive ? 'page' : undefined}>
                {Icon && <Icon size={18} />}
                <span>{item.label}</span>
                {item.badge && <span className="untitled-sidebar-badge">{item.badge}</span>}
              </button>
            </div>
          );
        })}
      </nav>
      <div className="untitled-sidebar-footer">
        {footerItems.map((item) => { const Icon = item.icon; return <button type="button" className="untitled-sidebar-item" key={item.label} onClick={() => handleFooter(item)}>{Icon && <Icon size={18} />}<span>{item.label}</span>{item.badge}</button>; })}
        <button type="button" className="untitled-sidebar-mobile-close" onClick={() => setIsSidebarOpen(false)} aria-label="Close navigation"><XClose size={16} /></button>
      </div>
    </aside>
  );
}

export const SidebarNavigationSectionDividers = SidebarNavigationSlim;
export default SidebarNavigationSlim;
