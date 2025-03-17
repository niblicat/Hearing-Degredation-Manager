<script lang="ts">

    import { Button, Search, Modal, Label, Input, Radio, Tooltip } from 'flowbite-svelte';
    import { ChevronDownOutline, UserAddSolid, CirclePlusSolid, EditSolid } from 'flowbite-svelte-icons';
    import { Dropdown } from 'flowbite-svelte';
    import { AnomalyStatus } from "./interpret";
    import type { Employee, EmployeeSearchable } from './MyTypes';
    import InsertEmployeePage from './InsertEmployeePage.svelte';
    import { extractFrequencies } from './utility';
    import InsertDataPage from './InsertDataPage.svelte';
    import PageTitle from './PageTitle.svelte';
    import ErrorMessage from './ErrorMessage.svelte';
    import EmployeeData from './EmployeeData.svelte';

    interface Props {
        employees: Array<Employee>;
    }

    let { employees }: Props = $props();

    // Data for scatter plot
    let rightBaselineHearingData = $state<Array<number>>([]);
    let rightNewHearingData =  $state<Array<number>>([]);
    let leftBaselineHearingData =  $state<Array<number>>([]);
    let leftNewHearingData =  $state<Array<number>>([]);
    
    let hearingHistory = $state<Array<{year: string, leftStatus: string, rightStatus: string}>>([]);

    // Selected employee and year
    let selectedYear = $state("No year selected");
    let selectedEmail = $state("No data selected");
    let selectedDOB = $state("No data selected");
    let selectedStatus = $state("No data selected");
    let STSstatusRight = $state("No data selected");
    let STSstatusLeft = $state("No data selected");
    let selectedSex = $state("No data selected");

    const blankFrequencies = {
        hz500: "",
        hz1000: "",
        hz2000: "",
        hz3000: "",
        hz4000: "",
        hz6000: "",
        hz8000: ""
    };

    let modifiedLeftFrequencies = $state(blankFrequencies);
    let modifiedRightFrequencies = $state(blankFrequencies);

    let inputValueName: string = $state("");
    let inputValueYear = $state("");

    let success = $state(true);
    let errorMessage = $state("");

    // Dropdown menu state
    let nameMenuOpen = $state(false);
    let yearMenuOpen = $state(false);

    let yearItems = $state<Array<string>>([]);

    function displayError(message: string) {
        errorMessage = message;
        success = false;
    }

    const undefinedEmployee: Employee = {
        employeeID: "-1",
        firstName: "Undefined",
        lastName: "Undefined",
        email: "Undefined",
        dob: "Undefined",
        activeStatus: "Undefined",
        sex: "Undefined"
    };

    // employee map that is search friendly
    // name will hold first and last so it's easier to search
    // actual employee data (id and stuff) is in employee_dict.data
    let employee_dict = $derived(
        employees
            .slice() // Create a copy to avoid modifying the original array
            .sort((a, b) => a.firstName.localeCompare(b.firstName))
            .map((employee) => ({
                name: `${employee.firstName} ${employee.lastName}`,
                data: employee
            })) as Array<EmployeeSearchable>
    );

    // When the user types into the selection text box, the employees list should filter
    let filteredEmployees = $derived(employee_dict.filter(item => item.name.toLowerCase().includes(inputValueName.toLowerCase())));

    let selectedEmployee: EmployeeSearchable = $state({
        name: "No employee selected", 
        data: undefinedEmployee
    });

    // Functions to update selected employee and year
    async function selectEmployee(employee: EmployeeSearchable): Promise<void> {
        const formData = new FormData();

        selectedEmployee = employee;
        nameMenuOpen = false; 

        // Reset year selection and clear years dropdown
        selectedYear = "No year selected";
        yearItems = [];
        inputValueYear = "";
        STSstatusRight = "No data selected";
        STSstatusLeft = "No data selected";
        // Clear previous data
        rightBaselineHearingData.length = 0;
        rightNewHearingData.length = 0;
        leftBaselineHearingData.length = 0;
        leftNewHearingData.length = 0;

        formData.append('employeeID', selectedEmployee.data.employeeID);

        // Fetch employee details from the server and years for other dropdown
        try {
            // data stuff first
            const dataResponse = await fetch('/dashboard?/fetchEmployeeInfo', {
                method: 'POST',
                body: formData,
            });
            const serverDataResponse = await dataResponse.json();
            const dataResult = JSON.parse(JSON.parse(serverDataResponse.data)[0]);

            if (dataResult["success"]) {
                success = true;
                selectedEmail = dataResult.employee.email;
                selectedStatus = dataResult.employee.employmentStatus;
                selectedDOB = dataResult.employee.dob
                    ? new Date(dataResult.employee.dob).toISOString().split('T')[0]
                    : "No selection made";
                selectedSex = dataResult.employee.sex;
            }
            else { 
                selectedEmail = "Error fetching data: not a data success";
                selectedDOB = "Error fetching data: not a data success";
                selectedStatus = "Error fetching data: not a data success";
            }

            // years stuff next
            const yearsResponse = await fetch('/dashboard?/fetchYears', {
                method: 'POST',
                body: formData,
            });

            const serverYearsResponse = await yearsResponse.json();
            const yearsResult = JSON.parse(JSON.parse(serverYearsResponse.data)[0]);

            console.log(yearsResult);

            if (yearsResult["success"]) {
                success = true;
                yearItems = yearsResult.years.map(String);
                console.log(yearItems);
            }
            else {
                yearItems = [];
                displayError('No years found for the selected employee');
            }
        } 
        catch (error) {
            console.error('Error fetching data:', error);
            yearItems = [];
            displayError('Error fetching data');
        }
    }

    let filteredYears = $derived.by(() => {
        let filterable = yearItems;
        let filter = inputValueYear;

        return filterable.filter(item => item.includes(filter));
    });

    async function selectYear(year: string): Promise<void> {
        selectedYear = year;
        yearMenuOpen = false;

        await fetchUpdatedHearingData();

        // Creating form data
        const formData = new FormData();
        formData.append('employeeID', selectedEmployee.data.employeeID);
        formData.append('year', selectedYear);
        formData.append('sex', selectedEmployee.data.sex);

        try {
            const response = await fetch('/dashboard?/calculateSTS', { 
                method: 'POST',
                body: formData,
            });

            // ! Everything before this point should be outside of the try block
            const serverResponse = await response.json();
            const result = JSON.parse(JSON.parse(serverResponse.data)[0]);

            if (result["success"]) {
                success = true;
                // Find the test result that matches the selected year
                const selectedYearReport = result.hearingReport.find((report: any) => report.reportYear === parseInt(year, 10));

                if (selectedYearReport) {
                    STSstatusRight = GetAnomalyStatusText(selectedYearReport.rightStatus);
                    STSstatusLeft = GetAnomalyStatusText(selectedYearReport.leftStatus);
                } else {
                    STSstatusRight = "No Data";
                    STSstatusLeft = "No Data";
                }

                // Build the full hearing history from all years
                hearingHistory = result.hearingReport.map((report: any) => ({
                    year: report.reportYear.toString(),
                    leftStatus: GetAnomalyStatusText(report.leftStatus),
                    rightStatus: GetAnomalyStatusText(report.rightStatus)
                }));
                
                // Sort by year (newest first)
                hearingHistory.sort((a, b) => parseInt(b.year) - parseInt(a.year));
            }
            else {
                displayError(result["message"]);
            }
        } catch (error) {
            const errorMessage = 'Error fetching hearing data: ' + error;
            console.error(errorMessage);
            displayError(errorMessage);
        }
    }

    // Helper function to get the readable status
    function GetAnomalyStatusText(status: AnomalyStatus): string {
        return AnomalyStatus[status] ?? "Unknown";
    }

    //DATA MODIFICATION STUFF
    let nameModal = $state(false); // controls the appearance of the employee name change window
    let emailModal = $state(false);
    let DOBmodal = $state(false);
    let activeStatusModal = $state(false);
    let addDataModal = $state(false);
    let editDataModal = $state(false);
    let addEmployeeModal = $state(false);
    let sexModal = $state(false);

    let newFirstName = $state("");
    let newLastName = $state("");
    let newEmail = $state("");
    let newDOB = $state("");
    let newActiveStatus = $state("");
    let isInactive = $state(false);
    let newSex = $state("");

    function showAddEmployeeModal() {
        addEmployeeModal = true;
    }

    function showEditDataModal() {
        if (!selectedYear || selectedYear === "No year selected") {
            displayError("Please select a year first.");
            return;
        }

        editDataModal = true;
    }

    function showAddDataModal() {
        addDataModal = true;
    }

    async function modifyEmployeeName(): Promise<void> {
        const formData = new FormData();
        formData.append('employeeID', selectedEmployee.data.employeeID);
        formData.append('newFirstName', newFirstName);
        formData.append('newLastName', newLastName);

        const response = await fetch('/dashboard?/modifyEmployeeName', {
            method: 'POST',
            body: formData,
        });

        try {
            const serverResponse = await response.json();
            console.log(response);

            const result = JSON.parse(JSON.parse(serverResponse.data)[0]);
    
            if (result["success"]) {
                success = true;
                selectedEmployee.name = `${newFirstName} ${newLastName}`;
                selectedEmployee.data.firstName = newFirstName;
                selectedEmployee.data.lastName = newLastName;
            }
            else {
                displayError(result["message"]);
            }
        }
        catch (error: any) {
            let errorMessage = error.message;
            displayError(errorMessage);
        }
    }

    async function modifyEmployeeEmail(): Promise<void> {
        const formData = new FormData();
        formData.append('employeeID', selectedEmployee.data.employeeID);
        formData.append('newEmail', newEmail);

        const response = await fetch('/dashboard?/modifyEmployeeEmail', {
            method: 'POST',
            body: formData,
        });

        try {
            const serverResponse = await response.json();
            console.log(response);

            const result = JSON.parse(JSON.parse(serverResponse.data)[0]);
    
            if (result["success"]) {
                success = true;
                selectedEmployee.data.email = newEmail;
                selectedEmail = selectedEmployee.data.email;
            }
            else {
                displayError(result["message"]);
            }
        }
        catch (error: any) {
            let errorMessage = error.message;
            displayError(errorMessage);
        }
    }
    async function modifyEmployeeDOB(): Promise<void> {
        const formData = new FormData();
        formData.append('employeeID', selectedEmployee.data.employeeID);
        formData.append('newDOB', newDOB);

        const response = await fetch('/dashboard?/modifyEmployeeDOB', {
            method: 'POST',
            body: formData,
        });

        try {
            const serverResponse = await response.json();
            console.log(response);

            const result = JSON.parse(JSON.parse(serverResponse.data)[0]);
    
            if (result["success"]) {
                success = true;
                selectedEmployee.data.dob = newDOB;
                selectedDOB = selectedEmployee.data.dob
                    ? new Date(selectedEmployee.data.dob).toISOString().split('T')[0]
                    : "No selection made";
            }
            else {
                displayError(result["message"]);
            }
        }
        catch (error: any) {
            let errorMessage = error.message;
            displayError(errorMessage);
        }
    }

    async function modifyEmployeeSex(): Promise<void> {
        const formData = new FormData();
        formData.append('employeeID', selectedEmployee.data.employeeID);
        formData.append('newSex', newSex); 

        const response = await fetch('/dashboard?/modifyEmployeeSex', {
            method: 'POST',
            body: formData,
        });

        try {
            const serverResponse = await response.json();
            console.log(response);

            const result = JSON.parse(JSON.parse(serverResponse.data)[0]);
    
            if (result["success"]) {
                success = true;
                selectedEmployee.data.sex = newSex;
            }
            else {
                displayError(result["message"]);
            }
        }
        catch (error: any) {
            let errorMessage = error.message;
            displayError(errorMessage);
        }
    }

    async function modifyEmploymentStatus(): Promise<void> {
        const formData = new FormData();
        formData.append('employeeID', selectedEmployee.data.employeeID);
        formData.append('newActiveStatus', newActiveStatus === "Active" ? "" : newActiveStatus); // Ensures the form key matches what backend expects

        const response = await fetch('/dashboard?/modifyEmployeeStatus', {
            method: 'POST',
            body: formData,
        });

        try {
            const serverResponse = await response.json();
            console.log(response);

            const result = JSON.parse(JSON.parse(serverResponse.data)[0]);
    
            if (result["success"]) {
                success = true;
                selectedEmployee.data.activeStatus = newActiveStatus;
                if (newActiveStatus === "") {  
                    selectedStatus = "Active";
                } else {  
                    selectedStatus = "Inactive";
                }
            }
            else {
                displayError(result["message"]);
            }
        }
        catch (error: any) {
            let errorMessage = error.message;
            displayError(errorMessage);
        }
    }

    export async function fetchUpdatedHearingData() {
        try {
            const formData = new FormData();
            formData.append('employeeID', selectedEmployee.data.employeeID);
            formData.append('year', selectedYear);
            const response = await fetch('/dashboard?/fetchHearingData', {
                method: 'POST',
                body: formData,
            });
            
            const serverResponse = await response.json();
            const result = JSON.parse(JSON.parse(serverResponse.data)[0]);
            
            if (result["success"]) {
                const { baselineData, newData } = result.hearingData;

                // Clear previous data
                rightBaselineHearingData.length = 0;
                rightNewHearingData.length = 0;
                leftBaselineHearingData.length = 0;
                leftNewHearingData.length = 0;

                // Extract frequencies and populate arrays
                // For right ear baseline data
                if (baselineData.rightEar) {
                    rightBaselineHearingData.push(...extractFrequencies(baselineData.rightEar));
                }

                // For right ear new data
                if (newData.rightEar) {
                    rightNewHearingData.push(...extractFrequencies(newData.rightEar));
                }

                // For left ear baseline data
                if (baselineData.leftEar) {
                    leftBaselineHearingData.push(...extractFrequencies(baselineData.leftEar));
                }

                // For left ear new data
                if (newData.leftEar) {
                    leftNewHearingData.push(...extractFrequencies(newData.leftEar));
                }
            } 
            else {
                displayError('Failed to fetch hearing data for the selected year');
            }
        }
        catch (error) {
            console.error('Error fetching hearing data:', error);
            displayError('Error fetching hearing data');
        }
    }
