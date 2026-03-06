document.getElementById('searchBtn').addEventListener('click', search);

async function search() {
    const query = document.getElementById('query').value;
    const searchMode = document.getElementById('search_mode').value;
    const resultsDiv = document.getElementById('results');

    if (!query) {
        resultsDiv.innerHTML = '<p>Please enter a query.</p>';
        return;
    }

    resultsDiv.innerHTML = '<p>Loading...</p>';

    try {
        const response = await fetch('http://localhost:5000/search', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query, search_mode: searchMode })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();

        if (data.error) {
            resultsDiv.innerHTML = `<p>Error: ${data.error}</p>`;
            return;
        }

        let html = `<h2>Results for "${data.query}"</h2>`;
        html += `<p>Total tweets: ${data.total_tweets}</p>`;
        html += `<p>Overall sentiment: <strong>${data.summary.overall}</strong></p>`;
        html += `<p>Positive: ${data.summary.positive}, Negative: ${data.summary.negative}, Neutral: ${data.summary.neutral}</p>`;

        html += '<h3>Sentiments:</h3>';
        data.sentiments.forEach(sentiment => {
            html += `<div class="tweet">
                <p>${sentiment.text}</p>
                <p class="sentiment">${sentiment.sentiment}</p>
            </div>`;
        });

        resultsDiv.innerHTML = html;
    } catch (error) {
        resultsDiv.innerHTML = `<p>Error: ${error.message}. Make sure the backend is running on localhost:5000.</p>`;
    }
}