const { fetchExchangeRates, getLatestRates } = require('./exchangeRate');

const initCronJobs = async () => {
  console.log('Initializing daily exchange rate scheduler (Myanmar Time)...');

  // Trigger initial check/fetch on startup if rates are missing or stale
  try {
    await getLatestRates();
  } catch (err) {
    console.error('Error during initial exchange rate check:', err);
  }

  const scheduleNextRun = () => {
    const now = new Date();
    
    // 1. Current UTC time in milliseconds
    const nowUTC = now.getTime();
    
    // 2. Myanmar Time Offset in milliseconds (UTC + 6:30)
    const myanmarOffset = 6.5 * 60 * 60 * 1000;
    const nowMyanmar = new Date(nowUTC + myanmarOffset);
    
    // 3. Set Target to Today's 3:30 PM in Myanmar Time
    const targetMyanmar = new Date(nowUTC + myanmarOffset);
    targetMyanmar.setUTCHours(15, 30, 0, 0); // 3:30 PM Myanmar Time

    // 4. Target already passed today? Set to Tomorrow 3:30 PM Myanmar Time
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
