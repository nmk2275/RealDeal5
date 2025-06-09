// RealDeal Chrome Extension - Content Script
// Version 1.1 - Complete Fixes
// =============================================
// STYLES
// =============================================
const addStyles = () => {
  const style = document.createElement('style');
  style.textContent = `
    /* Sidebar Styles */
    #realdeal-sidebar {
      position: fixed;
      top: 80px;
      right: 0;
      width: 60px;
      background: rgb(98, 171, 243);
      border-radius: 0 12px 12px 0;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 8px 0;
    }
    .sidebar-btn {
      background: none;
      border: none;
      color: #fff;
      width: 48px;
      height: 48px;
      margin: 6px 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border-radius: 50%;
      transition: background 0.2s;
      font-size: 18px;
    }
    .sidebar-btn:hover {
      background: #1565c0;
    }
    .icon {
      font-size: 22px;
      margin-bottom: 2px;
    }
    .label {
      font-size: 10px;
      font-weight: 500;
      line-height: 1;
    }

    /* Panel Styles */
    #realdeal-price-panel {
      position: fixed;
      top: 100px;
      right: 70px;
      width: 350px;
      height: 550px; /* Added height */
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 16px rgba(0,0,0,0.18);
      z-index: 100000;
      padding: 16px;
      border: 1px solid #1976d2;
      display: none;
    }
    #rd-panel-header {
      font-weight: bold;
      color: #1976d2;
      margin-bottom: 8px;
      font-size: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    #rd-panel-close {
      background: none;
      border: none;
      color: #1976d2;
      font-size: 18px;
      cursor: pointer;
    }
    #loadingIndicator {
      text-align: center;
      padding: 20px;
      display: none;
    }
    #priceChartContainer {
      width: 100%;
      height: 450px;
    }

    /* Seller Panel Styles */
    #realdeal-seller-panel {
      position: fixed;
      top: 100px;
      right: 70px;
      width: 350px;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 16px rgba(0,0,0,0.18);
      z-index: 100000;
      padding: 16px;
      border: 1px solid #1976d2;
      display: none;
    }
    #seller-panel-header {
      font-weight: bold;
      color: #1976d2;
      margin-bottom: 8px;
      font-size: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    #seller-panel-close {
      background: none;
      border: none;
      color: #1976d2;
      font-size: 18px;
      cursor: pointer;
    }

    /* Reviews Panel Styles */
    #realdeal-reviews-panel {
      position: fixed;
      top: 100px;
      right: 70px;
      width: 350px;
      height: 250px;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 16px rgba(0,0,0,0.18);
      z-index: 100000;
      padding: 16px;
      border: 1px solid #1976d2;
      display: none;
    }
    #reviews-panel-header {
      font-weight: bold;
      color: #1976d2;
      margin-bottom: 8px;
      font-size: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    #reviews-panel-close {
      background: none;
      border: none;
      color: #1976d2;
      font-size: 18px;
      cursor: pointer;
    }
    #reviewsContainer {
      max-height: 400px;
      overflow-y: auto;
      margin-top: 8px;
    }
    .review {
      border-bottom: 1px solid #eee;
      padding: 8px 0;
    }
    .review:last-child {
      border-bottom: none;
    }
    .review-author {
      font-weight: bold;
      color: #333;
    }
    .review-rating {
      color: #f39c12;
    }
    .review-text {
      margin: 4px 0;
      color: #555;
    }
  `;
  document.head.appendChild(style);
};

// =============================================
// UI COMPONENTS
// =============================================
const createSidebar = () => {
  const sidebar = document.createElement('div');
  sidebar.id = 'realdeal-sidebar';
  sidebar.innerHTML = `
    <button class="sidebar-btn" id="price-history-btn" title="Price History">
      <span class="icon">📈</span>
      <span class="label">Price History</span>
    </button>
    <button class="sidebar-btn" id="reviews-auth-btn" title="Reviews Authenticity">
      <span class="icon">⭐</span>
      <span class="label">Reviews Authenticity</span>
    </button>
    <button class="sidebar-btn" id="seller-rep-btn" title="Seller Reputation">
      <span class="icon">📦</span>
      <span class="label">Seller details</span>
    </button>
    <button class="sidebar-btn" id="realdeal-meter-btn" title="RealDeal Meter">
      <span class="icon">✅</span>
      <span class="label">RealDeal Meter</span>
    </button>
  `;
  document.body.appendChild(sidebar);
  return sidebar;
};

