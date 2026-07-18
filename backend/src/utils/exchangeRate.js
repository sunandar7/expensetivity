const https = require('https');
const ExchangeRate = require('../models/ExchangeRate');

// Zero-dependency JSON fetching helper with native fetch and https fallback
const fetchJSON = (url) => {
  if (typeof fetch === 'function') {
    return fetch(url).then(res => res.json());
  }
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
};

// Fetch daily rates from open.er-api.com and save to DB
const fetchExchangeRates = async () => {
  try {
    console.log('Fetching exchange rates from API...');
    const data = await fetchJSON('https://open.er-api.com/v6/latest/USD');
    if (data && data.result === 'success') {
      const newRates = await ExchangeRate.create({
        base: data.base_code || 'USD',
        rates: data.rates,
        fetchedAt: new Date()
      });
      console.log('Exchange rates updated successfully in database');
      return newRates;
    } else {
      console.error('Failed to fetch exchange rates: API response result was not success');
    }
  } catch (err) {
    console.error('Error fetching exchange rates:', err);
  }
  return null;
};

// Retrieve latest rates from DB; if none exist, fetch them immediately
const getLatestRates = async () => {
  try {
    let rateDoc = await ExchangeRate.findOne().sort({ fetchedAt: -1 });
    if (!rateDoc) {
      console.log('No exchange rates found in database. Triggering initial fetch...');
      rateDoc = await fetchExchangeRates();
    }
    return rateDoc;
  } catch (err) {
    console.error('Error getting latest rates:', err);
    return null;
  }
};

// Convert an amount from expCurrency to baseCurrency using latest rates
const convertAmount = async (amount, expCurrency, baseCurrency) => {
  const normExp = (expCurrency || 'MMK').toUpperCase();
  const normBase = (baseCurrency || 'MMK').toUpperCase();

  if (normExp === normBase) {
    return {
      exchangeRateUsed: 1,
      baseAmount: amount
    };
  }

  const rateDoc = await getLatestRates();
  if (!rateDoc) {
    console.warn('Exchange rates not available. Defaulting conversion to 1:1');
    return {
      exchangeRateUsed: 1,
      baseAmount: amount
    };
  }

  const rates = rateDoc.rates;
  const getRate = (cur) => {
    if (!rates) return 1;
    if (typeof rates.get === 'function') {
      return rates.get(cur) || 1;
    }
    return rates[cur] || 1;
  };

  const rateOfBase = getRate(normBase);
  const rateOfExp = getRate(normExp);

  // exchangeRateUsed is how much baseCurrency per 1 unit of expCurrency
  // e.g. base = MMK (2100), exp = USD (1) -> rate = 2100 / 1 = 2100.
  const exchangeRateUsed = rateOfBase / rateOfExp;
  const baseAmount = amount * exchangeRateUsed;

  return {
    exchangeRateUsed,
    baseAmount: Math.round(baseAmount * 100) / 100 // Round to 2 decimal places
  };
};

// Migrate existing expenses lacking baseAmount or exchangeRateUsed
const migrateExistingExpenses = async () => {
  try {
    const Expense = require('../models/Expense');
    const User = require('../models/User');

    // Find expenses that lack baseAmount or exchangeRateUsed
    const expensesToMigrate = await Expense.find({
      $or: [
        { baseAmount: { $exists: false } },
        { exchangeRateUsed: { $exists: false } }
      ]
    });

    if (expensesToMigrate.length === 0) {
      return;
    }

    console.log(`Found ${expensesToMigrate.length} existing expenses to migrate...`);

    const rateDoc = await getLatestRates();
    const rates = rateDoc ? rateDoc.rates : null;

    const getRate = (cur) => {
      if (!rates) return 1;
      if (typeof rates.get === 'function') {
        return rates.get(cur) || 1;
      }
      return rates[cur] || 1;
    };

    for (const exp of expensesToMigrate) {
      const user = await User.findById(exp.userId);
      const userBaseCurrency = (user?.baseCurrency || 'MMK').toUpperCase();
      const expenseCurrency = (exp.currency || 'MMK').toUpperCase();

      let exchangeRateUsed = 1;
      let baseAmount = exp.amount;

      if (expenseCurrency !== userBaseCurrency) {
        const rateOfBase = getRate(userBaseCurrency);
        const rateOfExp = getRate(expenseCurrency);
        exchangeRateUsed = rateOfBase / rateOfExp;
        baseAmount = exp.amount * exchangeRateUsed;
      }

      exp.exchangeRateUsed = exchangeRateUsed;
      exp.baseAmount = Math.round(baseAmount * 100) / 100;
      await exp.save();
    }

    console.log(`Successfully migrated ${expensesToMigrate.length} expenses!`);
  } catch (err) {
    console.error('Error migrating existing expenses:', err);
  }
};

module.exports = {
  fetchExchangeRates,
  getLatestRates,
  convertAmount,
  migrateExistingExpenses
};
