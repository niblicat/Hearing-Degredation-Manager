<script lang="ts">
    import { Button } from "flowbite-svelte";
    import { PageCategory } from "../MyTypes";
    import { InfoCircleSolid } from "flowbite-svelte-icons";
    import { Tooltip } from "flowbite-svelte"

    const defaultClass = "p-1! cursor-pointer";

    interface Props {
        page: PageCategory
        infoModal: boolean
        class?: string
        tooltipText?: string
    }
    const defaultCategory = PageCategory.Home;

    let {
        page = defaultCategory,
        // used to activate external info modal defined by encapsulating component
        infoModal = $bindable(false),
        class: classValue = defaultClass,
        tooltipText = "Learn more about this page"
    }: Props = $props();
</script>

{#if page != PageCategory.Home}
    <Button size="sm" color="none" class={classValue} on:click={() => infoModal = true}>
        <InfoCircleSolid />
    </Button>
    <Tooltip placement="left">
        {tooltipText}
    </Tooltip>
{/if}