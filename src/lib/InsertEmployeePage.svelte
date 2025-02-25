<script lang="ts">
    import { Label, Input, Radio, Button } from 'flowbite-svelte';
    import { invalidateAll } from '$app/navigation';
    import ErrorMessage from './ErrorMessage.svelte';
    import SuccessMessage from './SuccessMessage.svelte';
	import { isDate } from './utility';
	import PageTitle from './PageTitle.svelte';

    let firstName = $state("");
    let lastName = $state("");
    let email = $state("");
    let dateOfBirth = $state("");
    let isInactive = $state("false");
    let sex = $state("");
    let lastActive = $state("");

    let success = $state(true);
    let errorMessage = $state("");
    let successMessage = $state("");

    let isInactiveBool = $derived(isInactive == "true")

    let top: HTMLElement;

    interface Props {
        showTitle?: boolean;
    }

    let { showTitle = false }: Props = $props();

    // Employee type
    type Employee = {
        employee_id: number;
        first_name: string;
        last_name: string;
        email: string;
        date_of_birth: string;
        last_active: string | null;
    };

    // Employees list
    let employees: Employee[] = [];

    function displayError(message: string) {
        console.error(message);
        errorMessage = message;
        success = false;
    }

    const validDate = /^\d{4}-\d{2}-\d{2}$/;
    export async function addEmployee() {
        // scroll to the top
        top.scrollIntoView({ behavior: 'smooth' });

        if (!firstName) {
            displayError("No first name was provided!");
            return;
        }
        if (!lastName) {
            displayError("No last name was provided!");
            return;
        }
        if (!email) {
            displayError("No email was provided!");
            return;
        }
        if (!sex) {
            displayError("No sex was provided!");
            return;
        }
        if (!dateOfBirth.match(validDate)) {
            displayError("The date of birth is invalid");
            return;
        }

        const formData = new FormData();
        formData.append('firstName', firstName);
        formData.append('lastName', lastName);
        formData.append('email', email);
        formData.append('dateOfBirth', dateOfBirth);
        formData.append('sex', sex);
        formData.append('isInactive', isInactive.toString());

        if (isInactiveBool) {
            formData.append('lastActive', lastActive);

            if (!lastActive.match(validDate)) {
                displayError("The date of last activity is invalid!");
                return;
            }
        }

        // Debug: Log form data
        console.log('Form data to be sent:', Object.fromEntries(formData.entries()));

        const response = await fetch('/dashboard?/addEmployee', {
            method: 'POST',
            body: formData,
        });

        try {
            const serverResponse = await response.json();
            const result = JSON.parse(JSON.parse(serverResponse.data)[0]);

            if (result["success"]) {
                success = true;
                successMessage = "Successfully added employee!";
                await invalidateAll();
            }
            else {
                displayError(result["message"]  ?? "Failed to add new employee");
            }

            console.log('Server Response:', serverResponse);
        } 
        catch (error: any) {
            let errorMessage = error.message;
            displayError(errorMessage ?? "An error occurred when modifying admin permissions");
        }
    }

    const formClasses = "mx-auto w-[60%] p-2.5"


</script>

<div aria-hidden="true" bind:this={top}></div>

{#if showTitle}
    <PageTitle title="Add a New Employee" sub />
{/if}

<SuccessMessage {success} {successMessage} />
<ErrorMessage {success} {errorMessage} />

<div class="{formClasses}">
    <Label for="firstName" class="block mb-2">Employee First Name</Label>
    <Input id="firstName" bind:value={firstName} placeholder="First Name" required />
</div>

<div class="mb-6 {formClasses}">
    <Label for="lastName" class="block mb-2">Employee Last Name</Label>
    <Input id="lastName" bind:value={lastName} placeholder="Last Name" required />
</div>

<div class="mb-6 {formClasses}">
    <Label for="email" class="block mb-2">Employee Email</Label>
    <Input id="email" type="email" bind:value={email} placeholder="email@company.com" required />
</div>

<div class="mb-6 {formClasses}">
    <Label for="dateOfBirth" class="block mb-2">Employee Date of Birth</Label>
    <Input id="dateOfBirth" type="date" bind:value={dateOfBirth} required />
</div>

<div class="{formClasses}">
    <Label for="sex" class="block mb-2">Sex</Label>
    <Radio name="sex" value="male" bind:group={sex}>Male</Radio>
    <Radio name="sex" value="female" bind:group={sex}>Female</Radio>
    <Radio name="sex" value="other" bind:group={sex}>Other</Radio>
</div>

<div class="{formClasses}">
    <Label for="employmentStatus" class="block mb-2">Employment Status</Label>
    <Radio name="employmentStatus" value="false" bind:group={isInactive}>Active</Radio>
    <Radio name="employmentStatus" value="true" bind:group={isInactive}>Inactive</Radio>
</div>


{#if isInactiveBool}
    <div class="mb-6 {formClasses}">
        <Label for="lastActive" class="block mb-2">Last Active Date</Label>
        <Input id="lastActive" type="date" bind:value={lastActive} />
    </div>
{/if}


<div class="{formClasses}">
    <Button 
        color="primary"
        class="w-[60%]" 
        on:click={addEmployee}>
        Submit
    </Button>
    </div>

    <div>
</div>