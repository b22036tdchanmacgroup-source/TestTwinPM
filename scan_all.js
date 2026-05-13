const XLSX = require('xlsx');
const workbook = XLSX.readFile('SW 분류 및 폴더 체계.xlsx');
const worksheet = workbook.Sheets['SW 분류 및 폴더 유형'];
const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

data.forEach((row, i) => {
    if (row[6] || row[7]) {
        console.log(`Row ${i}: F=${row[5]}, G=${row[6]}, H=${row[7]}`);
    }
});
