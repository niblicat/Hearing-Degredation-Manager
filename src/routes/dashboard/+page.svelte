<script lang="ts">
    import { page } from '$app/state';
    import CustomNavbar from '$lib/CustomNavbar.svelte';
    import CustomSidebar from '$lib/CustomSidebar.svelte';
    import EmployeesPage from '$lib/EmployeesPage.svelte';
    import MailingPage from '$lib/MailingPage.svelte';
    import AdminPage from '$lib/AdminPage.svelte';
    import Information from '$lib/Information.svelte'
    import type { UserSimple } from '$lib/MyTypes.js';
    import PageTitle from '$lib/PageTitle.svelte';
	import { STRING_HEADER_TITLE } from '$lib/strings.js';
	import HomePageDashboard from '$lib/HomePageDashboard.svelte';
    let { data } = $props();

    let activeURL = $derived(page.url.pathname);
    let activeURLHash = $derived(page.url.hash);

    let admins = $derived(data.admins);
    let employees = $derived(data.employees);

    // sidebar state and visibility 
    let sidebarOpen = $state(false);
    function toggleSidebar() {
        sidebarOpen = !sidebarOpen;
    };

    let user: UserSimple = {
        loggedIn: !!page.data.session?.user,
        name: page.data.session?.user?.name || "Not logged in",
        email: page.data.session?.user?.email || "",
        avatar: page.data.session?.user?.image || ""
    }

</script>

<svelte:head>
    <title>{STRING_HEADER_TITLE}</title>
</svelte:head>

<CustomNavbar {user} hasSidebar
    sidebarOpen={sidebarOpen} toggle={toggleSidebar} />

<CustomSidebar sidebarOpen={sidebarOpen}
    activeUrl={activeURLHash} toggle={toggleSidebar} />

<main class="min-h-dvh w-full bg-gray-100 dark:bg-gray-900 pt-24 px-4">
    {#if activeURLHash == "#employees"}
        <EmployeesPage {employees} />
    {:else if activeURLHash == "#mailings"}
        <MailingPage employees={employees}/>
    {:else if activeURLHash == "#admin"}
        <AdminPage {admins} />
    {:else}
        <HomePageDashboard />
    {/if}
</main>