import React from 'react';
import { Settings01 } from '@untitledui/icons';
import { SidebarNavigationSectionDividers } from '@/components/application/app-navigation/sidebar-navigation/sidebar-slim';
import { EditIcon, ExportIcon, MethodologyIcon, ResultsIcon, ShieldCheckIcon, UploadIcon, ValidateIcon, ReviewIcon } from './Icons';

const navigationItems = [
  { label: 'Upload documents', id: 'upload', href: '#', icon: UploadIcon },
  { label: 'Extracted inventory', id: 'extract', href: '#', icon: ReviewIcon },
  { label: 'Review & mapping', id: 'user_review', href: '#', icon: EditIcon },
  { label: 'PCR rules audit', id: 'validate', href: '#', icon: ValidateIcon },
  { label: 'LCIA methodology', id: 'methodology', href: '#', icon: MethodologyIcon },
  { label: 'LCIA results', id: 'results', href: '#', icon: ResultsIcon },
  { label: 'Pre-audit verification', id: 'audit', href: '#', icon: ShieldCheckIcon },
  { label: 'Export EPD', id: 'export', href: '#', icon: ExportIcon },
];

export default function StudioSidebar() {
  return <SidebarNavigationSectionDividers items={navigationItems} footerItems={[{ label: 'Settings', href: '/settings', icon: Settings01 }]} />;
}
