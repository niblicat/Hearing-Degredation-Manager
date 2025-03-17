<script lang="ts">
    const defaultClass = "text-2xl text-gray-900 dark:text-white text-center";
    const defaultCaptionClass = "text-sm font-normal text-gray-500 dark:text-gray-400 text-center";

    interface Props {
        sub?: boolean
        children?: any
        caption?: any
        class?: string,
        captionClass?: string
    }

    let {
        children,
        caption,
        sub = false,
        class: classValue = defaultClass,
        captionClass = defaultCaptionClass
    }: Props = $props();
</script>

<div class="p-4">
    {#if sub}
        <h1 class={classValue}>
            {@render children?.()}
        </h1>
    {:else}
        <h2 class={classValue}>
            {@render children?.()}
        </h2>
    {/if}
    {#if caption}
        <p class={captionClass}>
            {@render caption?.()}
        </p>
    {/if}
</div>