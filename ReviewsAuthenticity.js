// Namespace for Reviews Authenticity
window.RealDeal = window.RealDeal || {};

/* ---------- Helper: Wait for Element ---------- */
const waitForElement = (selector, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const interval = 100;
    let elapsed = 0;

    const check = () => {
      const el = document.querySelector(selector);
      if (el) return resolve(el);
      if (elapsed >= timeout) return reject(`Timeout waiting for: ${selector}`);
      elapsed += interval;
      setTimeout(check, interval);
    };

    check();
  });
};

/* ---------- Scrape Overall Rating and Counts ---------- */
window.RealDeal.scrapeOverallRating = () => {
  const rating = document.querySelector('.sc-eDvSVe.cdZTwf')?.textContent.trim() || 'N/A';
  const ratingsCount = document.querySelectorAll('.sc-eDvSVe.XndEO')[0]?.textContent.match(/(\d+)\s+Ratings/)?.[1] || '0';
  const reviewsCount = document.querySelectorAll('.sc-eDvSVe.XndEO')[1]?.textContent.match(/(\d+)\s+Reviews/)?.[1] || '0';

  return { rating, ratingsCount, reviewsCount };
};

/* ---------- Scrape Unique Valid Reviews ---------- */
// Cache for storing scraped reviews
let lastProductId = null;
let cachedReviews = null;

window.RealDeal.scrapeReviews = async () => {
  // Get a unique product identifier from DOM (adjust selector as needed)
  const productTitle = document.querySelector('h1')?.textContent.trim() || 'unknown-product';

  // If the product has changed, invalidate the cache
  if (lastProductId !== productTitle) {
    console.log('[RealDeal] Product changed. Clearing previous review cache.');
    lastProductId = productTitle;
    cachedReviews = null;
  }

  if (cachedReviews) {
    console.log('[RealDeal] Returning cached reviews for product:', productTitle);
    return cachedReviews;
  }

  const reviewMap = new Map();

  // Step 1: Open "View All Reviews"
  const viewAllBtn = document.querySelector('.sc-eDvSVe.fMCXww.sc-jrcTuL.cqTYLr');
  if (viewAllBtn) {
    console.log('[RealDeal] Clicking "View All Reviews"...');
    viewAllBtn.click();
    await waitForElement('[class*="RatingReviewDrawer__StyledCard-sc-y5ksev-1"]');
    await new Promise(res => setTimeout(res, 500));
  }

  // Step 2: Load all reviews
  let previousCount = 0;
  let iterationCount = 0; // Counter to limit the number of iterations
  const maxIterations = 20; // Maximum number of iterations

  while (iterationCount < maxIterations) {
    const viewMoreBtn = [...document.querySelectorAll('button')].find(btn =>
      btn.textContent.trim().toLowerCase().includes('view more')
    );
    if (!viewMoreBtn) break;

    viewMoreBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    try {
      viewMoreBtn.click();
    } catch (err) {
      break;
    }

    await new Promise(res => setTimeout(res, 500));
    const currentCount = document.querySelectorAll('div.sc-iBYQkv.fCRAHG').length;
    if (currentCount === previousCount) break;
    previousCount = currentCount;

    iterationCount++; // Increment the counter
  }

  if (iterationCount >= maxIterations) {
    console.warn('[RealDeal] Stopped loading reviews after reaching the maximum iteration limit.');
  }

  // Step 3: Scrape reviews
  const allNodes = document.querySelectorAll('div.sc-iBYQkv.fCRAHG');
  const reviewElements = [...allNodes].filter(el =>
    el.querySelector('.sc-eDvSVe.dugLmN') && el.querySelector('.sc-eDvSVe.gUjMRV')
  );

  reviewElements.forEach(el => {
    try {
      const text = el.querySelector('.sc-eDvSVe.gUjMRV')?.textContent.trim() || 'No review text';
      const rating = parseFloat(el.querySelector('.sc-jOiSOi span')?.textContent.trim()) || 0;
      const username = el.querySelector('.sc-eDvSVe.dugLmN')?.textContent.trim() || 'Anonymous';
      const date = el.querySelector('.sc-eDvSVe.XndEO')?.textContent.trim() || 'Unknown date';

      const key = `${username.toLowerCase()}::${text.toLowerCase()}`;
      if (reviewMap.has(key)) {
        reviewMap.get(key).count += 1;
      } else {
        reviewMap.set(key, { username, text, rating, date, count: 1 });
      }
    } catch (err) {
      console.warn('[RealDeal] Error processing review:', err);
    }
  });

  const reviews = Array.from(reviewMap.values());
  console.log(`[RealDeal] Scraped ${reviews.length} unique reviews for: ${productTitle}`);

  cachedReviews = reviews; // Set new cache

  // Step 4: Close the "View All Reviews" drawer (Safe Dispatch Version)
  try {
    console.log('[RealDeal] Attempting to close the drawer...');

    const drawerSelector = 'div.Drawerstyled__ContentWrapper-sc-1ltfkrx-1.cWjHwD';
    const closeSvgSelector = 'div.Drawerstyled__HeaderTitleWrapper-sc-1ltfkrx-2.cuMGwa svg';

    await waitForElement(drawerSelector, 5000);
    await waitForElement(closeSvgSelector, 3000);

    const closeSvg = document.querySelector(closeSvgSelector);

    if (!closeSvg) {
      console.warn('[RealDeal] Close SVG not found.');
    }

    const closeBtn = closeSvg.closest('button');
    const target = closeBtn || closeSvg;

    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Dispatch real mouse click event
      const evt = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
      target.dispatchEvent(evt);

      console.log('[RealDeal] Dispatched native click to close the drawer.');
    } else {
      console.warn('[RealDeal] No valid clickable close element found.');
    }

  } catch (err) {
    console.warn('[RealDeal] Failed to close drawer:', err);
  }

  return reviews;
};

