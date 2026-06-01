import os
import requests
from dotenv import load_dotenv

load_dotenv()

GITHUB_API_BASE = "https://api.github.com"
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")


def get_github_headers():
    headers = {
        "Accept": "application/vnd.github+json"
    }

    if GITHUB_TOKEN:
        headers["Authorization"] = f"Bearer {GITHUB_TOKEN}"

    return headers


def search_github_user(username: str):
    if not username:
        return None, "No username provided"

    url = f"{GITHUB_API_BASE}/users/{username}"

    try:
        response = requests.get(url, headers=get_github_headers(), timeout=60)

        if response.status_code == 404:
            return None, None

        if response.status_code != 200:
            return None, f"GitHub API error while fetching user: {response.status_code}"

        data = response.json()

        return {
            "login": data.get("login"),
            "profile_url": data.get("html_url"),
            "account_type": data.get("type"),
            "name": data.get("name"),
            "bio": data.get("bio"),
            "company": data.get("company"),
            "location": data.get("location"),
            "public_repos": data.get("public_repos"),
            "followers": data.get("followers"),
            "following": data.get("following"),
        }, None

    except requests.RequestException as error:
        return None, f"Request failed while fetching user: {error}"


def fetch_user_repositories(username: str, per_page: int = 5):
    if not username:
        return [], "No username provided"

    url = f"{GITHUB_API_BASE}/users/{username}/repos"
    params = {
        "per_page": per_page,
        "sort": "updated"
    }

    try:
        response = requests.get(
            url,
            headers=get_github_headers(),
            params=params,
            timeout=60
        )

        if response.status_code == 404:
            return [], None

        if response.status_code != 200:
            return [], f"GitHub API error while fetching repositories: {response.status_code}"

        items = response.json()
        repositories = []

        for repo in items:
            repositories.append({
                "name": repo.get("name"),
                "full_name": repo.get("full_name"),
                "description": repo.get("description"),
                "url": repo.get("html_url"),
                "language": repo.get("language"),
                "stars": repo.get("stargazers_count"),
                "forks": repo.get("forks_count"),
                "updated_at": repo.get("updated_at"),
                "owner": repo.get("owner", {}).get("login")
            })

        return repositories, None

    except requests.RequestException as error:
        return [], f"Request failed while fetching repositories: {error}"


def search_github_repositories(query: str, per_page: int = 5):
    if not query:
        return [], "No query provided"

    url = f"{GITHUB_API_BASE}/search/repositories"
    params = {
        "q": query,
        "per_page": per_page
    }

    try:
        response = requests.get(
            url,
            headers=get_github_headers(),
            params=params,
            timeout=60
        )

        if response.status_code != 200:
            return [], f"GitHub API error while searching repositories: {response.status_code}"

        data = response.json()
        items = data.get("items", [])
        repositories = []

        for repo in items:
            repositories.append({
                "name": repo.get("name"),
                "full_name": repo.get("full_name"),
                "description": repo.get("description"),
                "url": repo.get("html_url"),
                "language": repo.get("language"),
                "stars": repo.get("stargazers_count"),
                "forks": repo.get("forks_count"),
                "updated_at": repo.get("updated_at"),
                "owner": repo.get("owner", {}).get("login")
            })

        return repositories, None

    except requests.RequestException as error:
        return [], f"Request failed while searching repositories: {error}"


def build_github_module(query: str, query_type: str):
    user_data = None
    repositories = []
    errors = []

    if not query:
        return {
            "status": "not_applicable",
            "result_count": 0,
            "error": None,
            "data": {
                "user": None,
                "repositories": []
            }
        }

    if query_type == "username":
        user_data, user_error = search_github_user(query)
        if user_error:
            errors.append(user_error)

        repositories, repo_error = fetch_user_repositories(query, per_page=5)
        if repo_error:
            errors.append(repo_error)

    elif query_type in ["domain", "email"]:
        repositories, repo_error = search_github_repositories(query, per_page=5)
        if repo_error:
            errors.append(repo_error)

    else:
        return {
            "status": "not_applicable",
            "result_count": 0,
            "error": None,
            "data": {
                "user": None,
                "repositories": []
            }
        }

    result_count = len(repositories)
    if user_data:
        result_count += 1

    if user_data or repositories:
        status = "success"
    elif errors:
        status = "error"
    else:
        status = "no_results"

    return {
        "status": status,
        "result_count": result_count,
        "error": "; ".join(errors) if errors else None,
        "data": {
            "user": user_data,
            "repositories": repositories
        }
    }
