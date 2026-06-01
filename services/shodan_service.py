import os
import requests
from dotenv import load_dotenv

load_dotenv()

SHODAN_API_KEY = os.getenv("SHODAN_API_KEY")
SHODAN_BASE_URL = "https://api.shodan.io"


def build_shodan_module(query: str, query_type: str):
    """
    Build normalized Shodan module output for IP queries only.
    """
    if not query or query_type != "ip":
        return {
            "status": "not_applicable",
            "result_count": 0,
            "error": None,
            "data": {
                "host": "N/A",
                "organization": "N/A",
                "open_ports": [],
                "services": []
            }
        }

    if not SHODAN_API_KEY:
        return {
            "status": "error",
            "result_count": 0,
            "error": "Shodan API key is missing",
            "data": {
                "host": query,
                "organization": "N/A",
                "open_ports": [],
                "services": []
            }
        }

    try:
        url = f"{SHODAN_BASE_URL}/shodan/host/{query}"

        response = requests.get(
            url,
            params={"key": SHODAN_API_KEY},
            timeout=60
        )

        if response.status_code == 404:
            return {
                "status": "no_results",
                "result_count": 0,
                "error": None,
                "data": {
                    "host": query,
                    "organization": "N/A",
                    "open_ports": [],
                    "services": []
                }
            }

        if response.status_code != 200:
            return {
                "status": "error",
                "result_count": 0,
                "error": f"Shodan host lookup error: {response.status_code} - {response.text}",
                "data": {
                    "host": query,
                    "organization": "N/A",
                    "open_ports": [],
                    "services": []
                }
            }

        result = response.json()

        services = []
        for item in result.get("data", []):
            services.append({
                "port": item.get("port"),
                "service": item.get("_shodan", {}).get("module", "N/A"),
                "product": item.get("product", "N/A")
            })

        open_ports = result.get("ports", [])

        has_results = bool(open_ports or services or result.get("org"))

        return {
            "status": "success" if has_results else "no_results",
            "result_count": len(services),
            "error": None,
            "data": {
                "host": result.get("ip_str", query),
                "organization": result.get("org", "N/A"),
                "open_ports": open_ports,
                "services": services
            }
        }

    except requests.Timeout:
        return {
            "status": "error",
            "result_count": 0,
            "error": "Shodan request timed out while retrieving host intelligence",
            "data": {
                "host": query,
                "organization": "N/A",
                "open_ports": [],
                "services": []
            }
        }

    except requests.RequestException as error:
        return {
            "status": "error",
            "result_count": 0,
            "error": f"Shodan request failed: {error}",
            "data": {
                "host": query,
                "organization": "N/A",
                "open_ports": [],
                "services": []
            }
        }

    except Exception as error:
        return {
            "status": "error",
            "result_count": 0,
            "error": str(error),
            "data": {
                "host": query,
                "organization": "N/A",
                "open_ports": [],
                "services": []
            }
        }
