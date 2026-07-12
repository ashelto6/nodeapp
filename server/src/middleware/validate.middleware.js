const { HttpError } = require('../utils/http-error');

// Validation middleware factory. A route declares Zod schemas for the
// request parts it accepts, and the controller only ever runs if they
// all pass -- controllers never validate input themselves:
//
//   router.post('/', validate({ body: createUserSchema }), createUser);
//
// On success, the request part is REPLACED with Zod's parsed output, so
// controllers receive cleaned/coerced data (unknown fields stripped,
// "5" -> 5 for coerced numbers, etc.), not the raw client payload.
// On failure, a 400 flows through the central error middleware with a
// message naming each bad field.
function validate(schemas) {
    return (req, res, next) => {
        for (const part of ['body', 'params', 'query']) {
            if (!schemas[part]) continue;

            const result = schemas[part].safeParse(req[part]);
            if (!result.success) {
                const details = result.error.issues
                    .map((issue) => `${part}.${issue.path.join('.') || '(root)'}: ${issue.message}`)
                    .join('; ');
                return next(new HttpError(400, `Invalid request: ${details}`));
            }
            req[part] = result.data;
        }
        next();
    };
}

module.exports = { validate };
