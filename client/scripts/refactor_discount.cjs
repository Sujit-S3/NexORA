const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  replacements.forEach(({ from, to }) => {
    content = content.split(from).join(to);
  });
  fs.writeFileSync(filePath, content);
}

const renames = [
  ['server/src/models/Coupon.js', 'server/src/models/Discount.js'],
  ['server/src/controllers/couponController.js', 'server/src/controllers/discountController.js'],
  ['server/src/routes/couponRoutes.js', 'server/src/routes/discountRoutes.js'],
  ['client/src/services/couponService.js', 'client/src/services/discountService.js'],
  ['client/src/pages/admin/ManageCoupons.jsx', 'client/src/pages/admin/ManageDiscounts.jsx'],
];

renames.forEach(([oldPath, newPath]) => {
  const fullOld = path.join(__dirname, '../..', oldPath);
  const fullNew = path.join(__dirname, '../..', newPath);
  if (fs.existsSync(fullOld)) {
    fs.renameSync(fullOld, fullNew);
  }
});

const filesToUpdate = [
  'server/src/models/Discount.js',
  'server/src/controllers/discountController.js',
  'server/src/routes/discountRoutes.js',
  'server/src/server.js',
  'server/src/routes/index.js',
  'client/src/services/discountService.js',
  'client/src/pages/admin/ManageDiscounts.jsx',
  'client/src/App.jsx',
  'client/src/components/layout/AdminLayout.jsx',
  'client/src/pages/Cart.jsx',
  'client/src/pages/Checkout.jsx',
];

const stringReplacements = [
  { from: 'Coupon', to: 'Discount' },
  { from: 'coupon', to: 'discount' },
  { from: 'COUPON', to: 'DISCOUNT' },
  { from: 'Coupons', to: 'Discounts' },
  { from: 'coupons', to: 'discounts' },
  { from: 'COUPONS', to: 'DISCOUNTS' },
];

filesToUpdate.forEach(file => {
  replaceInFile(path.join(__dirname, '../..', file), stringReplacements);
});

console.log('Refactoring complete');
