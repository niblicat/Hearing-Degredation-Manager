<script lang="ts">
    import { Alert } from "flowbite-svelte";

    interface Props {
        success: boolean,
        successMessage: string
    }

    const defaultMessage: string = "Success message is currently not being passed into SuccessMessage component";

    let { success = false, successMessage = defaultMessage }: Props = $props();

</script>

{#if success && successMessage != ""}
    <Alert color="green" border class="ml-10 mr-10">
        <span class="font-heavy">Success!</span>
        {successMessage}
    </Alert>
{/if}