/* ---------- Analyze Reviews ---------- */
window.RealDeal.analyzeReviews = (reviews) => {
  if (!reviews || reviews.length === 0) {
    return {
      averageRating: 'N/A',
      fakeReviewCount: 0,
      totalReviews: 0,
      mostRecentReview: {
        text: 'No reviews available.',
        username: 'N/A',
        date: 'N/A'
      }
    };
  }

  let totalRating = 0;
  let totalReviews = 0;
  let fakeReviewCount = 0;

  // Helper function to parse dates
  const parseDate = (str) => {
    const match = str.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
    return match ? new Date(`${match[2]} ${match[1]}, ${match[3]}`) : new Date(0);
  };

  let mostRecentReview = null;

  // Process each review
  reviews.forEach(r => {
    totalRating += r.rating * r.count; // Weighted rating
    totalReviews += r.count; // Total number of reviews (including duplicates)
    if (r.count > 1) fakeReviewCount += r.count - 1; // Count duplicates as fake reviews

    // Find the most recent review
    if (!mostRecentReview || parseDate(r.date) > parseDate(mostRecentReview.date)) {
      mostRecentReview = r;
    }
  });

  const averageRating = (totalRating / totalReviews).toFixed(1); // Calculate average rating

  console.log(`Total reviews processed: ${totalReviews}`);
  console.log(`Fake reviews detected: ${fakeReviewCount}`);
  console.log(`Most recent review: ${mostRecentReview.text} by ${mostRecentReview.username} on ${mostRecentReview.date}`);

  return {
    averageRating,
    fakeReviewCount,
    totalReviews,
    mostRecentReview
  };
};

/* ---------- Render Final Output ---------- */
window.RealDeal.renderReviews = async (panel) => {
  const container = document.getElementById('reviewsContainer');
  container.innerHTML = `<p>Loading reviews...</p>`;

  const overallData = window.RealDeal.scrapeOverallRating();
  const reviews = await window.RealDeal.scrapeReviews(); // Uses cached data if available

  if (reviews.length === 0) {
    container.innerHTML = `
      <h3>Reviews Analysis</h3>
      <p><strong>Overall Rating:</strong> ${overallData.rating}</p>
      <p><strong>Number of Ratings:</strong> ${overallData.ratingsCount}</p>
      <p><strong>Number of Reviews:</strong> ${overallData.reviewsCount}</p>
      <p><strong>Fake Reviews Detected:</strong> 0</p>
      <p><strong>Most Recent Review:</strong> No reviews available.</p>
    `;
    return;
  }

  const analysis = window.RealDeal.analyzeReviews(reviews);

  container.innerHTML = `
    <h3>Reviews Analysis</h3>
    <p><strong>Overall Rating:</strong> ${overallData.rating}</p>
    <p><strong>Number of Ratings:</strong> ${overallData.ratingsCount}</p>
    <p><strong>Number of Reviews:</strong> ${overallData.reviewsCount}</p>
    <p><strong>Fake Reviews Detected:</strong> ${analysis.fakeReviewCount-2}</p>
    <p><strong>Most Recent Review:</strong> ${analysis.mostRecentReview.text} (by ${analysis.mostRecentReview.username} on ${analysis.mostRecentReview.date})</p>
  `;
};
