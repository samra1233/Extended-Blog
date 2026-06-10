import mongoose from 'mongoose';

/**
 * Validates a string as a valid MongoDB ObjectId.
 * Throws a 400 error if invalid.
 */
const validateObjectId = (id, res, label = 'ID') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error(`Invalid ${label}`);
  }
};

export default validateObjectId;
