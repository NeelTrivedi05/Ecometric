import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FileIcon } from "@untitledui/file-icons";
import { UploadCloud02 } from "@untitledui/icons";
import { Table, TableCard } from "@/components/application/table/table";
import uploadedFiles from "@/components/application/table/uploaded-files.json";
import { Button } from "@/components/base/buttons/button";
import { DropdownIconSimple } from "@/components/base/dropdown/dropdown-icon-simple";
import { useStudio } from "@/context/StudioContext";
import { PlusIcon, FileTextIcon, ShieldCheckIcon } from "./Icons";
import EpdCertificateModal from "./EpdCertificateModal";

export const Table04AlternatingFills = ({ onInspectEpd, searchQuery = '', typeFilter = 'all' }) => {
    const { currentAccount, assembledDatabase, showNotif, addEpd } = useStudio();
    const fileInputRef = useRef(null);

    // Helper to generate account-specific file inventory
    const getAccountFiles = (acc, db) => {
        const brand = acc?.company_name || 'Carrier Commercial HVAC';
        const prefix = brand.replace(/\s+/g, '_');
        const facility = (acc?.facility_name || 'Primary Plant').replace(/\s+/g, '_');
        const user = acc?.user_name || 'Lead LCA Engineer';
        const code = acc?.avatar || 'CC';
        const dbName = (db?.db_name || 'ecoinvent 3.12').replace(/\s+/g, '_');

        return [
            {
                name: `${prefix}_EPD_Declaration.pdf`,
                size: '2.4 MB',
                uploadedAt: 'Apr 15, 2026',
                updatedAt: 'Apr 15, 2031 (5-yr cycle)',
                uploadedBy: user,
                type: 'pdf',
                status: 'Verified & Published',
                epd_number: `EPD-${code}-2026-001`,
                sha256: '9a2f7c4b1890de5a6b7312c4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4',
            },
            {
                name: `${prefix}_${facility}_LCI_BOM.xlsx`,
                size: '1.8 MB',
                uploadedAt: 'Apr 12, 2026',
                updatedAt: 'Apr 14, 2026',
                uploadedBy: user,
                type: 'xlsx',
                status: 'Primary Foreground LCI',
                epd_number: null,
                sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
            },
            {
                name: `EPD_${code}_2026_001_openEPD_Package.json`,
                size: '340 KB',
                uploadedAt: 'Apr 15, 2026',
                updatedAt: 'Apr 15, 2026',
                uploadedBy: 'EcoMetric Core Engine',
                type: 'json',
                status: 'Digital Product Passport',
                epd_number: `EPD-${code}-2026-001`,
                sha256: '6bc4e6475877e8e90d8a6184b681366154cc5f6ec42c7cec54eb871224b33e02',
            },
            {
                name: `UL10010_4_Verification_Certificate.pdf`,
                size: '890 KB',
                uploadedAt: 'Apr 14, 2026',
                updatedAt: 'Apr 14, 2026',
                uploadedBy: 'Jack Geibig (EcoForm)',
                type: 'pdf',
                status: 'Third-Party Certified',
                epd_number: `EPD-${code}-2026-001`,
                sha256: 'a17f4b8932c019d5ef7698a2456b9c81432f801648a73921098e4f16bc479831',
            },
            {
                name: `${dbName}_Lineage_Audit.csv`,
                size: '512 KB',
                uploadedAt: 'Apr 10, 2026',
                updatedAt: 'Apr 11, 2026',
                uploadedBy: 'Audit Traceability Subsystem',
                type: 'csv',
                status: 'Lineage Proof Verified',
                epd_number: null,
                sha256: 'c89b71e403d7912a5b6e410f87234918e98341a0293847561829304857102948',
            },
        ];
    };

    const [filesData, setFilesData] = useState(() => getAccountFiles(currentAccount, assembledDatabase));
    const [selectedEpdForCert, setSelectedEpdForCert] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);

    // Update files whenever current signed-in account or database changes
    useEffect(() => {
        setFilesData(getAccountFiles(currentAccount, assembledDatabase));
    }, [currentAccount, assembledDatabase]);

    // Filter files based on search query and type filter
    const filteredFiles = useMemo(() => {
        return filesData.filter((file) => {
            if (typeFilter && typeFilter !== 'all' && file.type !== typeFilter) {
                return false;
            }
            if (searchQuery && searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchName = file.name.toLowerCase().includes(q);
                const matchUser = file.uploadedBy?.toLowerCase().includes(q);
                const matchStatus = file.status?.toLowerCase().includes(q);
                const matchEpd = file.epd_number?.toLowerCase().includes(q);
                if (!matchName && !matchUser && !matchStatus && !matchEpd) {
                    return false;
                }
            }
            return true;
        });
    }, [filesData, searchQuery, typeFilter]);

    // Upload file handler
    const handleUploadClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
        const sizeStr = parseFloat(sizeInMb) > 0 ? `${sizeInMb} MB` : `${Math.max(1, Math.round(file.size / 1024))} KB`;
        const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';

        const newFileItem = {
            name: file.name,
            size: sizeStr,
            uploadedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            updatedAt: 'Just now (Foreground LCI)',
            uploadedBy: currentAccount?.user_name || 'Lead LCA Engineer',
            type: ext,
            status: 'Uploaded Foreground Dataset',
            epd_number: null,
            sha256: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
        };

        setFilesData((prev) => [newFileItem, ...prev]);
        if (showNotif) {
            showNotif(`Uploaded ${file.name} (${sizeStr}) to ${currentAccount?.facility_name || 'facility assembly'}.`, 'File Uploaded');
        }
        e.target.value = '';
    };

    // Generate new EPD PDF handler
    const handleGeneratePdf = () => {
        setIsGenerating(true);
        const facilityName = assembledDatabase?.facility_name || currentAccount?.facility_name || 'Primary Plant';
        const brandName = currentAccount?.company_name || 'Carrier Commercial HVAC';
        const code = currentAccount?.avatar || 'EM';

        setTimeout(() => {
            const randomId = Math.floor(100 + Math.random() * 900);
            const fileName = `${brandName.replace(/\s+/g, '_')}_EPD_2026_${randomId}.pdf`;
            const epdNum = `EPD-${code}-2026-${randomId}`;

            const newFile = {
                name: fileName,
                size: '2.6 MB',
                uploadedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                updatedAt: `${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} (Valid 5 yrs)`,
                uploadedBy: currentAccount?.user_name || 'Lead LCA Engineer',
                type: 'pdf',
                status: 'Verified & Generated',
                epd_number: epdNum,
                sha256: '9a2f7c4b1890de5a6b7312c4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4',
            };

            setFilesData((prev) => [newFile, ...prev]);

            // Sync with studio epds list
            if (addEpd) {
                addEpd({
                    id: `epd-${randomId}`,
                    epd_number: epdNum,
                    title: `${brandName} EPD 2026 ${randomId}`,
                    product_name: `${brandName} High-Efficiency Chiller System`,
                    pcr_standard: assembledDatabase?.pcr_standard || 'UL 10010-4 Part B v2.0 & EN 15804+A2',
                    verifier: 'Jack Geibig',
                    verifier_org: 'EcoForm Certification',
                    gwp_total: 38420,
                    valid_until: '2031-04-15',
                    created_at: new Date().toISOString(),
                });
            }

            setIsGenerating(false);

            if (showNotif) {
                showNotif(`Generated ${fileName} with ${facilityName} LCI lineage.`, 'EPD PDF Generated');
            }

            // Immediately offer inspection of generated certificate
            const certData = {
                epd_number: epdNum,
                title: fileName.replace(/_/g, ' ').replace('.pdf', ''),
                product_name: `${brandName} Commercial Industrial System`,
                program_operator: 'UL Solutions / EcoPlatform',
                pcr_standard: assembledDatabase?.pcr_standard || currentAccount?.pcr_standard || 'UL 10010-4 Part B v2.0 & EN 15804+A2',
                publication_date: newFile.uploadedAt,
                valid_until: '2031-04-15',
                verifier: 'Jack Geibig',
                verifier_org: 'EcoForm Certification',
                functional_unit: '1 ton cooling capacity over 25 years RSL',
                gwp_total: 38420,
                a1_a3_gwp: 14200,
                a4_a5_gwp: 1850,
                b1_b7_gwp: 21100,
                c1_c4_gwp: 1270,
                module_d: -3840,
                sha256_hash: newFile.sha256,
                dqr_score: assembledDatabase?.dqr_score || 1.28,
            };
            if (onInspectEpd) {
                onInspectEpd(certData);
            } else {
                setSelectedEpdForCert(certData);
            }
        }, 500);
    };

    // Real client-side package download handler
    const handleDownloadAll = () => {
        const company = currentAccount?.company_name || 'Carrier Commercial HVAC';
        const packageData = {
            package_name: `${company} - Complete EPD & Foreground LCI Package`,
            exported_at: new Date().toISOString(),
            iso_standard: "ISO 14025 / EN 15804+A2 Type III Verification",
            pcr_reference: assembledDatabase?.pcr_standard || currentAccount?.pcr_standard || "UL 10010-4 Part B v2.0",
            facility: assembledDatabase?.facility_name || currentAccount?.facility_name,
            grid_emission_factor_kg_co2e_per_kwh: assembledDatabase?.grid_emission_factor,
            data_quality_score: assembledDatabase?.dqr_score || 1.28,
            verified_files_inventory: filesData.map((f) => ({
                filename: f.name,
                size: f.size,
                date_uploaded: f.uploadedAt,
                last_updated: f.updatedAt,
                uploaded_by: f.uploadedBy,
                status: f.status,
                epd_number: f.epd_number,
                sha256_hash: f.sha256,
            })),
        };

        const blob = new Blob([JSON.stringify(packageData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${company.replace(/\s+/g, '_')}_EPD_Package.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 2000);

        if (showNotif) {
            showNotif(`Downloaded verified package (${filesData.length} files) for ${company}.`, 'Package Downloaded');
        }
    };

    // Download single file handler
    const downloadSingleFile = (item) => {
        const company = currentAccount?.company_name || 'Carrier Commercial HVAC';
        let content = '';
        let mime = 'application/octet-stream';

        if (item.name.endsWith('.json')) {
            content = JSON.stringify(
                {
                    epd_id: item.epd_number || 'EPD-2026-001',
                    product: item.name.replace(/\.[^/.]+$/, ''),
                    standard: assembledDatabase?.pcr_standard || 'UL 10010-4 Part B v2.0 & EN 15804+A2',
                    lineage_sha256: item.sha256,
                    generated_at: new Date().toISOString(),
                },
                null,
                2
            );
            mime = 'application/json';
        } else if (item.name.endsWith('.csv')) {
            content = `File,Module,Life Cycle Stage,Impact (kg CO2e),Data Quality Rating\n${item.name},A1-A3,Product Manufacturing,14200,1.28\n${item.name},A4-A5,Construction Freight,1850,1.31\n${item.name},B1-B7,Operational Energy,21100,1.24\n${item.name},C1-C4,End of Life,1270,1.35\n${item.name},Module D,Net Recycled Metal Credit,-3840,1.30`;
            mime = 'text/csv';
        } else if (item.name.endsWith('.xlsx')) {
            content = `Foreground LCI Bill of Materials Export\nFacility: ${assembledDatabase?.facility_name || currentAccount?.facility_name}\nData Quality Rating: ${assembledDatabase?.dqr_score || 1.28}\nSHA256: ${item.sha256}`;
            mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        } else {
            // PDF Document
            content = `%PDF-1.4\n% EcoMetric ISO 14025 / EN 15804+A2 Environmental Product Declaration\nManufacturer: ${company}\nProduct: ${item.name.replace(/\.pdf$/, '')}\nRegistration: ${item.epd_number || 'EPD-CC-2026-001'}\nPCR Standard: UL 10010-4 Part B v2.0 & EN 15804+A2\nTotal GWP (A1-C4): 38,420 kg CO2e\nData Quality Rating: DQR ${assembledDatabase?.dqr_score || 1.28}\nVerification Hash: ${item.sha256}\nThird-party Verified by Jack Geibig (EcoForm Certification)\n%%EOF`;
            mime = 'application/pdf';
        }

        const blob = new Blob([content], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = item.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 2000);

        if (showNotif) {
            showNotif(`Downloaded ${item.name} successfully.`, 'File Downloaded');
        }
    };

    const handleActionSelect = (item, action) => {
        if (action.action === 'inspect' || action.action === 'verify') {
            const certData = {
                epd_number: item.epd_number || `EPD-${currentAccount?.avatar || 'EM'}-2026-001`,
                title: item.name.replace(/_/g, ' ').replace('.pdf', ''),
                product_name: item.name.replace(/_/g, ' ').replace('.pdf', ''),
                program_operator: 'UL Solutions / EcoPlatform',
                pcr_standard: assembledDatabase?.pcr_standard || currentAccount?.pcr_standard || 'UL 10010-4 Part B v2.0 & EN 15804+A2',
                publication_date: item.uploadedAt,
                valid_until: '2031-04-15',
                verifier: 'Jack Geibig',
                verifier_org: 'EcoForm Certification',
                functional_unit: '1 ton cooling capacity over 25 years RSL',
                gwp_total: 38420,
                a1_a3_gwp: 14200,
                a4_a5_gwp: 1850,
                b1_b7_gwp: 21100,
                c1_c4_gwp: 1270,
                module_d: -3840,
                sha256_hash: item.sha256,
                dqr_score: assembledDatabase?.dqr_score || 1.28,
            };
            if (onInspectEpd) {
                onInspectEpd(certData);
            } else {
                setSelectedEpdForCert(certData);
            }
        } else if (action.action === 'download') {
            downloadSingleFile(item);
        }
    };

    return (
        <>
            {/* Hidden system file picker for genuine upload */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
                accept=".pdf,.xlsx,.xls,.json,.csv"
            />

            <TableCard.Root>
                <TableCard.Header
                    title="Files uploaded"
                    description={`Type III declarations and background LCI files assembled for ${currentAccount?.company_name || 'active facility'}`}
                    contentTrailing={
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Button size="sm" color="secondary" onClick={handleDownloadAll}>
                                Download all
                            </Button>
                            <Button
                                size="sm"
                                color="secondary"
                                iconLeading={UploadCloud02}
                                onClick={handleUploadClick}
                            >
                                Upload
                            </Button>
                            <Button
                                size="sm"
                                color="primary"
                                iconLeading={PlusIcon}
                                onClick={handleGeneratePdf}
                                disabled={isGenerating}
                            >
                                {isGenerating ? 'Generating...' : 'Generate EPD PDF'}
                            </Button>
                        </div>
                    }
                />
                <Table aria-label="Team members" selectionMode="multiple">
                    <Table.Header className="bg-primary">
                        <Table.Head id="name" label="File name" isRowHeader />
                        <Table.Head id="size" label="File size" />
                        <Table.Head id="uploadedAt" label="Date uploaded" />
                        <Table.Head id="updatedAt" label="Last updated" className="md:hidden xl:table-cell" />
                        <Table.Head id="uploadedBy" label="Uploaded by" />
                        <Table.Head id="actions" />
                    </Table.Header>
                    <Table.Body items={filteredFiles}>
                        {(item) => (
                            <Table.Row id={item.name} key={item.name} className="odd:bg-secondary">
                                <Table.Cell>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <FileIcon type={item.name.split(".")[1] || 'pdf'} theme="light" className="size-10 dark:hidden" />
                                        <FileIcon type={item.name.split(".")[1] || 'pdf'} theme="dark" className="size-10 not-dark:hidden" />

                                        <div className="whitespace-nowrap">
                                            <p
                                                className="text-sm font-medium text-primary"
                                                style={{ cursor: 'pointer', transition: 'color 0.15s ease' }}
                                                onClick={() => handleActionSelect(item, { action: 'inspect' })}
                                                onMouseEnter={(e) => (e.currentTarget.style.color = '#1f7a4c')}
                                                onMouseLeave={(e) => (e.currentTarget.style.color = '#16231b')}
                                            >
                                                {item.name}
                                            </p>
                                            <p className="text-sm text-tertiary">
                                                {item.size} • {item.status || 'Verified'}
                                            </p>
                                        </div>
                                    </div>
                                </Table.Cell>
                                <Table.Cell className="whitespace-nowrap">{item.size}</Table.Cell>
                                <Table.Cell className="whitespace-nowrap">{item.uploadedAt}</Table.Cell>
                                <Table.Cell className="whitespace-nowrap md:hidden xl:table-cell">{item.updatedAt}</Table.Cell>
                                <Table.Cell className="whitespace-nowrap">{item.uploadedBy}</Table.Cell>
                                <Table.Cell className="px-4">
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                                        <DropdownIconSimple
                                            items={[
                                                { label: 'Inspect EPD Certificate', action: 'inspect' },
                                                { label: 'Download PDF', action: 'download' },
                                                { label: 'Verify Cryptographic Lineage', action: 'verify' },
                                            ]}
                                            onSelect={(action) => handleActionSelect(item, action)}
                                        />
                                    </div>
                                </Table.Cell>
                            </Table.Row>
                        )}
                    </Table.Body>
                </Table>
            </TableCard.Root>

            <EpdCertificateModal
                epd={selectedEpdForCert}
                isOpen={Boolean(selectedEpdForCert)}
                onClose={() => setSelectedEpdForCert(null)}
            />
        </>
    );
};

export default Table04AlternatingFills;
