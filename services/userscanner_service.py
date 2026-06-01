import os
import paramiko
import re
import shlex
from dotenv import load_dotenv

# Load private values from .env
load_dotenv()

# Kali SSH details from .env
KALI_HOST = os.getenv("KALI_HOST")
KALI_PORT = int(os.getenv("KALI_PORT", 22))
KALI_USERNAME = os.getenv("KALI_USERNAME")
KALI_PASSWORD = os.getenv("KALI_PASSWORD")

USER_SCANNER_CANDIDATES = [
    "/home/kali/.local/bin/user-scanner",
    "/usr/local/bin/user-scanner",
    "/usr/bin/user-scanner",
    "user-scanner",
]

def parse_userscanner_output(output):
    results = []
    current_category = "Unknown"

    for line in output.splitlines():
        line = line.strip()

        if not line:
            continue

        # Example category:
        # == Social ==
        category_match = re.match(r"^==\s+(.+?)\s+==$", line)
        if category_match:
            current_category = category_match.group(1).strip().title()
            continue

        # Common positive patterns:
        # [+] Instagram (Registered): ...
        # [+] instagram.com: Registered
        # [FOUND] Twitter: Registered
        positive_markers = ["[+]", "[FOUND]", "Registered", "Found", "USED", "Email used"]

        if any(marker.lower() in line.lower() for marker in positive_markers):
            cleaned = re.sub(r"\x1b\[[0-9;]*m", "", line)

            site = "Unknown"
            site_match = re.search(
                r"(?:\[\+\]|\[FOUND\])\s*([A-Za-z0-9_.-]+)",
                cleaned,
                re.IGNORECASE
            )

            if site_match:
                site = site_match.group(1)
            else:
                before_colon = cleaned.split(":")[0].strip()
                before_colon = before_colon.replace("[+]", "").replace("[FOUND]", "").strip()
                if before_colon:
                    site = before_colon

            if site.lower() not in ["twitter", "github", "for btc donations"]:
                results.append({
                    "site": site,
                    "category": current_category,
                    "status": cleaned
                })

    # Remove duplicates
    unique = []
    seen = set()

    for item in results:
        key = item["site"].lower()
        if key not in seen:
            unique.append(item)
            seen.add(key)

    return unique


def run_remote_command(ssh, command, timeout=90):
    stdin, stdout, stderr = ssh.exec_command(command, timeout=timeout)

    output = stdout.read().decode("utf-8", errors="ignore").strip()
    error = stderr.read().decode("utf-8", errors="ignore").strip()

    exit_code = stdout.channel.recv_exit_status()

    return output, error, exit_code


def find_userscanner_binary(ssh):
    for candidate in USER_SCANNER_CANDIDATES:
        check_command = f"command -v {shlex.quote(candidate)} || test -x {shlex.quote(candidate)} && echo {shlex.quote(candidate)}"
        output, error, exit_code = run_remote_command(ssh, check_command, timeout=15)

        if output:
            return candidate

    return None


def build_userscanner_module(query, query_type):
    if query_type != "email":
        return {
            "status": "not_applicable",
            "result_count": 0,
            "data": {
                "found_on": [],
                "total_hits": 0,
                "raw_output": ""
            },
            "error": None
        }

    ssh = None

    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

        ssh.connect(
            hostname=KALI_HOST,
            port=KALI_PORT,
            username=KALI_USERNAME,
            password=KALI_PASSWORD,
            timeout=60
        )

        binary = find_userscanner_binary(ssh)

        if not binary:
            return {
                "status": "error",
                "result_count": 0,
                "data": {
                    "found_on": [],
                    "total_hits": 0,
                    "raw_output": ""
                },
                "error": "user-scanner was not found on Kali. Test manually with: command -v user-scanner"
            }

        safe_query = shlex.quote(query)
# command execution
#email, delay , only found
        command = (
            f"{binary} -e {safe_query} -d 2 --only-found "
            f"2>&1"
        )
#output
        output, error, exit_code = run_remote_command(ssh, command, timeout=120)

        combined_output = output or error

        if not combined_output:
            return {
                "status": "no_results",
                "result_count": 0,
                "data": {
                    "found_on": [],
                    "total_hits": 0,
                    "raw_output": ""
                },
                "error": None
            }

        if exit_code != 0 and "Registered" not in combined_output and "[+]" not in combined_output:
            return {
                "status": "error",
                "result_count": 0,
                "data": {
                    "found_on": [],
                    "total_hits": 0,
                    "raw_output": combined_output
                },
                "error": combined_output
            }

        found_on = parse_userscanner_output(combined_output)

        if not found_on:
            return {
                "status": "no_results",
                "result_count": 0,
                "data": {
                    "found_on": [],
                    "total_hits": 0,
                    "raw_output": combined_output
                },
                "error": None
            }

        return {
            "status": "success",
            "result_count": len(found_on),
            "data": {
                "found_on": found_on,
                "total_hits": len(found_on),
                "raw_output": combined_output
            },
            "error": None
        }

    except Exception as e:
        return {
            "status": "error",
            "result_count": 0,
            "data": {
                "found_on": [],
                "total_hits": 0,
                "raw_output": ""
            },
            "error": str(e)
        }

    finally:
        if ssh:
            ssh.close()
