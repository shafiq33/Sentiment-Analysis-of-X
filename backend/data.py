import requests
from pathlib import Path

url = "https://api.x.com/2/tweets/search/recent?max_results=10"

headers = {"Authorization": "Bearer AAAAAAAAAAAAAAAAAAAAAAYn7QEAAAAAqGGpCZwkl%2BCzS%2BzlVJMQR%2FtnNH8%3DBBM1KSFGxygFbM6aFk8hp2B18I3S19qEeDqnIiVZUlZFcv6qVX"}
params = {
    "query": "openai",      # your keyword
    "max_results": 100,      # number of tweets per request (10-100)
    "tweet.fields": "created_at,author_id"  # optional fields
}


response = requests.get(url, headers=headers, params=params)

file_path = Path("./data.txt")

if file_path.exists():
    with open(file_path, "a") as f:
        f.write(response.text)
else:
    file_path.write_text(response.text)

print(response.text)