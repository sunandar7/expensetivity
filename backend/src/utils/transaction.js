const mongoose = require('mongoose');

// Executes a callback within a Mongoose transaction session.
const withTransaction = async (workFn) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const result = await workFn(session);
    await session.commitTransaction();
    return result;
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    if (error.message && (error.message.includes('replica set') || error.message.includes('Transaction numbers'))) {
      console.warn('MongoDB standalone detected. Executing operations without transaction session.');
      return await workFn(null);
    }
    throw error;
  } finally {
    session.endSession();
  }
};

module.exports = { withTransaction };
