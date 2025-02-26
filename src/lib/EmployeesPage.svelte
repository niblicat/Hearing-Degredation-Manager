<script lang="ts">

    import { ButtonGroup, Button, Search, Modal, Label, Input, Radio } from 'flowbite-svelte';
    import { ChevronDownOutline, UserRemoveSolid, UserAddSolid, CirclePlusSolid, EditSolid, EditOutline } from 'flowbite-svelte-icons';
    import { Dropdown } from 'flowbite-svelte';
    import ScatterPlot from './ScatterPlot.svelte';
    import { Footer } from 'flowbite-svelte';
    import EditIcon from './EditIcon.svelte';
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';
    import { AnomalyStatus } from "./interpret";
    import type { Employee, EmployeeSearchable } from './MyTypes';
    import { invalidateAll } from '$app/navigation';
    import { controllers } from 'chart.js';
    import InsertEmployeePage from './InsertEmployeePage.svelte';
    import { extractFrequencies } from './utility';
    import InsertDataPage from './InsertDataPage.svelte';

    let chart: any;

    interface Props {
        employees: Array<Employee>;
    }

    let { employees }: Props = $props();

    // Data for scatter plot
    let RightBaselineHearingData = $state<Array<number>>([]);
    let RightNewHearingData =  $state<Array<number>>([]);
    let LeftBaselineHearingData =  $state<Array<number>>([]);
    let LeftNewHearingData =  $state<Array<number>>([]);

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

    let success = true;
    let errorMessage = $state("");

    // Dropdown menu state
    let nameMenuOpen = $state(false);
    let yearMenuOpen = $state(false);

    // Chart Selection
    let isRightEar = $state(false);
    let showBoth = $state(true);

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
    let employee_dict = $derived(employees.map((employee) => ({
        name: `${employee.firstName} ${employee.lastName}`,
        data: employee
    })) as Array<EmployeeSearchable>);

    // When the user types into the selection text box, the employees list should filter
    let filteredEmployees = $derived(employee_dict.filter(item => item.name.toLowerCase().includes(inputValueName.toLowerCase())));

    let selectedEmployee: EmployeeSearchable = $state({
        name: "No employee selected", 
        data: undefinedEmployee
    });
    
    const toggleChart = (ear: string) => {
        if (ear === 'both') {
            showBoth = true;
        } else {
            isRightEar = ear === 'right';
            showBoth = false;
        }
    };
  
    // Functions to update selected employee and year
    const selectEmployee = async (employee: EmployeeSearchable) => {
        const formData = new FormData();

        selectedEmployee = employee;
        nameMenuOpen = false; 

        // Reset year selection and clear years dropdown
        selectedYear = "No year selected";
        yearItems = [];
        inputValueYear = "";
        // Clear previous data
        RightBaselineHearingData.length = 0;
        RightNewHearingData.length = 0;
        LeftBaselineHearingData.length = 0;
        LeftNewHearingData.length = 0;

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
    };

    let filteredYears = $derived.by(() => {
        let filterable = yearItems;
        let filter = inputValueYear;

        return filterable.filter(item => item.includes(filter));
    });
   
    const selectYear = async (year: string) => {
        selectedYear = year;
        yearMenuOpen = false;

        try {
            await fetchUpdatedHearingData(selectedEmployee.name, year);

            const formData = new FormData();
            formData.append('employeeID', selectedEmployee.data.employeeID);
            formData.append('year', selectedYear);
            formData.append('sex', selectedEmployee.data.sex);

            const response = await fetch('/dashboard?/calculateSTS', { 
                method: 'POST',
                body: formData,
            });

            const serverResponse = await response.json();
            console.log(response);

            const result = JSON.parse(JSON.parse(serverResponse.data)[0]);
    
            if (result["success"]) {
                success = true;

                // Find the test result that matches the selected year
                const selectedYearReport = result.hearingReport.find((report: any) => report.reportYear === parseInt(year, 10));

                if (selectedYearReport) {
                    STSstatusRight = GetAnomalyStatusText(selectedYearReport.rightStatus);
                    STSstatusLeft = GetAnomalyStatusText(selectedYearReport.leftStatus);

                    console.log(`STS Report for ${year} - RIGHT:`, STSstatusRight);
                    console.log(`STS Report for ${year} - LEFT:`, STSstatusLeft);
                } else {
                    console.warn(`No hearing report found for year: ${year}`);
                    STSstatusRight = "No Data";
                    STSstatusLeft = "No Data";
                }
            } else {
                throw new Error(serverResponse.error ?? "Failed to calculate STS");
            }

        } catch (error) {
            console.error('Error fetching hearing JOE data:', error);
            displayError('Error fetching hearing data');
        }
    };

    // Helper function to get the readable status
    const GetAnomalyStatusText = (status: AnomalyStatus): string => {
        return AnomalyStatus[status] ?? "Unknown";
    };

    //DATA MODIFICATION STUFF
    let nameModal = $state(false); // controls the appearance of the employee name change window
    let emailModal = $state(false);
    let DOBmodal = $state(false);
    let activeStatusModal = $state(false);
    let addDataModal = $state(false);
    let editDataModal = $state(false);
    let addEmployeeModal = $state(false);

    let newFirstName = $state("");
    let newLastName = $state("");
    let newEmail = $state("");
    let newDOB = $state("");
    let newActiveStatus = $state("");
    let isInactive = $state(false);

    function showNameChangeModal(employee: Employee) {
        newFirstName = employee.firstName;
        newLastName = employee.lastName;
        nameModal = true;
    }
    function showEmailChangeModal(employee: Employee) {
        newEmail = employee.email;
        emailModal = true;
    }
    function showDOBChangeModal(employee: Employee) {
        newDOB = employee.dob
        selectedDOB = newDOB
                    ? new Date(newDOB).toISOString().split('T')[0]
                    : "No selection made";
        DOBmodal = true;
    }
    function showActiveStatusChangeModal(employee: Employee) {
        activeStatusModal = true;
    }

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


    export async function fetchUpdatedHearingData(employeeID: string, year: string) {
        // ! employeeID and year from the parameters are unused
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
                RightBaselineHearingData.length = 0;
                RightNewHearingData.length = 0;
                LeftBaselineHearingData.length = 0;
                LeftNewHearingData.length = 0;

                // Extract frequencies and populate arrays
                // For right ear baseline data
                if (baselineData.rightEar) {
                    RightBaselineHearingData.push(...extractFrequencies(baselineData.rightEar));
                }

                // For right ear new data
                if (newData.rightEar) {
                    RightNewHearingData.push(...extractFrequencies(newData.rightEar));
                }

                // For left ear baseline data
                if (baselineData.leftEar) {
                    LeftBaselineHearingData.push(...extractFrequencies(baselineData.leftEar));
                }

                // For left ear new data
                if (newData.leftEar) {
                    LeftNewHearingData.push(...extractFrequencies(newData.leftEar));
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

<div class="relative dropdown-container flex space-x-4" style="margin-top: 20px; margin-left: 20px;"> 
    <!-- User Dropdown -->
    <Button class="cursor-pointer" color="primary" style="width:300px">{selectedEmployee.name}<ChevronDownOutline class="w-6 h-6 ms-2 text-white dark:text-white" /></Button>
    <Dropdown bind:open={nameMenuOpen} class="overflow-y-auto px-3 pb-3 text-sm h-44">
        <div  class="p-3">
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

    <!-- Year Dropdown -->
    <Button class="cursor-pointer" color="primary" style="width:300px">{selectedYear}<ChevronDownOutline class="w-6 h-6 ms-2 text-white dark:text-white" /></Button>
    <Dropdown bind:open={yearMenuOpen} class="overflow-y-auto px-3 pb-3 text-sm h-44">
        <div  class="p-3">
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

    <Button class="cursor-pointer" on:click={() => showAddEmployeeModal()} color="primary"><UserAddSolid /></Button>
    
    {#if selectedEmployee.name !== "No employee selected"} 
        <Button class="cursor-pointer" on:click={() => showAddDataModal()} color="primary"><CirclePlusSolid /></Button>
    {/if} 
    {#if selectedYear !== "No year selected"} 
        <Button class="cursor-pointer" on:click={() => showEditDataModal()} color="primary"><EditSolid /></Button>
    {/if} 
</div>

<!---------------------- DISPLAY INFO ---------------------->

<!-- MODALS -->
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

<div class="flex-container">
    <!-- Information Section -->
    <section class="selected-info text-xl">
        <br>
        <p>Year: {selectedYear}</p> <br>
        <p>Employee: {selectedEmployee.name}
            {#if selectedEmployee.data.employeeID !== "-1"} 
                <Button outline size="sm" class="p-1! cursor-pointer" on:click={() => showNameChangeModal(selectedEmployee.data)}>
                    <EditOutline class="w-4 h-4" />
                </Button>
            {/if} 
        </p> <br>
        <p>Email: {selectedEmail}
            {#if selectedEmployee.data.email !== "Undefined"} 
                <Button outline size="sm" class="p-1! cursor-pointer" on:click={() => showEmailChangeModal(selectedEmployee.data)}>
                    <EditOutline class="w-4 h-4" />
                </Button> 
            {/if} 
        </p> <br>
        <p>Date of Birth: {selectedDOB}
            {#if selectedEmployee.data.dob !== "Undefined"} 
                <Button outline size="sm" class="p-1! cursor-pointer" on:click={() => showDOBChangeModal(selectedEmployee.data)}>
                    <EditOutline class="w-4 h-4" />
                </Button> 
            {/if} 
        </p> <br>
        <p>Sex: {selectedSex}</p> <br>
        <p>Employment Status: {selectedStatus} <!-- inactive to active is not working // double check --> 
            {#if selectedEmployee.data.employeeID !== "-1"} 
                <Button outline size="sm" class="p-1! cursor-pointer" on:click={() => showActiveStatusChangeModal(selectedEmployee.data)}>
                    <EditOutline class="w-4 h-4" />
                </Button>
            {/if} 
        </p> <br>
        <p class="text-3xl">STS Status Left: {STSstatusLeft}</p> <br>
        <p class="text-3xl">STS Status Right: {STSstatusRight}</p> <br>
    </section>

    <!-- Chart Section -->
    <div class="chart-container">
        {#if showBoth}
            <ScatterPlot 
                plotTitle="Both Ears"
                baselineHearingData={RightBaselineHearingData.concat(LeftBaselineHearingData)}
                newHearingData={RightNewHearingData.concat(LeftNewHearingData)}
                labels={['Right Baseline', 'Right New', 'Left Baseline', 'Left New']}
            />
        {:else if isRightEar}
            <ScatterPlot 
                plotTitle="Right Ear"
                baselineHearingData={RightBaselineHearingData} 
                newHearingData={RightNewHearingData} 
                labels={['Right Baseline', 'Right New']}
            />
        {:else}
            <ScatterPlot 
                plotTitle="Left Ear"
                baselineHearingData={LeftBaselineHearingData} 
                newHearingData={LeftNewHearingData} 
                labels={['Left Baseline', 'Left New']}
            />
        {/if}
        <ButtonGroup class="*:!ring-primary-700">
            <Button class="cursor-pointer" color="blue" style="width:175px" on:click={() => toggleChart('left')}>Left</Button>
            <Button class="cursor-pointer" color="red" style="width:175px" on:click={() => toggleChart('right')}>Right</Button> 
            <Button class="cursor-pointer" color="purple" style="width:175px" on:click={() => toggleChart('both')}>Both</Button> 
        </ButtonGroup>
    </div>
</div>
<!-- TODO: Convert these styles into tailwind classes -->
<style>
    .flex-container {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
    }
    .selected-info {
        flex: 1; 
        margin-left: 75px; 
        margin-top: 55px; 
        max-width: 500px; 
    }
    .chart-container {
        flex: 1;  
        margin-right: 75px; 
        margin-top: 15px; 
        max-width: 550px; 
        text-align: center;
    }
</style>