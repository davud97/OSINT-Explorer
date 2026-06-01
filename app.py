# Flask tools used to create the web backend, receive requests, show pages, send files, and return JSON.
from flask import Flask, render_template, request, send_file, jsonify
# json is used to read the sample_intel.json file and convert it into Python data.
import json
# Path helps Flask find project folders and files safely.
from pathlib import Path
# datetime is used to add the current scan time to the results.
from datetime import datetime
# ThreadPoolExecutor means your Flask app runs many OSINT modules at the same time instead of one by one.
from concurrent.futures import ThreadPoolExecutor
# Paramiko lets Flask connect to the Kali VM using SSH and run/download Kali tool outputs.
import paramiko
# tempfile creates a temporary local file, used here when downloading the Maigret PDF from Kali.
import tempfile
# os is used for basic file path operations, like getting the PDF file name.
import os
# dotenv loads private API keys and Kali login details from the .env file.
from dotenv import load_dotenv
# unquote converts URL-encoded paths back to normal file paths.
from urllib.parse import unquote
# CORS allows the frontend to call the Flask backend API without browser blocking issues.
from flask_cors import CORS


# These imports bring each OSINT module from the services folder.
# Each build_*_module function runs one intelligence source and returns structured results.
from services.github_service import build_github_module
from services.whois_service import build_whois_module
from services.virustotal_service import build_virustotal_module
from services.shodan_service import build_shodan_module
from services.otx_service import build_otx_module
from services.theharvester_service import build_theharvester_module
from services.censys_service import build_censys_module
from services.subfinder_service import build_subfinder_module
from services.maigret_service import build_maigret_module
from services.holehe_service import build_holehe_module
from services.ghunt_service import build_ghunt_module
from services.userscanner_service import build_userscanner_module

# This creates the Flask application.
app = Flask(__name__)
CORS(app)

# This loads private values from the .env file.
# The .env file must NOT be uploaded to GitHub.
load_dotenv()

# Data stored
BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR / "data" / "sample_intel.json"

# These are the Kali Linux SSH connection details.
# Paramiko uses them to connect to Kali and collect files such as the Maigret PDF.
KALI_HOST = os.getenv("KALI_HOST")
KALI_PORT = int(os.getenv("KALI_PORT", 22))
KALI_USERNAME = os.getenv("KALI_USERNAME")
KALI_PASSWORD = os.getenv("KALI_PASSWORD")


# Data Loaded
def load_sample_data():
    with open(DATA_FILE, "r", encoding="utf-8") as file:
        return json.load(file)

# This route opens the home page of the web app.
# When the user visits /, Flask displays index.html.
@app.route("/")
def home():
    return render_template("index.html")


# This route downloads the Maigret PDF report from Kali to the user's browser.
# The frontend sends the remote_path, then Flask gets the PDF through SFTP.
@app.route("/download_maigret")
def download_maigret():
    # Gets the PDF path from the browser request.
    # If there is no path, it returns an error instead of crashing.
    remote_path = request.args.get("remote_path", "").strip()
    if not remote_path:
        return "Missing remote_path", 400

    # Converts URL-encoded characters back to normal text.
    remote_path = unquote(remote_path)

    # These start as None so they can be safely closed later in finally.
    ssh = None
    sftp = None
    temp_file = None

    try:
        # Creates an SSH client to connect from Flask/Windows to Kali Linux.
        ssh = paramiko.SSHClient()

        # AutoAddPolicy accepts Kali's SSH host key automatically.
        # This avoids manual SSH key confirmation during the demo.
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

        # This connects to the Kali VM using the IP, port, username, and password.
        ssh.connect(
            hostname=KALI_HOST,
            port=KALI_PORT,
            username=KALI_USERNAME,
            password=KALI_PASSWORD,
            timeout=15,
        )

        # SFTP means secure file transfer over SSH.
        # It is used here to copy the PDF report from Kali to the Flask machine.
        sftp = ssh.open_sftp()

        # Creates a temporary PDF file on the local machine.
        # The Kali PDF will be copied into this temporary file first.
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
        temp_file.close()

        # Copies the PDF from Kali remote_path into the temporary local file.
        sftp.get(remote_path, temp_file.name)

        # Gets the original PDF file name so the downloaded file has a proper name.
        download_name = os.path.basename(remote_path)

        # Sends the PDF file to the browser as a downloadable attachment.
        return send_file(
            temp_file.name,
            as_attachment=True,
            download_name=download_name,
            mimetype="application/pdf",
        )

    except Exception as error:
        # If the download fails, this returns a clear error message.
        return f"Failed to download Maigret PDF: {error}", 500

    finally:
        # This closes the SFTP and SSH connection after the download attempt.
        # It runs whether the download succeeds or fails.
        if sftp:
            sftp.close()
        if ssh:
            ssh.close()


