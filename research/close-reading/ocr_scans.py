#!/usr/bin/env python3
"""Create a resumable page-level OCR index for vertical Chinese scans."""

from __future__ import annotations

import argparse
import os
import subprocess
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

import fitz


def ocr_page(pdf_path: Path, output_dir: Path, page_number: int, dpi: int) -> tuple[int, int]:
    output_path = output_dir / f"page-{page_number:04d}.txt"
    if output_path.exists() and output_path.stat().st_size > 80:
        return page_number, output_path.stat().st_size

    with fitz.open(pdf_path) as document:
        page = document.load_page(page_number - 1)
        scale = dpi / 72
        pixmap = page.get_pixmap(matrix=fitz.Matrix(scale, scale), colorspace=fitz.csGRAY, alpha=False)
        image = pixmap.tobytes("png")

    process = subprocess.run(
        ["tesseract", "stdin", "stdout", "-l", "chi_tra_vert", "--psm", "5"],
        input=image,
        capture_output=True,
        check=False,
    )
    if process.returncode != 0:
        message = process.stderr.decode("utf-8", errors="replace").strip()
        raise RuntimeError(f"page {page_number}: {message}")

    text = process.stdout.decode("utf-8", errors="replace").strip()
    body = f"# PDF page {page_number}\n# OCR draft; verify against scan before quoting.\n\n{text}\n"
    temporary_path = output_path.with_suffix(".tmp")
    temporary_path.write_text(body, encoding="utf-8")
    os.replace(temporary_path, output_path)
    return page_number, len(body)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("pdf", type=Path)
    parser.add_argument("output_dir", type=Path)
    parser.add_argument("--dpi", type=int, default=180)
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--start", type=int, default=1)
    parser.add_argument("--end", type=int)
    args = parser.parse_args()

    args.output_dir.mkdir(parents=True, exist_ok=True)
    with fitz.open(args.pdf) as document:
        page_count = document.page_count
    end = min(args.end or page_count, page_count)
    pages = range(max(1, args.start), end + 1)

    failures: list[str] = []
    with ThreadPoolExecutor(max_workers=max(1, args.workers)) as executor:
        futures = {
            executor.submit(ocr_page, args.pdf, args.output_dir, page, args.dpi): page
            for page in pages
        }
        for future in as_completed(futures):
            page = futures[future]
            try:
                completed_page, size = future.result()
                print(f"page {completed_page:04d}: {size} bytes", flush=True)
            except Exception as error:
                failures.append(f"page {page}: {error}")

    if failures:
        for failure in failures:
            print(failure)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
