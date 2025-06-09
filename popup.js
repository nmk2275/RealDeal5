// Initialize popup
document.addEventListener('DOMContentLoaded', () => {
  const statusMessages = document.getElementById('status-messages');
  const chartContainer = document.getElementById('chartContainer');

  const addStatusMessage = (message) => {
    const div = document.createElement('div');
    div.textContent = message;
    statusMessages.appendChild(div);
  };

  addStatusMessage('✔️ Extension is active');
  addStatusMessage('✔️ Ready to analyze products');

  // Dynamically load PriceData.js
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('PriceData.js');
  document.head.appendChild(script);

  script.onload = () => {
    console.log('[RealDeal] PriceData.js loaded successfully.');

    // Listen for product ID from content script
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'PRODUCT_ID') {
        const productId = message.productId;
        console.log(`[RealDeal] Received Product ID: ${productId}`);

        // Fetch price data for the product
        const productData = productPriceData[productId];
        if (!productData) {
          console.error(`[RealDeal] No price data found for product: ${productId}`);
          chartContainer.innerHTML = `<p style="color: red;">No price data available for this product.</p>`;
          return;
        }

        const { name, prices } = productData;
        const priceValues = prices.map(row => row.price);
        const labels = prices.map(row => row.month);

        // Load Highcharts locally
        const highchartsScript = document.createElement('script');
        highchartsScript.src = chrome.runtime.getURL('libs/highcharts.js');
        document.head.appendChild(highchartsScript);

        highchartsScript.onload = () => {
          Highcharts.chart(chartContainer, {
            chart: { type: 'line' },
            title: { text: `Price History for ${name}` },
            xAxis: { categories: labels, title: { text: 'Months' } },
            yAxis: { title: { text: 'Price (₹)' } },
            series: [{ name: 'Price', data: priceValues, color: '#1976d2' }],
            tooltip: { valuePrefix: '₹' }
          });
        };

        highchartsScript.onerror = () => {
          console.error('[RealDeal] Error loading Highcharts locally.');
        };
      }
    });

    // Default message if no product ID is received
    addStatusMessage('⚠️ Waiting for product data...');
  };

  script.onerror = () => {
    console.error('[RealDeal] Error loading PriceData.js.');
  };
});

const sendProductIdToPopup = () => {
  const productId = getProductIdentifier(); // Extract product ID
  if (productId) {
    chrome.runtime.sendMessage({ type: 'PRODUCT_ID', productId });
    console.log(`[RealDeal] Sent Product ID to popup: ${productId}`);
  } else {
    console.error('[RealDeal] No product identifier found.');
  }
};

// Call this function when the extension initializes
document.addEventListener('DOMContentLoaded', () => {
  sendProductIdToPopup();
});