const createPricePanel = () => {
  const panel = document.createElement('div');
  panel.id = 'realdeal-price-panel';
  panel.innerHTML = `
    <div id="rd-panel-header">
      <span>Price History</span>
      <button id="rd-panel-close">✖</button>
    </div>
    <div id="priceChartContainer"></div>
    <div id="loadingIndicator">Loading price data...</div>
  `;
  document.body.appendChild(panel);
  return panel;
};

const createSellerPanel = () => {
  const panel = document.createElement('div');
  panel.id = 'realdeal-seller-panel';
  panel.innerHTML = `
    <div id="seller-panel-header">
      <span>Seller Reputation</span>
      <button id="seller-panel-close">✖</button>
    </div>
    <div id="sellerDetailsContainer">
      <p>Loading seller details...</p>
    </div>
  `;
  document.body.appendChild(panel);
  return panel;
};

const createReviewsPanel = () => {
  const panel = document.createElement('div');
  panel.id = 'realdeal-reviews-panel';
  panel.innerHTML = `
    <div id="reviews-panel-header">
      <span>Reviews Authenticity</span>
      <button id="reviews-panel-close">✖</button>
    </div>
    <div id="reviewsContainer">
      <p>Loading reviews...</p>
    </div>
  `;
  document.body.appendChild(panel);
  return panel;
};

const createRealDealMeterPanel = () => {
  const panel = document.createElement('div');
  panel.id = 'realdeal-meter-panel';
  panel.style.position = 'fixed';
  panel.style.top = '100px';
  panel.style.right = '70px';
  panel.style.width = '350px';
  panel.style.background = '#fff';
  panel.style.borderRadius = '8px';
  panel.style.boxShadow = '0 2px 16px rgba(0,0,0,0.18)';
  panel.style.zIndex = '100000';
  panel.style.padding = '16px';
  panel.style.border = '1px solid #1976d2';
  panel.style.display = 'none';
  panel.innerHTML = `
    <div id="realdeal-meter-header" style="display:flex; justify-content:space-between; align-items:center;">
      <span style="font-weight:bold; color:#1976d2;">RealDeal Meter</span>
      <button id="realdeal-meter-close" style="background:none; border:none; color:#1976d2; font-size:18px; cursor:pointer;">✖</button>
    </div>
    <div id="realdealMeterContainer" style="margin-top:10px;">
      <p>Loading RealDeal insights...</p>
    </div>
  `;
  document.body.appendChild(panel);
  return panel;
};

// Function to render seller details in the panel
const renderSellerDetails = async (panel) => {
  const container = document.getElementById('sellerDetailsContainer');
  container.innerHTML = `<p>Loading seller details...</p>`;

  const sellerDetails = await window.RealDeal.scrapeSellerDetails();
  container.innerHTML = `
    <h3>Seller Details</h3>
    <p><strong>Name:</strong> ${sellerDetails.name}</p>
    <p><strong>Address:</strong> ${sellerDetails.address}</p>
    <p><strong>Rating:</strong> ${sellerDetails.rating}</p>
  `;
};

// Function to render reviews in the panel
const renderReviews = async (panel) => {
  const container = document.getElementById('reviewsContainer');
  container.innerHTML = `<p>Loading reviews...</p>`;

  const reviews = await window.RealDeal.scrapeReviews();
  container.innerHTML = reviews.map(review => `
    <div class="review">
      <div class="review-author">${review.author}</div>
      <div class="review-rating">Rating: ${review.rating}</div>
      <div class="review-text">${review.text}</div>
    </div>
  `).join('');
};

