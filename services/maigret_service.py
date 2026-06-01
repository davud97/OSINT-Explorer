import os
import re
import json
from urllib.parse import quote

import paramiko
from dotenv import load_dotenv

# Load private values from .env
load_dotenv()

# Kali SSH details from .env
KALI_HOST = os.getenv("KALI_HOST")
KALI_PORT = int(os.getenv("KALI_PORT", 22))
KALI_USERNAME = os.getenv("KALI_USERNAME")
KALI_PASSWORD = os.getenv("KALI_PASSWORD")

MAIGRET_BINARY = "/home/kali/.local/bin/maigret"


IMPORTANT_STDOUT_SITES = {
    "tiktok",
    "picsart",
    "twitter",
    "x",
    "figma",
    "discord",
    "leetcode",
    "facebook",
    "slack",
    "instagram",
    "threads",
    "snapchat",
    "github",
    "gitlab",
}

def sanitize_username(username: str) -> str:
    username = username.strip()
    username = re.sub(r"[^a-zA-Z0-9_.-]", "_", username)
    return username[:100] if username else ""


def clean_ansi(text: str) -> str:
    return re.sub(r"\x1B\[[0-?]*[ -/]*[@-~]", "", text or "")


def run_remote_command(ssh, command: str, timeout: int = 240):
    _, stdout, stderr = ssh.exec_command(command, timeout=timeout)
    out = stdout.read().decode("utf-8", errors="ignore")
    err = stderr.read().decode("utf-8", errors="ignore")
    return out, err


def add_account(accounts, seen_accounts, site, url, tags=None, status="Claimed", ids=None, matched_username=""):
    if not site or not url:
        return

    tags = tags if isinstance(tags, list) else []
    ids = ids if isinstance(ids, dict) else {}

    unique_key = f"{site}|{url}|{matched_username}".lower()

    if unique_key in seen_accounts:
        return

    seen_accounts.add(unique_key)

    accounts.append({
        "site": site,
        "url": url,
        "tags": tags,
        "status": status,
        "ids": ids,
        "matched_username": matched_username
    })


def parse_maigret_json_accounts(json_text: str, accounts, seen_accounts):
    try:
        maigret_data = json.loads(json_text)
    except json.JSONDecodeError:
        return

    if not isinstance(maigret_data, dict):
        return

    for site_name, site_data in maigret_data.items():
        if not isinstance(site_data, dict):
            continue

        status_block = site_data.get("status", {})
        status_value = ""

        if isinstance(status_block, dict):
            status_value = str(status_block.get("status", "")).strip()
        else:
            status_value = str(status_block).strip()

        if status_value.lower() != "claimed":
            continue

        account_url = site_data.get("url_user") or ""

        if not account_url and isinstance(status_block, dict):
            account_url = status_block.get("url", "")

        tags = []

        site_block = site_data.get("site", {})
        if isinstance(site_block, dict):
            tags = site_block.get("tags", [])

        if not tags and isinstance(status_block, dict):
            tags = status_block.get("tags", [])

        if not isinstance(tags, list):
            tags = []

        extracted_ids = {}
        if isinstance(status_block, dict):
            extracted_ids = status_block.get("ids", {})

        if not isinstance(extracted_ids, dict):
            extracted_ids = {}

        matched_username = str(site_data.get("username", "")).strip()

        add_account(
            accounts=accounts,
            seen_accounts=seen_accounts,
            site=site_name,
            url=account_url,
            tags=tags,
            status=status_value,
            ids=extracted_ids,
            matched_username=matched_username
        )


def parse_maigret_stdout_accounts(raw_output: str, accounts, seen_accounts):
    for line in raw_output.splitlines():
        line = clean_ansi(line).strip()

        if not line.startswith("[+]"):
            continue

        match = re.match(r"^\[\+\]\s+(.+?):\s+(https?://\S+)", line)

        if not match:
            continue

        site = match.group(1).strip()
        url = match.group(2).strip()

        site_key = site.lower()

        if site_key not in IMPORTANT_STDOUT_SITES:
            continue

        matched_username = ""

        username_match = re.search(r"/@?([A-Za-z0-9_.-]+)(?:/)?$", url)
        if username_match:
            matched_username = username_match.group(1)

        add_account(
            accounts=accounts,
            seen_accounts=seen_accounts,
            site=site,
            url=url,
            tags=["stdout_backup"],
            status="Claimed",
            ids={},
            matched_username=matched_username
        )


