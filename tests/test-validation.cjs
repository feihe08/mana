/**
 * 测试文件和数据验证功能
 */

const fs = require('fs');
const path = require('path');

// 测试用例
const testCases = [
  {
    name: '✅ 正常CSV文件',
    file: 'test-files/normal.csv',
    shouldPass: true,
  },
  {
    name: '❌ 超大文件（28MB）',
    file: 'test-files/over-10mb.csv',
    shouldPass: false,
    expectedError: 'FILE_TOO_LARGE',
  },
  {
    name: '❌ 包含无效数据',
    file: 'test-files/invalid-data.csv',
    shouldPass: false,
    expectedError: '数据验证失败',
  },
  {
    name: '❌ 不支持的文件类型',
    file: 'test-files/test.txt',
    shouldPass: false,
    expectedError: 'INVALID_EXTENSION',
  },
];

console.log('='.repeat(60));
console.log('📋 文件和数据验证测试');
console.log('='.repeat(60));
console.log();

// 检查文件是否存在
testCases.forEach((test) => {
  const filePath = path.join(__dirname, test.file);

  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log(`${test.name}`);
    console.log(`   文件: ${test.file}`);
    console.log(`   大小: ${sizeMB} MB`);
    console.log(`   预期: ${test.shouldPass ? '✅ 通过' : '❌ 失败'}`);
    console.log();

    // 如果是超大文件测试，显示警告
    if (test.expectedError === 'FILE_TOO_LARGE') {
      console.log(`   ⚠️  此文件超过10MB限制，应该被拒绝`);
    }
  } else {
    console.log(`${test.name}`);
    console.log(`   ⚠️  文件不存在: ${test.file}`);
    console.log();
  }
});

console.log('='.repeat(60));
console.log('🔍 验证逻辑说明');
console.log('='.repeat(60));
console.log();
console.log('1. 文件大小限制: 最大 10MB');
console.log('2. 支持的文件类型: .csv, .xlsx, .xls, .txt');
console.log('3. 数据验证规则:');
console.log('   - 金额必须为非零数字');
console.log('   - 日期必须在 1990-01-01 到 2030-12-31 范围内');
console.log('   - 必须包含 description, amount, transactionDate 字段');
console.log();
console.log('='.repeat(60));
console.log('📝 下一步: 手动测试');
console.log('='.repeat(60));
console.log();
console.log('启动开发服务器:');
console.log('  pnpm dev');
console.log();
console.log('然后访问 http://localhost:3000 并上传测试文件');
console.log();
console.log('测试文件位置:');
console.log('  ✅ normal.csv - 应该成功');
console.log('  ❌ over-10mb.csv - 应该提示文件过大');
console.log('  ❌ invalid-data.csv - 应该显示详细错误');
console.log();
