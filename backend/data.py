# We're no longer relying on web scraping; instead use a static
# dataset shipped with the project.  The tweet_eval dataset from
# Hugging Face provides a reasonable set of real tweets labelled for
# sentiment.  This ensures the backend works offline and isn't affected
# by Twitter's API restrictions.

from pathlib import Path
from datasets import load_dataset

# load the dataset once at import time; we'll use the 'train' split for
# search.  This will download the data the first time the module is
# imported, which may take a moment.
_dataset = load_dataset("tweet_eval", "sentiment", split="train")


def fetch_tweets(query, max_results=10):
    """Return a list of tweets from the static dataset containing ``query``.

    The returned structure mirrors what the frontend expects (a dict with
    key "data" and a list of tweet-like dicts).  If no examples match the
    query we still return a small set of baked‑in sample tweets so the
    UI doesn't break.
    """

    # helper for loading fallback tweets
    def _load_sample():
        import json
        path = Path(__file__).parent / "sample_tweets.json"
        if path.exists():
            return {"data": json.loads(path.read_text())}
        return {"data": []}

    # query the static dataset
    matches = []
    text = query.lower()
    for idx, example in enumerate(_dataset):
        if text in example["text"].lower():
            matches.append({
                "text": example["text"],
                # tweet_eval doesn't provide timestamps or author ids, so
                # we leave those blank or fabricate placeholders
                "created_at": "",
                "author_id": "",
                "id": str(idx)
            })
            if len(matches) >= max_results:
                break
    if matches:
        return {"data": matches}

    # nothing matched in the dataset; fall back to tiny built-in file
    return _load_sample()

# Example usage (remove when integrating)
if __name__ == "__main__":
    result = fetch_tweets("openai", 10)
    print(result)