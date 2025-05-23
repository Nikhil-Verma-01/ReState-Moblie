import {Account, Avatars, Client, OAuthProvider} from "react-native-appwrite";
import * as Linking from "expo-linking";
import * as Browser from "expo-web-browser";

export const config = {
    platform: 'com.nik.restate',
    endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
    projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
}

export const client = new Client();

client
    .setEndpoint(config.endpoint!)
    .setProject(config.projectId!)
    .setPlatform(config.platform!)

export const avatar = new Avatars(client);
export const account = new Account(client);

export async function login() {
    try {
        const redirectUri = 'https://fra.cloud.appwrite.io/v1/account/sessions/oauth2/callback/google/682b66ad001f773576e3';
        console.log("Redirect URI: ", redirectUri);

        const response = await account.createOAuth2Token(
            OAuthProvider.Google,
            redirectUri
        );

        if(!response) throw new Error('Failed to login');

        const browserResult = await Browser.openAuthSessionAsync(
            response.toString(),
            Linking.createURL('/'),
        )
        
        if(browserResult.type !== 'success') throw new Error('Failed to OAuth');

        const url = new URL(browserResult.url);

        const secret = url.searchParams.get('secret')?.toString();
        const userId = url.searchParams.get('userId')?.toString();

        if(!secret || !userId) throw new Error('Failed to Login, No userId and secret exists.');

        const session = await account.createSession(userId, secret);

        if(!session) throw new Error('Failed to create a session');

        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export async function logout() {
    try {
        await account.deleteSession('current');
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export async function getCurrentUser() {
    try {
        const response = await account.get();

        if(response.$id){
            const userAvatar = avatar.getInitials(response.name);

            return{
                ...response,
                avatar: userAvatar.toString(),
            }
        }
        return response;
    } catch (error) {
        console.error(error);
        return null;
    }
}
