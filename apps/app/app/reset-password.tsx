import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { Button, Input, Text, YStack } from 'tamagui'

import { useAuth } from '../src/auth/AuthContext'

export default function ResetPassword() {
	const { confirmForgotPassword } = useAuth()
	const { email } = useLocalSearchParams<{ email: string }>()
	const [code, setCode] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [error, setError] = useState<string | null>(null)
	const [isSubmitting, setIsSubmitting] = useState(false)

	const onSubmit = async () => {
		setError(null)
		setIsSubmitting(true)
		try {
			await confirmForgotPassword(email, code, newPassword)
			router.replace('/login')
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to reset password')
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
				Enter new password
			</Text>
			<Text color='$color'>Enter the code sent to {email}</Text>
			<Input
				width='100%'
				placeholder='Reset code'
				keyboardType='number-pad'
				value={code}
				onChangeText={setCode}
			/>
			<Input
				width='100%'
				placeholder='New password'
				secureTextEntry
				value={newPassword}
				onChangeText={setNewPassword}
			/>
			{error && <Text color='$red10'>{error}</Text>}
			<Button width='100%' onPress={onSubmit} disabled={isSubmitting}>
				{isSubmitting ? 'Resetting…' : 'Reset password'}
			</Button>
		</YStack>
	)
}
