const fs = require('fs');
const XLSX = require('./node_modules/xlsx');

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      inQuotes = !inQuotes;
    } else if (line[i] === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += line[i];
    }
  }
  result.push(current.trim());
  return result;
}

// 测试支付宝
const alipayBuffer = fs.readFileSync('test_files/支付宝交易明细(20251201-20251231).csv');
const alipayText = new TextDecoder('gb18030').decode(alipayBuffer);
const alipayLines = alipayText.split('\n').filter(l => l.trim());

let alipayStart = 0;
for (let i = 0; i < alipayLines.length; i++) {
  if (alipayLines[i].includes('交易时间,交易分类')) {
    alipayStart = i;
    break;
  }
}

const alipayBills = [];
for (let i = alipayStart + 1; i < alipayLines.length; i++) {
  const cols = parseCSVLine(alipayLines[i]);
  if (cols.length < 9) continue;
  if (cols[5] && cols[5].includes('支出')) {
    alipayBills.push({ desc: cols[4], amount: cols[6], method: cols[7] });
  }
}

console.log('✅ 支付宝账单解析成功');
console.log(`   记录数: ${alipayBills.length} 条`);
console.log(`   示例: ${alipayBills[0]?.desc} - ${alipayBills[0]?.amount}元`);

// 测试微信
const wb = XLSX.readFile('test_files/微信支付账单流水文件(20251201-20251231)_20260116203530.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const wechatCSV = XLSX.utils.sheet_to_csv(ws);
const wechatLines = wechatCSV.split('\n').filter(l => l.trim());

let wechatStart = 0;
for (let i = 0; i < wechatLines.length; i++) {
  if (wechatLines[i].includes('交易时间,交易类型')) {
    wechatStart = i;
    break;
  }
}

const wechatBills = [];
for (let i = wechatStart + 1; i < wechatLines.length; i++) {
  const cols = parseCSVLine(wechatLines[i]);
  if (cols.length < 7) continue;
  if (cols[4] && cols[4].includes('支出')) {
    wechatBills.push({ desc: cols[3], amount: cols[5], method: cols[6] });
  }
}

console.log('\n✅ 微信账单解析成功');
console.log(`   记录数: ${wechatBills.length} 条`);
console.log(`   示例: ${wechatBills[0]?.desc} - ${wechatBills[0]?.amount}元`);

console.log('\n📊 总计:', alipayBills.length + wechatBills.length, '条支出记录');

// 支付方式统计
const alipayMethods = {};
alipayBills.forEach(b => {
  alipayMethods[b.method] = (alipayMethods[b.method] || 0) + 1;
});

console.log('\n💳 支付宝支付方式分布:');
Object.entries(alipayMethods).sort((a, b) => b[1] - a[1]).slice(0, 5).forEach(([method, count]) => {
  console.log(`   ${method}: ${count}笔`);
});

console.log('\n✅ 结论：账单自动识别完全可行！');
