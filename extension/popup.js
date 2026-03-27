let trendingTopics = [];
let currentPage = 0;
const topicsPerPage = 10;
let sentimentChartInstance = null; // Store chart instance

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

  // View all trending topics button
  document.getElementById('viewAllBtn').addEventListener('click', () => {
    window.open('http://localhost:5000/all-trending', '_blank');
  });
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
  const keywordHelper = document.getElementById('keywordHelper');
  const userHelper = document.getElementById('userHelper');

  queryInput.addEventListener('input', () => {
    const value = queryInput.value.trim();
    if (value.length > 0) {
      queryInput.classList.add('valid');
      queryInput.classList.remove('invalid');
      keywordHelper.className = 'input-helper success';
      keywordHelper.innerHTML = '✓ Ready to search for "' + escapeHtml(value) + '"';
    } else {
      queryInput.classList.remove('valid', 'invalid');
      keywordHelper.className = 'input-helper';
      keywordHelper.innerHTML = '💡 Try searching for trending topics, hashtags (#AI), or general keywords';
    }
  });

  userInput.addEventListener('input', () => {
    const value = userInput.value.trim();
    const isValid = /^@[a-zA-Z0-9_]+$/.test(value);
    
    if (isValid) {
      userInput.classList.add('valid');
      userInput.classList.remove('invalid');
      userHelper.className = 'input-helper success';
      userHelper.innerHTML = '✓ Valid username format';
    } else if (value.length > 0) {
      userInput.classList.add('invalid');
      userInput.classList.remove('valid');
      userHelper.className = 'input-helper error';
      userHelper.innerHTML = '✗ Username must start with @ and contain only letters, numbers, and underscores';
    } else {
      userInput.classList.remove('valid', 'invalid');
      userHelper.className = 'input-helper';
      userHelper.innerHTML = '💡 Enter a username starting with @ (e.g., @elonmusk)';
    }
  });
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

  const summary = data.summary || {};
  const tweets = data.tweets || [];
  const query = data.query || '';

  let html = '<div class="summary-box">';
  html += '<h2>Results for: ' + escapeHtml(query) + '</h2>';
  html += '<div class="sentiment-stats">';
  html += '<div class="stat positive">✓ Positive: ' + summary.positive + '</div>';
  html += '<div class="stat neutral">○ Neutral: ' + summary.neutral + '</div>';
  html += '<div class="stat negative">✗ Negative: ' + summary.negative + '</div>';
  html += '</div>';
  
  // Add chart container
  html += '<div class="chart-container">';
  html += '<div class="chart-title">Sentiment Distribution</div>';
  html += '<canvas id="sentimentChart" width="400" height="200"></canvas>';
  html += '</div>';
  
  html += '<div class="overall-sentiment ' + summary.overall + '">';
  html += 'Overall Sentiment: ' + summary.overall;
  html += '</div>';
  html += '</div>';

  if (tweets.length > 0) {
    html += '<div class="tweets-list">';
    tweets.forEach(tweet => {
      const sentimentLabel = tweet.sentiment.includes('Positive') ? 'Positive' :
                             tweet.sentiment.includes('Negative') ? 'Negative' : 'Neutral';
      html += '<div class="tweet-card">';
      // Only show user if it's not "unknown"
      if (tweet.user && tweet.user !== 'unknown') {
        html += '<div class="tweet-user">@' + escapeHtml(tweet.user) + '</div>';
      }
      html += '<div class="tweet-text">' + escapeHtml(tweet.text) + '</div>';
      html += '<span class="tweet-sentiment ' + sentimentLabel + '">' + sentimentLabel + '</span>';
      html += '</div>';
    });
    html += '</div>';
  }

  resultsDiv.innerHTML = html;
  
  // Create the bar chart
  createSentimentChart(summary);
}

function createSentimentChart(summary) {
  // Destroy previous chart if it exists
  if (sentimentChartInstance) {
    sentimentChartInstance.destroy();
  }
  
  const ctx = document.getElementById('sentimentChart');
  if (!ctx) return;
  
  sentimentChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Positive', 'Neutral', 'Negative'],
      datasets: [{
        label: 'Number of Posts',
        data: [summary.positive, summary.neutral, summary.negative],
        backgroundColor: [
          'rgba(40, 167, 69, 0.8)',    // Green for positive
          'rgba(255, 193, 7, 0.8)',     // Yellow for neutral
          'rgba(220, 53, 69, 0.8)'      // Red for negative
        ],
        borderColor: [
          'rgba(40, 167, 69, 1)',
          'rgba(255, 193, 7, 1)',
          'rgba(220, 53, 69, 1)'
        ],
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: 12,
          titleFont: {
            size: 14,
            weight: 'bold'
          },
          bodyFont: {
            size: 13
          },
          borderColor: 'rgba(255, 255, 255, 0.2)',
          borderWidth: 1,
          displayColors: false,
          callbacks: {
            label: function(context) {
              const total = summary.positive + summary.neutral + summary.negative;
              const percentage = ((context.parsed.y / total) * 100).toFixed(1);
              return context.parsed.y + ' posts (' + percentage + '%)';
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
            font: {
              size: 11
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          ticks: {
            font: {
              size: 11,
              weight: '600'
            }
          },
          grid: {
            display: false
          }
        }
      }
    }
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}