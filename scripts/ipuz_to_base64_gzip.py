#!/usr/bin/env python3
"""
Convert an .ipuz file to a base64-encoded gzipped string for use in share.html.
"""

import argparse
import base64
import gzip
import sys


def ipuz_to_base64_gzip(data: bytes) -> str:
    """Gzip-compresses raw bytes and returns the base64-encoded string."""
    compressed = gzip.compress(data)
    return base64.b64encode(compressed).decode("ascii")


def main():
    parser = argparse.ArgumentParser(
        description="Convert an .ipuz file into base64-encoded gzipped data for share.html."
    )
    parser.add_argument(
        "input_file",
        nargs="?",
        type=str,
        help="Path to the .ipuz file (reads from stdin if omitted or '-').",
    )
    parser.add_argument(
        "-u",
        "--url",
        type=str,
        default=None,
        help="Optional base URL (e.g. 'https://crosswordnexus.com/share.html') to output a complete link.",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=str,
        default=None,
        help="Output file path (default: print to stdout).",
    )

    args = parser.parse_args()

    if args.input_file and args.input_file != "-":
        with open(args.input_file, "rb") as f:
            data = f.read()
    else:
        if sys.stdin.isatty():
            parser.print_help()
            sys.exit(1)
        data = sys.stdin.buffer.read()

    b64_str = ipuz_to_base64_gzip(data)

    if args.url:
        base = args.url.rstrip("#")
        output_str = f"{base}#{b64_str}"
    else:
        output_str = b64_str

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(output_str + "\n")
    else:
        print(output_str)


if __name__ == "__main__":
    main()
