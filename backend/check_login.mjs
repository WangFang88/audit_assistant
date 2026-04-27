const loginRes = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone: '13800000001', password: '123456' }),
});
const data = await loginRes.json();
console.log('status:', loginRes.status);
console.log('response:', JSON.stringify(data).slice(0, 300));
