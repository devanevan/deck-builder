import type { Card } from '../types/card'

export function isCardLegalForLegend(card: Card, legend: Card): boolean {
	if (card.classification.domain.includes('Colorless')) return true
	return card.classification.domain.some((domain) => legend.classification.domain.includes(domain))
}

export interface DeckLegalityResult {
	legal: boolean
	illegalCardIds: string[]
}

export function validateDeckLegality(legend: Card, cards: Card[]): DeckLegalityResult {
	if (legend.classification.type !== 'Legend') {
		throw new Error(`Card ${legend.id} is not a Legend and cannot anchor deck domains`)
	}

	const illegalCardIds = cards.filter((card) => !isCardLegalForLegend(card, legend)).map((card) => card.id)

	return { legal: illegalCardIds.length === 0, illegalCardIds }
}
