import { Link, router } from 'expo-router'
import { useState } from 'react'
import { Button, Input, Text, YStack } from 'tamagui'

import { useAuth } from '../src/auth/AuthContext'

export default function Login() {
	const { signIn } = useAuth()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState<string | null>(null)
	const [isSubmitting, setIsSubmitting] = useState(false)

	const onSubmit = async () => {
		setError(null)
		setIsSubmitting(true)
		try {
			await signIn(email, password)
			router.replace('/home')
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to sign in')
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
				Log in
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
			{error && <Text color='$red10'>{error}</Text>}
			<Button width='100%' onPress={onSubmit} disabled={isSubmitting}>
				{isSubmitting ? 'Logging in…' : 'Log in'}
			</Button>
			<Link href='/register'>
				<Text color='$color'>Need an account? Register</Text>
			</Link>
		</YStack>
	)
}
