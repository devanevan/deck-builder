import { router } from 'expo-router'
import { useState } from 'react'
import { Button, Input, Text, YStack } from 'tamagui'

import { useAuth } from '../src/auth/AuthContext'

export default function ForgotPassword() {
	const { forgotPassword } = useAuth()
	const [email, setEmail] = useState('')
	const [error, setError] = useState<string | null>(null)
	const [isSubmitting, setIsSubmitting] = useState(false)

	const onSubmit = async () => {
		setError(null)
		setIsSubmitting(true)
		try {
			await forgotPassword(email)
			router.replace({ pathname: '/reset-password', params: { email } })
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to send reset code')
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<YStack
			flex={1}
			alignItems='center'
			justifyContent='center'
			backgroundColor='$background'
			gap='$4'
			padding='$4'
		>
			<Text fontSize='$6' fontWeight='bold' color='$color'>
				Reset your password
			</Text>
			<Text color='$color'>Enter your email and we'll send you a reset code</Text>
			<Input
				width='100%'
				placeholder='Email'
				autoCapitalize='none'
				keyboardType='email-address'
				value={email}
				onChangeText={setEmail}
			/>
			{error && <Text color='$red10'>{error}</Text>}
			<Button width='100%' onPress={onSubmit} disabled={isSubmitting}>
				{isSubmitting ? 'Sending…' : 'Send reset code'}
			</Button>
		</YStack>
	)
}
