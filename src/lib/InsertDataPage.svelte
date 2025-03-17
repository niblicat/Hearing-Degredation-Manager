<script lang="ts">

    import { Label, Input, ButtonGroup} from 'flowbite-svelte';
    import { Dropdown, Search, Button } from 'flowbite-svelte';
    import { ChevronDownOutline } from 'flowbite-svelte-icons';
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';

    import type { Employee, EmployeeSearchable, HearingDataSingle } from './MyTypes';
    import { invalidateAll } from '$app/navigation';
    import ErrorMessage from './ErrorMessage.svelte';
    import SuccessMessage from './SuccessMessage.svelte';
    import { isNumber, validateFrequenciesLocally } from './utility';
	import PageTitle from './PageTitle.svelte';

    interface Props {
        employees?: Array<Employee>,
        year?: string,
        employee?: Employee,
        allowModify?: boolean,
        showTitle?: boolean
    }

    let { employees = [], year, employee, allowModify = false, showTitle = false }: Props = $props();

    const undefinedEmployee: Employee = {
        employeeID: "-1",
        firstName: "Undefined",
        lastName: "Undefined",
        email: "Undefined",
        dob: "Undefined",
        activeStatus: "Undefined",
        sex: "Undefined"
    };

    const undefinedEmployeeSearchable: EmployeeSearchable = $state({
        name: "Select an employee",
        data: undefinedEmployee
    });

    // used to make it easier to access employees from their full name


    // employee map that is search friendly
    // name will hold first and last so it's easier to search
    // actual employee data (id and stuff) is in employee_dict.data
    let employee_dict = $derived(employees.map((employee) => ({
        name: `${employee.firstName} ${employee.lastName}`,
        data: employee
    })) as Array<EmployeeSearchable>);

    let selectedEmployee: EmployeeSearchable = $state(undefinedEmployeeSearchable);

    let inputValueName: string = $state("");

    // When the user types into the selection text box, the employees list should filter
    let filtered_employees = $derived(employee_dict.filter(item => item.name.toLowerCase().includes(inputValueName.toLowerCase())));

    // Functions to update selected employee and year
    const selectEmployee = (employee: EmployeeSearchable) => {
        selectedEmployee = employee;
        nameMenuOpen = false; 
    };

    let showDataFields = $state((employee && year) ? true : false);

    let nameMenuOpen = $state(false);

    let inputValueYear = $state("");
    const blankFrequencies: HearingDataSingle = {
        hz500: "",
        hz1000: "",
        hz2000: "",
        hz3000: "",
        hz4000: "",
        hz6000: "",
        hz8000: ""
    };

    let leftFrequencies = $state(blankFrequencies);
    let rightFrequencies = $state(blankFrequencies);

    $effect(() => {
        // need to get hearing data for both ears ear
        // put that hearing data into the left and right frequencies
        if (employee && year) fetchHearingDataForYearFromServer(employee.employeeID, year);
    })


    let lastPulledLeftFrequencies = $state(blankFrequencies);
    let lastPulledRightFrequencies = $state(blankFrequencies);

    function assignFrequencies(leftEar: any, rightEar: any) {
        leftFrequencies = leftEar;
        lastPulledLeftFrequencies = leftEar;
        rightFrequencies = rightEar;
        lastPulledRightFrequencies = rightEar;
    }

    function compareFrequencieEquality(freq1: HearingDataSingle, freq2: HearingDataSingle): boolean {
        // Iterate through each frequency key and check if they are the same in both sets
        return Object.keys(freq1).every((key) => {
            // Type assertion to tell TypeScript the key is a valid key of HearingDataSingle
            return freq1[key as keyof HearingDataSingle] === freq2[key as keyof HearingDataSingle];
        });
    }


    async function fetchHearingDataForYearFromServer(employeeID: string, year: string) {
        try {
            const formData = new FormData();
            formData.append('employeeID', employeeID);
            formData.append('year', year);

            const response = await fetch('/dashboard?/fetchHearingDataForYear', {
                method: 'POST',
                body: formData,
            });
            
            const serverResponse = await response.json();
            const result = JSON.parse(JSON.parse(serverResponse.data)[0]);
            
            if (result["success"]) {
                const { year, leftEar, rightEar } = result.hearingData;
                console.log(leftEar);
                assignFrequencies(leftEar, rightEar);

            } 
            else {
                displayError(`Failed to fetch hearing data for the selected year... ${result["message"] ?? "No error message supplied."}`);
            }
        }
        catch (error) {
            console.error('Error fetching hearing data:', error);
            displayError('Error fetching hearing data');
        }
    }

    let success = $state(true);
    let errorMessage = $state("");
    let successMessage = $state("");

    function displayError(message: string) {
        errorMessage = message;
        success = false;
    }

    function displaySuccess(message: string) {
        successMessage = message;
        success = true;
    }

    function preprocessFrequencies(frequencies: Record<string, string>) {
        return Object.fromEntries(
            Object.entries(frequencies).map(([key, value]) => [
                key, 
                typeof value === 'string' && value.trim().toUpperCase() === "CNT" ? null : value
            ])
        );
    }

    async function checkYearAvailabilityKeydown(e: KeyboardEvent) {
        if (e.key == "Enter") {
            await checkYearAvailability();
        }
    }

    const earliestYear = 1957;

    async function checkYearAvailability() {
        // Some checks to see if our ducks are in a row
        if (!employee && selectedEmployee == undefinedEmployeeSearchable) {
            displayError("No employee was selected!");
            return;
        }
        if (!isNumber(inputValueYear)) {
            displayError("The year is not a number...");
            return;
        }
        const yearAsInteger = parseInt(inputValueYear);
        if (yearAsInteger < earliestYear) {
            displayError(`The selected year is before ${earliestYear}. Please choose a valid year.`);
            return;
        }
        const currentYear = new Date().getFullYear();
        if (yearAsInteger > currentYear) {
            displayError(`The selected year is after ${currentYear}. Please choose a valid year.`);
            return;
        }
        
        const formData = new FormData();

        const appendedEmployeeID = employee ? employee.employeeID : selectedEmployee.data.employeeID;
        formData.append('id', appendedEmployeeID); // Pass id
        const appendedYear = year ? year : inputValueYear;
        formData.append('year', appendedYear); // Year of data

        const response = await fetch('/dashboard?/checkYearAvailability', {
            method: 'POST',
            body: formData,
        });
        showDataFields = false;
        try {
            console.log('Raw server response:', response);
            const serverResponse = await response.json()
            const result = JSON.parse(JSON.parse(serverResponse.data)[0]);

            if (result["success"]) {
                success = true;
                showDataFields = true;
            } else {
                displayError(result["message"] ?? "Failed to add check available years.");
                
            }
        } 
        catch (error: any) {
            console.error('Error during fetch or JSON parsing: ', error.message ?? 'no defined error message');
            displayError(error.message ?? 'An error occurred');
        }
    }

    async function addHearingData() {
        if (compareFrequencieEquality(lastPulledLeftFrequencies, leftFrequencies) && compareFrequencieEquality(lastPulledRightFrequencies, rightFrequencies)) {
            displayError("There were no changes to push!");
            return;
        }
        if (!validateFrequenciesLocally(leftFrequencies, rightFrequencies)) {
            displayError("The values you submitted are out of range or invalid. Choose values between -10 and 90 or 'CNT'.")
            return;
        }

        const formData = new FormData();
        formData.append('leftEarFrequencies', JSON.stringify(preprocessFrequencies(leftFrequencies))); // Left ear data
        formData.append('rightEarFrequencies', JSON.stringify(preprocessFrequencies(rightFrequencies))); // Right ear data

        const appendedEmployeeID = employee ? employee.employeeID : selectedEmployee.data.employeeID;
        formData.append('id', appendedEmployeeID); // Pass id
        const appendedYear = year ? year : inputValueYear;
        formData.append('year', appendedYear); // Year of data

        // Debug: Log form data
        console.log('Form data to be sent:', Object.fromEntries(formData.entries()));

        const location = allowModify ? '/dashboard?/modifyHearingData' : '/dashboard?/addHearingData';

        const response = await fetch(location, {
            method: 'POST',
            body: formData,
        });

        try {
            // Debug: Log raw response
            console.log('Raw server response:', response);
            const serverResponse = await response.json()
            const result = JSON.parse(JSON.parse(serverResponse.data)[0]);

            if (result["success"]) {
                displaySuccess("Successfully pushed changes to database.");
                await invalidateAll();
            } else {
                displayError(result["message"] ?? "Failed to add employee data.");
            }
        } 
        catch (error: any) {
            console.error('Error during fetch or JSON parsing: ', error.message ?? 'no defined error message');
            displayError(error.message ?? 'An error occurred');
        }
    }

    function assignColorBasedOnValue(freq: string, oldFreq: string): "base" | "green" | "red" | undefined {
        if (!(isNumber(freq) || freq == "CNT")) {
            console.log(freq)
            return "red";
        }
        const freqInt = parseInt(freq);
        if (freqInt < -10 || freqInt > 90) {
            return "red";
        }
        if (freq != oldFreq) {
            return "green";
        }
        return "base";
    }

