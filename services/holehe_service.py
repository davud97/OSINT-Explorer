import os
import paramiko
import re
from dotenv import load_dotenv

# Load private values from .env
load_dotenv()

# Kali SSH details from .env
KALI_HOST = os.getenv("KALI_HOST")
KALI_PORT = int(os.getenv("KALI_PORT", 22))
KALI_USERNAME = os.getenv("KALI_USERNAME")
KALI_PASSWORD = os.getenv("KALI_PASSWORD")


def parse_holehe_output(output):
    found_on = []
    for line in output.splitlines():
        line = line.strip()
        if line.startswith("[+]"):
            site = line.replace("[+]", "").strip()

            if site and "Email used" not in site:
                found_on.append(site)
    return found_on

def build_holehe_module(query, query_type):

    if query_type != "email":
        return {"status": "not_applicable", "data": {}, "error": None}

    ssh = None

    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

        ssh.connect(
            hostname=KALI_HOST,
            port=KALI_PORT,
            username=KALI_USERNAME,
            password=KALI_PASSWORD,
            timeout=30
        )

#command execution

        command = f"/home/kali/.local/bin/holehe {query} --only-used"

        stdin, stdout, stderr = ssh.exec_command(command, timeout=25)
#output
        output = stdout.read().decode().strip()
        error = stderr.read().decode().strip()

        if error and not output:
            return {"status": "error", "data": {}, "error": error}

        if not output:
            return {"status": "no_results", "data": {}, "error": None}
#output found
        found_on = parse_holehe_output(output)

        if not found_on:
            return {
                "status": "no_results",
                "data": {"found_on": [], "raw_output": output},
                "error": None
            }

        return {
            "status": "success",
            "data": {
                "found_on": found_on,
                "raw_output": output
            },
            "error": None
        }

    except Exception as e:
        return {"status": "error", "data": {}, "error": str(e)}

    finally:
        if ssh:
            ssh.close()
