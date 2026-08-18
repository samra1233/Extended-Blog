import mongoose from 'mongoose';

const validateObjectId = (id, res, label = 'ID') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400);
    throw new Error(`Invalid ${label}`);
  }
};

export default validateObjectId;
