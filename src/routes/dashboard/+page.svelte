<script lang="ts">
    import { page } from '$app/state';
	import CustomNavbar from '$lib/CustomNavbar.svelte';
	import CustomSidebar from '$lib/CustomSidebar.svelte';
	import EmployeesPage from '$lib/EmployeesPage.svelte';
    import MailingPage from '$lib/MailingPage.svelte';
    import AdminPage from '$lib/AdminPage.svelte';
	import type { UserSimple } from '$lib/MyTypes.js';
	import Information from '$lib/Information.svelte';
    let { data } = $props();

    let activeURL = $derived(page.url.pathname);
    let activeURLHash = $derived(page.url.hash);

    let admins = $derived(data.admins);
    let employees = $derived(data.employees);

    // sidebar state and visibility 
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

<CustomNavbar {user} hasSidebar
    sidebarOpen={sidebarOpen} toggle={toggleSidebar} />

<CustomSidebar sidebarOpen={sidebarOpen}
    activeUrl={activeURLHash} toggle={toggleSidebar} />

<div id="content" class="h-dvh bg-gray-100 pt-16">
    {#if activeURLHash == "#employees"}
        <EmployeesPage {employees} />
    {:else if activeURLHash == "#mailings"}
<<<<<<< HEAD
        <MailingPage {employees} />
=======
        <MailingPage />
>>>>>>> 727e42dc4863ffea82dd0d9fe6092998c1524db6
    {:else if activeURLHash == "#admin"}
        <AdminPage {admins} />
    {:else}
        <!-- User who is not logged in should be redirected to home (no hash) -->
        <div class="flex justify-center p-4 text-2xl">Welcome to the dashboard</div>
        <Information />
    {/if}
</div>