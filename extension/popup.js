document.getElementById('searchBtn').addEventListener('click', search);
document.getElementById('openWebpageBtn').addEventListener('click', openWebpage);

const placeholders = {
  keyword: "e.g. #Bitcoin, Elon Musk, AI",
  trending: "",
  user_tag: "e.g. @elonmusk, @Twitter"
};

const validationRules = {
  keyword: (input) => input.trim().length > 0,
  trending: () => true,
  user_tag: (input) => /@[a-zA-Z0-9_]+/.test(input.trim())
};

let trendingTopics = [];
let currentPage = 0;
const topicsPerPage = 10;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
  updatePlaceholder();
  setupEventListeners();
  loadTrendingTopics();
});

function setupEventListeners() {
  const searchModeSelect = document.getElementById('search_mode');
  const queryInput = document.getElementById('query');

  searchModeSelect.addEventListener('change', function() {
    updatePlaceholder();
    queryInput.value = '';
    clearValidation();
    toggleTrendingView();
  });

  queryInput.addEventListener('input', validateInput);
}

function updatePlaceholder() {
  const searchMode = document.getElementById('search_mode').value;
  const queryInput = document.getElementById('query');
  queryInput.placeholder = placeholders[searchMode];
}

function toggleTrendingView() {
  const searchMode = document.getElementById('search_mode').value;
  const inputContainer = document.querySelector('.input-container');
  const trendingContainer = document.getElementById('trendingContainer');
  const searchBtn = document.getElementById('searchBtn');

  if (searchMode === 'trending') {
    document.getElementById('query').style.display = 'none';
    searchBtn.style.display = 'none';
    trendingContainer.style.display = 'block';
    displayTrendingTopics();
  } else {
    document.getElementById('query').style.display = 'block';
    searchBtn.style.display = 'block';
    trendingContainer.style.display = 'none';
  }
}

function validateInput() {
  const queryInput = document.getElementById('query');
  const searchMode = document.getElementById('search_mode').value;
  const input = queryInput.value;
  const searchBtn = document.getElementById('searchBtn');

  if (input.trim() === '') {
    clearValidation();
    return;
  }

  const isValid = validationRules[searchMode](input);

  if (isValid) {
    queryInput.classList.remove('invalid');
    queryInput.classList.add('valid');
    searchBtn.disabled = false;
  } else {
    queryInput.classList.remove('valid');
    queryInput.classList.add('invalid');
    searchBtn.disabled = true;
  }
}

function clearValidation() {
  const queryInput = document.getElementById('query');
  const searchBtn = document.getElementById('searchBtn');

  queryInput.classList.remove('valid', 'invalid');
  searchBtn.disabled = true;
}

async function loadTrendingTopics() {
  try {
    const response = await fetch('http://localhost:5000/trending');
    const data = await response.json();
    trendingTopics = data.topics;
  } catch (error) {
    console.error('Failed to load trending topics:', error);
  }
}

function displayTrendingTopics() {
  const container = document.getElementById('trendingTopics');
  const start = currentPage * topicsPerPage;
  const end = start + topicsPerPage;
  const topics = trendingTopics.slice(start, end);

  let html = '<div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;">';
  topics.forEach(topic => {
    html += `<button class="topic-btn" data-topic="${topic}">${topic}</button>`;
  });
  html += '</div>';

  // Pagination
  html += '<div style="margin-top: 10px; text-align: center;">';
  if (currentPage > 0) {
    html += '<button onclick="changePage(-1)">Previous</button>';
  }
  html += ` Page ${currentPage + 1} `;
  if (end < trendingTopics.length) {
    html += '<button onclick="changePage(1)">Next</button>';
  }
  html += '</div>';

  container.innerHTML = html;

  // Add event listeners to topic buttons
  document.querySelectorAll('.topic-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const topic = this.getAttribute('data-topic');
      searchTopic(topic);
    });
  });
}

function changePage(delta) {
  currentPage += delta;
  displayTrendingTopics();
}

async function searchTopic(topic) {
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = '<p>Loading...</p>';

  try {
    const response = await fetch('http://localhost:5000/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: topic, search_mode: 'trending' })
    });

    const data = await response.json();
    displayResults(data);
  } catch (error) {
    resultsDiv.innerHTML = `<p>Error: ${error.message}</p>`;
  }
}

async function search() {
    const query = document.getElementById('query').value;
    const searchMode = document.getElementById('search_mode').value;
    const resultsDiv = document.getElementById('results');

    // Final validation
    if (!validationRules[searchMode](query)) {
        resultsDiv.innerHTML = '<p>Please enter a valid input.</p>';
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

        const data = await response.json();
        displayResults(data);
    } catch (error) {
        resultsDiv.innerHTML = `<p>Error: ${error.message}. Make sure the backend is running on localhost:5000.</p>`;
    }
}

function displayResults(data) {
  const resultsDiv = document.getElementById('results');

  if (data.message) {
    resultsDiv.innerHTML = `<p>${data.message}</p>`;
    return;
  }

  if (data.error) {
    resultsDiv.innerHTML = `<p>Error: ${data.error}</p>`;
    return;
  }

  let html = `<div class="summary">
      <strong>Overall Sentiment:</strong> ${data.summary.overall}<br>
      Positive: ${data.summary.positive}, Negative: ${data.summary.negative}, Neutral: ${data.summary.neutral}
  </div>`;

  html += '<h3>Sentiments:</h3>';
  data.sentiments.forEach(sentiment => {
    html += `<div class="tweet">
        <p>${sentiment.text}</p>
        <p class="sentiment">${sentiment.sentiment}</p>
    </div>`;
  });

  resultsDiv.innerHTML = html;
}

function openWebpage() {
  window.open('http://localhost:5000', '_blank');
}