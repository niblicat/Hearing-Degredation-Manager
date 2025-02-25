<script lang="ts">
    interface Props {
        title: string
        caption?: string
        sub?: boolean
    }

    let { title, caption, sub = false }: Props = $props();
</script>

<div class="p-4">
    {#if sub}
        <h1 class="text-2xl text-center">{title}</h1>
    {:else}
        <h2 class="text-2xl text-center">{title}</h2>
    {/if}
    {#if caption}
        <p class="text-sm font-normal text-gray-500 dark:text-gray-400 text-center">{caption}</p>
    {/if}
</div>