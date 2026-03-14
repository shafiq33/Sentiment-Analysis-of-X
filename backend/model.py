from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
import os

# Load the pre-trained model and tokenizer
model_name = "cardiffnlp/twitter-roberta-base-sentiment"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSequenceClassification.from_pretrained(model_name)

# Load the saved model state if it exists
model_path = os.path.join(os.path.dirname(__file__), "sentiment_model.pt")
if os.path.exists(model_path):
    model.load_state_dict(torch.load(model_path, map_location=torch.device('cpu')))
    print(f"Loaded model state from {model_path}")
else:
    print(f"Model state file not found at {model_path}, using pre-trained model")

# Set model to evaluation mode
model.eval()

def sentiment_scores(sentence):
    # Tokenize the input
    inputs = tokenizer(sentence, return_tensors="pt", truncation=True, padding=True, max_length=128)
    
    # Get model predictions
    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
    
    # Get the predicted class
    predicted_class = torch.argmax(logits, dim=1).item()
    
    # Map to sentiment labels (0: negative, 1: neutral, 2: positive)
    labels = ["Negative", "Neutral", "Positive"]
    sentiment = labels[predicted_class]
    
    print(f"Sentence: {sentence}")
    print(f"Sentiment: {sentiment}")
    
    return f"Overall Sentiment: {sentiment}"