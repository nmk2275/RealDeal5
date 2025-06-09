// Create a global namespace if it doesn't exist
window.RealDeal = window.RealDeal || {};
console.log('[RealDeal] SellerReputation.js loaded and RealDeal namespace initialized.');

/* ---------- NEW utility ---------- */
function cleanSellerName(raw) {
  if (!raw) return '';
  return raw
    .replace(/c\/o/gi, '')          // remove "c/o"
    .replace(/meesho|amazon|flipkart|snapdeal/gi, 'bussiness') // remove platform tags
    .replace(/[^a-z0-9& ]+/gi, ' ') // drop punctuation
    .replace(/\s{2,}/g, ' ')        // collapse spaces
    .trim();
}

// Function to scrape seller details
window.RealDeal.scrapeSellerDetails = async () => {
  const sellerDetails = {};
  let infoOpenedByScript = false;
  let moreInfoButton = null;

  try {
    // Get reference to the "More Information" button
    moreInfoButton = document.querySelector('.sc-eDvSVe.guezwa.ProductDescription__MoreInfoCaption-sc-1l1jg0i-1');

    // Check if the "More Information" section is already visible
    const alreadyVisible = document.querySelector('.sc-eDvSVe.dfTWIc');
    if (!alreadyVisible && moreInfoButton) {
      moreInfoButton.click();
      infoOpenedByScript = true;
      console.log('[RealDeal] Clicked "More Information" button.');
      await window.RealDeal.waitForElement('.sc-eDvSVe.dfTWIc');
    }

    // Extract Supplier Name
    const getSupplierName = () => {
      const labels = document.querySelectorAll('.sc-eDvSVe.dfTWIc');
      for (let label of labels) {
        if (label.textContent.trim() === 'Supplier Information') {
          const supplierDiv = label.nextElementSibling?.querySelector('div');
          return supplierDiv ? supplierDiv.textContent.trim() : 'N/A';
        }
      }
      return 'N/A';
    };

    // Extract Seller Contact Info (Name and Address)
    const getSellerContactInfo = () => {
      const labels = document.querySelectorAll('.sc-eDvSVe.dfTWIc');
      for (let label of labels) {
        if (label.textContent.trim() === 'Contact Information') {
          const divs = label.nextElementSibling?.querySelectorAll('div') || [];

          let sellerName = 'N/A';
          let addressLines = [];
          let startCollecting = false;

          for (let div of divs) {
            const text = div.textContent.trim();
            if (text.startsWith('Seller Name -')) {
              sellerName = text.replace('Seller Name -', '').trim();
              startCollecting = true;
            } else if (startCollecting) {
              if (text.startsWith('PID -') || text.includes('Seller Mailbox') || text.toLowerCase().includes('contact seller')) {
                continue;
              }
              if (text.match(/\d{3,}/) || text.includes(',') || text.includes('Road') || text.includes('Park') || text.includes('Bengaluru')) {
                addressLines.push(text);
              }
            }
          }

          return {
            sellerName,
            address: addressLines.join(', ')
          };
        }
      }

      return { sellerName: 'N/A', address: 'N/A' };
    };

    // Extract Seller Rating
    const getSellerRating = () => {
      const ratingElement = document.querySelector('.sc-eDvSVe.jkpPSq'); // Selector for the rating span
      return ratingElement ? ratingElement.textContent.trim() : 'N/A';
    };

    // Final assignment
    const contactInfo = getSellerContactInfo();
    sellerDetails.name = getSupplierName();
    sellerDetails.address = contactInfo.address;
    sellerDetails.rating = getSellerRating();

    // Verify Seller Online
    sellerDetails.verification = await window.RealDeal.verifySeller(sellerDetails.name);

    console.log('[RealDeal] Extracted Seller Details:', sellerDetails);

  } catch (error) {
    console.warn('[RealDeal] Error scraping seller details:', error);
    sellerDetails.name = 'N/A';
    sellerDetails.address = 'N/A';
    sellerDetails.rating = 'N/A';
    sellerDetails.verification = 'Error';
  }

  // Close the "More Information" section if we opened it
  if (infoOpenedByScript && moreInfoButton) {
    moreInfoButton.click();
    console.log('[RealDeal] Closed "More Information" section.');
  }

  return sellerDetails;
};

