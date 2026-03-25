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


def get_trending_topics_paginated(page=1, per_page=50):
    """Return paginated trending topics with their details."""
    start = (page - 1) * per_page
    end = start + per_page
    
    paginated_df = trending_df.iloc[start:end]
    topics = [
        {
            'tag': row['tag'],
            'count': int(row['tweets']),
            'year': int(row['year']),
            'rank': int(row['rank'])
        }
        for _, row in paginated_df.iterrows()
    ]
    
    total_topics = len(trending_df)
    total_pages = (total_topics + per_page - 1) // per_page
    
    return {
        'topics': topics,
        'pagination': {
            'page': page,
            'per_page': per_page,
            'total_topics': total_topics,
            'total_pages': total_pages,
            'has_prev': page > 1,
            'has_next': page < total_pages
        }
    }


def fetch_tweets(query, search_mode="keyword", max_results=10):
    """Return a list of tweets from Sentiment140 containing the query based on mode."""

    matches = []
    query_lower = query.lower()

    if search_mode == "user_tag":
        # Only match if query starts with '@'
        print(f"Searching for user tag: {query_lower}")
        if not query_lower.startswith("@"):  # If no @, return empty
            print(query_lower)
            return {"data": []}
        user_tag = query_lower[1:]  # remove '@'
        for idx, example in enumerate(sentiment140_df.itertuples()):
            if user_tag == getattr(example, 'user').lower():
                matches.append({
                    "text": getattr(example, 'text'),
                    "created_at": "",
                    "author_id": getattr(example, 'user'),
                    "id": f"sentiment140_{idx}"
                })
                if len(matches) >= max_results:
                    break
        return {"data": matches}

    # Always search Sentiment140 dataset for trending topics and keywords
    search_text = query_lower
    # For trending topics, do not prepend #, just use topic name as-is
    for idx, example in enumerate(sentiment140_dataset):
        text_lower = example["text"].lower()
        if search_text in text_lower:
            matches.append({
                "text": example["text"],
                "created_at": "",
                "author_id": "",
                "id": f"sentiment140_{idx}"
            })
            if len(matches) >= max_results:
                break
    return {"data": matches}

# Example usage (remove when integrating)
if __name__ == "__main__":
    result = fetch_tweets("openai", 10)
    print(result)