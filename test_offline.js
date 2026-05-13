const fs = require('fs');

const content = fs.readFileSync('C:/Users/admin/.gemini/antigravity/brain/f95ef582-a26b-4a1e-a36b-b00093849861/.system_generated/steps/28/content.md', 'utf8');
const lines = content.split('\n');
let jsonStr = '';
for(let i=0; i<lines.length; i++) {
  if (lines[i].startsWith('[')) {
    jsonStr = lines[i];
    break;
  }
}

const allData = JSON.parse(jsonStr);

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
  } else {
    if (swGroups[swName].category === '기타' && category !== '기타') {
      swGroups[swName].category = category;
    }
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

const sortedSwNames = (cat) => {
    return categories[cat].sort((a, b) => {
      let idxA = swOrder.indexOf(a);
      let idxB = swOrder.indexOf(b);
      return idxA - idxB;
    });
};

console.log("SW Order for 구조:", sortedSwNames('구조'));

