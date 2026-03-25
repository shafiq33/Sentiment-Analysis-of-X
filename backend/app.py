from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
from model import sentiment_scores
from data import fetch_tweets, get_trending_topics, get_trending_topics_paginated

app = Flask(__name__)
CORS(app)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/all-trending")
def all_trending():
    return render_template("all-trending.html")

@app.route("/trending-sentiment", methods=["POST"])
def trending_sentiment():
    data = request.get_json()
    print(f"Received data for trending sentiment: {data}")
    topic = data.get("topic", "")
    if not topic:
        return jsonify({"error": "No topic provided."}), 400

    # Use keyword search logic for trending topic
    tweets_data = fetch_tweets(topic, max_results=20)
    if "error" in tweets_data:
        return jsonify({"error": tweets_data["error"]})

    tweets = tweets_data.get("data", [])
    if not tweets:
        return jsonify({
            "message": "No tweets found for the topic.",
            "query": topic
        })

    tweet_sentiments = []
    for tweet in tweets:
        text = tweet.get("text", "")
        user = tweet.get("author_id", "unknown")
        sentiment = sentiment_scores(text)
        tweet_sentiments.append({
            "text": text,
            "user": user if user else "unknown",
            "sentiment": sentiment
        })

    positive = sum(1 for s in tweet_sentiments if "Positive" in s["sentiment"])
    negative = sum(1 for s in tweet_sentiments if "Negative" in s["sentiment"])
    neutral = sum(1 for s in tweet_sentiments if "Neutral" in s["sentiment"])

    overall = "Positive" if positive > negative and positive > neutral else \
              "Negative" if negative > positive and negative > neutral else \
              "Neutral"

    return jsonify({
        "query": topic,
        "total_tweets": len(tweet_sentiments),
        "tweets": tweet_sentiments,
        "summary": {
            "positive": positive,
            "negative": negative,
            "neutral": neutral,
            "overall": overall
        }
    })
@app.route("/trending")
def trending():
    # Check if pagination parameters are provided in request
    if 'page' in request.args or 'per_page' in request.args:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        result = get_trending_topics_paginated(page, per_page)
        return jsonify(result)
    
    # Default behavior for extension popup (simple list)
    topics = get_trending_topics(100)
    return jsonify({"topics": topics})

@app.route("/search", methods=["POST"])
def search():
    data = request.get_json()
    query = data.get("query", "")
    search_mode = data.get("search_mode", "keyword")
    
    # Adjust query based on search mode
    if search_mode == "user_tag":
        pass
    # For keyword and trending, use as is
    
    print(f"Query: {query}, Mode: {search_mode}")
    
    # Fetch tweets
    tweets_data = fetch_tweets(query, search_mode, max_results=20)
    
    if "error" in tweets_data:
        return jsonify({"error": tweets_data["error"]})
    
    tweets = tweets_data.get("data", [])
    if not tweets:
        return jsonify({"message": "No tweets found for the query."})
    
    # Analyze sentiment for each tweet
    tweet_sentiments = []
    for tweet in tweets:
        text = tweet.get("text", "")
        user = tweet.get("author_id", "unknown")
        sentiment = sentiment_scores(text)
        tweet_sentiments.append({
            "text": text,
            "user": user if user else "unknown",
            "sentiment": sentiment
        })
    
    # Aggregate sentiments
    positive = sum(1 for s in tweet_sentiments if "Positive" in s["sentiment"])
    negative = sum(1 for s in tweet_sentiments if "Negative" in s["sentiment"])
    neutral = sum(1 for s in tweet_sentiments if "Neutral" in s["sentiment"])
    
    overall = "Positive" if positive > negative and positive > neutral else "Negative" if negative > positive else "Neutral"
    
    return jsonify({
        "query": query,
        "total_tweets": len(tweet_sentiments),
        "tweets": tweet_sentiments,
        "summary": {
            "positive": positive,
            "negative": negative,
            "neutral": neutral,
            "overall": overall
        }
    })

if __name__ == "__main__":
    app.run(debug=True)