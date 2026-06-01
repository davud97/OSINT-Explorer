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


def parse_ghunt_output(output):
    data = {}
    
    profile_pic = re.search(r"=> (https://lh3\.googleusercontent\.com\S+)", output)
    if profile_pic:
        data["profile_picture"] = profile_pic.group(1)

    last_edit = re.search(r"Last profile edit\s*:\s*(.+)", output)
    if last_edit:
        data["last_profile_edit"] = last_edit.group(1).strip()

    gaia = re.search(r"Gaia ID\s*:\s*(\d+)", output)
    if gaia:
        data["gaia_id"] = gaia.group(1)

    services = re.findall(r"\[+\] Activated Google services :(.*?)(?=\n\n|\Z)", output, re.DOTALL)
    if services:
        data["activated_services"] = [s.strip() for s in services[0].strip().splitlines() if s.strip().startswith("-")]

    maps_page = re.search(r"Profile page\s*:\s*(https\S+)", output)
    if maps_page:
        data["maps_profile"] = maps_page.group(1)

    for stat in ["Reviews", "Ratings", "Photos", "Videos", "Answers", "Edits"]:
        match = re.search(rf"{stat}\s*:\s*(\d+)", output)
        if match:
            data[stat.lower()] = int(match.group(1))

    calendar = re.search(r"(No public Google Calendar|Public calendar found)", output)
    if calendar:
        data["calendar"] = calendar.group(1)

    return data


def build_ghunt_module(query, query_type):

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

#Command execution
        command = f"/home/kali/.local/bin/ghunt email {query}"

        stdin, stdout, stderr = ssh.exec_command(command, timeout=25)

        output = stdout.read().decode().strip()
        error = stderr.read().decode().strip()

        if error and not output:
            return {"status": "error", "data": {}, "error": error}

        if not output:
            return {"status": "no_results", "data": {}, "error": None}

        parsed = parse_ghunt_output(output)

        return {
            "status": "success",
            "data": {
                **parsed,
                "email": query,
                "raw_output": output
            },
            "error": None
        }

    except Exception as e:
        return {"status": "error", "data": {}, "error": str(e)}

    finally:
        if ssh:
            ssh.close()
