import sys
import time
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.append(str(REPO_ROOT / "backend"))

from app.database import search_lcia_indicators

queries = ['GWP', 'CO2', 'acidification', 'smog', 'eutrophication', 'ozone']
for q in queries:
    t0 = time.perf_counter()
    res = search_lcia_indicators(q, methodology_filter='EF v3.1', limit=5)
    t1 = time.perf_counter()
    latency_ms = (t1 - t0) * 1000
    print(f'Query "{q}": returned {len(res)} results in {latency_ms:.2f}ms')
