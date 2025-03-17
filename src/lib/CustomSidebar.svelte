<script lang="ts">
    import { Sidebar, SidebarGroup, SidebarItem, SidebarWrapper } from 'flowbite-svelte';
    import { GridSolid, MailBoxSolid, UserSolid, ArrowRightToBracketOutline, HomeSolid } from 'flowbite-svelte-icons';

    import { slide } from 'svelte/transition';
    import { backIn } from 'svelte/easing';
	import { clickOutside, tapOutside } from 'svelte-outside';

    let { sidebarOpen, activeUrl, toggle } = $props();

    let url: string = $state("#")

    $effect(() => {
        if (activeUrl == "") {
            url = "#";
        }
        else {
            url = activeUrl;
        }
    });

    let clickOutsideLock = false;
    const clickOutsideDelayMilliseconds = 500;

    // handles sidebar opening timing to prevent spam open & close
    $effect(() => {
        if (sidebarOpen) {
            clickOutsideLock = true;
            setTimeout(() => {
                clickOutsideLock = false;
            }, clickOutsideDelayMilliseconds);
        }
    })

    async function sidebarToggleDispatch() {
        toggle();
    }

    function clickedOutside() {
        if (sidebarOpen && !clickOutsideLock) toggle();
    }

    let activeClass = 'flex items-center p-2 text-base font-normal text-primary-900 bg-primary-200 dark:bg-primary-700 rounded-lg dark:text-white hover:bg-primary-100 dark:hover:bg-gray-700';
    let nonActiveClass = 'flex items-center p-2 text-base font-normal text-green-900 rounded-lg dark:text-white hover:bg-green-100 dark:hover:bg-green-700';
</script>

{#key sidebarOpen}
    <div out:slide={{ axis: 'x', easing: backIn }} in:slide={{ axis: 'x' }} 
        use:clickOutside={clickedOutside} use:tapOutside={clickedOutside}
        class="fixed pointer-events-none left-0 w-80 h-screen z-20 pt-20">
        {#if sidebarOpen}
            <Sidebar activeUrl={url} {activeClass} {nonActiveClass} class="pointer-events-auto h-full">
                <!-- Content wrapper inside the sidebar with padding to push content down -->
                <SidebarWrapper class="overflow-y-auto h-full">
                    <SidebarGroup>
                        <SidebarItem on:click={sidebarToggleDispatch} label="Dashboard" href="#">
                            <HomeSolid/>
                        </SidebarItem>
                        <SidebarItem on:click={sidebarToggleDispatch} label="Admins" href="#admin">
                            <UserSolid/>
                        </SidebarItem>
                        <SidebarItem on:click={sidebarToggleDispatch} label="Employees" href="#employees">
                            <GridSolid/>
                        </SidebarItem>
                        <SidebarItem on:click={sidebarToggleDispatch} label="Mailings" href="#mailings">
                            <MailBoxSolid/>
                        </SidebarItem>
                    </SidebarGroup>
                </SidebarWrapper>
            </Sidebar>
        {/if}
    </div>
{/key}