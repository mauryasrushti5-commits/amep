/**
 * Standardized response formatter
 */

const success = (data, message = 'Success', statusCode = 200) => {
  return {
    statusCode,
    success: true,
    message,
    data
  };
};

const error = (message = 'Error', statusCode = 500, details = null) => {
  return {
    statusCode,
    success: false,
    message,
    ...(details && { details })
  };
};

const paginated = (items, total, page, limit) => {
  return {
    items,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit)
    }
  };
};

module.exports = {
  success,
  error,
  paginated
};
