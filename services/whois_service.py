import whois
import subprocess
import re
from datetime import datetime, date


def normalize_date(value):
    if isinstance(value, list):
        value = value[0] if value else None

    if isinstance(value, (datetime, date)):
        return value.strftime("%Y-%m-%d")

    return str(value) if value else "N/A"


def normalize_list(value):
    if not value:
        return []

    if isinstance(value, (list, tuple, set)):
        return [str(item) for item in value if item]

    return [str(value)]


def get_first_value(value, default="N/A"):
    if isinstance(value, list):
        return str(value[0]) if value else default
    return str(value) if value else default


def extract_raw_field(raw_text, field_name):
    pattern = rf"^{re.escape(field_name)}:\s*(.+)$"
    match = re.search(pattern, raw_text, re.MULTILINE | re.IGNORECASE)
    return match.group(1).strip() if match else "N/A"


def run_raw_whois(query):
    try:
        completed = subprocess.run(
            ["whois", query],
            capture_output=True,
            text=True,
            timeout=20
        )

        raw_text = completed.stdout.strip()
        if not raw_text:
            return {
                "raw_text": "",
                "registry_domain_id": "N/A",
                "registrar_whois_server": "N/A",
                "registrar_url": "N/A",
                "registrar_iana_id": "N/A",
                "registrant_contact": "N/A",
                "tech_contact": "N/A",
                "dnssec": "N/A",
                "abuse_contact_email": "N/A",
                "abuse_contact_phone": "N/A",
                "icann_complaint_form": "N/A",
                "whois_database_last_update": "N/A"
            }

        last_update_match = re.search(
            r">>> Last update of WHOIS database:\s*(.+?)\s*<<<",
            raw_text,
            re.IGNORECASE
        )
        whois_database_last_update = (
            last_update_match.group(1).strip() if last_update_match else "N/A"
        )

        return {
            "raw_text": raw_text,
            "registry_domain_id": extract_raw_field(raw_text, "Registry Domain ID"),
            "registrar_whois_server": extract_raw_field(raw_text, "Registrar WHOIS Server"),
            "registrar_url": extract_raw_field(raw_text, "Registrar URL"),
            "registrar_iana_id": extract_raw_field(raw_text, "Registrar IANA ID"),
            "registrant_contact": extract_raw_field(raw_text, "Registrant Email"),
            "tech_contact": extract_raw_field(raw_text, "Tech Email"),
            "dnssec": extract_raw_field(raw_text, "DNSSEC"),
            "abuse_contact_email": extract_raw_field(raw_text, "Registrar Abuse Contact Email"),
            "abuse_contact_phone": extract_raw_field(raw_text, "Registrar Abuse Contact Phone"),
            "icann_complaint_form": extract_raw_field(
                raw_text,
                "URL of the ICANN Whois Inaccuracy Complaint Form"
            ),
            "whois_database_last_update": whois_database_last_update
        }

    except Exception:
        return {
            "raw_text": "",
            "registry_domain_id": "N/A",
            "registrar_whois_server": "N/A",
            "registrar_url": "N/A",
            "registrar_iana_id": "N/A",
            "registrant_contact": "N/A",
            "tech_contact": "N/A",
            "dnssec": "N/A",
            "abuse_contact_email": "N/A",
            "abuse_contact_phone": "N/A",
            "icann_complaint_form": "N/A",
            "whois_database_last_update": "N/A"
        }


def build_whois_module(query: str, query_type: str):
    """
    Build normalized WHOIS module output for domain queries.
    Uses python-whois for structured parsing and raw whois command for enrichment.
    """
    default_data = {
        "domain_name": "N/A",
        "registrar": "N/A",
        "creation_date": "N/A",
        "updated_date": "N/A",
        "expiration_date": "N/A",
        "name_servers": [],
        "status_list": [],
        "emails": [],
        "country": "N/A",
        "org": "N/A",
        "registry_domain_id": "N/A",
        "registrar_whois_server": "N/A",
        "registrar_url": "N/A",
        "registrar_iana_id": "N/A",
        "registrant_contact": "N/A",
        "tech_contact": "N/A",
        "dnssec": "N/A",
        "abuse_contact_email": "N/A",
        "abuse_contact_phone": "N/A",
        "icann_complaint_form": "N/A",
        "whois_database_last_update": "N/A",
        "raw_text": ""
    }

    if query_type != "domain" or not query:
        return {
            "status": "not_applicable",
            "result_count": 0,
            "error": None,
            "data": default_data
        }

    try:
        result = whois.whois(query)
        raw_data = run_raw_whois(query)

        domain_name = get_first_value(result.get("domain_name"), query.upper())
        registrar = get_first_value(result.get("registrar"))
        creation_date = normalize_date(result.get("creation_date"))
        updated_date = normalize_date(result.get("updated_date"))
        expiration_date = normalize_date(result.get("expiration_date"))

        name_servers = normalize_list(result.get("name_servers"))
        status_list = normalize_list(result.get("status"))
        emails = normalize_list(result.get("emails"))

        country = get_first_value(result.get("country"))
        org = (
            get_first_value(result.get("org"))
            if result.get("org")
            else get_first_value(result.get("organization"))
        )

        merged_data = {
            "domain_name": domain_name,
            "registrar": registrar,
            "creation_date": creation_date,
            "updated_date": updated_date,
            "expiration_date": expiration_date,
            "name_servers": name_servers,
            "status_list": status_list,
            "emails": emails,
            "country": country,
            "org": org,
            "registry_domain_id": raw_data["registry_domain_id"],
            "registrar_whois_server": raw_data["registrar_whois_server"],
            "registrar_url": raw_data["registrar_url"],
            "registrar_iana_id": raw_data["registrar_iana_id"],
            "registrant_contact": raw_data["registrant_contact"],
            "tech_contact": raw_data["tech_contact"],
            "dnssec": raw_data["dnssec"],
            "abuse_contact_email": raw_data["abuse_contact_email"],
            "abuse_contact_phone": raw_data["abuse_contact_phone"],
            "icann_complaint_form": raw_data["icann_complaint_form"],
            "whois_database_last_update": raw_data["whois_database_last_update"],
            "raw_text": raw_data["raw_text"]
        }

        has_results = any([
            merged_data["domain_name"] not in ["N/A", "", query],
            merged_data["registrar"] != "N/A",
            merged_data["creation_date"] != "N/A",
            merged_data["updated_date"] != "N/A",
            merged_data["expiration_date"] != "N/A",
            len(merged_data["name_servers"]) > 0,
            len(merged_data["status_list"]) > 0,
            len(merged_data["emails"]) > 0,
            merged_data["country"] != "N/A",
            merged_data["org"] != "N/A",
            merged_data["registry_domain_id"] != "N/A",
            merged_data["dnssec"] != "N/A",
            merged_data["abuse_contact_email"] != "N/A"
        ])

        return {
            "status": "success" if has_results else "no_results",
            "result_count": 1 if has_results else 0,
            "error": None,
            "data": merged_data
        }

    except Exception as error:
        return {
            "status": "error",
            "result_count": 0,
            "error": str(error),
            "data": default_data | {"domain_name": query}
        }
