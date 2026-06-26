import axios from 'axios';

(async () => {
  try {
    const prodRes = await axios.get('http://localhost:5000/api/products');
    const realProduct = prodRes.data.data.products[0];

    const payload = {
      orderItems: [
        {
          product: realProduct._id,
          name: realProduct.name,
          image: realProduct.images[0]?.url,
          price: realProduct.price,
          quantity: 1
        }
      ],
      shippingAddress: { street: '123', city: 'LA', state: 'CA', zip: '90000', country: 'USA' },
      paymentMethod: 'card',
      deliveryMethod: 'standard',
      discountCode: 'LUXURY20'
    };

    const res = await axios.post('http://localhost:5000/api/orders', payload);
    console.log('Success:', res.data);
  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
  }
})();