</script>

<!-- TITLE PAGE SECTION -->
<div class="relative w-full">
    <div class="flex flex-col items-center justify-center">
        <PageTitle>
            Employee Data Management
            {#snippet caption()}
                View employee information and data.
            {/snippet}
        </PageTitle>
        <ErrorMessage class="mx-10 mb-4 w-full" {success} {errorMessage} />
    </div>
</div>

<div class="w-full px-4">
    <!-- DROPDOWN MENU SECTION BEGINS -->
    <div class="mb-4 flex gap-4 md:ms-13">
        <Button class="cursor-pointer w-64 h-12" color="primary">
            {selectedEmployee.name}
            <ChevronDownOutline class="w-6 h-6 ms-2 text-white dark:text-white" />
        </Button>
        <Dropdown bind:open={nameMenuOpen} class="overflow-y-auto px-3 pb-3 text-sm h-44">
            <div class="p-3">
                <Search size="md" bind:value={inputValueName}/>
            </div>
            {#each filteredEmployees as employee}
                <li class="rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-600">
                    <button type="button" class="w-full text-left cursor-pointer" onclick={() => selectEmployee(employee)}>
                        {employee.name}
                    </button>
                </li>
            {/each}
        </Dropdown>

        {#if selectedEmployee.name !== "No employee selected"}
            <Button class="cursor-pointer w-64 h-12" color="primary">
                {selectedYear}
                <ChevronDownOutline class="w-6 h-6 ms-2 text-white dark:text-white" />
            </Button>
            <Dropdown bind:open={yearMenuOpen} class="overflow-y-auto px-3 pb-3 text-sm h-44">
                <div class="p-3">
                    <Search size="md" bind:value={inputValueYear}/>
                </div>
                {#each filteredYears as year}
                    <li class="rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-600">
                        <button type="button" class="w-full text-left cursor-pointer" onclick={() => selectYear(year)}>
                            {year}
                        </button>
                    </li>
                {/each}
            </Dropdown>
        {/if}

        <Button size="sm" class="cursor-pointer w-12 h-12" on:click={() => showAddEmployeeModal()} color="primary"><UserAddSolid /></Button>
        <Tooltip placement="bottom">Add New Employee</Tooltip>
        
        {#if selectedEmployee.name !== "No employee selected"}
            <Button size="sm" class="cursor-pointer w-12 h-12" on:click={() => showAddDataModal()} color="primary"><CirclePlusSolid /></Button>
            <Tooltip placement="bottom">Add New Data</Tooltip>
        {/if} 
        {#if selectedYear !== "No year selected"} 
            <Button size="sm" class="cursor-pointer w-12 h-12" on:click={() => showEditDataModal()} color="primary"><EditSolid /></Button>
            <Tooltip placement="bottom">Edit Current Data</Tooltip>
        {/if} 
    </div>
    <!-- DROPDOWN MENU SECTION ENDS -->

    <!-- INFORMATION DISPLAY SECTION BEGINS -->
    <div class="mb-4">
        <EmployeeData 
            {selectedYear}
            {selectedEmployee}
            {selectedEmail}
            {selectedDOB}
            {selectedStatus}
            {STSstatusLeft}
            {STSstatusRight}
            {rightBaselineHearingData}
            {rightNewHearingData}
            {leftBaselineHearingData}
            {leftNewHearingData}
            {hearingHistory}
            editname={() => nameModal = true}
            editemail={() => emailModal = true}
            editdob={() => DOBmodal = true}
            editsex={() => sexModal = true}
            editstatus={() => activeStatusModal = true}
        />
    </div>
</div>
<!-- INFORMATION DISPLAY SECTION ENDS -->

<!-- MODAL SECTION BEGINS -->
<Modal title="Change Employee Name" bind:open={nameModal} autoclose>
    <p>
        <span>Please provide an updated name for {selectedEmployee.data.firstName} {selectedEmployee.data.lastName}</span>
        <br>
        <br>
        <Label for="first" class="mb-2">First name</Label>
        <Input type="text" id="firstName" placeholder={selectedEmployee.data.firstName} bind:value={newFirstName} required />
        <Label for="last" class="mb-2">Last name</Label>
        <Input type="text" id="lastName" placeholder={selectedEmployee.data.lastName} bind:value={newLastName} required />
    
    </p>
    <svelte:fragment slot="footer">
    <Button class="cursor-pointer" color="primary" on:click={() => modifyEmployeeName()}>Confirm</Button>
    <Button class="cursor-pointer" color="red">Cancel</Button>
    </svelte:fragment>
</Modal>

<Modal title="Change Employee Email" bind:open={emailModal} autoclose>
    <p>
        <span>Please provide an updated email for {selectedEmployee.data.firstName} {selectedEmployee.data.lastName} ({selectedEmployee.data.email})</span>
        <br>
        <br>
        <Label for="newEmail" class="mb-2">New Email</Label>
        <Input type="text" id="email" placeholder={selectedEmployee.data.email} bind:value={newEmail} required />
    </p>
    <svelte:fragment slot="footer">
    <Button class="cursor-pointer" color="primary" on:click={() => modifyEmployeeEmail()}>Confirm</Button>
    <Button class="cursor-pointer" color="red">Cancel</Button>
    </svelte:fragment>
</Modal>

<Modal title="Change Employee Date of Birth" bind:open={DOBmodal} autoclose>
    <p>
        <span>Please provide an updated DOB for {selectedEmployee.data.firstName} {selectedEmployee.data.lastName}</span>
        <br>
        <br>
        <Label for="newEmail" class="mb-2">New Date</Label>
        <Input type="date" id="dob" placeholder={selectedEmployee.data.dob} bind:value={newDOB} required />
    </p>
    <svelte:fragment slot="footer">
    <Button class="cursor-pointer" color="primary" on:click={() => modifyEmployeeDOB()}>Confirm</Button>
    <Button class="cursor-pointer" color="red">Cancel</Button>
    </svelte:fragment>
</Modal>

<Modal title="Change Employee Sex" bind:open={sexModal} autoclose>
    <p>
        <span>Please provide the updated sex for {selectedEmployee.data.firstName} {selectedEmployee.data.lastName}</span>
        <br>
        <br>
        <Label for="newSex" class="mb-2">New Sex</Label>
        <Radio name="sex" bind:group={newSex} value="male">Male</Radio>
        <Radio name="sex" bind:group={newSex} value="female">Female</Radio>
        <Radio name="sex" bind:group={newSex} value="other">Other</Radio>
    </p>
    <svelte:fragment slot="footer">
    <Button class="cursor-pointer" color="primary" on:click={() => modifyEmployeeSex()}>Confirm</Button>
    <Button class="cursor-pointer" color="red">Cancel</Button>
    </svelte:fragment>
</Modal>

<Modal title="Change Employee Active Status" bind:open={activeStatusModal} autoclose>
    <p>
        <span>Please provide an updated employment status for {selectedEmployee.data.firstName} {selectedEmployee.data.lastName}</span>
        <br>
        <br>
        <Label for="newActiveStatus" class="mb-2">New Employment Status</Label>
        <Radio name="employmentStatus" bind:checked={isInactive} on:change={() => isInactive = false}>Active</Radio>
        <Radio name="employmentStatus" bind:checked={isInactive} on:change={() => isInactive = true}>Inactive</Radio>

        {#if isInactive}
            <Label for="lastActive" class="block mb-2">Last Active Date</Label>
            <Input id="lastActive" type="date" bind:value={newActiveStatus} />
        {/if}
    </p>
    <svelte:fragment slot="footer">
    <Button class="cursor-pointer" color="primary" on:click={() => modifyEmploymentStatus()}>Confirm</Button>
    <Button class="cursor-pointer" color="red">Cancel</Button>
    </svelte:fragment>
</Modal>

<Modal size="xl" title={`Change ${selectedYear} Hearing Data for ${selectedEmployee.name}`} bind:open={editDataModal}> 
    <InsertDataPage employee={selectedEmployee.data} year={selectedYear} allowModify />

    <svelte:fragment slot="footer">
        <Button class="cursor-pointer" color="red"
            on:click={() => editDataModal = false}>
            Cancel
        </Button>
    </svelte:fragment>
</Modal>

<Modal size="xl" title={`Add Hearing Data for ${selectedEmployee.name}`} bind:open={addDataModal}> 
    <InsertDataPage employee={selectedEmployee.data} />

    <svelte:fragment slot="footer">
        <Button class="cursor-pointer" color="red"
            on:click={() => addDataModal = false}>
            Cancel
        </Button>
    </svelte:fragment>
</Modal>

<Modal title="Add Employee" bind:open={addEmployeeModal}>
    <InsertEmployeePage />
    <svelte:fragment slot="footer">
        <Button class="cursor-pointer" color="red"
            on:click={() => addEmployeeModal = false}>
            Cancel
        </Button>
    </svelte:fragment>
</Modal>
<!-- MODAL SECTION ENDS -->
