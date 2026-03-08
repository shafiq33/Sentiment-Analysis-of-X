from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
from model import sentiment_scores
from data import fetch_tweets, get_trending_topics

app = Flask(__name__)
CORS(app)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/trending")
def trending():
    topics = get_trending_topics(100)  # Get more for pagination
    return jsonify({"topics": topics})

@app.route("/search", methods=["POST"])
def search():
    data = request.get_json()
    query = data.get("query", "")
    search_mode = data.get("search_mode", "keyword")
    
    # Adjust query based on search mode
    if search_mode == "user_tag":
        if not query.startswith("@"):
            query = f"@{query}"
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
    sentiments = []
    for tweet in tweets:
        text = tweet.get("text", "")
        sentiment = sentiment_scores(text)
        sentiments.append({"text": text, "sentiment": sentiment})
    
    # Aggregate sentiments
    positive = sum(1 for s in sentiments if "Positive" in s["sentiment"])
    negative = sum(1 for s in sentiments if "Negative" in s["sentiment"])
    neutral = sum(1 for s in sentiments if "Neutral" in s["sentiment"])
    
    overall = "Positive" if positive > negative and positive > neutral else "Negative" if negative > positive else "Neutral"
    
    return jsonify({
        "query": query,
        "total_tweets": len(sentiments),
        "sentiments": sentiments,
        "summary": {
            "positive": positive,
            "negative": negative,
            "neutral": neutral,
            "overall": overall
        }
    })

if __name__ == "__main__":
    app.run(debug=True)