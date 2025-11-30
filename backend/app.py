from flask import Flask, render_template, jsonify, request
from model import sentiment_scores 


app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/search", methods=["POST"])
def search():
    data = request.get_json()
    query = data["query"]
    
    print("Sentence:", query)
    response = sentiment_scores(query)

    return jsonify({"Received": response}) 

app.run(debug=True)