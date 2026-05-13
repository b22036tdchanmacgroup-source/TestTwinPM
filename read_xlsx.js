const xlsx = require('xlsx');
const workbook = xlsx.readFile('SW 분류 및 폴더 체계.xlsx');
console.log('Sheet Names:');
console.log(workbook.SheetNames);
for (let sheetName of workbook.SheetNames) {
    console.log(`\n--- Sheet: ${sheetName} ---`);
    const sheet = workbook.Sheets[sheetName];
    const json = xlsx.utils.sheet_to_json(sheet, { defval: '' });
    console.log(JSON.stringify(json, null, 2));
}