// Function to set up the Seller Reputation feature
const setupSellerReputation = (panel) => {
  const sellerRepBtn = document.getElementById('seller-rep-btn');
  const closeBtn = document.getElementById('seller-panel-close');

  if (sellerRepBtn && closeBtn) {
    sellerRepBtn.addEventListener('click', () => {
      console.log('[RealDeal] Seller Reputation button clicked');
      panel.style.display = 'block';
      renderSellerDetails(panel);
    });

    closeBtn.addEventListener('click', () => {
      panel.style.display = 'none';
    });
  }
};

// Function to set up the Price History feature
const setupPriceHistory = (panel) => {
  const priceHistoryBtn = document.getElementById('price-history-btn');
  const closeBtn = document.getElementById('rd-panel-close');

  if (priceHistoryBtn && closeBtn) {
    priceHistoryBtn.addEventListener('click', () => {
      console.log('[RealDeal] Price History button clicked');
      panel.style.display = 'block';

      // Example: Extract productId from the URL or another source
      const productId = getProductIdentifier(); // Ensure this function exists and works
      console.log(`[RealDeal] Product ID: ${productId}`);
      console.log('[RealDeal] Extracted Product ID:', getProductIdentifier());

      if (productId) {
        renderPriceTable(panel, productId);
      } else {
        console.error('[RealDeal] Product ID not found.');
        const container = document.getElementById('priceChartContainer');
        container.innerHTML = `<p style="color: red;">Unable to fetch product data. Please try again.</p>`;
      }
    });

    closeBtn.addEventListener('click', () => {
      panel.style.display = 'none';
    });
  }
};

// Function to set up the Reviews Authenticity feature
const setupReviewsAuthenticity = (panel) => {
  const reviewsAuthBtn = document.getElementById('reviews-auth-btn'); // Button to trigger reviews analysis
  const closeBtn = document.getElementById('reviews-panel-close'); // Button to close the reviews panel

  if (reviewsAuthBtn && closeBtn) {
    reviewsAuthBtn.addEventListener('click', () => {
      console.log('[RealDeal] Reviews Authenticity button clicked');
      panel.style.display = 'block';
      window.RealDeal.renderReviews(panel); // Call the renderReviews function from ReviewsAuthenticity.js
    });

    closeBtn.addEventListener('click', () => {
      panel.style.display = 'none';
    });
  }
};

// Function to set up the RealDeal Meter feature
const setupRealDealMeter = (panel) => {
  const meterBtn = document.getElementById('realdeal-meter-btn'); // Button to open the RealDeal Meter
  const closeBtn = document.getElementById('realdeal-meter-close'); // Button to close the RealDeal Meter

  if (meterBtn && closeBtn) {
    meterBtn.addEventListener('click', () => {
      console.log('[RealDeal] RealDeal Meter button clicked');
      panel.style.display = 'block';
      window.renderRealDealInsights(panel); // Call the function from RealDealmeter.js
    });

    closeBtn.addEventListener('click', () => {
      panel.style.display = 'none';
    });
  }
};

