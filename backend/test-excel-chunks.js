// 测试Excel工作表分割逻辑
const testText = `[工作表: 案例1]
问题：某单位未按规定进行采购审批
相关条款：《政府采购法》第十三条
结论：违反采购程序，应予以整改

[工作表: 案例2]
问题：专项资金使用不规范
相关条款：《预算法》第五十六条
结论：资金使用存在风险，需加强管理

案例三、某企业财务报表造假
问题：虚增收入，隐瞒负债
相关条款：《会计法》第二十七条
结论：构成会计造假，应追究法律责任`;

// 模拟buildCaseChunks方法的切分逻辑
const caseMarkers = /(?:^|\n)(?:案例[一二三四五六七八九十\d]+[、：:.]|[一二三四五六七八九十\d]+[、\.](?![\u4e00-\u9fa5])|【案例\d+】|\[工作表:\s*[^\]]+\])/;

console.log('原始文本：');
console.log(testText);
console.log('\n' + '='.repeat(60) + '\n');

const segments = testText.split(caseMarkers).filter(s => s.trim().length > 20);

console.log(`检测到 ${segments.length} 个案例片段：\n`);

segments.forEach((segment, index) => {
  console.log(`片段 ${index + 1}:`);
  console.log(segment.trim());
  console.log('\n' + '-'.repeat(60) + '\n');
});

// 验证是否正确识别了工作表标记
const matches = testText.match(new RegExp(caseMarkers, 'g'));
console.log('识别到的分隔标记：');
if (matches) {
  matches.forEach(m => console.log(`  - ${m.trim()}`));
} else {
  console.log('  无');
}
