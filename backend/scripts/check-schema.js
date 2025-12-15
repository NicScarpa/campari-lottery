const sqlite3 = require('better-sqlite3');
const db = sqlite3('dev.db');

console.log('=== CHECKING DATABASE SCHEMA ===\n');

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables found:', tables.map(t => t.name).join(', '), '\n');

// Check Promotion table schema
const promotionSchema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='Promotion'").get();
console.log('Promotion table schema:');
console.log(promotionSchema?.sql || 'NOT FOUND');
console.log('\n---\n');

// Check StaffUser table schema
const staffSchema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='StaffUser'").get();
console.log('StaffUser table schema:');
console.log(staffSchema?.sql || 'NOT FOUND');
console.log('\n---\n');

// Check PrizeType table schema
const prizeTypeSchema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='PrizeType'").get();
console.log('PrizeType table schema:');
console.log(prizeTypeSchema?.sql || 'NOT FOUND');

db.close();
