require('dotenv').config();

console.log('Environment variables check:');
console.log('JWT_SECRET is set:', !!process.env.JWT_SECRET);
console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length);
console.log('JWT_SECRET starts with:', process.env.JWT_SECRET?.substring(0, 15) + '...');
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('\nServer would start successfully!');
