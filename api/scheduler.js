const { exec } = require('child_process');
const path = require('path');

function startScheduler() {
  const pythonScriptPath = path.join(__dirname, '..', 'scraper', 'live_crawl.py');
  const crawlIntervalMs = 120000; // Run every 2 minutes

  console.log(`[Scheduler] Live background crawler initialized. Running every 2 minutes.`);

  const runCrawler = () => {
    console.log(`[Scheduler] Starting live crawl at ${new Date().toLocaleTimeString()}...`);
    
    // Execute python script
    exec(`python "${pythonScriptPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`[Scheduler Error] Execution failed: ${error.message}`);
        return;
      }
      if (stderr) {
        console.warn(`[Scheduler Warn] Python output stderr: ${stderr}`);
      }
      // Log python stdout
      console.log(stdout.trim());
    });
  };

  // Run immediately on start
  runCrawler();

  // Schedule interval
  setInterval(runCrawler, crawlIntervalMs);
}

module.exports = { startScheduler };
