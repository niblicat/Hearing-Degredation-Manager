<script>
    import PageTitle from '$lib/Miscellaneous/PageTitle.svelte';
    import { STRING_ALT_TEXT_LOGO, STRING_INDEX_CAPTION, STRING_INDEX_WELCOME } from '$lib/strings.js';
</script>

<PageTitle>
    {STRING_INDEX_WELCOME}
    {#snippet caption()}
        {STRING_INDEX_CAPTION}
    {/snippet}
</PageTitle>

<div class="max-w-3xl mx-auto">
    <img src="landingpage/logo.png" alt={STRING_ALT_TEXT_LOGO}>
</div>