<script lang="ts">
    import { Alert } from "flowbite-svelte";

    interface Props {
        success: boolean,
        errorMessage: string,
        type?: "notice" | "error"
    }

    const defaultMessage: string = "Error message is currently not being passed into ErrorMessage component";

    let { 
        success = false,
        errorMessage = defaultMessage,
        type = "error"

    }: Props = $props();

</script>

{#if !success}
    <Alert color={type === "error" ? "red" : "yellow"} border class="mx-10">
        <span class="font-bold">{type === "error" ? "Error!" : "Notice!"}</span>
        {errorMessage}
    </Alert>
{/if}