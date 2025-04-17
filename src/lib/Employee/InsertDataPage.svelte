<script lang="ts">

    import { Label, Input, ButtonGroup} from 'flowbite-svelte';
    import { Dropdown, Search, Button } from 'flowbite-svelte';
    import { ChevronDownOutline } from 'flowbite-svelte-icons';
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';

    import type { Employee, EmployeeSearchable } from '../MyTypes';
    import { invalidateAll } from '$app/navigation';
    import ErrorMessage from '../Miscellaneous/ErrorMessage.svelte';
    import SuccessMessage from '../Miscellaneous/SuccessMessage.svelte';
    import { isNumber, validateFrequenciesLocally } from '../utility';
	import PageTitle from '../Miscellaneous/PageTitle.svelte';
	import { convertHearingDataOneEarToStrings, convertStringsToHearingDataOneEar, type HearingDataOneEarString, type HearingScreening } from '../interpret';
	import { addHearingScreening, checkEmployeeHearingScreening, getEmployeeHearingScreening } from '../client/postrequests';
	import { EARLIEST_SCREENING_YEAR } from '../strings';

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

    let nameMenuOpen: boolean = $state(false);

    let inputValueYear: string = $state("");

    // remove any letters from inputValueYear
    $effect(() => {
        if (!(/^\d*$/).test(inputValueYear)) {
            inputValueYear = inputValueYear.replace(/\D/g, '');
        }
    });

    // indicates if the transaction has been completed
    let completed: boolean = $state(false);

    const blankFrequencies: HearingDataOneEarString = {
        hz500: "",
        hz1000: "",
        hz2000: "",
        hz3000: "",
        hz4000: "",
        hz6000: "",
        hz8000: ""
    };

    let leftFrequencies: HearingDataOneEarString = $state(blankFrequencies);
    let rightFrequencies: HearingDataOneEarString = $state(blankFrequencies);

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

    function compareFrequencyEquality(freq1: HearingDataOneEarString, freq2: HearingDataOneEarString): boolean {
        // Iterate through each frequency key and check if they are the same in both sets
        return Object.keys(freq1).every((key) => {
            // Type assertion to tell TypeScript the key is a valid key of HearingDataSingle
            return freq1[key as keyof HearingDataOneEarString] === freq2[key as keyof HearingDataOneEarString];
        });
    }

    async function fetchHearingDataForYearFromServer(employeeID: string, year: string) {
        try {
            let screening: HearingScreening = await getEmployeeHearingScreening(employeeID, year);
            const leftScreeningStringified: HearingDataOneEarString = convertHearingDataOneEarToStrings(screening.leftEar);
            const rightScreeningStringified: HearingDataOneEarString = convertHearingDataOneEarToStrings(screening.rightEar);

            assignFrequencies(leftScreeningStringified, rightScreeningStringified);
        }
        catch (error: any) {
            let errorMessage = error.message;
            displayError(errorMessage ?? "An error occurred when fetching the year's hearing data");
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

    async function checkYearAvailabilityKeydown(e: KeyboardEvent) {
        if (e.key == "Enter") {
            await checkYearAvailability();
        }
    }

    async function checkYearAvailability() {
        try {
            // Some checks to see if our ducks are in a row
            // check if employee is selected
            if (!employee && selectedEmployee == undefinedEmployeeSearchable) throw new Error("No employee was selected!");
            // check if year is valid

            const appendedEmployeeID = employee ? employee.employeeID : selectedEmployee.data.employeeID;
            const appendedYear: string = (() => {
                if (year) return year;
                
                if (!isNumber(inputValueYear)) throw new Error("The year is not a number...");
                const yearAsInteger = parseInt(inputValueYear);

                // check if year is within range
                if (yearAsInteger < EARLIEST_SCREENING_YEAR) throw new Error(`The selected year is before ${EARLIEST_SCREENING_YEAR}. Please choose a valid year.`);
                const currentYear = new Date().getFullYear();
                if (yearAsInteger > currentYear) throw new Error(`The selected year is after ${currentYear}. Please choose a valid year.`);

                return inputValueYear;
            })();
            const dataExistsForYear: boolean = await checkEmployeeHearingScreening(appendedEmployeeID, appendedYear);

            if (!dataExistsForYear) {
                success = true
                showDataFields = true;
            }
            else throw new Error("There already exists hearing data for the provided year.");
        }
        catch (error: any) {
            showDataFields = false;
            const errorMessage: string = 'Error when checking if a hearing screening occurred on the provided year: ' +
                (error.message ?? 'no defined error message');
            displayError(errorMessage);
        }
    }

    async function addHearingData() {
        try {
            if (compareFrequencyEquality(lastPulledLeftFrequencies, leftFrequencies)
                && compareFrequencyEquality(lastPulledRightFrequencies, rightFrequencies)) {
                throw new Error("There were no changes to push!");
            }
            if (!validateFrequenciesLocally(leftFrequencies, rightFrequencies)) {
                throw new Error("The values you submitted are out of range or invalid. Choose values between -10 and 90 or 'CNT'.")
            }

            const appendedEmployeeID = employee ? employee.employeeID : selectedEmployee.data.employeeID;
            const appendedYear: number = (() => {
                if (year) return parseInt(year);
                
                if (!isNumber(inputValueYear)) throw new Error("The year is not a number...");
                const yearAsInteger = parseInt(inputValueYear);

                // check if year is within range
                if (yearAsInteger < EARLIEST_SCREENING_YEAR) throw new Error(`The selected year is before ${EARLIEST_SCREENING_YEAR}. Please choose a valid year.`);
                const currentYear = new Date().getFullYear();
                if (yearAsInteger > currentYear) throw new Error(`The selected year is after ${currentYear}. Please choose a valid year.`);

                return yearAsInteger;
            })();

            const newScreening: HearingScreening = (() => {
                return {
                    year: appendedYear,
                    leftEar: convertStringsToHearingDataOneEar(leftFrequencies),
                    rightEar: convertStringsToHearingDataOneEar(rightFrequencies),
                }
            })();

            await addHearingScreening(appendedEmployeeID, newScreening, allowModify);
            displaySuccess("Successfully pushed changes to database.");
            await invalidateAll();
            completed = true;
        }
        catch (error: any) {
            const errorMessage: string = 'Error when pushing hearing data: ' +
                (error.message ?? 'no defined error message');
            displayError(errorMessage);
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
                <Button color="primary" class="text-base flex justify-between items-center cursor-pointer">{selectedEmployee.name}<ChevronDownOutline class="w-6 h-6 ms-2 text-white dark:text-white" /></Button>
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
            <caption class="p-5 text-lg font-semibold text-left text-gray-900 bg-white dark:text-white dark:bg-gray-800">
                {allowModify ? "Modify" : "Add"} A Hearing Screening
                <p class="mt-1 text-sm font-normal text-gray-500 dark:text-gray-400">
                    Values between -10 and 90 are accepted. If a value could not be recorded, type CNT. 
                </p>
            </caption>
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
                <TableBodyCell><Input bind:value={leftFrequencies.hz500} color={assignColorBasedOnValue(leftFrequencies.hz500, lastPulledLeftFrequencies.hz500)} placeholder={lastPulledLeftFrequencies.hz500} required disabled={completed} /></TableBodyCell>
                <TableBodyCell><Input bind:value={leftFrequencies.hz1000} color={assignColorBasedOnValue(leftFrequencies.hz1000, lastPulledLeftFrequencies.hz1000)} placeholder={lastPulledLeftFrequencies.hz1000} required disabled={completed} /></TableBodyCell>
                <TableBodyCell><Input bind:value={leftFrequencies.hz2000} color={assignColorBasedOnValue(leftFrequencies.hz2000, lastPulledLeftFrequencies.hz2000)} placeholder={lastPulledLeftFrequencies.hz2000} required disabled={completed} /></TableBodyCell>
                <TableBodyCell><Input bind:value={leftFrequencies.hz3000} color={assignColorBasedOnValue(leftFrequencies.hz3000, lastPulledLeftFrequencies.hz3000)} placeholder={lastPulledLeftFrequencies.hz3000} required disabled={completed} /></TableBodyCell>
                <TableBodyCell><Input bind:value={leftFrequencies.hz4000} color={assignColorBasedOnValue(leftFrequencies.hz4000, lastPulledLeftFrequencies.hz4000)} placeholder={lastPulledLeftFrequencies.hz4000} required disabled={completed} /></TableBodyCell>
                <TableBodyCell><Input bind:value={leftFrequencies.hz6000} color={assignColorBasedOnValue(leftFrequencies.hz6000, lastPulledLeftFrequencies.hz6000)} placeholder={lastPulledLeftFrequencies.hz6000} required disabled={completed} /></TableBodyCell>
                <TableBodyCell><Input bind:value={leftFrequencies.hz8000} color={assignColorBasedOnValue(leftFrequencies.hz8000, lastPulledLeftFrequencies.hz8000)} placeholder={lastPulledLeftFrequencies.hz8000} required disabled={completed} /></TableBodyCell>
            </TableBodyRow>
            <TableBodyRow>
                <TableBodyCell>Right Ear</TableBodyCell>
                <TableBodyCell><Input bind:value={rightFrequencies.hz500} color={assignColorBasedOnValue(rightFrequencies.hz500, lastPulledRightFrequencies.hz500)} placeholder={lastPulledRightFrequencies.hz500} required disabled={completed} /></TableBodyCell>
                <TableBodyCell><Input bind:value={rightFrequencies.hz1000} color={assignColorBasedOnValue(rightFrequencies.hz1000, lastPulledRightFrequencies.hz1000)} placeholder={lastPulledRightFrequencies.hz1000} required disabled={completed} /></TableBodyCell>
                <TableBodyCell><Input bind:value={rightFrequencies.hz2000} color={assignColorBasedOnValue(rightFrequencies.hz2000, lastPulledRightFrequencies.hz2000)} placeholder={lastPulledRightFrequencies.hz2000} required disabled={completed} /></TableBodyCell>
                <TableBodyCell><Input bind:value={rightFrequencies.hz3000} color={assignColorBasedOnValue(rightFrequencies.hz3000, lastPulledRightFrequencies.hz3000)} placeholder={lastPulledRightFrequencies.hz3000} required disabled={completed} /></TableBodyCell>
                <TableBodyCell><Input bind:value={rightFrequencies.hz4000} color={assignColorBasedOnValue(rightFrequencies.hz4000, lastPulledRightFrequencies.hz4000)} placeholder={lastPulledRightFrequencies.hz4000} required disabled={completed} /></TableBodyCell>
                <TableBodyCell><Input bind:value={rightFrequencies.hz6000} color={assignColorBasedOnValue(rightFrequencies.hz6000, lastPulledRightFrequencies.hz6000)} placeholder={lastPulledRightFrequencies.hz6000} required disabled={completed} /></TableBodyCell>
                <TableBodyCell><Input bind:value={rightFrequencies.hz8000} color={assignColorBasedOnValue(rightFrequencies.hz8000, lastPulledRightFrequencies.hz8000)} placeholder={lastPulledRightFrequencies.hz8000} required disabled={completed} /></TableBodyCell>
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