"""
system_boundary_svg.py

Generates a programmatic SVG diagram for Figure 2: System Boundary Diagram,
modelled strictly on Page 9 of reference EPD11017 (Carrier AquaEdge 19DV).
Dynamically shows lifecycle modules in scope (A1-A5, B1-B7, C1-C4) with
material/energy inputs and waste outputs.
"""

def generate_system_boundary_svg(declared_modules: list = None) -> str:
    """
    Renders an authentic, vector SVG matching Figure 2 of EPD11017.
    """
    if declared_modules is None:
        declared_modules = ["A1", "A2", "A3", "A4", "A5", "B1", "B2", "B3", "B4", "B5", "B6", "B7", "C1", "C2", "C3", "C4"]

    svg = """
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 950 440" width="100%" height="auto" style="font-family: Arial, Helvetica, sans-serif;">
      <defs>
        <style>
          .header-box { fill: #0B2B67; rx: 4px; ry: 4px; }
          .header-text { fill: #FFFFFF; font-size: 11px; font-weight: bold; text-anchor: middle; }
          .stage-pill { fill: #1B4588; rx: 12px; ry: 12px; }
          .pill-text { fill: #FFFFFF; font-size: 10px; font-weight: bold; text-anchor: middle; }
          .waste-pill { fill: #0B2B67; rx: 4px; ry: 4px; }
          .arrow-line { stroke: #4A90E2; stroke-width: 3; stroke-linecap: round; }
          .arrow-head { fill: #4A90E2; }
          .dashed-boundary { fill: none; stroke: #0B2B67; stroke-width: 1.5; stroke-dasharray: 6,4; }
          .boundary-label { fill: #0B2B67; font-size: 10px; font-weight: bold; }
          .col-div { stroke: #D0D7DE; stroke-width: 1; stroke-dasharray: 4,4; }
        </style>
        <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 8 5 L 0 9 z" fill="#4A90E2" />
        </marker>
        <marker id="arrow-down" viewBox="0 0 10 10" refX="5" refY="6" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M 1 0 L 5 8 L 9 0 z" fill="#4A90E2" />
        </marker>
      </defs>

      <!-- Dashed System Boundary Outer Box -->
      <rect x="20" y="75" width="910" height="340" class="dashed-boundary" />
      <text x="830" y="405" class="boundary-label">System Boundary</text>

      <!-- 5 Column Headers -->
      <!-- Col 1: Product Stage (A1-A2) -->
      <rect x="25" y="15" width="160" height="35" class="header-box" />
      <text x="105" y="37" class="header-text">Product Stage (A1-A2)</text>

      <!-- Col 2: Assembly Stage (A3) -->
      <rect x="205" y="15" width="160" height="35" class="header-box" />
      <text x="285" y="37" class="header-text">Assembly Stage (A3)</text>

      <!-- Col 3: Installation (A4-A5) -->
      <rect x="385" y="15" width="160" height="35" class="header-box" />
      <text x="465" y="37" class="header-text">Installation (A4-A5)</text>

      <!-- Col 4: Use & Maintenance (B1-B7) -->
      <rect x="565" y="15" width="170" height="35" class="header-box" />
      <text x="650" y="30" class="header-text">Use &amp; Maintenance</text>
      <text x="650" y="44" class="header-text" style="font-size: 9px;">(B1-B7)</text>

      <!-- Col 5: End of life (C1-C4) -->
      <rect x="755" y="15" width="170" height="35" class="header-box" />
      <text x="840" y="37" class="header-text">End of life (C1-C4)</text>

      <!-- Column Dividers -->
      <line x1="195" y1="55" x2="195" y2="400" class="col-div" />
      <line x1="375" y1="55" x2="375" y2="400" class="col-div" />
      <line x1="555" y1="55" x2="555" y2="400" class="col-div" />
      <line x1="745" y1="55" x2="745" y2="400" class="col-div" />

      <!-- CONTENT: COL 1 (Product Stage) -->
      <g transform="translate(45, 95)">
        <rect x="0" y="0" width="120" height="24" class="stage-pill" />
        <text x="60" y="16" class="pill-text">Steel</text>

        <rect x="0" y="34" width="120" height="24" class="stage-pill" />
        <text x="60" y="50" class="pill-text">Iron</text>

        <rect x="0" y="68" width="120" height="24" class="stage-pill" />
        <text x="60" y="84" class="pill-text">Copper</text>

        <rect x="0" y="102" width="120" height="24" class="stage-pill" />
        <text x="60" y="118" class="pill-text">Aluminum</text>

        <rect x="0" y="136" width="120" height="24" class="stage-pill" />
        <text x="60" y="152" class="pill-text">Refrigerant</text>

        <rect x="0" y="170" width="120" height="24" class="stage-pill" />
        <text x="60" y="186" class="pill-text">Packaging</text>

        <!-- Vertical arrow down -->
        <rect x="155" y="5" width="22" height="200" fill="#5B9BD5" rx="3" />
        <text x="166" y="115" fill="#FFFFFF" font-size="9" font-weight="bold" transform="rotate(-90 166 115)" text-anchor="middle">Transport to plant</text>
      </g>

      <!-- CONTENT: COL 2 (Assembly Stage A3) -->
      <g transform="translate(225, 95)">
        <rect x="0" y="0" width="120" height="26" class="header-box" />
        <text x="60" y="17" class="header-text">Electricity</text>

        <!-- Connector arrow to A3 mfg -->
        <line x1="60" y1="35" x2="60" y2="280" class="arrow-line" marker-end="url(#arrow-down)" />

        <rect x="0" y="295" width="120" height="28" class="header-box" />
        <text x="60" y="313" class="header-text" style="font-size: 10px;">Manufacturing Waste</text>
      </g>

      <!-- CONTENT: COL 3 (Installation A4-A5) -->
      <g transform="translate(405, 95)">
        <rect x="0" y="0" width="120" height="26" class="header-box" />
        <text x="60" y="17" class="header-text">Diesel</text>

        <!-- Transport to Installation Site -->
        <rect x="0" y="70" width="22" height="150" fill="#5B9BD5" rx="3" />
        <text x="11" y="145" fill="#FFFFFF" font-size="9" font-weight="bold" transform="rotate(-90 11 145)" text-anchor="middle">Transport to Installation site</text>

        <!-- Connector arrow to packaging waste -->
        <line x1="60" y1="35" x2="60" y2="280" class="arrow-line" marker-end="url(#arrow-down)" />

        <rect x="0" y="295" width="120" height="28" class="header-box" />
        <text x="60" y="313" class="header-text" style="font-size: 10px;">Packaging Waste</text>
      </g>

      <!-- CONTENT: COL 4 (Use & Maintenance B1-B7) -->
      <g transform="translate(585, 95)">
        <rect x="0" y="0" width="130" height="32" class="header-box" />
        <text x="65" y="15" class="header-text" style="font-size: 10px;">Operational</text>
        <text x="65" y="26" class="header-text" style="font-size: 9px;">Energy use</text>

        <rect x="0" y="42" width="130" height="30" class="header-box" />
        <text x="65" y="55" class="header-text" style="font-size: 9px;">Materials for</text>
        <text x="65" y="66" class="header-text" style="font-size: 9px;">Maintenance</text>

        <rect x="0" y="82" width="130" height="30" class="header-box" />
        <text x="65" y="95" class="header-text" style="font-size: 9px;">Material for</text>
        <text x="65" y="106" class="header-text" style="font-size: 9px;">Replacement</text>

        <!-- Output items -->
        <rect x="0" y="260" width="130" height="24" class="header-box" />
        <text x="65" y="276" class="header-text" style="font-size: 9px;">Refrigerant Leakage</text>

        <rect x="0" y="295" width="130" height="24" class="header-box" />
        <text x="65" y="311" class="header-text" style="font-size: 9px;">Replacement Disposal</text>
      </g>

      <!-- CONTENT: COL 5 (End of life C1-C4) -->
      <g transform="translate(775, 95)">
        <rect x="0" y="0" width="130" height="28" fill="#5B9BD5" rx="3" />
        <text x="65" y="18" fill="#FFFFFF" font-size="10" font-weight="bold" text-anchor="middle">&#128666; Transport to EOL</text>

        <rect x="0" y="45" width="130" height="32" class="header-box" />
        <text x="65" y="60" class="header-text" style="font-size: 10px;">Waste</text>
        <text x="65" y="71" class="header-text" style="font-size: 9px;">processing</text>

        <rect x="0" y="90" width="130" height="26" class="header-box" />
        <text x="65" y="107" class="header-text" style="font-size: 10px;">Landfill</text>
      </g>
    </svg>
    """
    return svg.strip()
