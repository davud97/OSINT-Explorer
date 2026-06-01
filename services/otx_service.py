import os
import requests
from dotenv import load_dotenv

load_dotenv()

OTX_API_KEY = os.getenv("OTX_API_KEY")
OTX_BASE_URL = "https://otx.alienvault.com/api/v1"


def build_otx_module(query: str, query_type: str):
    """
    Build normalized OTX module output for domain and IP queries.
    """
    default_data = {
        "indicator": query or "N/A",
        "indicator_type": query_type or "N/A",
        "pulse_count": 0,
        "country_code": "N/A",
        "reputation": "N/A",
        "related": {
            "malware_count": 0,
            "url_count": 0,
            "passive_dns_count": 0
        }
    }

    if not query or query_type not in ["domain", "ip"]:
        return {
            "status": "not_applicable",
            "result_count": 0,
            "error": None,
            "data": default_data
        }

    if not OTX_API_KEY:
        return {
            "status": "error",
            "result_count": 0,
            "error": "OTX API key is missing",
            "data": default_data
        }

    headers = {
        "X-OTX-API-KEY": OTX_API_KEY
    }

    try:
        if query_type == "ip":
            url = f"{OTX_BASE_URL}/indicators/IPv4/{query}/general"
        else:
            url = f"{OTX_BASE_URL}/indicators/domain/{query}/general"

        response = requests.get(url, headers=headers, timeout=60)

        if response.status_code == 404:
            return {
                "status": "no_results",
                "result_count": 0,
                "error": None,
                "data": default_data
            }

        if response.status_code != 200:
            return {
                "status": "error",
                "result_count": 0,
                "error": f"OTX API error: {response.status_code} - {response.text}",
                "data": default_data
            }

        result = response.json()

        pulse_info = result.get("pulse_info", {})
        pulses = pulse_info.get("pulses", [])

        country_code = result.get("country_code") or "N/A"
        reputation = result.get("reputation")
        reputation = reputation if reputation is not None else "N/A"

        malware_count = 0
        if isinstance(result.get("malware"), dict):
            malware_count = len(result.get("malware", {}).get("data", []))

        url_count = 0
        if isinstance(result.get("url_list"), dict):
            url_count = len(result.get("url_list", {}).get("url_list", []))

        passive_dns_count = 0
        if isinstance(result.get("passive_dns"), dict):
            passive_dns_count = len(result.get("passive_dns", {}).get("passive_dns", []))

        has_results = bool(
            len(pulses) > 0 or
            malware_count > 0 or
            url_count > 0 or
            passive_dns_count > 0 or
            (reputation != "N/A" and reputation != 0)
        )

        return {
            "status": "success" if has_results else "no_results",
            "result_count": len(pulses),
            "error": None,
            "data": {
                "indicator": query,
                "indicator_type": query_type,
                "pulse_count": len(pulses),
                "country_code": country_code,
                "reputation": reputation,
                "related": {
                    "malware_count": malware_count,
                    "url_count": url_count,
                    "passive_dns_count": passive_dns_count
                }
            }
        }

    except requests.Timeout:
        return {
            "status": "error",
            "result_count": 0,
            "error": "OTX request timed out while retrieving threat intelligence",
            "data": default_data
        }

    except requests.RequestException as error:
        return {
            "status": "error",
            "result_count": 0,
            "error": f"OTX request failed: {error}",
            "data": default_data
        }

    except Exception as error:
        return {
            "status": "error",
            "result_count": 0,
            "error": str(error),
            "data": default_data
        }
