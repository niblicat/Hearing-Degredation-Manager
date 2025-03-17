<script>
    import PageTitle from '$lib/PageTitle.svelte';
    import { STRING_INDEX_CAPTION, STRING_INDEX_WELCOME } from '$lib/strings.js';
</script>

<PageTitle>
    {STRING_INDEX_WELCOME}
    {#snippet caption()}
        {STRING_INDEX_CAPTION}
    {/snippet}
</PageTitle>

<div class="max-w-3xl mx-auto">
    <img src="landingpage/SIUE_logo_2024.png" alt="SIUE Logo">
</div>