<script lang="ts">
    import { page } from '$app/state';
    import { Avatar, Dropdown, DropdownItem, DropdownHeader, DropdownDivider } from 'flowbite-svelte';
    import type { UserSimple } from './MyTypes';
    
    interface Props {
        user: UserSimple;
    }

    let { user }: Props = $props();

    let encodedURL = $derived(encodeURIComponent(page.url.href ?? ""));
</script>


<Avatar id="avatar-menu" class="cursor-pointer shadow-sm shadow-black z-50"
    src={user.avatar.replace(/=(.*)/, '')} size="md" />
<Dropdown placement="bottom-start" triggeredBy="#avatar-menu">
    <DropdownHeader>
        <span class="block text-sm">{user.name}</span>
        <span class="block truncate text-sm font-medium">{user.email}</span>
    </DropdownHeader>
    {#if user.loggedIn}
        <DropdownItem href={`/auth/signout?callbackUrl=${encodedURL}`} class="text-red-700 hover:text-red-800 dark:text-red-300 dark:hover:text-red-400 hover:no-underline cursor-pointer">
            Log Out
        </DropdownItem>
    {:else}
        <DropdownItem href={`/auth/signin?callbackUrl=${encodedURL}`} class="text-primary-700 hover:text-primary-800 dark:text-primary-300 dark:hover:text-primary-400 hover:no-underline cursor-pointer">
            Log In
        </DropdownItem>
    {/if}
</Dropdown>