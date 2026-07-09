import { syncCards } from '../src/cards/syncCards'

syncCards()
	.then((result) => console.log(`Synced ${result.synced} cards from Riftcodex`))
	.catch((error) => {
		console.error(error)
		process.exit(1)
	})
