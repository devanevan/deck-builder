import jwt from 'jsonwebtoken'

// Local dev only. serverless-offline never verifies JWT signatures, only
// decodes them - but it does check iss/aud, so these must match
// custom.authorizerConfig.local in serverless.yml. There is no real
// Cognito pool behind this token.
const userId = process.argv[2] ?? 'local-dev-user'

const token = jwt.sign(
	{
		sub: userId,
		email: `${userId}@example.com`,
		iss: 'http://localhost/local-issuer',
		aud: 'local-client-id',
	},
	'unused-local-secret',
	{ algorithm: 'HS256', expiresIn: '12h' },
)

console.log(token)
