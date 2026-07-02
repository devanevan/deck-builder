export interface DeckCard {
	cardId: string
	quantity: number
}

export interface Deck {
	id: string
	userId: string
	name: string
	description?: string
	cards: DeckCard[]
	createdAt: string
	updatedAt: string
}
