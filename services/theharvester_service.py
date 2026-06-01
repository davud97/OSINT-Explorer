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


PUBLIC_EMAIL_DOMAINS = {
    "gmail.com",
    "googlemail.com",
    "outlook.com",
    "hotmail.com",
    "live.com",
    "yahoo.com",
    "icloud.com",
    "proton.me",
    "protonmail.com",
    "aol.com"
}


def empty_theharvester_data():
    return {
        "emails": [],
        "hosts": [],
        "ips": [],
        "urls": [],
        "asns": []
    }
def clean_ansi(text: str) -> str:
    ansi_escape = re.compile(r"\x1B\[[0-?]*[ -/]*[@-~]")
    return ansi_escape.sub("", text)


def is_ip(value: str) -> bool:
    ip_pattern = re.compile(r"^(?:\d{1,3}\.){3}\d{1,3}$")
    ipv6_pattern = re.compile(r"^[0-9a-fA-F:]+$")
    value = value.strip()
    return bool(ip_pattern.fullmatch(value) or (":" in value and ipv6_pattern.fullmatch(value)))


def is_email(value: str) -> bool:
    email_pattern = re.compile(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$")
    return bool(email_pattern.fullmatch(value.strip()))


def is_url(value: str) -> bool:
    value = value.strip().lower()
    return value.startswith("http://") or value.startswith("https://")


def is_asn(value: str) -> bool:
    return bool(re.fullmatch(r"AS\d+", value.strip(), re.IGNORECASE))


def looks_like_host(value: str) -> bool:
    value = value.strip()

    if not value or " " in value:
        return False

    if value.startswith("[") or value.startswith("*"):
        return False

    if is_ip(value) or is_email(value) or is_url(value) or is_asn(value):
        return False

    return "." in value


def parse_theharvester_output(raw_output: str):
    emails = []
    hosts = []
    ips = []
    urls = []
    asns = []

    cleaned_output = clean_ansi(raw_output)

    for raw_line in cleaned_output.splitlines():
        line = raw_line.strip()

        if not line:
            continue

        if line.startswith("[*]") or line.startswith("[+]") or line.startswith("[-]"):
            continue

        if line.startswith("----") or line.startswith("***"):
            continue

        if is_asn(line):
            if line not in asns:
                asns.append(line.upper())
            continue

        if is_email(line):
            if line not in emails:
                emails.append(line)
            continue

        if is_url(line):
            if line not in urls:
                urls.append(line)
            continue

        if is_ip(line):
            if line not in ips:
                ips.append(line)
            continue

        if looks_like_host(line):
            if line not in hosts:
                hosts.append(line)
            continue

        if ":" in line and not is_url(line):
            if line not in hosts:
                hosts.append(line)

    return {
        "emails": emails,
        "hosts": hosts,
        "ips": ips,
        "urls": urls,
        "asns": asns
    }


def build_theharvester_module(query: str, query_type: str):
    if not query or query_type not in ["domain", "email"]:
        return {
            "status": "not_applicable",
            "result_count": 0,
            "error": None,
            "data": empty_theharvester_data(),
            "raw_output": ""
        }

    search_target = query.strip().lower()

    if query_type == "email":
        if "@" not in query:
            return {
                "status": "error",
                "result_count": 0,
                "error": "Invalid email format",
                "data": empty_theharvester_data(),
                "raw_output": ""
            }

        email_domain = query.split("@", 1)[1].strip().lower()

        if email_domain in PUBLIC_EMAIL_DOMAINS:
            return {
                "status": "not_applicable",
                "result_count": 0,
                "error": None,
                "data": empty_theharvester_data(),
                "raw_output": f"theHarvester skipped for public email provider domain: {email_domain}"
            }

        search_target = email_domain

    ssh = None

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

#command execution
#domain target, data sources and limit
        command = (
            f'theHarvester -d "{search_target}" '
            f'-b certspotter,crtsh,hackertarget,otx,rapiddns,urlscan '
            f'-l 50'
        )

        stdin, stdout, stderr = ssh.exec_command(command, timeout=240)

        output = stdout.read().decode("utf-8", errors="ignore")
        error_output = stderr.read().decode("utf-8", errors="ignore")
        raw_output = clean_ansi((output + "\n" + error_output).strip())

        parsed_data = parse_theharvester_output(raw_output)
#output
        result_count = (
            len(parsed_data["emails"]) +
            len(parsed_data["hosts"]) +
            len(parsed_data["ips"]) +
            len(parsed_data["urls"]) +
            len(parsed_data["asns"])
        )

        status = "success" if result_count > 0 else "no_results"

        return {
            "status": status,
            "result_count": result_count,
            "error": None,
            "data": parsed_data,
            "raw_output": raw_output
        }

    except Exception as error:
        return {
            "status": "error",
            "result_count": 0,
            "error": str(error),
            "data": empty_theharvester_data(),
            "raw_output": ""
        }

    finally:
        if ssh:
            ssh.close()
