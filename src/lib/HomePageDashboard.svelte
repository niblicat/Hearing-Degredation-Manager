<script>
    import Information from "$lib/Information/Information.svelte";
    import PageTitle from "$lib/Miscellaneous/PageTitle.svelte";
</script>

<PageTitle>
    Welcome to the Dashboard!
    {#snippet caption()}
        Check out the dropdowns below to get started. Use the sidebar to navigate through the various pages.
    {/snippet}
</PageTitle>

<div class="max-w-3xl mx-auto">
    <Information />
</div>