// =============================================
// PRICE TABLE FUNCTIONALITY
// =============================================
const renderPriceTable = (panel, productId) => {
  return new Promise((resolve) => {
    console.log(`[RealDeal] Rendering price table for Product ID: ${productId}`); // Debugging

    const productData = productPriceData[productId];
    if (!productData) {
      console.error(`[RealDeal] No price data found for product: ${productId}`);
      const container = document.getElementById('priceChartContainer');
      container.innerHTML = `<p style="color: red;">No price data available for this product.</p>`;
      resolve();
      return;
    }

    const { name, prices } = productData; // Access name and prices
    console.log(`[RealDeal] Product Data:`, productData); // Debugging

    const container = document.getElementById('priceChartContainer');
    container.innerHTML = ''; // Clear old content
    container.style.display = 'block';

    // Display product name
    const productName = document.createElement('h3');
    productName.textContent = name;
    productName.style.textAlign = 'center';
    container.appendChild(productName);

    // Generate the table
    const table = document.createElement('table');
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.innerHTML = `
      <thead>
        <tr>
          <th style="border: 1px solid #ddd; padding: 8px;">Month</th>
          <th style="border: 1px solid #ddd; padding: 8px;">Price (₹)</th>
        </tr>
      </thead>
      <tbody>
        ${prices.map(row => `
          <tr>
            <td style="border: 1px solid #ddd; padding: 8px;">${row.month}</td>
            <td style="border: 1px solid #ddd; padding: 8px;">${row.price}</td>
          </tr>
        `).join('')}
      </tbody>
    `;

    container.appendChild(table);

    // Calculate highest, lowest, and average price
    const priceValues = prices.map(row => row.price);
    const highestPrice = Math.max(...priceValues);
    const lowestPrice = Math.min(...priceValues);
    const averagePrice = (priceValues.reduce((sum, price) => sum + price, 0) / priceValues.length).toFixed(2);

    // Create a summary section
    const summary = document.createElement('div');
    summary.style.marginTop = '20px';
    summary.style.fontSize = '14px';
    summary.innerHTML = `
      <p><strong>Highest Price:</strong> ₹${highestPrice}</p>
      <p><strong>Lowest Price:</strong> ₹${lowestPrice}</p>
      <p><strong>Average Price:</strong> ₹${averagePrice}</p>
    `;

    container.appendChild(summary);

    document.getElementById('loadingIndicator').style.display = 'none';
    resolve();
  });
};

const getProductIdentifier = () => {
  const url = window.location.href;

  // Check for Meesho product ID
  if (url.includes('meesho.com')) {
    const match = url.match(/\/p\/([^/]+)/); // Extract product ID from Meesho URL
    return match ? match[1] : null;
  }

  // Check for Amazon product ID
  if (url.includes('amazon.in')) {
    const match = url.match(/\/dp\/([^/]+)/); // Extract product ID from Amazon URL
    return match ? match[1] : null;
  }

  // Check for Flipkart product ID
  if (url.includes('flipkart.com')) {
    const match = url.match(/\/p\/([^?]+)/); // Extract product ID from Flipkart URL
    return match ? match[1] : null;
  }

  console.error('[RealDeal] Unsupported website.');
  return null;
};

// =============================================
// INITIALIZATION
// =============================================
const initRealDeal = () => {
  console.log('[RealDeal] Initializing extension...');

  // Add styles first
  addStyles();

  // Create UI components
  if (!document.getElementById('realdeal-sidebar')) {
    console.log('[RealDeal] Creating sidebar...');
    createSidebar();
  }

  const pricePanel = createPricePanel();
  const sellerPanel = createSellerPanel();
  const reviewsPanel = createReviewsPanel(); // Create the reviews panel
  const realDealMeterPanel = createRealDealMeterPanel(); // Create the RealDeal Meter panel

  // Set up functionality
  console.log('[RealDeal] Setting up Price History...');
  setupPriceHistory(pricePanel);

  console.log('[RealDeal] Setting up Seller Reputation...');
  window.RealDeal.setupSellerReputation(sellerPanel);

  console.log('[RealDeal] Setting up Reviews Authenticity...');
  setupReviewsAuthenticity(reviewsPanel); // Set up reviews authenticity

  console.log('[RealDeal] Setting up RealDeal Meter...');
  setupRealDealMeter(realDealMeterPanel); // Set up RealDeal Meter

  console.log('[RealDeal] Extension initialized successfully');
};

// Start the extension when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initRealDeal();
  });
} else {
  initRealDeal();
}

let currentProductId = getProductIdentifier();

const observer = new MutationObserver(() => {
  const newProductId = getProductIdentifier();
  if (newProductId && newProductId !== currentProductId) {
    console.log('[RealDeal] Product changed, updating RealDeal Meter.');
    currentProductId = newProductId;
    const panel = document.getElementById('realdeal-meter-panel');
    if (panel && panel.style.display === 'block') {
      window.renderRealDealInsights(panel);
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });

const checkRealDealMeterPanel = () => {
  const panel = document.getElementById('realdeal-meter-panel');
  if (!panel) {
    console.error('[RealDeal] RealDeal Meter panel not found.');
  }
};

checkRealDealMeterPanel();

