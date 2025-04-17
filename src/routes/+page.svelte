<script lang="ts">
    import { page } from '$app/state';
    import CustomNavbar from '$lib/Navigation/CustomNavbar.svelte';
    import ErrorMessage from '$lib/Miscellaneous/ErrorMessage.svelte';
    import HomePage from '$lib/HomePage.svelte';
    import type { UserSimple } from '$lib/MyTypes';
	import { STRING_HEADER_TITLE } from '$lib/strings.js';
    import { LoginStatus, loginMessages } from '$lib/utility';

    let { data } = $props();

    // get login status
    let loginStatus = $state(LoginStatus.None);
    $effect(() => {
        if (data.loginStatus) loginStatus = data.loginStatus;
    })

    let badLogin = $state(false);
    const badLoginStatuses = [LoginStatus.NoSession, LoginStatus.NoID, LoginStatus.NoEmail, LoginStatus.NoName];
    $effect(() => {
        badLogin = badLoginStatuses.includes(loginStatus);
    })

    // Sidebar state and visibility 
    let sidebarOpen = $state(false);
    const toggleSidebar = () => {
        sidebarOpen = !sidebarOpen;
    };

    let user: UserSimple = {
        loggedIn: !!page.data.session?.user,
        name: page.data.session?.user?.name ?? "Not logged in",
        email: page.data.session?.user?.email ?? "",
        avatar: page.data.session?.user?.image ?? ""
    }

</script>

<svelte:head>
    <title>{STRING_HEADER_TITLE}</title>
</svelte:head>

<CustomNavbar {user} sidebarOpen={sidebarOpen} toggle={toggleSidebar} />

<main class="min-h-dvh w-full bg-gray-100 dark:bg-gray-900 pt-24">
    <ErrorMessage success={loginStatus === LoginStatus.None} type={badLogin ? "error" : "notice"}
        errorMessage={loginMessages[loginStatus]} />

    <HomePage />
</main>