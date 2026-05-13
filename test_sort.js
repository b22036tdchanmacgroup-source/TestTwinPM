const fs = require('fs');
const https = require('https');

const API_URL = 'https://script.google.com/macros/s/AKfycbzM7rN_1nxnVeu6B_mRZv48WoTD7w3C-JM1AskiHisbzrJLc80BgkNWnnTuXtpVK5SyjQ/exec';

https.get(API_URL, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    const allData = JSON.parse(body);
    let swGroups = {};
    let categoryOrder = [];
    let swOrder = [];

    allData.forEach(row => {
      let rawSw = row.depth1 || '기타';
      let category = '기타';
      let swName = rawSw;

      if (rawSw.includes(':')) {
        const parts = rawSw.split(':');
        category = parts[0].trim();
        swName = parts[1].trim();
      } else if (rawSw.includes('분야')) {
        category = rawSw.split('분야')[0].trim();
      }
      
      category = category.replace(/[\[\]]/g, '');
      row._swName = swName;

      if (!categoryOrder.includes(category)) {
        categoryOrder.push(category);
      }
      if (!swOrder.includes(swName)) {
        swOrder.push(swName);
      }

      if (!swGroups[swName]) {
        swGroups[swName] = { category: category };
      }
    });

    const categories = {};
    Object.keys(swGroups).forEach(swName => {
      const group = swGroups[swName];
      const cat = group.category;

      if (cat.includes('기획') || cat.includes('기획실') || cat.includes('총괄')) {
        return;
      }

      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(swName);
    });

    const sortedCategories = Object.keys(categories).sort((a, b) => {
      let idxA = categoryOrder.indexOf(a);
      let idxB = categoryOrder.indexOf(b);
      if (idxA === -1) idxA = 999;
      if (idxB === -1) idxB = 999;
      return idxA - idxB;
    });

    console.log("categoryOrder:", categoryOrder);
    console.log("sortedCategories:", sortedCategories);
  });
});
