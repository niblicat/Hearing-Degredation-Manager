<script lang="ts">
    import { Navbar, NavBrand } from 'flowbite-svelte';
    import { Button } from 'flowbite-svelte';

    import CustomAvatar from './CustomAvatar.svelte';
    import type { UserSimple } from './MyTypes';
	import { BarsOutline, CloseOutline } from 'flowbite-svelte-icons';

    interface Props {
        hasSidebar?: any;
        sidebarOpen: any;
        user: UserSimple;
        toggle: any;
    }

    let { hasSidebar = false, sidebarOpen, user, toggle }: Props = $props();

    function sidebarToggleDispatch() {
        toggle();
    }

</script>

{#if hasSidebar}
    <Button color="primary" class="fixed top-2.5 left-5 z-50 w-8 h-10" on:click={sidebarToggleDispatch}>
        {#if sidebarOpen}
            <CloseOutline size="xl" />
        {:else}
            <BarsOutline size="xl" />
        {/if}
    </Button>
{/if}

<Navbar color="primary" class="fixed flex justify-between items-center h-16 z-30">
    <NavBrand href="/dashboard" class="w-full text-center">
        <span class="m-auto relative inline-block overflow-hidden whitespace-nowrap text-3xl font-bold text-[clamp(0.75rem,_3vw,_2rem)]">
            SIUE SLHC Employee Hearing Panel
        </span>
    </NavBrand>
    <CustomAvatar {user} />
</Navbar>