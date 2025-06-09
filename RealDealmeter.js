// =======================
// RealDealmeter.js (FINAL)
// =======================

// Function to render RealDeal insights
const renderRealDealInsights = async (panel) => {
  const container = document.getElementById('realdealMeterContainer');
  if (!container) {
    console.error('[RealDeal] RealDeal Meter container not found.');
    return;
  }

  container.innerHTML = `<p>Loading RealDeal insights...</p>`;

  try {
    const insights = await fetchRealDealInsights();

    if (insights.details.length === 0) {
      container.innerHTML = `<p>No insights available.</p>`;
      return;
    }

    // Render insights
    container.innerHTML = insights.details.map((insight, index) => `
      <div class="insight" style="opacity: 0; transform: translateY(10px); transition: all 0.5s ease ${index * 0.2}s; margin-bottom: 8px;">
        <p>${insight}</p>
      </div>
    `).join('');

    // Animate entries
    setTimeout(() => {
      const insightElements = container.querySelectorAll('.insight');
      insightElements.forEach(el => {
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
      });
    }, 100);

    // Add Animated Recommendation Bar
    const barContainer = document.createElement('div');
    let barColor = '';
    if (insights.label === 'Skip') barColor = 'red';
    else if (insights.label === 'Wait') barColor = 'orange';
    else if (insights.label === 'Okay') barColor = 'teal';
    else if (insights.label === 'Yes') barColor = 'green';

    barContainer.innerHTML = `
      <h3>Recommendation</h3>
      <div style="background: #ddd; border-radius: 25px; height: 20px; width: 100%; position: relative; overflow: hidden; margin-bottom: 8px;">
        <div id="progress-bar" style="background: ${barColor}; height: 100%; width: 0%; border-radius: 25px; transition: width 1s ease;"></div>
      </div>
      <div style="display: flex; justify-content: space-between; font-weight: bold; margin-top: 4px;">
        <span style="color: red;">Skip</span>
        <span style="color: orange;">Wait</span>
        <span style="color: teal;">Okay</span>
        <span style="color: green;">Yes</span>
      </div>
      <p style="margin-top: 8px; font-weight: bold; font-size: 16px;">Recommendation: ${insights.label}</p>
    `;

    container.appendChild(barContainer);

    // Animate the progress bar
    setTimeout(() => {
      document.getElementById('progress-bar').style.width = `${insights.percentage}%`;
    }, 100);

  } catch (err) {
    console.error('[RealDeal] Failed to load insights:', err);
    container.innerHTML = `<p style="color: red;">Failed to load insights. Please try again later.</p>`;
  }
};

// Function to fetch RealDeal insights
const fetchRealDealInsights = async () => {
  const seller = await window.RealDeal.scrapeSellerDetails();
  const reviews = await window.RealDeal.scrapeReviews();
  console.log(`[RealDeal] Reviews scraped: ${reviews.length}`);
  console.log(`[RealDeal] Reviews passed to analyzeReviews:`, reviews);
  const analysis = window.RealDeal.analyzeReviews(reviews);
  const productId = getProductIdentifier();
  const productData = productPriceData[productId];

  let insights = [];
  let score = 0;

  // 1. Return Policy Insight
  const returnPolicyElement = document.querySelector(
    'div.Marketing__TagCardStyled-sc-1ngqanf-1 span'
  );
  if (returnPolicyElement) {
    const returnPolicyText = returnPolicyElement.textContent.trim();
    insights.push(`✅ Product has a return policy`);
    score += 2;
  } else {
    insights.push('❌ No return policy information found.');
  }

  // 2. Price Comparison Insight
  if (productData) {
    const priceValues = productData.prices.map(row => row.price);
    const latestPrice = priceValues[priceValues.length - 1];
    const averagePrice =
      priceValues.reduce((sum, price) => sum + price, 0) / priceValues.length;

    if (latestPrice < averagePrice) {
      insights.push(`✅ The price is lower than the average price (${averagePrice.toFixed(2)}).`);
      score += 2;
    } else {
      insights.push(`⚠️ The price is higher than the average price (${averagePrice.toFixed(2)}).`);
    }
  } else {
    insights.push('ℹ️ No price history available for this product.');
  }

  // 3. Seller Verification Insight
  if (seller.verification === 'Verified') {
    insights.push('✅ The seller is verified and trustworthy.');
    score += 2;
  } else if (seller.verification === 'Unverified') {
    insights.push('⚠️ The seller is not verified. Proceed with caution.');
  } else {
    insights.push('❌ Seller verification failed or unavailable.');
  }

  // 4. Product Rating Insight
  if (parseFloat(analysis.averageRating) >= 4.0) {
    insights.push('✅ This product has a good average rating.');
    score += 2;
  } else {
    insights.push('⚠️ This product has a low average rating.');
  }

  // 5. Fake Reviews Insight
  const totalReviews = analysis.totalReviews || 0; // Ensure totalReviews is available
  const fakeReviewCount = analysis.fakeReviewCount || 0; // Ensure fakeReviewCount is available

  if (totalReviews === 0) {
    insights.push('ℹ️ No reviews available to analyze fake reviews.');
  } else if (fakeReviewCount < 10) {
    insights.push(`✅ Few fake reviews detected (${fakeReviewCount} fake reviews out of ${totalReviews} total reviews).`);
    score += 2;
  } else {
    insights.push(`⚠️ Multiple potential fake reviews detected (${fakeReviewCount} fake reviews out of ${totalReviews} total reviews).`);
  }

  // Calculate Recommendation
  let label = '';
  if (score <= 3) label = 'Skip';
  else if (score <= 6) label = 'Wait';
  else if (score <= 8) label = 'Okay';
  else label = 'Yes';

  let percentage = (score / 10) * 100;

  return { details: insights, score, percentage, label };
};

// Attach functions to the global window object for accessibility
window.renderRealDealInsights = renderRealDealInsights;
window.fetchRealDealInsights = fetchRealDealInsights;