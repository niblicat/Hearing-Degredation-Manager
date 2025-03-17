import { SvelteKitAuth } from "@auth/sveltekit";
import Google from "@auth/sveltekit/providers/google";
import Github from "@auth/sveltekit/providers/github";
import type { Handle } from "@sveltejs/kit";

export const { handle, signIn, signOut } = SvelteKitAuth(async (event) => {
    const authOptions = {
        providers: [
            Google({ 
                clientId: process.env.AUTH_GOOGLE_ID,
                clientSecret: process.env.AUTH_GOOGLE_SECRET
            }),
            Github({ 
                clientId: process.env.AUTH_GITHUB_ID,
                clientSecret: process.env.AUTH_GITHUB_SECRET
            })
        ],
        secret: process.env.AUTH_SECRET,
        trustHost: true,
    }

    return authOptions;
}) satisfies { handle: Handle };;