import { redirect } from '@sveltejs/kit'
import { obtainLoginStatus, LoginStatus } from '$lib/utility';
import { AdminStatus } from '$lib/utility';;

export const load = async (event) => {
    const loginStatus = await obtainLoginStatus(event);

    switch (loginStatus) {
        case LoginStatus.HasPerms:
            console.log("User HAS perms");
            redirect(303, '/dashboard');
        default:
            return { loginStatus };
    }
}