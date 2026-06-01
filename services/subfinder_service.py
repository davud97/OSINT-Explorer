import os
import paramiko
import re
import time
from dotenv import load_dotenv

# Load private values from .env
load_dotenv()

# Kali SSH details from .env
KALI_HOST = os.getenv("KALI_HOST")
KALI_PORT = int(os.getenv("KALI_PORT", 22))
KALI_USERNAME = os.getenv("KALI_USERNAME")
KALI_PASSWORD = os.getenv("KALI_PASSWORD")


def clean_ansi(text: str) -> str:
    ansi_escape = re.compile(r"\x1B\[[0-?]*[ -/]*[@-~]")
    return ansi_escape.sub("", text)

# Runs quick Kali Linux commands through SSH and returns normal/error output.
def run_simple_command(ssh, command: str, timeout: int = 30):
    """Fast commands only — ls, cat, wc, rm. Not for tools that take time."""
    _, stdout, stderr = ssh.exec_command(command, timeout=timeout)
    out = stdout.read().decode("utf-8", errors="ignore")
    err = stderr.read().decode("utf-8", errors="ignore")
    return out, err


def run_blocking_command(ssh, command: str, timeout: int = 240):
    """
    Waits for the remote process to fully exit before returning.
    Required for subfinder — the old run_remote_command returned as soon
    as stdout closed, which happened immediately because subfinder uses
    -silent -o file (nothing printed to stdout). The file was still being
    written when httpx tried to read it. This fixes that race condition.
    """
    transport = ssh.get_transport()
    channel = transport.open_session()
    channel.settimeout(timeout)
    channel.exec_command(command)

    start = time.time()
    while not channel.exit_status_ready():
        if time.time() - start > timeout:
            channel.close()
            raise TimeoutError(f"subfinder timed out after {timeout}s")
        time.sleep(2)

    exit_status = channel.recv_exit_status()
    channel.close()
    return exit_status


def build_subfinder_module(query: str, query_type: str):
    if not query or query_type != "domain":
        return {
            "status": "not_applicable",
            "result_count": 0,
            "error": None,
            "data": {
                "subdomains": [],
                "subdomains_file": ""
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
            timeout=10
        )
#output
        safe_query = query.replace('"', "").strip()
        subdomains_file = f"/tmp/{safe_query}_subdomains.txt"

        # Check subfinder binary exists
        check_out, check_err = run_simple_command(
            ssh,
            'command -v subfinder || which subfinder',
            timeout=10
        )
        debug_parts.append("=== SUBFINDER BINARY CHECK ===\n" + check_out)
        debug_parts.append("=== SUBFINDER BINARY STDERR ===\n" + check_err)

        if not check_out.strip():
            return {
                "status": "error",
                "result_count": 0,
                "error": "subfinder was not found on Kali",
                "data": {
                    "subdomains": [],
                    "subdomains_file": ""
                },
                "raw_output": clean_ansi("\n\n".join(debug_parts))
            }

        subfinder_binary = check_out.strip().splitlines()[0].strip()

        # Remove stale output file so we never read old results
        run_simple_command(ssh, f'rm -f "{subdomains_file}"', timeout=10)
        debug_parts.append("=== STALE FILE REMOVED ===\n" + subdomains_file)

        #command execution
        #target domain, silent for cleaner output, save output file
        command = (
            f"bash -lc '"
            f'timeout 240s "{subfinder_binary}" '
            f'-d "{safe_query}" '
            f'-silent '
            f'-o "{subdomains_file}"'
            f"'"
        )

        debug_parts.append("=== SUBFINDER COMMAND ===\n" + command)

        # run_blocking_command polls exit_status_ready() every 2 seconds.
        # It only returns after subfinder has fully exited and the OS has
        # closed the file handle on the output file.
        exit_status = run_blocking_command(ssh, command, timeout=240)
        debug_parts.append("=== SUBFINDER EXIT STATUS ===\n" + str(exit_status))

        # sync flushes all pending filesystem writes to disk.
        # The 1 second sleep gives the VirtualBox shared filesystem a moment
        # to settle before we try to read the file over SSH.
        run_simple_command(ssh, "sync", timeout=10)
        time.sleep(1)

        # Verify the output file was actually created
        file_check, _ = run_simple_command(
            ssh,
            f'if [ -f "{subdomains_file}" ]; then echo "EXISTS"; else echo "MISSING"; fi',
            timeout=10
        )
        debug_parts.append("=== FILE EXISTS CHECK ===\n" + file_check.strip())

        if "MISSING" in file_check:
            debug_parts.append("=== NOTE ===\nsubfinder ran but wrote no output file. Domain likely has no subdomains.")
            return {
                "status": "no_results",
                "result_count": 0,
                "error": None,
                "data": {
                    "subdomains": [],
                    "subdomains_file": ""
                },
                "raw_output": clean_ansi("\n\n".join(debug_parts))
            }

        # Line count for debug visibility
        wc_out, _ = run_simple_command(ssh, f'wc -l "{subdomains_file}"', timeout=10)
        debug_parts.append("=== LINE COUNT ===\n" + wc_out.strip())

        # Read the file contents
        file_out, file_err = run_simple_command(
            ssh,
            f'cat "{subdomains_file}"',
            timeout=30
        )
        debug_parts.append("=== FILE CONTENTS ===\n" + file_out)
        debug_parts.append("=== FILE READ STDERR ===\n" + file_err)

        subdomains = []
        for line in file_out.splitlines():
            line = line.strip()
            if line and line not in subdomains:
                subdomains.append(line)

        status = "success" if subdomains else "no_results"

        # Only pass the file path to httpx if we actually have subdomains.
        # Empty string here causes httpx_service to exit early cleanly
        # instead of opening a second SSH connection just to find an empty file.
        return {
            "status": status,
            "result_count": len(subdomains),
            "error": None,
            "data": {
                "subdomains": subdomains,
                "subdomains_file": subdomains_file if subdomains else ""
            },
            "raw_output": clean_ansi("\n\n".join(debug_parts))
        }

    except Exception as error:
        return {
            "status": "error",
            "result_count": 0,
            "error": repr(error),
            "data": {
                "subdomains": [],
                "subdomains_file": ""
            },
            "raw_output": clean_ansi("\n\n".join(debug_parts))
        }

    finally:
        if ssh:
            ssh.close()