# This function safely gets the result from a module running in ThreadPoolExecutor.
# If one module fails, it returns an error object instead of crashing the whole scan.
def safe_module_result(name, future):
    try:
        return future.result()
    except Exception as error:
        return {
            "status": "error",
            "result_count": 0,
            "error": f"{name} module failed: {error}",
            "data": {},
        }


# This route is used for the normal results page.
# It runs the OSINT modules and displays results.html with the final intel data.
@app.route("/results", methods=["GET", "POST"])
def results():
    # Loads the sample JSON structure first, then replaces parts with live results.
    data = load_sample_data()

    #user input
    query = request.form.get("query") or request.args.get("query") or ""
    query_type = request.form.get("query_type") or request.args.get("query_type") or ""


    # strip removes extra spaces, lower makes query_type consistent.
    query = query.strip()
    query_type = query_type.strip().lower()

    # These print statements help debugging in the Flask terminal.
    print("QUERY:", query)
    print("QUERY TYPE:", query_type)

    # ThreadPoolExecutor means the Flask app runs many OSINT modules at the same time instead of one by one.
    # max_workers=11 allows multiple sources to run in parallel, which improves speed.
    with ThreadPoolExecutor(max_workers=11) as executor:
        # futures stores all running module tasks.
        # executor.submit starts each module in the background and passes query and query_type to it.
        futures = {
            "github": executor.submit(build_github_module, query, query_type),
            "whois": executor.submit(build_whois_module, query, query_type),
            "virustotal": executor.submit(build_virustotal_module, query, query_type),
            "shodan": executor.submit(build_shodan_module, query, query_type),
            "otx": executor.submit(build_otx_module, query, query_type),
            "theharvester": executor.submit(
                build_theharvester_module, query, query_type
            ),
            "censys": executor.submit(build_censys_module, query, query_type),
            "subfinder": executor.submit(build_subfinder_module, query, query_type),
            "maigret": executor.submit(build_maigret_module, query, query_type),
            "holehe": executor.submit(build_holehe_module, query, query_type),
            "ghunt": executor.submit(build_ghunt_module, query, query_type),
            "userscanner": executor.submit(build_userscanner_module, query, query_type),
        }

        # results_map is a dictionary that stores each module's final result.
        # safe_module_result makes sure one failed module does not stop the full scan.
        results_map = {}
        for name, future in futures.items():
            results_map[name] = safe_module_result(name, future)

    # These variables make it easier to use each module result later in the code.
    github_module = results_map["github"]
    whois_module = results_map["whois"]
    virustotal_module = results_map["virustotal"]
    shodan_module = results_map["shodan"]
    otx_module = results_map["otx"]
    theharvester_module = results_map["theharvester"]
    censys_module = results_map["censys"]
    subfinder_module = results_map["subfinder"]
    maigret_module = results_map["maigret"]
    holehe_module = results_map["holehe"]
    ghunt_module = results_map["ghunt"]
    userscanner_module = results_map["userscanner"]

    # These lines store the main search information into the final data object.
    data["query"] = query
    data["query_type"] = query_type
    data["timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M")

    #data live
    data["modules"] = {
        "github": github_module,
        "maigret": maigret_module,
        "whois": whois_module,
        "virustotal": virustotal_module,
        "shodan": shodan_module,
        "otx": otx_module,
        "theharvester": theharvester_module,
        "censys": censys_module,
        "subfinder": subfinder_module,
        "holehe": holehe_module,
        "ghunt": ghunt_module,
        "userscanner": userscanner_module,
    }

    # key_findings is a simple summary list shown on the dashboard.
    # Instead of showing only raw data, it explains the important findings in short sentences.
    key_findings = []

    # This block adds Subfinder findings.
    # It counts discovered subdomains or explains if no subdomains were found.
    if subfinder_module.get("status") == "success":
        subdomain_count = len(subfinder_module.get("data", {}).get("subdomains", []))
        key_findings.append(f"Subfinder identified {subdomain_count} subdomains")
    elif subfinder_module.get("status") == "no_results" and query_type == "domain":
        key_findings.append(
            "Subfinder did not return subdomains for the queried domain"
        )

    if subfinder_module.get("error"):
        key_findings.append(f"Subfinder error: {subfinder_module['error']}")

    # This block adds GitHub findings.
    # It checks if a GitHub user or related repositories were found.
    if github_module.get("data", {}).get("user"):
        key_findings.append(
            f"GitHub user found: {github_module['data']['user']['login']}"
        )

    repo_count = len(github_module.get("data", {}).get("repositories", []))
    if repo_count > 0:
        if query_type == "username":
            key_findings.append(
                f"{repo_count} GitHub repositories were retrieved for the user"
            )
        else:
            key_findings.append(
                f"{repo_count} GitHub repositories referenced the searched query"
            )

    if github_module.get("error"):
        key_findings.append(f"GitHub error: {github_module['error']}")

    # This block adds Maigret findings.
    # Maigret checks where a username appears across many platforms.
    if maigret_module.get("status") == "success":
        claimed_count = len(maigret_module.get("data", {}).get("accounts", []))
        username = maigret_module.get("data", {}).get("username", query)
        key_findings.append(
            f"Maigret identified {claimed_count} claimed accounts for username: {username}"
        )

    if maigret_module.get("error"):
        key_findings.append(f"Maigret error: {maigret_module['error']}")

    # This block adds Holehe findings.
    # Holehe checks whether an email appears registered on online platforms.
    if holehe_module.get("status") == "success":
        found_count = len(holehe_module.get("data", {}).get("found_on", []))
        key_findings.append(
            f"Holehe found the email registered on {found_count} platforms"
        )
    elif holehe_module.get("status") == "no_results" and query_type == "email":
        key_findings.append(
            "Holehe found no platform registrations for the queried email"
        )

    if holehe_module.get("error"):
        key_findings.append(f"Holehe error: {holehe_module['error']}")

    # This block adds GHunt findings.
    # GHunt returns Google account-related intelligence for an email.
    if ghunt_module.get("status") == "success":
        key_findings.append(
            "GHunt returned Google account intelligence for the queried email"
        )

    if ghunt_module.get("error"):
        key_findings.append(f"GHunt error: {ghunt_module['error']}")

    # This block adds UserScanner findings.
    # UserScanner checks whether an email is found on supported sites.
    if userscanner_module.get("status") == "success":
        sites_count = len(userscanner_module.get("data", {}).get("found_on", []))
        key_findings.append(f"UserScanner found the email on {sites_count} sites")
    elif userscanner_module.get("status") == "no_results" and query_type == "email":
        key_findings.append("UserScanner found no results for the queried email")

    if userscanner_module.get("error"):
        key_findings.append(f"UserScanner error: {userscanner_module['error']}")

    # This block adds WHOIS findings.
    # WHOIS gives registration details like registrar, DNSSEC, and abuse contact.
    if whois_module.get("status") == "success":
        domain_name = whois_module.get("data", {}).get("domain_name", query)
        key_findings.append(f"WHOIS record found for domain: {domain_name}")

        if whois_module.get("data", {}).get("registrar") != "N/A":
            key_findings.append(
                f"Registrar identified: {whois_module['data']['registrar']}"
            )

        if whois_module.get("data", {}).get("dnssec") != "N/A":
            key_findings.append(f"DNSSEC status: {whois_module['data']['dnssec']}")

        if whois_module.get("data", {}).get("abuse_contact_email") != "N/A":
            key_findings.append(
                f"Registrar abuse contact identified: {whois_module['data']['abuse_contact_email']}"
            )

    if whois_module.get("error"):
        key_findings.append(f"WHOIS error: {whois_module['error']}")

    # This block adds Shodan findings.
    # Shodan shows internet exposure, such as open ports and services.
    if shodan_module.get("status") == "success":
        port_count = len(shodan_module.get("data", {}).get("open_ports", []))
        key_findings.append(
            f"Shodan identified {port_count} open ports for the queried host"
        )

    if shodan_module.get("error"):
        key_findings.append(f"Shodan error: {shodan_module['error']}")

    # This block adds VirusTotal findings.
    # It checks whether the target is detected as malicious or suspicious.
    if virustotal_module.get("status") == "success":
        stats = virustotal_module.get("data", {}).get("last_analysis_stats", {})
        malicious = stats.get("malicious", 0)
        suspicious = stats.get("suspicious", 0)
        key_findings.append(
            f"VirusTotal analysis found {malicious} malicious and {suspicious} suspicious detections"
        )

    if virustotal_module.get("error"):
        key_findings.append(f"VirusTotal error: {virustotal_module['error']}")

    # This block adds OTX findings.
    # OTX gives threat intelligence pulses related to a domain or IP.
    if otx_module.get("status") == "success":
        pulse_count = otx_module.get("data", {}).get("pulse_count", 0)
        key_findings.append(
            f"OTX returned {pulse_count} related pulses for the queried indicator"
        )
    elif otx_module.get("status") == "no_results" and query_type in ["domain", "ip"]:
        key_findings.append(
            "OTX returned no related threat intelligence references for the queried indicator"
        )

    if otx_module.get("error"):
        key_findings.append(f"OTX error: {otx_module['error']}")

    # This block adds theHarvester findings.
    # theHarvester collects hosts, emails, IPs, and URLs related to a domain/email domain.
    if theharvester_module.get("status") == "success":
        host_count = len(theharvester_module.get("data", {}).get("hosts", []))
        email_count = len(theharvester_module.get("data", {}).get("emails", []))
        ip_count = len(theharvester_module.get("data", {}).get("ips", []))
        url_count = len(theharvester_module.get("data", {}).get("urls", []))

        if query_type == "email":
            key_findings.append(
                f"theHarvester identified {host_count} hosts, {email_count} emails, {ip_count} IPs, and {url_count} URLs related to the email domain"
            )
        else:
            key_findings.append(
                f"theHarvester identified {host_count} hosts, {email_count} emails, {ip_count} IPs, and {url_count} URLs"
            )

    if theharvester_module.get("error"):
        key_findings.append(f"theHarvester error: {theharvester_module['error']}")

    # This block adds Censys findings.
    # Censys shows exposed services related to the queried host.
    if censys_module.get("status") == "success":
        service_count = len(censys_module.get("data", {}).get("services", []))
        key_findings.append(
            f"Censys returned {service_count} exposed services for the queried host"
        )

    if censys_module.get("error"):
        key_findings.append(f"Censys error: {censys_module['error']}")

    # If no source produced anything important, the dashboard still shows a clean message.
    if not key_findings:
        key_findings.append("No major findings were returned for the current query.")

    # sources_queried counts how many OSINT modules were attempted.
    # sources_with_results counts how many modules returned success.
    sources_queried = len(data["modules"])
    sources_with_results = sum(
        1 for module in data["modules"].values() if module.get("status") == "success"
    )

    # This block calculates the risk level.
    # VirusTotal malicious result makes it High.
    # Suspicious result or OTX threat intelligence makes it Medium.
    # Otherwise, it stays Low.
    risk_level = "Low"
    vt_stats = virustotal_module.get("data", {}).get("last_analysis_stats", {})
    malicious = vt_stats.get("malicious", 0)
    suspicious = vt_stats.get("suspicious", 0)

    if malicious > 0:
        risk_level = "High"
    elif suspicious > 0 or otx_module.get("status") == "success":
        risk_level = "Medium"

    #Data Summary
    data["summary"] = {
        "risk_level": risk_level,
        "sources_queried": sources_queried,
        "sources_with_results": sources_with_results,
        "key_findings": key_findings,
    }

    # raw_output stores the full detailed results from every module.
    # This is useful for debugging and detailed dashboard sections.
    data["raw_output"] = {
        "github": github_module,
        "whois": whois_module,
        "shodan": shodan_module,
        "virustotal": virustotal_module,
        "otx": otx_module,
        "theharvester": theharvester_module,
        "censys": censys_module,
        "subfinder": subfinder_module,
        "maigret": maigret_module,
        "holehe": holehe_module,
        "ghunt": ghunt_module,
        "userscanner": userscanner_module,
    }

    # Finally, Flask displays results.html and sends all collected intelligence as intel.
    return render_template("results.html", intel=data)


