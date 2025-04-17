<script lang="ts">
    import { Alert } from "flowbite-svelte";

    const defaultMessage: string = "Error message is currently not being passed into ErrorMessage component";
    const defaultClass: string = "mx-10 mb-4";

    interface Props {
        success: boolean,
        errorMessage: string,
        type?: "notice" | "error"
        class?: string
    }


    let { 
        success = false,
        errorMessage = defaultMessage,
        type = "error",
        class: classValue = defaultClass,
        ...others
    }: Props = $props();

</script>

{#if !success}
    <Alert color={type === "error" ? "red" : "yellow"} border class={classValue} {...others}>
        <span class="font-bold">{type === "error" ? "Error!" : "Notice!"}</span>
        {errorMessage}
    </Alert>
{/if}