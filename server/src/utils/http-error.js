// An Error subclass carrying an HTTP status code, so controllers can
// signal intentional, expected failures (404 not found, 400 bad input)
// distinctly from unexpected crashes. The error middleware uses the
// presence of `status` to decide what to expose to the client:
//
//   throw new HttpError(404, 'User not found');
class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

export { HttpError };
