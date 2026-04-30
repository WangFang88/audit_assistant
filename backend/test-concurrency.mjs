/**
 * 并发上下文隔离测试
 * 用法: node test-concurrency.mjs
 * 前提: 服务器已在 localhost:3000 运行，且已有两个注册用户
 */

const BASE = 'http://localhost:3000/api';

async function login(phone, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password }),
  });
  const data = await res.json();
  if (!data.accessToken) throw new Error(`登录失败: ${JSON.stringify(data)}`);
  return data;
}

async function register(phone, password) {
  const res = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, password }),
  });
  return res.json();
}

async function getMe(token) {
  const res = await fetch(`${BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

async function main() {
  // 准备两个用户
  const admin = await login('13800138000', '123456');
  await register('19900000099', '123456').catch(() => {});
  const user = await login('19900000099', '123456');

  console.log(`用户A: ${admin.user.name} (${admin.user.id})`);
  console.log(`用户B: ${user.user.name} (${user.user.id})`);
  console.log('');

  // 并发 20 次请求，交替使用两个 token
  const ROUNDS = 20;
  const requests = Array.from({ length: ROUNDS }, (_, i) =>
    i % 2 === 0
      ? getMe(admin.accessToken).then((r) => ({ expected: admin.user.id, got: r.id, ok: r.id === admin.user.id }))
      : getMe(user.accessToken).then((r) => ({ expected: user.user.id, got: r.id, ok: r.id === user.user.id })),
  );

  const results = await Promise.all(requests);
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);

  console.log(`并发 ${ROUNDS} 请求: ${passed} 通过, ${failed.length} 失败`);
  if (failed.length > 0) {
    console.error('失败详情:', failed);
    process.exit(1);
  } else {
    console.log('✓ 用户上下文隔离正常');
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
