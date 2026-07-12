// Express 4 does not catch errors thrown inside async handlers -- a
// rejected promise never reaches the error middleware and becomes an
// unhandled rejection instead. Wrapping async controllers forwards any
// rejection to next(), which routes it to the error middleware:
//
//   router.get('/', asyncHandler(myAsyncController));
function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}

module.exports = { asyncHandler };
