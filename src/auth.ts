import { SvelteKitAuth } from "@auth/sveltekit"
import Google from "@auth/sveltekit/providers/google"
import dotenv from 'dotenv';

dotenv.config(); // Provides access to the environment file
 
export const { handle } = SvelteKitAuth({
  providers: [
    Google({
        clientId: process.env.AUTH_GOOGLE_CLIENT_ID,
        clientSecret: process.env.AUTH_GOOGLE_SECRET
    })
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token, user }) {
      //@ts-ignore
      session.access_token = token.accessToken;
      return session;
    }
  },
  secret: process.env.AUTH_SECRET ?? 'defaultSecret',
  trustHost: true
});