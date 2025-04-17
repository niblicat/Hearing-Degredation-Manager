<script lang="ts">
    import { DarkMode, Modal, Navbar, NavBrand } from 'flowbite-svelte';
    import { Button } from 'flowbite-svelte';
    import CustomAvatar from '../Miscellaneous/CustomAvatar.svelte';
    import { PageCategory, type UserSimple } from '../MyTypes';
    import { BarsOutline, CloseOutline } from 'flowbite-svelte-icons';
    import { page } from '$app/state';
	import InfoButton from '../Miscellaneous/InfoButton.svelte';
	import Information from '$lib/Information/Information.svelte';
	import { STRING_HEADER_TITLE } from '../strings';

    let activeURLHash = $derived(page.url.hash);

    interface Props {
        hasSidebar?: any;
        sidebarOpen: any;
        user: UserSimple;
        toggle?: any;
    }

    let { hasSidebar = false, sidebarOpen, user, toggle }: Props = $props();

    function sidebarToggleDispatch() {
        toggle();
    }

    let currentPageCategory = $derived.by(() => {
        switch (activeURLHash) {
            case "#":
            case "":
                return PageCategory.Home;
            case "#admin":
                return PageCategory.Admin;
            case "#employees":
                return PageCategory.Employee;
            case "#mailings":
                return PageCategory.Mailing;
            default:
                return PageCategory.Other;
        }
    })

    let infoModal = $state(false);
    const darkClass = "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-hidden rounded-lg text-sm p-2.5";
</script>

<Navbar color="primary" class="fixed z-30" navContainerClass="flex flex-nowrap space-x-4 h-16">
    {#if hasSidebar}
        <Button color="primary" class="w-8 h-10 cursor-pointer !z-50" on:click={sidebarToggleDispatch}>
            {#if sidebarOpen}
                <CloseOutline size="xl" />
            {:else}
                <BarsOutline size="xl" />
            {/if}
        </Button>
    {/if}

    <NavBrand href="/dashboard" class="cursor-pointer mr-0">
        <img src="favicon.png" class="me-3 h-6 sm:h-9" alt="Hearing Panel Logo" />
        <span class="text-3xl font-bold text-[clamp(0.5rem,_3vw,_2.5rem)] overflow-ellipsis">
            {STRING_HEADER_TITLE}
        </span>
    </NavBrand>
    
    <div class="ml-auto flex">
        <DarkMode class={darkClass + " mr-4 cursor-pointer"} />
        <InfoButton class="p-1! mr-4 cursor-pointer" page={currentPageCategory} bind:infoModal={infoModal} />
        <CustomAvatar {user} />
    </div>
</Navbar>

<Modal title="Information" bind:open={infoModal} placement="top-right" outsideclose>
    <Information page={currentPageCategory} />
    
    <svelte:fragment slot="footer">
        <Button class="cursor-pointer" color="primary" on:click={() => infoModal = false}>OK</Button>
    </svelte:fragment>
</Modal>
