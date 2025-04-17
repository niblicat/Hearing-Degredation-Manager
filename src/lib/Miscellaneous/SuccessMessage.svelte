<script lang="ts">
    import { Alert } from "flowbite-svelte";

    const defaultMessage: string = "Success message is currently not being passed into SuccessMessage component";
    const defaultClass: string = "mx-10";

    interface Props {
        success: boolean,
        successMessage: string
        class?: string
    }


    let {
        success = false,
        successMessage = defaultMessage,
        class: classValue = defaultClass,
        ...others
    }: Props = $props();

</script>

{#if success && successMessage != ""}
    <Alert color="green" border class={classValue} {...others}>
        <span class="font-heavy">Success!</span>
        {successMessage}
    </Alert>
{/if}