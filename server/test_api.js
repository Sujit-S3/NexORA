fetch('http://localhost:5000/api/products')
  .then(r => r.text())
  .then(text => console.log('Response:', text.substring(0, 500)))
  .catch(e => console.log('Fetch error:', e));