# This route is the API version of the results route.
# Instead of returning an HTML page, it returns JSON data for frontend/API use.
@app.route("/api/results", methods=["GET", "POST"])
def api_results():
    # Loads the base JSON structure.
    data = load_sample_data()

    # If the frontend sends POST JSON, get query and query_type from the JSON body.
    # If it is a GET request, get them from the URL query parameters.
    if request.method == "POST":
        body = request.get_json(silent=True) or {}
        query = body.get("query", "")
        query_type = body.get("query_type", "")
    else:
        query = request.args.get("query", "")
        query_type = request.args.get("query_type", "")

    # Cleans the input before sending it to modules.
    query = query.strip()
    query_type = query_type.strip().lower()

    # Same parallel execution idea as /results.
    # It runs all modules at the same time and stores their outputs in futures.
    with ThreadPoolExecutor(max_workers=11) as executor:
        futures = {
            "github": executor.submit(build_github_module, query, query_type),
            "whois": executor.submit(build_whois_module, query, query_type),
            "virustotal": executor.submit(build_virustotal_module, query, query_type),
            "shodan": executor.submit(build_shodan_module, query, query_type),
            "otx": executor.submit(build_otx_module, query, query_type),
            "theharvester": executor.submit(
                build_theharvester_module, query, query_type
            ),
            "censys": executor.submit(build_censys_module, query, query_type),
            "subfinder": executor.submit(build_subfinder_module, query, query_type),
            "maigret": executor.submit(build_maigret_module, query, query_type),
            "holehe": executor.submit(build_holehe_module, query, query_type),
            "ghunt": executor.submit(build_ghunt_module, query, query_type),
            "userscanner": executor.submit(build_userscanner_module, query, query_type),
        }

        # Collects each module result safely into results_map.
        results_map = {}
        for name, future in futures.items():
            results_map[name] = safe_module_result(name, future)

    # Adds search details and module results into the API response.
    data["query"] = query
    data["query_type"] = query_type
    data["timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M")
    data["modules"] = results_map

    # Creates a simpler key findings list for the API response.
    key_findings = []

    # This loop checks each module.
    # If it succeeded, it adds a success message.
    # If it has an error, it adds the error message.
    for module_name, module in results_map.items():
        if module.get("status") == "success":
            key_findings.append(f"{module_name} returned results")
        if module.get("error"):
            key_findings.append(f"{module_name} error: {module.get('error')}")

    # Keeps the response clean even when nothing important was found.
    if not key_findings:
        key_findings.append("No major findings were returned for the current query.")

    # Counts total queried sources and successful sources.
    sources_queried = len(results_map)
    sources_with_results = sum(
        1 for module in results_map.values() if module.get("status") == "success"
    )

    # Gets VirusTotal stats for risk calculation.
    vt_stats = (
        results_map.get("virustotal", {}).get("data", {}).get("last_analysis_stats", {})
    )
    malicious = vt_stats.get("malicious", 0)
    suspicious = vt_stats.get("suspicious", 0)

    # Calculates risk level for the API response.
    risk_level = "Low"
    if malicious > 0:
        risk_level = "High"
    elif suspicious > 0 or results_map.get("otx", {}).get("status") == "success":
        risk_level = "Medium"

    # Adds final summary information to the API response.
    data["summary"] = {
        "risk_level": risk_level,
        "sources_queried": sources_queried,
        "sources_with_results": sources_with_results,
        "key_findings": key_findings,
    }

    # raw_output stores all detailed module outputs in the JSON response.
    data["raw_output"] = results_map

    # jsonify converts the Python dictionary into JSON for the frontend/API caller.
    return jsonify(data)


# This runs the Flask app only when this file is executed directly using: python app.py
# debug=True is useful during development because it shows errors and reloads after changes.
if __name__ == "__main__":
    app.run(debug=True)
