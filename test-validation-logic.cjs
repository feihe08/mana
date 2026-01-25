/**
 * 测试文件和数据验证逻辑
 */

// 模拟验证函数
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['.csv', '.xlsx', '.xls', '.txt'];

function validateFileSize(file) {
  if (file.size === 0) {
    return { valid: false, error: '文件为空' };
  }
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `文件过大（${sizeMB}MB），最大允许 ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    };
  }
  return { valid: true };
}

function validateFileExtension(filename) {
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  if (!extension) {
    return { valid: false, error: '文件缺少扩展名' };
  }
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    return {
      valid: false,
      error: `不支持的文件类型：${extension}，允许的类型：${ALLOWED_EXTENSIONS.join(', ')}`
    };
  }
  return { valid: true };
}

function validateAmount(amount) {
  if (amount === null || amount === undefined) return false;
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (typeof numAmount !== 'number' || isNaN(numAmount)) return false;
  if (Math.abs(numAmount) < 0.01) return false;
  if (Math.abs(numAmount) > 10_000_000) return false;
  return true;
}

function validateDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return false;
  const minDate = new Date('1990-01-01');
  const maxDate = new Date('2030-12-31');
  if (date < minDate || date > maxDate) return false;
  return true;
}

// 测试用例
console.log('='.repeat(70));
console.log('🧪 文件和数据验证单元测试');
console.log('='.repeat(70));
console.log();

// 测试1: 文件大小验证
console.log('📏 测试1: 文件大小验证');
console.log('-'.repeat(70));

const fileSizeTests = [
  { name: '空文件', size: 0, shouldFail: true },
  { name: '正常文件', size: 1024, shouldFail: false },
  { name: '临界值10MB', size: 10 * 1024 * 1024, shouldFail: false },
  { name: '超过10MB', size: 11 * 1024 * 1024, shouldFail: true },
  { name: '超大文件28MB', size: 28 * 1024 * 1024, shouldFail: true },
];

let passCount = 0;
let failCount = 0;

fileSizeTests.forEach((test) => {
  const result = validateFileSize({ size: test.size });
  const passed = result.valid === !test.shouldFail;

  if (passed) {
    console.log(`  ✅ ${test.name}: ${result.valid ? '通过' : result.error}`);
    passCount++;
  } else {
    console.log(`  ❌ ${test.name}: 期望${test.shouldFail ? '失败' : '通过'}, 但${result.valid ? '通过了' : '失败了'}`);
    failCount++;
  }
});

console.log();
console.log(`结果: ${passCount} 通过, ${failCount} 失败`);
console.log();

// 测试2: 文件扩展名验证
console.log('📁 测试2: 文件扩展名验证');
console.log('-'.repeat(70));

const extTests = [
  { name: 'CSV文件', file: 'test.csv', shouldFail: false },
  { name: 'Excel文件', file: 'test.xlsx', shouldFail: false },
  { name: 'TXT文件', file: 'test.txt', shouldFail: false },
  { name: 'PDF文件', file: 'test.pdf', shouldFail: true },
  { name: '无扩展名', file: 'test', shouldFail: true },
];

passCount = 0;
failCount = 0;

extTests.forEach((test) => {
  const result = validateFileExtension(test.file);
  const passed = result.valid === !test.shouldFail;

  if (passed) {
    console.log(`  ✅ ${test.name}: ${result.valid ? '通过' : result.error}`);
    passCount++;
  } else {
    console.log(`  ❌ ${test.name}: 期望${test.shouldFail ? '失败' : '通过'}, 但${result.valid ? '通过了' : '失败了'}`);
    failCount++;
  }
});

console.log();
console.log(`结果: ${passCount} 通过, ${failCount} 失败`);
console.log();

// 测试3: 金额验证
console.log('💰 测试3: 金额验证');
console.log('-'.repeat(70));

const amountTests = [
  { name: '正常金额', amount: 100.5, shouldFail: false },
  { name: '负数（支出）', amount: -50, shouldFail: false },
  { name: '零', amount: 0, shouldFail: true },
  { name: '过小（0.001）', amount: 0.001, shouldFail: true },
  { name: '过大', amount: 20_000_000, shouldFail: true },
  { name: 'NaN', amount: NaN, shouldFail: true },
  { name: 'null', amount: null, shouldFail: true },
  { name: '字符串数字', amount: '123.45', shouldFail: false },
];

passCount = 0;
failCount = 0;

amountTests.forEach((test) => {
  const result = validateAmount(test.amount);
  const passed = result === !test.shouldFail;

  if (passed) {
    console.log(`  ✅ ${test.name} (${test.amount}): ${result ? '有效' : '无效'}`);
    passCount++;
  } else {
    console.log(`  ❌ ${test.name} (${test.amount}): 期望${test.shouldFail ? '无效' : '有效'}, 但${result ? '有效' : '无效'}`);
    failCount++;
  }
});

console.log();
console.log(`结果: ${passCount} 通过, ${failCount} 失败`);
console.log();

// 测试4: 日期验证
console.log('📅 测试4: 日期验证');
console.log('-'.repeat(70));

const dateTests = [
  { name: '正常日期', date: '2025-01-15', shouldFail: false },
  { name: 'ISO格式', date: '2025-01-15T10:30:00Z', shouldFail: false },
  { name: '无效日期', date: '2025-13-45', shouldFail: true },
  { name: '过早', date: '1989-12-31', shouldFail: true },
  { name: '过晚', date: '2031-01-01', shouldFail: true },
  { name: '空字符串', date: '', shouldFail: true },
  { name: 'null', date: null, shouldFail: true },
];

passCount = 0;
failCount = 0;

dateTests.forEach((test) => {
  const result = validateDate(test.date);
  const passed = result === !test.shouldFail;

  if (passed) {
    console.log(`  ✅ ${test.name} (${test.date}): ${result ? '有效' : '无效'}`);
    passCount++;
  } else {
    console.log(`  ❌ ${test.name} (${test.date}): 期望${test.shouldFail ? '无效' : '有效'}, 但${result ? '有效' : '无效'}`);
    failCount++;
  }
});

console.log();
console.log(`结果: ${passCount} 通过, ${failCount} 失败`);
console.log();

// 测试5: 实际文件测试
console.log('📂 测试5: 实际测试文件');
console.log('-'.repeat(70));

const fs = require('fs');
const path = require('path');

const testFiles = [
  { path: 'test-files/normal.csv', name: '正常CSV', shouldPass: true },
  { path: 'test-files/over-10mb.csv', name: '超大文件', shouldPass: false },
  { path: 'test-files/invalid-data.csv', name: '无效数据', shouldPass: false },
];

testFiles.forEach((test) => {
  const filePath = path.join(__dirname, test.path);

  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`  📄 ${test.name}`);
    console.log(`     路径: ${test.path}`);
    console.log(`     大小: ${sizeMB} MB`);

    // 测试文件大小
    const sizeResult = validateFileSize(stats);

    if (test.shouldPass) {
      console.log(`     状态: ${sizeResult.valid ? '✅ 应该通过验证' : '❌ 会被拒绝'}`);
    } else {
      console.log(`     状态: ${sizeResult.valid ? '⚠️  意外通过' : '✅ 正确拒绝'}`);
      if (!sizeResult.valid) {
        console.log(`     原因: ${sizeResult.error}`);
      }
    }
    console.log();
  } else {
    console.log(`  ⚠️  ${test.name}: 文件不存在`);
    console.log();
  }
});

console.log('='.repeat(70));
console.log('✅ 测试完成');
console.log('='.repeat(70));
console.log();
console.log('📝 下一步: 启动开发服务器进行完整测试');
console.log('   pnpm dev');
console.log('   然后访问 http://localhost:3000');
console.log();
