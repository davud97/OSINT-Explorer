import os
import requests
from dotenv import load_dotenv

load_dotenv()

VT_API_KEY = os.getenv("VIRUSTOTAL_API_KEY")
VT_BASE_URL = "https://www.virustotal.com/api/v3"


def build_virustotal_module(query: str, query_type: str):
    if not query or query_type not in ["domain", "ip", "url"]:
        return {
            "status": "not_applicable",
            "result_count": 0,
            "error": None,
            "data": {}
        }

    if not VT_API_KEY:
        return {
            "status": "error",
            "result_count": 0,
            "error": "VirusTotal API key is missing",
            "data": {}
        }

    headers = {
        "x-apikey": VT_API_KEY
    }

    try:
        if query_type == "domain":
            url = f"{VT_BASE_URL}/domains/{query}"
        elif query_type == "ip":
            url = f"{VT_BASE_URL}/ip_addresses/{query}"
        elif query_type == "url":
            return {
                "status": "error",
                "result_count": 0,
                "error": "URL lookup will be added separately because VirusTotal URL lookups require URL ID encoding",
                "data": {}
            }

        response = requests.get(url, headers=headers, timeout=20)

        if response.status_code != 200:
            return {
                "status": "error",
                "result_count": 0,
                "error": f"VirusTotal API error: {response.status_code} - {response.text}",
                "data": {}
            }

        result = response.json()
        attributes = result.get("data", {}).get("attributes", {})
        stats = attributes.get("last_analysis_stats", {})

        return {
            "status": "success",
            "result_count": 1,
            "error": None,
            "data": {
                "id": result.get("data", {}).get("id"),
                "type": result.get("data", {}).get("type"),
                "reputation": attributes.get("reputation"),
                "last_analysis_stats": stats,
                "categories": attributes.get("categories", {}),
                "tags": attributes.get("tags", []),
                "country": attributes.get("country"),
                "as_owner": attributes.get("as_owner"),
                "registrar": attributes.get("registrar")
            }
        }

    except Exception as error:
        return {
            "status": "error",
            "result_count": 0,
            "error": str(error),
            "data": {}
        }



