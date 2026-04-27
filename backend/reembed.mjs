const loginRes = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone: '13800138000', password: '123456' }),
});
const { accessToken } = await loginRes.json();
if (!accessToken) { console.log('login failed'); process.exit(1); }

const res = await fetch('http://localhost:3000/api/documents/reembed-all', {
  method: 'POST',
  headers: { Authorization: 'Bearer ' + accessToken },
});
const result = await res.json();
console.log('reembed-all triggered:', result);
