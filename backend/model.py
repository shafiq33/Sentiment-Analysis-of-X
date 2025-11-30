from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

def sentiment_scores(sentence):
    sid_obj = SentimentIntensityAnalyzer()
    sentiment_dict = sid_obj.polarity_scores(sentence)
    
    print(f"Sentiment Scores: {sentiment_dict}")
    print(f"Negative Sentiment: {sentiment_dict['neg']*100}%")
    print(f"Neutral Sentiment: {sentiment_dict['neu']*100}%")
    print(f"Positive Sentiment: {sentiment_dict['pos']*100}%")

    if sentiment_dict['compound'] >= 0.05:
        return "Overall Sentiment: Positive"
    elif sentiment_dict['compound'] <= -0.05:
        return "Overall Sentiment: Negative"
    else:
        return "Overall Sentiment: Neutral"