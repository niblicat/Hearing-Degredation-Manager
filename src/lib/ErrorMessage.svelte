<script lang="ts">
    import { Alert } from "flowbite-svelte";

    interface Props {
        success: boolean,
        errorMessage: string
    }

    const defaultMessage: string = "Error message is currently not being passed into ErrorMessage component";

    let { success = false, errorMessage = defaultMessage }: Props = $props();

</script>

{#if !success}
    <Alert color="red" border class="ml-10 mr-10">
        <span class="font-heavy">Error!</span>
        {errorMessage}
    </Alert>
{/if}