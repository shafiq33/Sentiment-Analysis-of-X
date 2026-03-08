# We're no longer relying on web scraping; instead use a static
# dataset shipped with the project.  The Sentiment140 dataset provides
# a large set of real tweets labelled for sentiment.

from pathlib import Path
from datasets import load_dataset, Dataset
import pandas as pd

# Load Sentiment140 dataset as primary
csv_path = Path(__file__).parent / "training.1600000.processed.noemoticon.csv"
sentiment140_df = pd.read_csv(csv_path, encoding='latin-1', header=None,
                              names=['polarity', 'id', 'date', 'query', 'user', 'text'])

# Map Sentiment140 polarities to labels
# Sentiment140: 0=negative, 2=neutral, 4=positive
polarity_mapping = {0: 0, 2: 1, 4: 2}
sentiment140_df['label'] = sentiment140_df['polarity'].map(polarity_mapping)

# Convert to Hugging Face dataset format (full dataset)
sentiment140_dataset = Dataset.from_pandas(sentiment140_df[['text', 'label']])

# Load trending topics dataset
trending_csv_path = Path(__file__).parent / "twitter-trending-hashtags.csv"
trending_df = pd.read_csv(trending_csv_path)
trending_topics_list = trending_df['tag'].tolist()


def get_trending_topics(limit=50):
    """Return a list of trending hashtags."""
    return trending_topics_list[:limit]


def fetch_tweets(query, search_mode="keyword", max_results=10):
    """Return a list of tweets from Sentiment140 containing the query based on mode."""

    # helper for loading fallback tweets
    def _load_sample():
        import json
        path = Path(__file__).parent / "sample_tweets.json"
        if path.exists():
            return {"data": json.loads(path.read_text())}
        return {"data": []}

    matches = []
    query_lower = query.lower()

    if search_mode == "keyword":
        # Search for keyword in text or as hashtag
        for idx, example in enumerate(sentiment140_dataset):
            text_lower = example["text"].lower()
            if query_lower in text_lower or f"#{query_lower}" in text_lower:
                matches.append({
                    "text": example["text"],
                    "created_at": "",
                    "author_id": "",
                    "id": f"sentiment140_{idx}"
                })
                if len(matches) >= max_results:
                    break

    elif search_mode == "user_tag":
        # Search for @username in text
        user_query = f"@{query_lower}"
        for idx, example in enumerate(sentiment140_dataset):
            if user_query in example["text"].lower():
                matches.append({
                    "text": example["text"],
                    "created_at": "",
                    "author_id": "",
                    "id": f"sentiment140_{idx}"
                })
                if len(matches) >= max_results:
                    break

    elif search_mode == "trending":
        # Query is the hashtag, search for it in text
        hashtag_query = f"#{query_lower}"
        for idx, example in enumerate(sentiment140_dataset):
            if hashtag_query in example["text"].lower():
                matches.append({
                    "text": example["text"],
                    "created_at": "",
                    "author_id": "",
                    "id": f"sentiment140_{idx}"
                })
                if len(matches) >= max_results:
                    break

    if matches:
        return {"data": matches}

    # nothing matched, fall back to sample
    return _load_sample()

# Example usage (remove when integrating)
if __name__ == "__main__":
    result = fetch_tweets("openai", 10)
    print(result)