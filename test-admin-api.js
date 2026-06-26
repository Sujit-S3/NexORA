async function test() {
  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@nexora.com', password: 'password123' })
    });
    
    const loginData = await loginRes.json();
    if (!loginData.success) throw new Error(loginData.message);
    
    const token = loginData.data.token;
    console.log('Got token');

    const dashRes = await fetch('http://localhost:5000/api/admin/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const dashData = await dashRes.json();
    console.log('Dashboard stats:', dashData.success ? Object.keys(dashData.data) : dashData.message);
    if (dashData.success) {
      console.log('kpis:', dashData.data.kpis);
      console.log('charts:', dashData.data.charts);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
