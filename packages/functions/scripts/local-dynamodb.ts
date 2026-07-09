import dynalite from 'dynalite'
import { DynamoDBClient, CreateTableCommand, ResourceInUseException } from '@aws-sdk/client-dynamodb'

const PORT = 8000

const server = dynalite({ createTableMs: 0 })

server.listen(PORT, async () => {
	console.log(`dynalite listening on http://localhost:${PORT}`)

	const client = new DynamoDBClient({
		endpoint: `http://localhost:${PORT}`,
		region: 'localhost',
		credentials: { accessKeyId: 'local', secretAccessKey: 'local' },
	})

	try {
		await client.send(
			new CreateTableCommand({
				TableName: 'riftbound-functions-decks-local',
				BillingMode: 'PAY_PER_REQUEST',
				AttributeDefinitions: [
					{ AttributeName: 'userId', AttributeType: 'S' },
					{ AttributeName: 'id', AttributeType: 'S' },
				],
				KeySchema: [
					{ AttributeName: 'userId', KeyType: 'HASH' },
					{ AttributeName: 'id', KeyType: 'RANGE' },
				],
			}),
		)
		console.log('created table riftbound-functions-decks-local')
	} catch (error) {
		if (!(error instanceof ResourceInUseException)) throw error
	}

	try {
		await client.send(
			new CreateTableCommand({
				TableName: 'riftbound-functions-users-local',
				BillingMode: 'PAY_PER_REQUEST',
				AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
				KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
			}),
		)
		console.log('created table riftbound-functions-users-local')
	} catch (error) {
		if (!(error instanceof ResourceInUseException)) throw error
	}

	try {
		await client.send(
			new CreateTableCommand({
				TableName: 'riftbound-functions-cards-local',
				BillingMode: 'PAY_PER_REQUEST',
				AttributeDefinitions: [
					{ AttributeName: 'id', AttributeType: 'S' },
					{ AttributeName: 'cardType', AttributeType: 'S' },
					{ AttributeName: 'setId', AttributeType: 'S' },
				],
				KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
				GlobalSecondaryIndexes: [
					{
						IndexName: 'TypeIndex',
						KeySchema: [
							{ AttributeName: 'cardType', KeyType: 'HASH' },
							{ AttributeName: 'id', KeyType: 'RANGE' },
						],
						Projection: { ProjectionType: 'ALL' },
					},
					{
						IndexName: 'SetIndex',
						KeySchema: [
							{ AttributeName: 'setId', KeyType: 'HASH' },
							{ AttributeName: 'id', KeyType: 'RANGE' },
						],
						Projection: { ProjectionType: 'ALL' },
					},
				],
			}),
		)
		console.log('created table riftbound-functions-cards-local')
	} catch (error) {
		if (!(error instanceof ResourceInUseException)) throw error
	}
})
