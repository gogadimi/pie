describe('Health API', () => {
  test('health endpoint returns 200', async () => {
    const res = await fetch('http://localhost:3000/api/health');
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('services');
    expect(data.services).toHaveProperty('database');
  });
});

describe('API Routes', () => {
  test('products API returns 200', async () => {
    const res = await fetch('http://localhost:3000/api/products?orgId=demo-org');
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('success', true);
  });

  test('competitors API returns 200', async () => {
    const res = await fetch('http://localhost:3000/api/competitors?orgId=demo-org');
    expect(res.status).toBe(200);
  });

  test('dashboard stats API returns 200', async () => {
    const res = await fetch('http://localhost:3000/api/dashboard/stats?orgId=demo-org');
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('stats');
    expect(data.stats).toHaveProperty('totalProducts');
    expect(data.stats).toHaveProperty('totalCompetitors');
  });

  test('invalid scrape request returns 400', async () => {
    const res = await fetch('http://localhost:3000/api/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });
});
