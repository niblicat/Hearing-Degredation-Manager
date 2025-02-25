<script lang="ts">
    import { page } from '$app/state';
    import CustomNavbar from '$lib/CustomNavbar.svelte';
    import type { UserSimple } from '$lib/MyTypes';
    import { LoginStatus, loginMessages } from '$lib/utility';
    import { Alert, Button } from 'flowbite-svelte';

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
        name: page.data.session?.user?.name || "Not logged in",
        email: page.data.session?.user?.email || "",
        avatar: page.data.session?.user?.image || ""
    }

</script>

<CustomNavbar {user} sidebarOpen={sidebarOpen} toggle={toggleSidebar} />

<div id="content" class="h-dvh bg-gray-100 pt-16">
    {#if loginStatus != LoginStatus.None}
        <Alert color={badLogin ? "red" : "yellow"} 
            class="ml-10 mr-10">
            {loginMessages[loginStatus]}
        </Alert>
    {/if}

    <!-- Main content -->
    <section class="flex flex-col items-center justify-center py-12">
        <div class="max-w-3xl text-center">
            <h1 class="text-4xl font-extrabold text-gray-800 mb-6">Welcome to the Speech-Language-Hearing Center's Hearing Degradation Software</h1>
            <p class="text-lg text-gray-600 mb-8">
                Access powerful features and manage everything efficiently in our easy-to-use dashboard.
            </p>

            <!-- Correct Image Reference -->
            <img src="landingpage/SIUE_logo_2024.png" alt="SIUE Logo">

        </div>
    </section>
</div>