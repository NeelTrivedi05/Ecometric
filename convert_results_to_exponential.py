#!/usr/bin/env python3
"""
Convert every numeric value in the EPD results CSV to exponential (scientific) notation.

- Column 1 (impact category name) and the header row are kept exactly as they are,
  so category names and module columns can change freely.
- Every other cell that is a number is rewritten, e.g. 111983531.83 -> 1.120e+08.
  Empty cells and non-numeric text are left untouched.

Usage:
    python convert_results_to_exponential.py                 # reads the default path below
    python convert_results_to_exponential.py --digits 3      # 3 digits after the decimal point
    python convert_results_to_exponential.py --inplace       # overwrite the original file
    python convert_results_to_exponential.py --input other.csv --output out.csv

Default output: epd_results_exp.csv in the same folder as the input (original is untouched).
"""

import argparse
import csv
import math
import sys
from pathlib import Path

DEFAULT_INPUT = "/Users/parth/Desktop/Ecometric/results/epd_results.csv"
DEFAULT_DIGITS = 3  # digits after the decimal point: 1.234e+05


def to_exponential(cell: str, digits: int = 3) -> str:
    """Return the cell in exponential form if it is a finite number, otherwise unchanged."""
    text = str(cell).strip() if cell is not None else ""
    if not text:
        return "" if cell is None else str(cell)
    try:
        value = float(text)
    except ValueError:
        return str(cell)
    if not math.isfinite(value):
        return str(cell)
    return f"{value:.{digits}e}"


def convert_file(input_path: Path, output_path: Path, digits: int = 3) -> int:
    with input_path.open("r", newline="", encoding="utf-8-sig") as f:
        rows = list(csv.reader(f))

    if not rows:
        raise ValueError(f"{input_path} is empty.")

    header, body = rows[0], rows[1:]
    converted = [header]
    count = 0
    for row in body:
        if not row:
            converted.append(row)
            continue
        new_row = [row[0]]  # keep the impact category name as-is
        for cell in row[1:]:
            new_cell = to_exponential(cell, digits)
            if new_cell != cell:
                count += 1
            new_row.append(new_cell)
        converted.append(new_row)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", newline="", encoding="utf-8") as f:
        csv.writer(f).writerows(converted)
    return count


def main():
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--input", default=DEFAULT_INPUT, help=f"Input CSV. Default: {DEFAULT_INPUT}")
    parser.add_argument("--output", default=None,
                        help="Output CSV. Default: epd_results_exp.csv next to the input file.")
    parser.add_argument("--digits", type=int, default=DEFAULT_DIGITS,
                        help=f"Digits after the decimal point. Default: {DEFAULT_DIGITS}")
    parser.add_argument("--inplace", action="store_true",
                        help="Overwrite the input file instead of writing a new one.")
    args = parser.parse_args()

    input_path = Path(args.input).expanduser()
    if not input_path.is_file():
        print(f"ERROR: input file not found: {input_path}", file=sys.stderr)
        sys.exit(1)

    if args.inplace:
        output_path = input_path
    elif args.output:
        output_path = Path(args.output).expanduser()
    else:
        output_path = input_path.with_name(input_path.stem + "_exp.csv")

    count = convert_file(input_path, output_path, args.digits)
    print(f"Converted {count} values to exponential form.")
    print(f"Wrote: {output_path}")


if __name__ == "__main__":
    main()
