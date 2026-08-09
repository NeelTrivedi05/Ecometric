from typing import Dict, Any

def generate_epd_report(project_id: str, project_name: str = "Chiller EPD Assessment") -> Dict[str, Any]:
    sanitized_name = project_name.replace(" ", "_")
    report_url = f"/reports/epd_{project_id}_v1.0.pdf"
    
    disclaimer = (
        "Directional comparative platform declaration based on PCR UL 10010-4 Part B v2.0 (2018) "
        "using ecoinvent v3.12 datasets. Not an independently third-party verified EPD certificate."
    )

    return {
        "success": True,
        "pdf_url": report_url,
        "download_file_name": f"EcoMetric_EPD_{sanitized_name}_v1.0.pdf",
        "disclaimer": disclaimer,
        "version": "1.0"
    }
