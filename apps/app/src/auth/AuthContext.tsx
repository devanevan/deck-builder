import AsyncStorage from '@react-native-async-storage/async-storage'
import {
	AuthenticationDetails,
	CognitoRefreshToken,
	CognitoUser,
	CognitoUserAttribute,
	CognitoUserPool,
	type CognitoUserSession,
} from 'amazon-cognito-identity-js'
import type { PropsWithChildren } from 'react'
import { createContext, useContext, useEffect, useState } from 'react'

const REFRESH_TOKEN_KEY = 'auth.refreshToken'
const EMAIL_KEY = 'auth.email'

const userPool = new CognitoUserPool({
	UserPoolId: process.env.EXPO_PUBLIC_COGNITO_USER_POOL_ID as string,
	ClientId: process.env.EXPO_PUBLIC_COGNITO_CLIENT_ID as string,
})

type AuthState = {
	isLoading: boolean
	isAuthenticated: boolean
	email: string | null
	signUp: (email: string, password: string) => Promise<void>
	confirmSignUp: (email: string, code: string) => Promise<void>
	signIn: (email: string, password: string) => Promise<void>
	signOut: () => Promise<void>
	forgotPassword: (email: string) => Promise<void>
	confirmForgotPassword: (email: string, code: string, newPassword: string) => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

const persistSession = async (email: string, session: CognitoUserSession) => {
	await AsyncStorage.setItem(EMAIL_KEY, email)
	await AsyncStorage.setItem(REFRESH_TOKEN_KEY, session.getRefreshToken().getToken())
}

export function AuthProvider({ children }: PropsWithChildren) {
	const [isLoading, setIsLoading] = useState(true)
	const [email, setEmail] = useState<string | null>(null)

	useEffect(() => {
		const rehydrate = async () => {
			const [storedEmail, refreshToken] = await Promise.all([
				AsyncStorage.getItem(EMAIL_KEY),
				AsyncStorage.getItem(REFRESH_TOKEN_KEY),
			])

			if (!storedEmail || !refreshToken) {
				setIsLoading(false)
				return
			}

			const cognitoUser = new CognitoUser({ Username: storedEmail, Pool: userPool })
			cognitoUser.refreshSession(
				new CognitoRefreshToken({ RefreshToken: refreshToken }),
				(error: Error | null, session: CognitoUserSession | null) => {
					if (error || !session) {
						AsyncStorage.multiRemove([EMAIL_KEY, REFRESH_TOKEN_KEY]).finally(() => setIsLoading(false))
						return
					}
					setEmail(storedEmail)
					setIsLoading(false)
				},
			)
		}

		rehydrate()
	}, [])

	const signUp = (email: string, password: string) =>
		new Promise<void>((resolve, reject) => {
			const attributes = [new CognitoUserAttribute({ Name: 'email', Value: email })]
			userPool.signUp(email, password, attributes, [], (error) => {
				if (error) {
					reject(error)
					return
				}
				resolve()
			})
		})

	const confirmSignUp = (email: string, code: string) =>
		new Promise<void>((resolve, reject) => {
			const cognitoUser = new CognitoUser({ Username: email, Pool: userPool })
			cognitoUser.confirmRegistration(code, true, (error) => {
				if (error) {
					reject(error)
					return
				}
				resolve()
			})
		})

	const signIn = (email: string, password: string) =>
		new Promise<void>((resolve, reject) => {
			const cognitoUser = new CognitoUser({ Username: email, Pool: userPool })
			const authDetails = new AuthenticationDetails({ Username: email, Password: password })

			cognitoUser.authenticateUser(authDetails, {
				onSuccess: (session) => {
					persistSession(email, session).then(() => {
						setEmail(email)
						resolve()
					})
				},
				onFailure: (error) => reject(error),
			})
		})

	const signOut = async () => {
		await AsyncStorage.multiRemove([EMAIL_KEY, REFRESH_TOKEN_KEY])
		setEmail(null)
	}

	const forgotPassword = (email: string) =>
		new Promise<void>((resolve, reject) => {
			const cognitoUser = new CognitoUser({ Username: email, Pool: userPool })
			cognitoUser.forgotPassword({
				onSuccess: () => resolve(),
				onFailure: (error) => reject(error),
			})
		})

	const confirmForgotPassword = (email: string, code: string, newPassword: string) =>
		new Promise<void>((resolve, reject) => {
			const cognitoUser = new CognitoUser({ Username: email, Pool: userPool })
			cognitoUser.confirmPassword(code, newPassword, {
				onSuccess: () => resolve(),
				onFailure: (error) => reject(error),
			})
		})

	const value: AuthState = {
		isLoading,
		isAuthenticated: email !== null,
		email,
		signUp,
		confirmSignUp,
		signIn,
		signOut,
		forgotPassword,
		confirmForgotPassword,
	}

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
	const context = useContext(AuthContext)
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider')
	}
	return context
}
