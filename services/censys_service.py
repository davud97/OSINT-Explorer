import os
import requests
from dotenv import load_dotenv

load_dotenv()

CENSYS_API_TOKEN = os.getenv("CENSYS_API_TOKEN")
CENSYS_ORGANIZATION_ID = os.getenv("CENSYS_ORGANIZATION_ID")
CENSYS_BASE_URL = "https://api.platform.censys.io/v3"


def build_censys_module(query: str, query_type: str):
    """
    Build normalized Censys Platform output for IP queries.
    """
    if not query or query_type != "ip":
        return {
            "status": "not_applicable",
            "result_count": 0,
            "error": None,
            "data": {
                "host": "N/A",
                "location": "N/A",
                "autonomous_system": "N/A",
                "operating_system": "N/A",
                "services": [],
            },
        }

    if not CENSYS_API_TOKEN:
        return {
            "status": "error",
            "result_count": 0,
            "error": "Censys API token is missing",
            "data": {
                "host": query,
                "location": "N/A",
                "autonomous_system": "N/A",
                "operating_system": "N/A",
                "services": [],
            },
        }

    try:
        headers = {
            "Authorization": f"Bearer {CENSYS_API_TOKEN}",
            "Accept": "application/json",
        }

        params = {}
        if CENSYS_ORGANIZATION_ID:
            headers["X-Organization-ID"] = CENSYS_ORGANIZATION_ID
            params["organization_id"] = CENSYS_ORGANIZATION_ID

        response = requests.get(
            f"{CENSYS_BASE_URL}/global/asset/host/{query}",
            headers=headers,
            params=params,
            timeout=60,
        )

        if response.status_code == 404:
            return {
                "status": "no_results",
                "result_count": 0,
                "error": None,
                "data": {
                    "host": query,
                    "location": "N/A",
                    "autonomous_system": "N/A",
                    "operating_system": "N/A",
                    "services": [],
                },
            }

        if response.status_code != 200:
            return {
                "status": "error",
                "result_count": 0,
                "error": f"Censys host lookup error: {response.status_code} - {response.text}",
                "data": {
                    "host": query,
                    "location": "N/A",
                    "autonomous_system": "N/A",
                    "operating_system": "N/A",
                    "services": [],
                },
            }

        result = response.json().get("result", {})

        services = []
        for service in result.get("services", []):
            services.append(
                {
                    "port": service.get("port", "N/A"),
                    "service_name": service.get("service_name", "N/A"),
                    "transport_protocol": service.get("transport_protocol", "N/A"),
                    "product": "N/A",
                }
            )

        location_obj = result.get("location", {}) or {}
        autonomous_system_obj = result.get("autonomous_system", {}) or {}

        location = (
            ", ".join(
                part
                for part in [
                    location_obj.get("city"),
                    location_obj.get("province"),
                    location_obj.get("country"),
                ]
                if part
            )
            or "N/A"
        )

        autonomous_system = (
            autonomous_system_obj.get("description")
            or autonomous_system_obj.get("name")
            or "N/A"
        )

        operating_system = "N/A"
        for service in result.get("services", []):
            observed = (
                service.get("observed_software", [])
                or service.get("software", [])
                or []
            )
            if observed:
                first = observed[0]
                operating_system = (
                    first.get("product")
                    or first.get("uniform_resource_identifier")
                    or "N/A"
                )
                break

        has_results = bool(
            services
            or location != "N/A"
            or autonomous_system != "N/A"
            or operating_system != "N/A"
        )

        return {
            "status": "success" if has_results else "no_results",
            "result_count": len(services),
            "error": None,
            "data": {
                "host": result.get("ip", query),
                "location": location,
                "autonomous_system": autonomous_system,
                "operating_system": operating_system,
                "services": services,
            },
        }

    except requests.Timeout:
        return {
            "status": "error",
            "result_count": 0,
            "error": "Censys request timed out while retrieving exposure intelligence",
            "data": {
                "host": query,
                "location": "N/A",
                "autonomous_system": "N/A",
                "operating_system": "N/A",
                "services": [],
            },
        }

    except requests.RequestException as error:
        return {
            "status": "error",
            "result_count": 0,
            "error": f"Censys request failed: {error}",
            "data": {
                "host": query,
                "location": "N/A",
                "autonomous_system": "N/A",
                "operating_system": "N/A",
                "services": [],
            },
        }

    except Exception as error:
        return {
            "status": "error",
            "result_count": 0,
            "error": str(error),
            "data": {
                "host": query,
                "location": "N/A",
                "autonomous_system": "N/A",
                "operating_system": "N/A",
                "services": [],
            },
        }
