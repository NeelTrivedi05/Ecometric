import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStudio } from '../../context/StudioContext';
import {
  FolderIcon,
  TagIcon,
  SearchIcon,
  PlusIcon,
  TrashIcon,
  BookOpenIcon,
  BuildingIcon,
  LayersIcon,
  CheckIcon,
  FileTextIcon,
  ExternalLinkIcon,
  CopyIcon,
  XIcon,
  ArrowDownIcon,
  FilterIcon,
  MoreVerticalIcon,
  HelpCircleIcon,
} from './Icons';
import EpdCertificateModal from './EpdCertificateModal';
import Table04AlternatingFills from './Table04AlternatingFills';
import { Button } from '@/components/base/buttons/button';

export default function ProjectsConsole() {
  const {
    currentAccount,
    accountsList,
    switchAccount,
    projectsList,
    epdsList,
    assembledDatabase,
    openProject,
    createProject,
    duplicateProject,
    deleteProject,
  } = useStudio();

  const navigate = useNavigate();
  const { folder } = useParams();

  // Navigation sidebar selection
  const [activeFolder, setActiveFolder] = useState('all'); // 'all', 'mine', 'shared', 'archived', 'epds'
  const [selectedTag, setSelectedTag] = useState(null);
  const [customTags, setCustomTags] = useState([
    'Chillers',
    'Heat Pumps',
    'Low-GWP HFO',
    'Variable Speed',
    'PEP Ecopassport',
  ]);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');

  // Top banner dismiss state
  const [showBanner, setShowBanner] = useState(true);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);

  // Modals
  const [selectedEpdForCert, setSelectedEpdForCert] = useState(null);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);

  useEffect(() => {
    const folderByRoute = {
      projects: 'all',
      mine: 'mine',
      shared: 'shared',
      archived: 'archived',
      epds: 'epds',
    };
    if (folder && folderByRoute[folder] && folderByRoute[folder] !== activeFolder) {
      setActiveFolder(folderByRoute[folder]);
      setSelectedTag(null);
      setSearchQuery('');
      setStatusFilter('all');
    }
  }, [folder, activeFolder]);

  const navigateToFolder = (nextFolder) => {
    const routeByFolder = {
      all: '/app/projects',
      mine: '/app/mine',
      shared: '/app/shared',
      archived: '/app/archived',
      epds: '/app/epds',
    };
    setActiveFolder(nextFolder);
    setSelectedTag(null);
    setSearchQuery('');
    setStatusFilter('all');
    navigate(routeByFolder[nextFolder]);
  };

  // Filter projects based on folder, tag, status, search
  const filteredProjects = useMemo(() => {
    return projectsList.filter((proj) => {
      // Folder filter
      if (activeFolder === 'mine' && proj.owner !== 'You') return false;
      if (activeFolder === 'shared' && proj.owner === 'You') return false;
      if (activeFolder === 'archived' && proj.status !== 'Archived') return false;
      if (activeFolder !== 'archived' && proj.status === 'Archived') return false;

      // Tag filter
      if (selectedTag && (!proj.tags || !proj.tags.includes(selectedTag))) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && proj.status !== statusFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = proj.name?.toLowerCase().includes(q);
        const matchesModel = proj.product_model?.toLowerCase().includes(q);
        const matchesOwner = proj.owner?.toLowerCase().includes(q);
        const matchesStandard = proj.standard?.toLowerCase().includes(q);
        const matchesRefrigerant = proj.refrigerant?.toLowerCase().includes(q);
        if (!matchesName && !matchesModel && !matchesOwner && !matchesStandard && !matchesRefrigerant) {
          return false;
        }
      }

      return true;
    });
  }, [projectsList, activeFolder, selectedTag, statusFilter, searchQuery]);

  // Select all handler
  const isAllSelected =
    filteredProjects.length > 0 &&
    filteredProjects.every((p) => selectedProjectIds.includes(p.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedProjectIds([]);
    } else {
      setSelectedProjectIds(filteredProjects.map((p) => p.id));
    }
  };

  const toggleSelectProject = (id) => {
    if (selectedProjectIds.includes(id)) {
      setSelectedProjectIds(selectedProjectIds.filter((pId) => pId !== id));
    } else {
      setSelectedProjectIds([...selectedProjectIds, id]);
    }
  };

  // Tag creation
  const handleAddTag = (e) => {
    e.preventDefault();
    if (newTagInput.trim() && !customTags.includes(newTagInput.trim())) {
      setCustomTags([...customTags, newTagInput.trim()]);
      setNewTagInput('');
      setIsAddingTag(false);
    }
  };

  // Open project handler
  const handleOpenProject = (project) => {
    openProject(project.id);
    navigate(`/app/projects/${project.id}`);
  };

  // New project handler: create a default project and go straight to the studio
  const handleNewProject = () => {
    const capacityRt = 500;
    const lifespanYears = 25;
    const newProj = {
      id: `proj-${Date.now()}`,
      name: 'Untitled project',
      product_model: `UNTITLED-${capacityRt}RT`,
      capacity_rt: capacityRt,
      refrigerant: assembledDatabase?.default_refrigerant || 'R1233zd',
      refrigerant_charge_kg: 320,
      gwp_total: Math.round(capacityRt * 76.8),
      status: 'In Calculation',
      standard: assembledDatabase?.pcr_standard || 'UL 10010-4 Part B v2.0 & EN 15804+A2',
      owner: 'You',
      last_modified: 'Just now by You',
      created_at: new Date().toISOString().split('T')[0],
      tags: ['Chillers', 'Primary Facility LCI'],
      preset_key: 'carrier_19dv_benchmark',
      functional_unit: `1 ton chilling capacity over ${lifespanYears} years reference service life`,
      declared_unit: `1 complete chiller unit (${capacityRt} RT)`,
      facility: assembledDatabase?.facility_name || currentAccount?.facility_name || 'Primary Facility',
      epd_number: null,
    };
    createProject(newProj);
    navigate(`/app/projects/${newProj.id}`);
  };

  // Batch delete / archive
  const handleBatchArchive = () => {
    selectedProjectIds.forEach((id) => deleteProject(id));
    setSelectedProjectIds([]);
  };

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100%',
        backgroundColor: '#f2f6f0',
        fontFamily: "'Google Sans Flex', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: '#16231b',
        overflow: 'hidden',
      }}
    >
      {/* -------------------- LEFT SIDEBAR (OVERLEAF / ENGINEERING CONSOLE) -------------------- */}
      <aside
        style={{
          width: '260px',
          minWidth: '260px',
          backgroundColor: '#1b2620', // Dark forest slate matching the industrial console template
          color: '#e4ebe6',
          borderRight: '1px solid #28372d',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          userSelect: 'none',
        }}
      >
        {/* Top Section */}
        <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {/* Brand Mark */}
          <div
            style={{
              padding: '18px 20px',
              borderBottom: '1px solid #28372d',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                backgroundColor: '#1f7a4c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              <LayersIcon size={16} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em' }}>
                EcoMetric
              </div>
              <div style={{ fontSize: '11px', color: '#97a89e' }}>
                LCA & EPD Studio
              </div>
            </div>
          </div>

          {/* Navigation Items (Projects) */}
          <div style={{ padding: '16px 12px 8px' }}>
            {/* Primary 'Projects' Header Tab */}
            <div
              onClick={() => {
                navigateToFolder('all');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 12px',
                borderRadius: '8px',
                backgroundColor: activeFolder === 'all' && !selectedTag ? '#1f7a4c' : 'transparent',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                marginBottom: '4px',
              }}
            >
              <FolderIcon size={16} />
              <span>Projects</span>
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: activeFolder === 'all' && !selectedTag ? 'rgba(255,255,255,0.2)' : '#28372d',
                  padding: '2px 7px',
                  borderRadius: '9999px',
                }}
              >
                {projectsList.length}
              </span>
            </div>

            {/* Sub Folders */}
            <div style={{ paddingLeft: '14px', marginTop: '2px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div
                onClick={() => {
                  navigateToFolder('all');
                }}
                style={{
                  padding: '7px 10px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: activeFolder === 'all' && !selectedTag ? '#ffffff' : '#b1c2b7',
                  fontWeight: activeFolder === 'all' && !selectedTag ? 600 : 400,
                  cursor: 'pointer',
                  backgroundColor: activeFolder === 'all' && !selectedTag ? '#263b2f' : 'transparent',
                }}
              >
                All projects
              </div>

              <div
                onClick={() => {
                  navigateToFolder('mine');
                }}
                style={{
                  padding: '7px 10px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: activeFolder === 'mine' ? '#ffffff' : '#b1c2b7',
                  fontWeight: activeFolder === 'mine' ? 600 : 400,
                  cursor: 'pointer',
                  backgroundColor: activeFolder === 'mine' ? '#263b2f' : 'transparent',
                }}
              >
                Your projects
              </div>

              <div
                onClick={() => {
                  navigateToFolder('shared');
                }}
                style={{
                  padding: '7px 10px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: activeFolder === 'shared' ? '#ffffff' : '#b1c2b7',
                  fontWeight: activeFolder === 'shared' ? 600 : 400,
                  cursor: 'pointer',
                  backgroundColor: activeFolder === 'shared' ? '#263b2f' : 'transparent',
                }}
              >
                Shared with you
              </div>

              <div
                onClick={() => {
                  navigateToFolder('archived');
                }}
                style={{
                  padding: '7px 10px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: activeFolder === 'archived' ? '#ffffff' : '#b1c2b7',
                  fontWeight: activeFolder === 'archived' ? 600 : 400,
                  cursor: 'pointer',
                  backgroundColor: activeFolder === 'archived' ? '#263b2f' : 'transparent',
                }}
              >
                Archived projects
              </div>

              <div
                onClick={() => {
                  navigateToFolder('epds');
                }}
                style={{
                  padding: '7px 10px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  color: activeFolder === 'epds' ? '#ffffff' : '#b1c2b7',
                  fontWeight: activeFolder === 'epds' ? 600 : 400,
                  cursor: 'pointer',
                  backgroundColor: activeFolder === 'epds' ? '#263b2f' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>Generated EPDs</span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 600,
                    backgroundColor: '#1f7a4c',
                    color: '#ffffff',
                    padding: '1px 6px',
                    borderRadius: '9999px',
                  }}
                >
                  {epdsList.length}
                </span>
              </div>
            </div>
          </div>

          {/* Section: ORGANIZE TAGS */}
          <div style={{ padding: '16px 16px 8px', borderTop: '1px solid #28372d', marginTop: '10px' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.06em',
                color: '#829589',
                textTransform: 'uppercase',
                marginBottom: '8px',
              }}
            >
              Organize Tags
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {customTags.map((tag) => {
                const isTagActive = selectedTag === tag;
                return (
                  <div
                    key={tag}
                    onClick={() => {
                      setSelectedTag(isTagActive ? null : tag);
                      if (activeFolder === 'epds') navigateToFolder('all');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      fontSize: '12.5px',
                      color: isTagActive ? '#ffffff' : '#b1c2b7',
                      fontWeight: isTagActive ? 600 : 400,
                      cursor: 'pointer',
                      backgroundColor: isTagActive ? '#263b2f' : 'transparent',
                    }}
                  >
                    <TagIcon size={13} style={{ color: isTagActive ? '#1f7a4c' : '#73857a' }} />
                    <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {tag}
                    </span>
                  </div>
                );
              })}

              {isAddingTag ? (
                <form onSubmit={handleAddTag} style={{ marginTop: '6px' }}>
                  <input
                    type="text"
                    autoFocus
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    placeholder="Tag name..."
                    style={{
                      width: '100%',
                      padding: '5px 8px',
                      fontSize: '12px',
                      backgroundColor: '#28372d',
                      border: '1px solid #3d5244',
                      borderRadius: '4px',
                      color: '#ffffff',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    onBlur={() => {
                      if (!newTagInput.trim()) setIsAddingTag(false);
                    }}
                  />
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingTag(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#829589',
                    fontSize: '12.5px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    padding: '6px 8px',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '4px',
                  }}
                >
                  <PlusIcon size={12} />
                  <span>New tag</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Utility Navigation */}
        <div style={{ padding: '12px', borderTop: '1px solid #28372d', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div
            style={{
              padding: '8px 10px',
              borderRadius: '6px',
              fontSize: '12.5px',
              color: '#b1c2b7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}
            onClick={() => setIsAccountDropdownOpen(true)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BuildingIcon size={15} style={{ color: '#829589' }} />
              <span>LCI Plant Lineage</span>
            </div>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                backgroundColor: '#1f7a4c',
                color: '#ffffff',
                padding: '1px 6px',
                borderRadius: '4px',
              }}
            >
              v3.12
            </span>
          </div>

          <div
            style={{
              padding: '8px 10px',
              borderRadius: '6px',
              fontSize: '12.5px',
              color: '#b1c2b7',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
            }}
            onClick={() => navigateToFolder('archived')}
          >
            <TrashIcon size={15} style={{ color: '#829589' }} />
            <span>Trash</span>
          </div>

          {/* Account Profile Footer */}
          <div
            style={{
              marginTop: '8px',
              padding: '10px',
              borderRadius: '8px',
              backgroundColor: '#26342b',
              border: '1px solid #334438',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              position: 'relative',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: currentAccount?.accent_color || '#1f7a4c',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {currentAccount?.avatar || 'AC'}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#ffffff',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
              >
                {currentAccount?.company_name || 'Signed In Account'}
              </div>
              <div
                style={{
                  fontSize: '10.5px',
                  color: '#8ea195',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
              >
                {currentAccount?.user_name}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
              style={{
                background: 'none',
                border: 'none',
                color: '#829589',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Switch Signed-in Account"
            >
              <MoreVerticalIcon size={15} />
            </button>

            {/* Account Switcher Popover */}
            {isAccountDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '52px',
                  left: '0',
                  width: '260px',
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #dfe7dd',
                  boxShadow: '0 16px 36px rgba(16, 52, 33, 0.22)',
                  zIndex: 100,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '10px 14px',
                    backgroundColor: '#f8faf6',
                    borderBottom: '1px solid #dfe7dd',
                    fontSize: '11px',
                    fontWeight: 600,
                    color: '#5b6f62',
                    textTransform: 'uppercase',
                  }}
                >
                  Switch Signed-In Account & Database
                </div>
                <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                  {accountsList.map((acc) => {
                    const isSelected = acc.id === currentAccount?.id;
                    return (
                      <div
                        key={acc.id}
                        onClick={() => {
                          switchAccount(acc.id);
                          setIsAccountDropdownOpen(false);
                        }}
                        style={{
                          padding: '10px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          backgroundColor: isSelected ? '#eef7f1' : '#ffffff',
                          cursor: 'pointer',
                          borderBottom: '1px solid #edf2ec',
                          transition: 'background 0.15s ease',
                        }}
                      >
                        <div
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '5px',
                            backgroundColor: acc.accent_color || '#1f7a4c',
                            color: '#ffffff',
                            fontWeight: 700,
                            fontSize: '11px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {acc.avatar}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: '12px',
                              fontWeight: 600,
                              color: isSelected ? '#1f7a4c' : '#16231b',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {acc.company_name}
                          </div>
                          <div style={{ fontSize: '10px', color: '#5b6f62' }}>
                            {acc.facility_name}
                          </div>
                        </div>
                        {isSelected && <CheckIcon size={14} style={{ color: '#1f7a4c' }} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* -------------------- MAIN WORKSPACE CONTENT AREA -------------------- */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#f2f6f0',
          overflowY: 'auto',
        }}
      >
        {/* Top Dismissible Announcement Banner (Matching Overleaf Template in image) */}
        {showBanner && (
          <div
            style={{
              backgroundColor: '#1b3829', // Deep nature forest slate
              color: '#ffffff',
              padding: '12px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              borderBottom: '1px solid #284c39',
              fontSize: '13px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: '11px',
                  fontWeight: 700,
                }}
              >
                i
              </div>
              <span>
                ISO 14025 & EN 15804+A2 Verification Pipeline active. All LCI calculations use ecoinvent v3.12 verified datasets assembled for{' '}
                <strong>{currentAccount?.company_name}</strong>.
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
              <a
                href="/info"
                style={{
                  padding: '5px 14px',
                  borderRadius: '9999px',
                  border: '1px solid rgba(255,255,255,0.3)',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  transition: 'background 0.15s ease',
                }}
              >
                Verification Standards
              </a>

              <button
                type="button"
                onClick={() => setShowBanner(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.7)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Dismiss notice"
              >
                <XIcon size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Content Container */}
        <div style={{ padding: '24px 36px', maxWidth: '1440px', width: '100%', boxSizing: 'border-box' }}>
          {/* Header Row: Title & Plan Status */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: '#16231b',
                  margin: 0,
                  letterSpacing: '-0.02em',
                }}
              >
                {activeFolder === 'epds'
                  ? 'Generated EPDs & Verifiable Certificates'
                  : activeFolder === 'mine'
                  ? 'Your projects'
                  : activeFolder === 'shared'
                  ? 'Shared with you'
                  : activeFolder === 'archived'
                  ? 'Archived projects'
                  : selectedTag
                  ? `Tagged: ${selectedTag}`
                  : 'All projects'}
              </h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '12px', color: '#5b6f62' }}>
                Signed in: <strong style={{ color: '#16231b' }}>{currentAccount?.company_name}</strong>
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: '#eef7f1',
                  color: '#1f7a4c',
                  border: '1px solid #c8e2d1',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                }}
              >
                {currentAccount?.plan_tier || 'Tier 1 Verified LCI'}
              </span>
            </div>
          </div>

          {/* Section Mode Toggle: Projects vs EPD PDF Generator */}
          <div
            style={{
              display: 'inline-flex',
              backgroundColor: '#e6ede4',
              padding: '3px',
              borderRadius: '10px',
              marginBottom: '16px',
              border: '1px solid #dfe7dd',
            }}
          >
            <button
              type="button"
              onClick={() => {
                navigateToFolder('all');
              }}
              style={{
                padding: '7px 18px',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeFolder !== 'epds' ? '#ffffff' : 'transparent',
                color: activeFolder !== 'epds' ? '#16231b' : '#5b6f62',
                boxShadow: activeFolder !== 'epds' ? '0 1px 3px rgba(16, 52, 33, 0.08)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              Recent Projects ({projectsList.length})
            </button>
            <button
              type="button"
              onClick={() => {
                navigateToFolder('epds');
              }}
              style={{
                padding: '7px 18px',
                fontSize: '13px',
                fontWeight: 600,
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeFolder === 'epds' ? '#ffffff' : 'transparent',
                color: activeFolder === 'epds' ? '#1f7a4c' : '#5b6f62',
                boxShadow: activeFolder === 'epds' ? '0 1px 3px rgba(16, 52, 33, 0.08)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              Files uploaded &amp; EPDs ({epdsList.length})
            </button>
          </div>

          {/* Action & Filter Bar (Matching Overleaf top controls) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              marginBottom: '16px',
            }}
          >
            {/* Search Input */}
            <div style={{ position: 'relative', flex: 1, maxWidth: '640px' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#738077',
                  pointerEvents: 'none',
                  display: 'flex',
                }}
              >
                <SearchIcon size={15} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeFolder === 'epds'
                    ? 'Search uploaded files by name, type, author, or EPD registration...'
                    : 'Search in all projects...'
                }
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 12px 0 36px',
                  fontSize: '13px',
                  border: '1px solid #dfe7dd',
                  borderRadius: '8px',
                  backgroundColor: '#ffffff',
                  color: '#16231b',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s ease',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#738077',
                    cursor: 'pointer',
                    display: 'flex',
                  }}
                >
                  <XIcon size={14} />
                </button>
              )}
            </div>

            {/* Status or File Type Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                height: '38px',
                padding: '0 12px',
                fontSize: '13px',
                border: '1px solid #dfe7dd',
                borderRadius: '8px',
                backgroundColor: '#ffffff',
                color: '#16231b',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {activeFolder === 'epds' ? (
                <>
                  <option value="all">All file types</option>
                  <option value="pdf">PDF Declarations (.pdf)</option>
                  <option value="xlsx">Excel Foreground BOMs (.xlsx)</option>
                  <option value="json">openEPD Packages (.json)</option>
                  <option value="csv">Lineage Audits (.csv)</option>
                </>
              ) : (
                <>
                  <option value="all">All statuses</option>
                  <option value="Verified EPD">Verified EPD</option>
                  <option value="In Calculation">In Calculation</option>
                  <option value="BOM Extracted">BOM Extracted</option>
                  <option value="Draft">Draft</option>
                </>
              )}
            </select>

            {/* Primary Action Button: New project */}
            <Button
              size="md"
              color="primary"
              iconLeading={PlusIcon}
              onClick={handleNewProject}
            >
              New project
            </Button>
          </div>

          {/* -------------------- MAIN DATA TABLE / PROJECTS LIST -------------------- */}
          {activeFolder === 'epds' ? (
            <Table04AlternatingFills
              searchQuery={searchQuery}
              typeFilter={statusFilter}
              onInspectEpd={(cert) => setSelectedEpdForCert(cert)}
            />
          ) : (
            /* Overleaf-Style Projects Table */
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #dfe7dd',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(16, 52, 33, 0.04)',
              }}
            >
              {/* Table Header Row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 2.2fr 1.2fr 1fr 1fr 1.3fr 130px',
                  padding: '12px 16px',
                  backgroundColor: '#f8faf6',
                  borderBottom: '1px solid #dfe7dd',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#5b6f62',
                  alignItems: 'center',
                }}
              >
                {/* Select All Checkbox */}
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    style={{ cursor: 'pointer', accentColor: '#1f7a4c' }}
                  />
                </div>

                <div>Title</div>
                <div>Status & Compliance</div>
                <div>Owner</div>
                <div style={{ textAlign: 'right' }}>Lifecycle GWP</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                  <span>Last modified</span>
                  <ArrowDownIcon size={13} style={{ color: '#1f7a4c' }} />
                </div>
                <div style={{ textAlign: 'right' }}>Action</div>
              </div>

              {/* Table Rows */}
              {filteredProjects.length === 0 ? (
                <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#16231b', marginBottom: '4px' }}>
                    No matching projects found
                  </div>
                  <div style={{ fontSize: '12px', color: '#5b6f62', marginBottom: '16px' }}>
                    Try clearing your search query or create a new project.
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                      setSelectedTag(null);
                      navigateToFolder('all');
                    }}
                    style={{
                      padding: '7px 16px',
                      fontSize: '12px',
                      fontWeight: 500,
                      color: '#1f7a4c',
                      backgroundColor: '#eef7f1',
                      border: '1px solid #c8e2d1',
                      borderRadius: '9999px',
                      cursor: 'pointer',
                    }}
                  >
                    Reset all filters
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {filteredProjects.map((proj) => {
                    const isSelected = selectedProjectIds.includes(proj.id);
                    return (
                      <div
                        key={proj.id}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '40px 2.2fr 1.2fr 1fr 1fr 1.3fr 130px',
                          padding: '14px 16px',
                          borderBottom: '1px solid #edf2ec',
                          alignItems: 'center',
                          fontSize: '13px',
                          backgroundColor: isSelected ? '#eef7f1' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'background 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) e.currentTarget.style.backgroundColor = '#f8faf6';
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) e.currentTarget.style.backgroundColor = '#ffffff';
                        }}
                      >
                        {/* Checkbox */}
                        <div
                          style={{ display: 'flex', alignItems: 'center' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectProject(proj.id)}
                            style={{ cursor: 'pointer', accentColor: '#1f7a4c' }}
                          />
                        </div>

                        {/* Title & Model */}
                        <div
                          onClick={() => handleOpenProject(proj)}
                          style={{ minWidth: 0, paddingRight: '12px' }}
                        >
                          <div
                            style={{
                              fontWeight: 600,
                              color: '#16231b',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                            }}
                          >
                            <span style={{ color: '#1f7a4c', display: 'flex' }}>
                              <FileTextIcon size={15} />
                            </span>
                            <span
                              style={{
                                color: '#16231b',
                                transition: 'color 0.15s ease',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = '#1f7a4c')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = '#16231b')}
                            >
                              {proj.name}
                            </span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#5b6f62', marginTop: '2px' }}>
                            Model: {proj.product_model} • {proj.capacity_rt} RT • {proj.refrigerant}
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div onClick={() => handleOpenProject(proj)}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: '9999px',
                              backgroundColor:
                                proj.status === 'Verified EPD'
                                  ? '#eaf7ee'
                                  : proj.status === 'In Calculation'
                                  ? '#fef3c7'
                                  : '#edf2ec',
                              color:
                                proj.status === 'Verified EPD'
                                  ? '#1f7a4c'
                                  : proj.status === 'In Calculation'
                                  ? '#b45309'
                                  : '#5b6f62',
                              border:
                                proj.status === 'Verified EPD'
                                  ? '1px solid #c3e8cd'
                                  : proj.status === 'In Calculation'
                                  ? '1px solid #fde68a'
                                  : '1px solid #dfe7dd',
                            }}
                          >
                            {proj.status === 'Verified EPD' && <CheckIcon size={10} />}
                            <span>{proj.status}</span>
                          </span>
                        </div>

                        {/* Owner */}
                        <div
                          onClick={() => handleOpenProject(proj)}
                          style={{ color: '#2f3b33', fontSize: '13px' }}
                        >
                          {proj.owner}
                        </div>

                        {/* Lifecycle GWP */}
                        <div
                          onClick={() => handleOpenProject(proj)}
                          style={{
                            textAlign: 'right',
                            fontFamily: 'monospace',
                            fontWeight: 600,
                            color: '#16231b',
                          }}
                        >
                          {(proj.gwp_total || 0).toLocaleString()} kg CO₂e
                        </div>

                        {/* Last modified */}
                        <div
                          onClick={() => handleOpenProject(proj)}
                          style={{
                            textAlign: 'right',
                            color: '#5b6f62',
                            fontSize: '12px',
                          }}
                        >
                          {proj.last_modified}
                        </div>

                        {/* Actions */}
                        <div
                          style={{ textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '6px' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => handleOpenProject(proj)}
                            style={{
                              padding: '5px 12px',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              color: '#ffffff',
                              backgroundColor: '#1f7a4c',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              transition: 'background 0.15s ease',
                            }}
                            title="Open in Calculation Studio"
                          >
                            Open
                          </button>

                          <button
                            type="button"
                            onClick={() => duplicateProject(proj.id)}
                            style={{
                              padding: '5px 8px',
                              background: 'none',
                              border: '1px solid #dfe7dd',
                              borderRadius: '6px',
                              color: '#5b6f62',
                              cursor: 'pointer',
                              backgroundColor: '#ffffff',
                            }}
                            title="Duplicate Project"
                          >
                            <CopyIcon size={12} />
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteProject(proj.id)}
                            style={{
                              padding: '5px 8px',
                              background: 'none',
                              border: '1px solid #dfe7dd',
                              borderRadius: '6px',
                              color: '#dc2626',
                              cursor: 'pointer',
                              backgroundColor: '#ffffff',
                            }}
                            title="Archive / Delete Project"
                          >
                            <TrashIcon size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Table Footer (Showing X out of Y projects) */}
              <div
                style={{
                  padding: '14px 20px',
                  backgroundColor: '#f8faf6',
                  borderTop: '1px solid #dfe7dd',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  color: '#5b6f62',
                }}
              >
                <div>
                  Showing {filteredProjects.length} out of {projectsList.length} projects.
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>ecoinvent v3.12 Cut-Off Model</span>
                  <span>•</span>
                  <span>ISO 14044 / EN 15804+A2 Verified</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* -------------------- FLOATING BATCH ACTIONS BAR -------------------- */}
      {selectedProjectIds.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#1b2620',
            color: '#ffffff',
            padding: '10px 20px',
            borderRadius: '9999px',
            boxShadow: '0 12px 30px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            zIndex: 900,
            fontSize: '13px',
          }}
        >
          <span>
            <strong>{selectedProjectIds.length}</strong> project{selectedProjectIds.length > 1 ? 's' : ''} selected
          </span>

          <div style={{ width: '1px', height: '16px', backgroundColor: '#3d5244' }} />

          <button
            type="button"
            onClick={handleBatchArchive}
            style={{
              background: 'none',
              border: 'none',
              color: '#f87171',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '12.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <TrashIcon size={13} />
            <span>Archive Selected</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedProjectIds([])}
            style={{
              background: 'none',
              border: 'none',
              color: '#b1c2b7',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Deselect All
          </button>
        </div>
      )}

      {/* -------------------- MODALS -------------------- */}
      <EpdCertificateModal
        epd={selectedEpdForCert}
        isOpen={Boolean(selectedEpdForCert)}
        onClose={() => setSelectedEpdForCert(null)}
      />
    </div>
  );
}
