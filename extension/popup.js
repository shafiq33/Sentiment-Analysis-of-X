let trendingTopics = [];
let currentPage = 0;
const topicsPerPage = 10;

document.addEventListener('DOMContentLoaded', function() {
  loadTrendingTopics();
  setupValidation();
  setupEventListeners();
});

function setupEventListeners() {
  // Tab switching
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function() {
      const tabName = this.getAttribute('data-tab');
      switchTab(tabName, this);
    });
  });

  // Search buttons
  document.getElementById('searchBtn').addEventListener('click', () => search('keyword'));
  document.getElementById('userSearchBtn').addEventListener('click', () => search('user_tag'));

  // Pagination buttons
  document.getElementById('prevBtn').addEventListener('click', () => changePage(-1));
  document.getElementById('nextBtn').addEventListener('click', () => changePage(1));
}

function switchTab(tabName, clickedTab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

  clickedTab.classList.add('active');
  document.getElementById(tabName).classList.add('active');

  if (tabName === 'trending') {
    displayTrendingTopics();
  }
}

function setupValidation() {
  const queryInput = document.getElementById('query');
  const userInput = document.getElementById('userQuery');

  queryInput.addEventListener('input', () => validateInput(queryInput, 'keyword'));
  userInput.addEventListener('input', () => validateInput(userInput, 'user_tag'));
}

function validateInput(input, mode) {
  const value = input.value.trim();
  const isValid = mode === 'keyword' ? value.length > 0 : /^@[a-zA-Z0-9_]+$/.test(value);

  input.classList.toggle('valid', isValid);
  input.classList.toggle('invalid', !isValid && value.length > 0);
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

  container.innerHTML = topics.map(topic =>
    `<button class="topic-btn" data-topic="${topic}">${topic}</button>`
  ).join('');

  // Add event listeners to topic buttons
  container.querySelectorAll('.topic-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const topic = this.getAttribute('data-topic');
      searchTopic(topic);
    });
  });

  updatePagination();
}

function updatePagination() {
  const totalPages = Math.ceil(trendingTopics.length / topicsPerPage);
  document.getElementById('pageInfo').textContent = `Page ${currentPage + 1} of ${totalPages}`;
  document.getElementById('prevBtn').disabled = currentPage === 0;
  document.getElementById('nextBtn').disabled = currentPage >= totalPages - 1;
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

async function search(mode) {
  const query = mode === 'user_tag' ? document.getElementById('userQuery').value : document.getElementById('query').value;
  const resultsDiv = document.getElementById('results');

  if (!query.trim()) {
    resultsDiv.innerHTML = '<p>Please enter a search term.</p>';
    return;
  }

  resultsDiv.innerHTML = '<p>Loading...</p>';

  try {
    const response = await fetch('http://localhost:5000/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, search_mode: mode })
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

  html += '<h3>Analysis Results:</h3>';
  data.sentiments.forEach(sentiment => {
    html += `<div class="tweet">
        <p>${sentiment.text}</p>
        <p class="sentiment">${sentiment.sentiment}</p>
    </div>`;
  });

  resultsDiv.innerHTML = html;
}