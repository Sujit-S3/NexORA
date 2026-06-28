const fs = require('fs');

const path = 'c:/NexORA/client/src/pages/admin/AIStudio.jsx';
let content = fs.readFileSync(path, 'utf8');

// Colors
content = content.replace(/bg-\[#050505\]/g, 'bg-[#FDFDFD] dark:bg-[#050505] transition-colors duration-300');
content = content.replace(/bg-\[#0B0B0B\]/g, 'bg-white dark:bg-[#0B0B0B] transition-colors duration-300');
content = content.replace(/bg-\[#111\]/g, 'bg-gray-50 dark:bg-[#111] transition-colors duration-300');

content = content.replace(/border-white\/5(?!0)/g, 'border-gray-200 dark:border-white/5');
content = content.replace(/border-white\/10/g, 'border-gray-200 dark:border-white/10');
content = content.replace(/border-white\/20/g, 'border-gray-200 dark:border-white/20');

// Text
content = content.replace(/text-white/g, 'text-gray-900 dark:text-white');
content = content.replace(/text-gray-200/g, 'text-gray-700 dark:text-gray-200');
content = content.replace(/text-\[#6B7280\]/g, 'text-gray-500 dark:text-[#6B7280]');

// Hover
content = content.replace(/hover:text-gray-900 dark:text-white/g, 'hover:text-gray-900 dark:hover:text-white');

// Background opacity
content = content.replace(/bg-white\/10/g, 'bg-gray-200 dark:bg-white/10');
content = content.replace(/bg-white\/5(?!0)/g, 'bg-gray-100 dark:bg-white/5');

// Fix any double dark:dark:
content = content.replace(/dark:dark:/g, 'dark:');

fs.writeFileSync(path, content);
console.log('AI Studio themed successfully');
