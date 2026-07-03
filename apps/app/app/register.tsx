import { Link, router } from 'expo-router'
import { useState } from 'react'
import { Button, Input, Text, YStack } from 'tamagui'

import { useAuth } from '../src/auth/AuthContext'

export default function Register() {
	const { signUp } = useAuth()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [error, setError] = useState<string | null>(null)
	const [isSubmitting, setIsSubmitting] = useState(false)

	const onSubmit = async () => {
		setError(null)

		if (password !== confirmPassword) {
			setError('Passwords do not match')
			return
		}

		setIsSubmitting(true)
		try {
			await signUp(email, password)
			router.replace({ pathname: '/confirm', params: { email } })
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to register')
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
				Register
			</Text>
			<Input
				width='100%'
				placeholder='Email'
				autoCapitalize='none'
				keyboardType='email-address'
				value={email}
				onChangeText={setEmail}
			/>
			<Input
				width='100%'
				placeholder='Password'
				secureTextEntry
				value={password}
				onChangeText={setPassword}
			/>
			<Input
				width='100%'
				placeholder='Confirm password'
				secureTextEntry
				value={confirmPassword}
				onChangeText={setConfirmPassword}
			/>
			{error && <Text color='$red10'>{error}</Text>}
			<Button width='100%' onPress={onSubmit} disabled={isSubmitting}>
				{isSubmitting ? 'Registering…' : 'Register'}
			</Button>
			<Link href='/login'>
				<Text color='$color'>Already have an account? Log in</Text>
			</Link>
		</YStack>
	)
}