// Helper function to wait for an element to appear in the DOM
window.RealDeal.waitForElement = (selector, timeout = 5000) => {
  return new Promise((resolve, reject) => {
    const interval = 100; // Check every 100ms
    let elapsedTime = 0;

    const checkElement = () => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
      } else if (elapsedTime >= timeout) {
        reject(new Error(`Element with selector "${selector}" not found within ${timeout}ms`));
      } else {
        elapsedTime += interval;
        setTimeout(checkElement, interval);
      }
    };

    checkElement();
  });
};

// Function to set up the Seller Reputation feature
window.RealDeal.setupSellerReputation = (panel) => {
  const sellerRepBtn = document.getElementById('seller-rep-btn');
  const closeBtn = document.getElementById('seller-panel-close');

  if (sellerRepBtn && closeBtn) {
    sellerRepBtn.addEventListener('click', () => {
      console.log('[RealDeal] Seller Reputation button clicked');
      panel.style.display = 'block';
      window.RealDeal.renderSellerDetails(panel);
    });

    closeBtn.addEventListener('click', () => {
      panel.style.display = 'none';
    });
  }
};

// Function to render seller details in the panel
window.RealDeal.renderSellerDetails = async (panel) => {
  const container = document.getElementById('sellerDetailsContainer');
  container.innerHTML = `<p>Loading seller details...</p>`;

  const sellerDetails = await window.RealDeal.scrapeSellerDetails();
  container.innerHTML = `
    <h3>Seller Details</h3>
    <p><strong>Name:</strong> ${sellerDetails.name}</p>
    <p><strong>Address:</strong> ${sellerDetails.address}</p>
    <p><strong>Rating:</strong> ${sellerDetails.rating}</p>
    <p><strong>Verification:</strong> ${sellerDetails.verification}</p>
  `;
};

// Function to verify seller using Google Custom Search
window.RealDeal.verifySeller = async (rawName) => {
  const sellerName = cleanSellerName(rawName);
  if (!sellerName || sellerName.length < 3) return 'Unverified'; // Reject short or invalid names

  const apiKey = 'AIzaSyCCCMgVBWYlq2WfMe-DXCsxYhyKMEDh4AI'; // Your API Key
  const cx = '0210f1e3f09a441d4'; // Your Custom Search Engine ID
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(sellerName)}`;

  // Approved domains and business-related keywords
  const approvedDomains = [
    'indiamart', 'amazon', 'flipkart', 'snapdeal',
    'myntra', 'ajio', 'shopify', 'etsy', 'justdial', 'linkedin'
  ];

  const bizKeywords = [
    'private limited', 'pvt ltd', 'company', 'firm',
    'retail', 'wholesale', 'manufacturer', 'supplier',
    'seller', 'store', 'shop', 'buy', 'official'
  ];

  // Helper function to check if a domain contains at least two significant words from the seller name
  const ownDomainMatch = (host, nameTokens) => {
    let hits = 0;
    for (const tok of nameTokens) {
      if (tok.length >= 4 && host.includes(tok)) hits++;
    }
    return hits >= 2; // Require at least 2 token matches to trust
  };

  try {
    const r = await fetch(url);
    const res = await r.json();
    if (!(res.items && res.items.length)) return 'Unverified'; // No results found

    // Tokenize seller name once
    const tokens = sellerName.toLowerCase().split(/\s+/);

    let verified = false;

    for (const item of res.items) {
      const link = (item.link || '').toLowerCase();
      const snippet = `${item.title || ''} ${item.snippet || ''}`.toLowerCase();

      /* --- Path A: Seller’s Own Site --- */
      try {
        const host = new URL(link).hostname.replace(/^www\./, '');
        if (ownDomainMatch(host, tokens)) {
          verified = true;
          break;
        }
      } catch (_) {
        /* Ignore bad URLs */
      }

      /* --- Path B: Marketplace / Directory Hit --- */
      const domainOK = approvedDomains.some(d => link.includes(d));
      const keywordOK = bizKeywords.some(k => snippet.includes(k));
      if (domainOK && keywordOK) {
        verified = true;
        break;
      }
    }

    return verified ? 'Verified' : 'Unverified';

  } catch (err) {
    console.error('[RealDeal] verifySeller error:', err);
    return 'Error'; // Handle API errors gracefully
  }
};