def build_maigret_module(query: str, query_type: str):
    if query_type != "username" or not query.strip():
        return {
            "status": "not_applicable",
            "result_count": 0,
            "error": None,
            "data": {
                "username": "",
                "accounts": [],
                "pdf_file": "",
                "pdf_download_path": ""
            },
            "raw_output": ""
        }

    safe_username = sanitize_username(query)

    if not safe_username:
        return {
            "status": "error",
            "result_count": 0,
            "error": "Invalid username provided for Maigret search",
            "data": {
                "username": "",
                "accounts": [],
                "pdf_file": "",
                "pdf_download_path": ""
            },
            "raw_output": ""
        }

    ssh = None
    debug_parts = []

    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

        ssh.connect(
            hostname=KALI_HOST,
            port=KALI_PORT,
            username=KALI_USERNAME,
            password=KALI_PASSWORD,
            timeout=20
        )

        check_command = (
            f'if [ -x "{MAIGRET_BINARY}" ]; then '
            f'echo "{MAIGRET_BINARY}"; '
            f'else '
            f'echo "MISSING"; '
            f'fi'
        )

        check_out, check_err = run_remote_command(ssh, check_command, timeout=15)

        debug_parts.append("=== MAIGRET CHECK STDOUT ===\n" + check_out)
        debug_parts.append("=== MAIGRET CHECK STDERR ===\n" + check_err)

        maigret_runner = ""

        if check_out.strip() and "MISSING" not in check_out:
            first_line = check_out.strip().splitlines()[0].strip()
            maigret_runner = f'"{first_line}"'

        if not maigret_runner:
            return {
                "status": "error",
                "result_count": 0,
                "error": f"Maigret binary was not found at {MAIGRET_BINARY}",
                "data": {
                    "username": safe_username,
                    "accounts": [],
                    "pdf_file": "",
                    "pdf_download_path": ""
                },
                "raw_output": clean_ansi("\n\n".join(debug_parts))
            }

        remote_output_dir = f"/tmp/maigret_{safe_username}"

        prep_command = f'rm -rf "{remote_output_dir}" && mkdir -p "{remote_output_dir}"'

        prep_out, prep_err = run_remote_command(ssh, prep_command, timeout=20)

        debug_parts.append("=== PREP STDOUT ===\n" + prep_out)
        debug_parts.append("=== PREP STDERR ===\n" + prep_err)

#command execution
        maigret_command = (
            f"bash -lc 'timeout 180s {maigret_runner} \"{safe_username}\" "
            f'--folderoutput "{remote_output_dir}" '
            f'-J simple -P -a --no-color --no-progressbar'
            f"'"
        )

        maigret_out, maigret_err = run_remote_command(ssh, maigret_command, timeout=200)

        debug_parts.append("=== MAIGRET STDOUT ===\n" + maigret_out)
        debug_parts.append("=== MAIGRET STDERR ===\n" + maigret_err)

#output
        find_json_out, find_json_err = run_remote_command(
            ssh,
            f'find "{remote_output_dir}" -type f -name "*.json"',
            timeout=20
        )

        debug_parts.append("=== JSON FIND STDOUT ===\n" + find_json_out)
        debug_parts.append("=== JSON FIND STDERR ===\n" + find_json_err)

        remote_json_files = [
            line.strip()
            for line in find_json_out.splitlines()
            if line.strip()
        ]

        accounts = []
        seen_accounts = set()

        for remote_json_file in remote_json_files:
            json_out, json_err = run_remote_command(
                ssh,
                f'cat "{remote_json_file}"',
                timeout=30
            )

            debug_parts.append(f"=== JSON FILE STDOUT: {remote_json_file} ===\n" + json_out)
            debug_parts.append(f"=== JSON FILE STDERR: {remote_json_file} ===\n" + json_err)

            parse_maigret_json_accounts(
                json_text=json_out,
                accounts=accounts,
                seen_accounts=seen_accounts
            )

        parse_maigret_stdout_accounts(
            raw_output=maigret_out,
            accounts=accounts,
            seen_accounts=seen_accounts
        )

        find_pdf_out, find_pdf_err = run_remote_command(
            ssh,
            f'find "{remote_output_dir}" -type f -name "*.pdf" | head -n 1',
            timeout=20
        )

        debug_parts.append("=== PDF FIND STDOUT ===\n" + find_pdf_out)
        debug_parts.append("=== PDF FIND STDERR ===\n" + find_pdf_err)

        remote_pdf_file = find_pdf_out.strip()

        pdf_file = ""
        pdf_download_path = ""

        if remote_pdf_file:
            pdf_file = remote_pdf_file
            pdf_download_path = f"/download_maigret?remote_path={quote(remote_pdf_file)}"

#output expected
        return {
            "status": "success" if accounts else "no_results",
            "result_count": len(accounts),
            "error": None,
            "data": {
                "username": safe_username,
                "accounts": accounts,
                "pdf_file": pdf_file,
                "pdf_download_path": pdf_download_path
            },
            "raw_output": clean_ansi("\n\n".join(debug_parts))
        }

    except Exception as error:
        return {
            "status": "error",
            "result_count": 0,
            "error": repr(error),
            "data": {
                "username": safe_username,
                "accounts": [],
                "pdf_file": "",
                "pdf_download_path": ""
            },
            "raw_output": clean_ansi("\n\n".join(debug_parts))
        }

    finally:
        if ssh:
            ssh.close()
