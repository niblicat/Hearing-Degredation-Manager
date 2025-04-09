<script lang="ts">
	import { invalidateAll } from "$app/navigation";
	import ErrorMessage from "$lib/ErrorMessage.svelte";
	import { HearingDataOneEar, HearingScreening } from "$lib/interpret";
	import type { HearingHistory } from "$lib/MyTypes";
    import { Button, ButtonGroup, Input, Label, Li, List } from "flowbite-svelte";
    import { getEmployeeHearingHistory } from "$lib/clientaccessors"

    // initialize these as such so no error message is presented on load
    let success: boolean = $state(true);
    let errorMessage: string = $state("");

    function displayError(message: string) {
        errorMessage = message;
        success = false;
    }

    let requestedID = $state("");
    let history: HearingHistory | undefined = $state(); // this is undefined when not set

    async function updateHearingHistory(): Promise<void> {
        // store history we obtain from the server
        let historyFromServer: HearingHistory | undefined;

        try {
            // getEmployeeHearingHistory() is found in serveraccessors.ts
            historyFromServer = await getEmployeeHearingHistory(requestedID);
            success = true;  // set this to true to remove any previously showing errors
        }
        catch (error: any) {
            let errorMessage = error.message;
            displayError(errorMessage ?? "An error occurred when modifying admin permissions");
        }

        // use the stored history to get whatever we need, like STS statuses and what not

        // for this implementation, we will just update the presented history with the returned history
        history = historyFromServer;
    }

    async function updateHearingHistoryKeydown(e: KeyboardEvent): Promise<void> {
        if (e.key == "Enter") await updateHearingHistory();
    }

</script>

<ErrorMessage {errorMessage} {success} />

<Label for="employee_id" class="mb-2">Employee ID</Label>
<ButtonGroup>
    <Input type="text" id="employee_id" placeholder="Use a number here (like 39)" 
        bind:value={requestedID} on:keydown={updateHearingHistoryKeydown} required />
    <Button color="yellow" class="cursor-pointer" on:click={updateHearingHistory}>
        Get All Hearing Data for Employee
    </Button>
</ButtonGroup>

{#snippet displayHearingDataOneEar(earData: HearingDataOneEar)}
    <List class="ps-10 mt-2 space-y-1" tag="ul">
        <Li>hz500: {earData.hz500}</Li>
        <Li>hz1000: {earData.hz1000}</Li>
        <Li>hz2000: {earData.hz2000}</Li>
        <Li>hz3000: {earData.hz3000}</Li>
        <Li>hz4000: {earData.hz4000}</Li>
        <Li>hz6000: {earData.hz6000}</Li>
        <Li>hz8000: {earData.hz8000}</Li>
    </List>
{/snippet}

{#if history}
    <div>
        {history.employee.dob} {history.employee.email} {history.employee.firstName} {history.employee.sex} {history.employee.lastActive}
    </div>

    Hearing History:
    <List class="space-y-4" tag="ol">
        {#each history.screenings as screening}
            <Li>YEAR: {screening.year}
                <List class="ps-5 mt-2 space-y-1" tag="ul">
                    <Li>
                        LEFT
                        {@render displayHearingDataOneEar(screening.leftEar)}
                    </Li>
                    <Li>
                        RIGHT
                        {@render displayHearingDataOneEar(screening.rightEar)}
                    </Li>
                </List>
            </Li>
        {/each}
    </List>
{/if}