</script>
{#if showTitle}
    <PageTitle sub>
        {allowModify ? "Modify Data" : "Add New Data"}
    </PageTitle>
{/if}

<SuccessMessage {success} {successMessage} />
<ErrorMessage {success} {errorMessage} />

{#if !employee || !year}
    <div class="flex justify-center gap-4 w-4/5 p-5 m-auto"> 
        {#if !employee}
            <!-- Select Employee Dropdown -->
            <div class="w-m">
                <Label for="employee" class="block mb-2">Select Employee</Label>
                <Button color="primary" class="text-base flex justify-between items-center cursor-pointer" style="width:300px">{selectedEmployee.name}<ChevronDownOutline class="w-6 h-6 ms-2 text-white dark:text-white" /></Button>
                <Dropdown bind:open={nameMenuOpen} class="overflow-y-auto px-3 pb-3 text-sm h-44">
                <div  class="p-3">
                    <Search size="md" bind:value={inputValueName}/>
                </div>
                    {#each filtered_employees as filtedEmployee}
                        <li class="rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-600">
                            <button type="button" class="w-full text-left cursor-pointer" onclick={() => selectEmployee(filtedEmployee)}>
                                {filtedEmployee.name}
                            </button>
                        </li>
                    {/each}
                </Dropdown>
            </div>
        {/if}
        {#if !year}
            <!-- Add Year Input -->
            <div class="w-m ml-16">
                <Label for="year" class="block mb-2">Year of Data Recording</Label>
                <ButtonGroup class="w-full">
                    <Input id="year" placeholder="1957" 
                        bind:value={inputValueYear} on:keydown={checkYearAvailabilityKeydown} />
                    <Button class="cursor-pointer" color="primary" on:click={checkYearAvailability}>
                        Check
                    </Button>
                </ButtonGroup>
            </div>
        {/if}
    </div>
{/if}

{#if showDataFields}
    <div class="flex-column justify-center mx-4">
        <Table>
            <TableHead>
                <TableHeadCell></TableHeadCell>
                <TableHeadCell>500 Hz</TableHeadCell>
                <TableHeadCell>1000 Hz</TableHeadCell>
                <TableHeadCell>2000 Hz</TableHeadCell>
                <TableHeadCell>3000 Hz</TableHeadCell>
                <TableHeadCell>4000 Hz</TableHeadCell>
                <TableHeadCell>6000 Hz</TableHeadCell>
                <TableHeadCell>8000 Hz</TableHeadCell>
            </TableHead>
            <TableBody tableBodyClass="divide-y">
            <TableBodyRow>
                <TableBodyCell>Left Ear</TableBodyCell>
                <TableBodyCell><Input bind:value={leftFrequencies.hz500} color={assignColorBasedOnValue(leftFrequencies.hz500, lastPulledLeftFrequencies.hz500)} placeholder={lastPulledLeftFrequencies.hz500} required /></TableBodyCell>
                <TableBodyCell><Input bind:value={leftFrequencies.hz1000} color={assignColorBasedOnValue(leftFrequencies.hz1000, lastPulledLeftFrequencies.hz1000)} placeholder={lastPulledLeftFrequencies.hz1000} required /></TableBodyCell>
                <TableBodyCell><Input bind:value={leftFrequencies.hz2000} color={assignColorBasedOnValue(leftFrequencies.hz2000, lastPulledLeftFrequencies.hz2000)} placeholder={lastPulledLeftFrequencies.hz2000} required /></TableBodyCell>
                <TableBodyCell><Input bind:value={leftFrequencies.hz3000} color={assignColorBasedOnValue(leftFrequencies.hz3000, lastPulledLeftFrequencies.hz3000)} placeholder={lastPulledLeftFrequencies.hz3000} required /></TableBodyCell>
                <TableBodyCell><Input bind:value={leftFrequencies.hz4000} color={assignColorBasedOnValue(leftFrequencies.hz4000, lastPulledLeftFrequencies.hz4000)} placeholder={lastPulledLeftFrequencies.hz4000} required /></TableBodyCell>
                <TableBodyCell><Input bind:value={leftFrequencies.hz6000} color={assignColorBasedOnValue(leftFrequencies.hz6000, lastPulledLeftFrequencies.hz6000)} placeholder={lastPulledLeftFrequencies.hz6000} required /></TableBodyCell>
                <TableBodyCell><Input bind:value={leftFrequencies.hz8000} color={assignColorBasedOnValue(leftFrequencies.hz8000, lastPulledLeftFrequencies.hz8000)} placeholder={lastPulledLeftFrequencies.hz8000} required /></TableBodyCell>
            </TableBodyRow>
            <TableBodyRow>
                <TableBodyCell>Right Ear</TableBodyCell>
                <TableBodyCell><Input bind:value={rightFrequencies.hz500} color={assignColorBasedOnValue(rightFrequencies.hz500, lastPulledRightFrequencies.hz500)} placeholder={lastPulledRightFrequencies.hz500} required /></TableBodyCell>
                <TableBodyCell><Input bind:value={rightFrequencies.hz1000} color={assignColorBasedOnValue(rightFrequencies.hz1000, lastPulledRightFrequencies.hz1000)} placeholder={lastPulledRightFrequencies.hz1000} required /></TableBodyCell>
                <TableBodyCell><Input bind:value={rightFrequencies.hz2000} color={assignColorBasedOnValue(rightFrequencies.hz2000, lastPulledRightFrequencies.hz2000)} placeholder={lastPulledRightFrequencies.hz2000} required /></TableBodyCell>
                <TableBodyCell><Input bind:value={rightFrequencies.hz3000} color={assignColorBasedOnValue(rightFrequencies.hz3000, lastPulledRightFrequencies.hz3000)} placeholder={lastPulledRightFrequencies.hz3000} required /></TableBodyCell>
                <TableBodyCell><Input bind:value={rightFrequencies.hz4000} color={assignColorBasedOnValue(rightFrequencies.hz4000, lastPulledRightFrequencies.hz4000)} placeholder={lastPulledRightFrequencies.hz4000} required /></TableBodyCell>
                <TableBodyCell><Input bind:value={rightFrequencies.hz6000} color={assignColorBasedOnValue(rightFrequencies.hz6000, lastPulledRightFrequencies.hz6000)} placeholder={lastPulledRightFrequencies.hz6000} required /></TableBodyCell>
                <TableBodyCell><Input bind:value={rightFrequencies.hz8000} color={assignColorBasedOnValue(rightFrequencies.hz8000, lastPulledRightFrequencies.hz8000)} placeholder={lastPulledRightFrequencies.hz8000} required /></TableBodyCell>
            </TableBodyRow>
            </TableBody>
        </Table>
    </div>

    <div class="m-auto w-3/5 p-5 text-center">
        <Button 
            color="primary"
            class="cursor-pointer"
            on:click={addHearingData}>
            Submit
        </Button>
    </div>
{/if}