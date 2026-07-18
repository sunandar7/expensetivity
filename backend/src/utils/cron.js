const { fetchExchangeRates } = require('./exchangeRate');

const initCronJobs = () => {
  console.log('Initializing zero-dependency daily exchange rate scheduler (Myanmar Time)...');

  const scheduleNextRun = () => {
    const now = new Date();
    
    // 1. Current UTC time in milliseconds
    const nowUTC = now.getTime();
    
    // 2. Myanmar Time Offset in milliseconds (UTC + 6:30)
    const myanmarOffset = 6.5 * 60 * 60 * 1000;
    const nowMyanmar = new Date(nowUTC + myanmarOffset);
    
    // 3. Set Target to Today's 12:05 AM in Myanmar Time
    const targetMyanmar = new Date(nowUTC + myanmarOffset);
    targetMyanmar.setUTCHours(0, 5, 0, 0); // 12:05 AM Myanmar Time

    // 4. Target already passed today? Set to Tomorrow 12:05 AM Myanmar Time
    if (targetMyanmar <= nowMyanmar) {
      targetMyanmar.setUTCDate(targetMyanmar.getUTCDate() + 1);
    }

    // 5. Calculate physical delay in milliseconds
    const delay = targetMyanmar.getTime() - nowMyanmar.getTime();
    
    // Display next run time details in local & Myanmar equivalent
    const targetUTC = new Date(targetMyanmar.getTime() - myanmarOffset);
    const delayInMinutes = Math.round(delay / 60000);
    
    console.log(`Daily exchange rate scheduler configured.`);
    console.log(`Next API fetch: ${targetUTC.toString()} (Myanmar Time: ${targetMyanmar.toUTCString().replace('GMT', 'MMT')})`);
    console.log(`In approximately ${delayInMinutes} minutes`);

    setTimeout(async () => {
      console.log('Executing scheduled daily exchange rate fetch...');
      await fetchExchangeRates();
      
      // Recursively schedule next run to keep it active
      scheduleNextRun();
    }, delay);
  };

  scheduleNextRun();
};

module.exports = { initCronJobs };
