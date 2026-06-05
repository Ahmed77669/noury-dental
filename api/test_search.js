const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'dental_opportunities.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Test failed to open database:', err.message);
    process.exit(1);
  }
});

// Run verification checks
console.log('--- Verifying Database Ingestion ---');
db.get('SELECT COUNT(*) AS count FROM opportunities', [], (err, row) => {
  if (err) {
    console.error('Error fetching count:', err.message);
    process.exit(1);
  }
  console.log(`Successfully verified! Database contains ${row.count} opportunities.`);
  
  if (row.count !== 135) {
    console.error(`Expected 135 rows, got ${row.count}. Please re-run ingestion.`);
    process.exit(1);
  }
  
  console.log('\n--- Verifying Sample Opportunity Fields ---');
  db.get('SELECT * FROM opportunities LIMIT 1', [], (err, opp) => {
    if (err) {
      console.error('Error fetching sample:', err.message);
      process.exit(1);
    }
    
    console.log('Sample Data Checklist:');
    console.log(`- Title: "${opp.title}"`);
    console.log(`- Job Type: "${opp.job_type}"`);
    console.log(`- Governorate: "${opp.governorate}"`);
    console.log(`- Contact Phone: "${opp.contact_phone}"`);
    console.log(`- Base Score: ${opp.ranking_score}`);
    console.log(`- Content Hash: "${opp.content_hash}"`);
    
    if (!opp.id || !opp.title || !opp.job_type || !opp.governorate) {
      console.error('Validation Error: Core fields are missing in database record.');
      process.exit(1);
    }
    
    console.log('\nAll validation checks passed successfully! Ready for API launch.');
    db.close();
    process.exit(0);
  });
});
