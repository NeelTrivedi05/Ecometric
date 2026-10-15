import React from "react";
import {
    Archive,
    BarChartSquare02,
    CheckDone01,
    ClockFastForward,
    CurrencyDollarCircle,
    Grid03,
    HomeLine,
    Inbox01,
    LifeBuoy01,
    LineChartUp03,
    NotificationBox,
    Package,
    PieChart03,
    Rows01,
    Settings01,
    Settings03,
    Star01,
    Stars01,
    User01,
    UserSquare,
    Users01,
    UsersPlus,
} from "@untitledui/icons";
import {
    UploadIcon,
    ReviewIcon,
    EditIcon,
    ValidateIcon,
    MethodologyIcon,
    ResultsIcon,
    ShieldCheckIcon,
    ExportIcon,
} from "./Icons";
import { SidebarNavigationSlim } from "@/components/application/app-navigation/sidebar-navigation/sidebar-slim";

/**
 * 8 EPD Workflow Tabs as shown in the interface image,
 * structured with dual-tier code functionality and @untitledui/icons
 */
const navItemsDualTier = [
    {
        label: "Upload Documents",
        id: "upload",
        step: "1",
        sub: "XLSX, CSV, PDF Ingestion",
        href: "/upload",
        icon: UploadIcon,
        items: [
            { label: "Document Ingestion", href: "/upload/ingest", icon: Inbox01 },
            { label: "Chiller Benchmarks", href: "/upload/benchmarks", icon: Package },
            { label: "Extraction Engine", href: "/upload/engine", icon: Stars01 },
        ],
    },
    {
        label: "Extracted Inventory",
        id: "extract",
        step: "2",
        sub: "Modules A1–D Coverage",
        href: "/extract",
        icon: ReviewIcon,
        items: [
            { label: "Declared Scope", href: "/extract/scope", icon: Grid03 },
            { label: "Bill of Materials (A1)", href: "/extract/bom", icon: Package },
            { label: "Logistics Scope (A2/A4)", href: "/extract/logistics", icon: ClockFastForward },
            { label: "Plant Operations (A3)", href: "/extract/mfg", icon: BarChartSquare02 },
            { label: "Use Stage & Leakage (B1–B7)", href: "/extract/use", icon: LineChartUp03 },
            { label: "End of Life (C1–C4)", href: "/extract/eol", icon: Archive },
        ],
    },
    {
        label: "Review & Mapping",
        id: "user_review",
        step: "3",
        sub: "BOM & ecoinvent Providers",
        href: "/user_review",
        icon: EditIcon,
        items: [
            { label: "Material Mappings", href: "/review/materials", icon: Rows01 },
            { label: "ecoinvent 3.12 Activities", href: "/review/ecoinvent", icon: Star01 },
            { label: "Cut-Off Allocations", href: "/review/cutoffs", icon: PieChart03 },
        ],
    },
    {
        label: "PCR Rules Audit",
        id: "validate",
        step: "4",
        sub: "UL 10010-4 & GPI Check",
        href: "/validate",
        icon: ValidateIcon,
        badge: 10,
        items: [
            { label: "Audit Overview", href: "/validate/overview", icon: Grid03 },
            { label: "UL 10010-4 Gates", href: "/validate/gates", icon: NotificationBox, badge: 10 },
            { label: "Mass Balance (99%)", href: "/validate/mass-balance", icon: PieChart03 },
            { label: "Cut-Off Compliance (<1%)", href: "/validate/cutoffs", icon: Star01 },
        ],
    },
    {
        label: "LCIA Methodology",
        id: "methodology",
        step: "5",
        sub: "EF v3.1, TRACI, CML-IA",
        href: "/methodology",
        icon: MethodologyIcon,
        items: [
            { label: "Methodology Selection", href: "/methodology/select", icon: Grid03 },
            { label: "EF v3.1 (EN 15804+A2)", href: "/methodology/ef31", icon: Star01 },
            { label: "TRACI 2.1 (US EPA)", href: "/methodology/traci", icon: BarChartSquare02 },
            { label: "CML-IA Baseline", href: "/methodology/cml", icon: LineChartUp03 },
        ],
    },
    {
        label: "LCIA Results",
        id: "results",
        step: "6",
        sub: "25 Indicators × 16 Stages",
        href: "/results",
        icon: ResultsIcon,
        items: [
            { label: "Characterized Impacts", href: "/results/overview", icon: Grid03 },
            { label: "GWP-100 AR6 Benchmark", href: "/results/gwp", icon: LineChartUp03 },
            { label: "Stage Breakdown (A1–C4)", href: "/results/stages", icon: PieChart03 },
            { label: "Module D Net Benefits", href: "/results/module-d", icon: Star01 },
        ],
    },
    {
        label: "Pre-Audit Verification",
        id: "audit",
        step: "7",
        sub: "5-Gate ISO 14025 Check",
        href: "/audit",
        icon: ShieldCheckIcon,
        items: [
            { label: "5-Gate ISO 14025 Review", href: "/audit/gates", icon: CheckDone01 },
            { label: "SHA-256 Lineage Proof", href: "/audit/lineage", icon: ClockFastForward },
            { label: "Verification Sign-Off", href: "/audit/signoff", icon: UserSquare },
        ],
    },
    {
        label: "Export EPD",
        id: "export",
        step: "8",
        sub: "Publication PDF & openEPD",
        href: "/export",
        icon: ExportIcon,
        items: [
            { label: "Publication PDF", href: "/export/pdf", icon: Rows01 },
            { label: "openEPD JSON Package", href: "/export/openepd", icon: Package },
            { label: "Digital Product Passport", href: "/export/dpp", icon: Stars01 },
        ],
    },
];

export const SidebarNavigationSlimDemo = () => (
    <SidebarNavigationSlim
        items={navItemsDualTier}
        footerItems={[
            {
                label: "Support",
                href: "/support",
                icon: LifeBuoy01,
            },
            {
                label: "Settings",
                href: "/settings",
                icon: Settings01,
            },
        ]}
    />
);

export default SidebarNavigationSlimDemo;
