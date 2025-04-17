<script lang="ts">

    import { Button, Search, Modal, Label, Input, Radio, Tooltip, Dropdown } from 'flowbite-svelte';
    import { ChevronDownOutline, UserAddSolid, CirclePlusSolid, EditSolid } from 'flowbite-svelte-icons';
    import { AnomalyStatus, getPersonSexFromString, type EarAnomalyStatus} from "$lib/interpret";
    import type { Employee, EmployeeInfo, EmployeeSearchable, HearingHistory } from '$lib/MyTypes';
    import InsertEmployeePage from './InsertEmployeePage.svelte';
    import { calculateSTSClientSide } from '$lib/utility';
    import InsertDataPage from '$lib/Employee/InsertDataPage.svelte';
    import PageTitle from '$lib/Miscellaneous/PageTitle.svelte';
    import ErrorMessage from '$lib/Miscellaneous/ErrorMessage.svelte';
    import EmployeeData from '$lib/Employee/EmployeeData.svelte';
	import { getEmployeeHearingHistory, updateEmployeeDOB, updateEmployeeEmail, updateEmployeeName, updateEmployeeSex, updateEmploymentStatus } from '$lib/client/postrequests';

    interface Props {
        employees: Array<Employee>;
    }

    let { employees }: Props = $props();

    // Data for scatter plot
    let rightBaselineHearingData = $state<Array<number>>([]);
    let rightNewHearingData =  $state<Array<number>>([]);
    let leftBaselineHearingData =  $state<Array<number>>([]);
    let leftNewHearingData =  $state<Array<number>>([]);
    
    let hearingHistory = $state<Array<{year: string, leftStatus: string, rightStatus: string, leftBaseline: string, rightBaseline: string}>>([]);

    let allHearingData = $state<HearingHistory | null>(null);

    let allHearingReports = $state<EarAnomalyStatus[]>([]);
    let allYearScreenings = $state<Record<string, any>>({});

    // Selected employee and year
    let selectedYear = $state("No year selected");
    let selectedEmail = $state("No data selected");
    let selectedDOB = $state("No data selected");
    let selectedStatus = $state("No data selected");
    let STSstatusRight = $state("No data selected");
    let STSstatusLeft = $state("No data selected");
    let selectedSex = $state("No data selected");

    let inputValueName: string = $state("");
    let inputValueYear = $state("");

    let success = $state(true);
    let errorMessage = $state("");

    // Dropdown menu state
    let nameMenuOpen = $state(false);
    let yearMenuOpen = $state(false);

    let yearItems = $state<Array<string>>([]);

    function displayError(message: string, error?: any) {
        errorMessage = message;
        if (error) {
            console.error(message, error);
        }
        success = false;
    }
    function displayInfo(message: string) {
        errorMessage = message;
        success = true; // This will style it as an info message, not an error
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

    function resetEmployeeInfo() {
        // Reset year selection and clear years dropdown
        selectedYear = "No year selected";
        yearItems = [];
        inputValueYear = "";
        STSstatusRight = "No data selected";
        STSstatusLeft = "No data selected";
    }
    function resetData() {
        // Clear previous data
        rightBaselineHearingData.length = 0;
        rightNewHearingData.length = 0;
        leftBaselineHearingData.length = 0;
        leftNewHearingData.length = 0;
    }

    // Functions to update selected employee and year
    async function selectEmployee(employee: EmployeeSearchable): Promise<void> {
        const formData = new FormData();
        
        selectedEmployee = employee;
        nameMenuOpen = false; 
        
        // Reset all data
        resetEmployeeInfo();
        resetData();
        
        formData.append('employeeID', selectedEmployee.data.employeeID);

        let fetchedHistory: HearingHistory;

        try {
            // fetch the history by sending a POST request
            // will throw an error if employee isn't found or there's a database error
            fetchedHistory = await getEmployeeHearingHistory(selectedEmployee.data.employeeID);

            // update employee info
            const employeeInfo: EmployeeInfo = fetchedHistory.employee;
            selectedEmail = employeeInfo.email;
            selectedStatus = employeeInfo.lastActive === null ? "Active" : "Inactive";
            selectedDOB = employeeInfo.dob
                ? new Date(employeeInfo.dob).toISOString().split('T')[0]
                : "No selection made";
            selectedSex = employeeInfo.sex.toString();

            // Store hearing history directly
            allHearingData = fetchedHistory;

            if (allHearingData.screenings.length === 0) {
                // no hearing data found, but employee exists
                displayInfo(`No hearing test data available for ${employee.name}. You can add new data using the "Add New Data" button.`);
                hearingHistory = [];
                allHearingReports = [];
                allYearScreenings = {};
                allHearingData = null;
            }
            else {
                // hearing data exists!
                // Get years from screenings
                yearItems = allHearingData.screenings.map(screening => screening.year.toString());
                
                // Sort years (newest first for dropdown)
                yearItems.sort((a, b) => parseInt(b) - parseInt(a));
                
                // Calculate STS reports directly
                allHearingReports = calculateSTSClientSide(allHearingData);
                
                // Create year-indexed lookup for screenings
                allYearScreenings = {};
                allHearingData.screenings.forEach(screening => {
                    allYearScreenings[screening.year.toString()] = {
                        left: screening.leftEar,
                        right: screening.rightEar
                    };
                });
                
                // Create the hearing history display info
                hearingHistory = allHearingReports.map(report => ({
                    year: report.reportYear.toString(),
                    leftStatus: GetAnomalyStatusText(report.leftStatus),
                    rightStatus: GetAnomalyStatusText(report.rightStatus),
                    leftBaseline: report.leftBaselineYear.toString(),
                    rightBaseline: report.rightBaselineYear.toString()
                }));
                
                // Sort by year (newest first)
                hearingHistory.sort((a, b) => parseInt(b.year) - parseInt(a.year));
            }
        }
        catch (error: any) {
            const errorMessage = `Error fetching data: ${error.message ?? "No message provided"}`;
            console.error(errorMessage);
            yearItems = [];
            displayError(errorMessage);
        }
    }

    let filteredYears = $derived.by(() => {
        let filterable = yearItems;
        let filter = inputValueYear;

        return filterable.filter(item => item.includes(filter));
    });

    // Updated selectYear function that doesn't make API calls but uses cached data
    async function selectYear(year: string): Promise<void> {
        selectedYear = year;
        yearMenuOpen = false;

        if (!allHearingData || !allHearingReports) {
            displayError('No hearing data available');
            return;
        }

        try {
            // Find the test result that matches the selected year from the pre-calculated reports
            const selectedYearReport = allHearingReports.find(
                (report) => report.reportYear === parseInt(year, 10)
            );

            if (selectedYearReport) {
                STSstatusRight = GetAnomalyStatusText(selectedYearReport.rightStatus);
                STSstatusLeft = GetAnomalyStatusText(selectedYearReport.leftStatus);
            } else {
                STSstatusRight = "No Data";
                STSstatusLeft = "No Data";
            }

            // Update the graph data without making an API call
            updateHearingDataDisplay(year);
        } catch (error) {
            const errorMessage = 'Error processing hearing data: ' + error;
            console.error(errorMessage);
            displayError(errorMessage);
        }
    }

    // Function that updates the graph data from cached data
    function updateHearingDataDisplay(year: string): void {
        try {
            // Clear previous data
            resetData();

            // Find the baseline years from the selected year report
            const selectedYearReport = allHearingReports.find(
                (report) => report.reportYear === parseInt(year, 10)
            );

            if (!selectedYearReport) {
                displayError('No report found for the selected year');
                return;
            }

            // Get baseline year data for left and right ears
            const leftBaselineYear = selectedYearReport.leftBaselineYear.toString();
            const rightBaselineYear = selectedYearReport.rightBaselineYear.toString();
            
            // Get current year data
            const currentYearData = allYearScreenings[year];
            
            if (!currentYearData) {
                displayError('No hearing data found for the selected year');
                return;
            }

            // Extract data for the graphs
            if (leftBaselineYear && allYearScreenings[leftBaselineYear]?.left) {
                leftBaselineHearingData = [
                    allYearScreenings[leftBaselineYear].left.hz500,
                    allYearScreenings[leftBaselineYear].left.hz1000,
                    allYearScreenings[leftBaselineYear].left.hz2000,
                    allYearScreenings[leftBaselineYear].left.hz3000,
                    allYearScreenings[leftBaselineYear].left.hz4000,
                    allYearScreenings[leftBaselineYear].left.hz6000,
                    allYearScreenings[leftBaselineYear].left.hz8000,
                ].filter(value => value !== null);
            }

            if (rightBaselineYear && allYearScreenings[rightBaselineYear]?.right) {
                rightBaselineHearingData = [
                    allYearScreenings[rightBaselineYear].right.hz500,
                    allYearScreenings[rightBaselineYear].right.hz1000,
                    allYearScreenings[rightBaselineYear].right.hz2000,
                    allYearScreenings[rightBaselineYear].right.hz3000,
                    allYearScreenings[rightBaselineYear].right.hz4000,
                    allYearScreenings[rightBaselineYear].right.hz6000,
                    allYearScreenings[rightBaselineYear].right.hz8000,
                ].filter(value => value !== null);
            }

            // Current year data
            if (currentYearData.left) {
                leftNewHearingData = [
                    currentYearData.left.hz500,
                    currentYearData.left.hz1000,
                    currentYearData.left.hz2000,
                    currentYearData.left.hz3000,
                    currentYearData.left.hz4000,
                    currentYearData.left.hz6000,
                    currentYearData.left.hz8000,
                ].filter(value => value !== null);
            }

            if (currentYearData.right) {
                rightNewHearingData = [
                    currentYearData.right.hz500,
                    currentYearData.right.hz1000,
                    currentYearData.right.hz2000,
                    currentYearData.right.hz3000,
                    currentYearData.right.hz4000,
                    currentYearData.right.hz6000,
                    currentYearData.right.hz8000,
                ].filter(value => value !== null);
            }
        }
        catch (error) {
            console.error('Error updating hearing data display:', error);
            displayError('Error updating hearing data display');
        }
    }

   // Helper function to get the readable status
    function GetAnomalyStatusText(status: AnomalyStatus): string {
        return AnomalyStatus[status].replace(/([a-z])([A-Z])/g, (match: string, lower: string, upper: string) => {
            return lower + " " + upper;
        }) ?? "Unknown";
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

    function showEditNameModal() {
        // Initialize with current values
        newFirstName = selectedEmployee.data.firstName;
        newLastName = selectedEmployee.data.lastName;
        nameModal = true;
    }

    function isValidEmail(email: string): boolean {
        if (!email) return false;
        // Check for @ and . in the email address
        return email.includes('@') && email.includes('.') && email.indexOf('@') < email.lastIndexOf('.');
    }

    function showEditEmailModal() {
        // Initialize with current email
        newEmail = selectedEmployee.data.email;
        emailModal = true;
    }

    function showEditDOBModal() {
        // Check if there's a valid date of birth to initialize with
        if (selectedEmployee.data.dob && selectedEmployee.data.dob !== "Undefined") {
            // Format the date properly for the date input (YYYY-MM-DD)
            const dobDate = new Date(selectedEmployee.data.dob);
            if (!isNaN(dobDate.getTime())) {
                // If it's a valid date, format it as YYYY-MM-DD
                newDOB = dobDate.toISOString().split('T')[0];
            } else {
                // If parsing fails, try to use the string directly if it's in YYYY-MM-DD format
                newDOB = selectedEmployee.data.dob;
            }
        } else {
            // Reset the field if no valid DOB exists
            newDOB = "";
        }
        
        DOBmodal = true;
    }

    function showEditSexModal() {
        // Initialize with current sex value
        if (selectedEmployee.data.sex && selectedEmployee.data.sex !== "Undefined") {
            // Convert to lowercase to match the radio button values
            newSex = selectedEmployee.data.sex.toLowerCase();
        } else {
            // Default to empty if not set
            newSex = "";
        }
        
        sexModal = true;
    }

    function showEditStatusModal() {
        // Initialize based on current status
        if (selectedStatus === "Inactive") {
            isInactive = true;
            
            // Format the existing date properly for the date input (YYYY-MM-DD)
            if (selectedEmployee.data.activeStatus && 
                selectedEmployee.data.activeStatus !== "Undefined") {
                
                // Parse the date string to ensure proper format
                try {
                    const inactiveDate = new Date(selectedEmployee.data.activeStatus);
                    const validTime = !isNaN(inactiveDate.getTime());

                    // If it's a valid date, format it as YYYY-MM-DD
                    // Else, parsing as date fails, try to use the string directly if it's already in YYYY-MM-DD format
                    newActiveStatus = validTime ? inactiveDate.toISOString().split('T')[0] : selectedEmployee.data.activeStatus;
                } catch (error) {
                    console.error("Error parsing inactive date:", error);
                    newActiveStatus = ""; // Reset if there's an error
                }
            } else {
                newActiveStatus = ""; // Reset if no date available
            }
        } else {
            isInactive = false;
            newActiveStatus = "Active";  // Set to "Active" for active employees
        }
        
        activeStatusModal = true;
    }

    async function modifyEmployeeName(): Promise<void> {
        try {
            // send a post request to update the employee name
            await updateEmployeeName(selectedEmployee.data.employeeID, newFirstName, newLastName);

            success = true;
            selectedEmployee.name = `${newFirstName} ${newLastName}`;
            selectedEmployee.data.firstName = newFirstName;
            selectedEmployee.data.lastName = newLastName;
        }
        catch (error: any) {
            let errorMessage = error.message;
            displayError(errorMessage);
        }
    }

    async function modifyEmployeeEmail(): Promise<void> {
        try {
            // send a post request to update the employee email
            await updateEmployeeEmail(selectedEmployee.data.employeeID, newEmail);

            success = true;
            selectedEmployee.data.email = newEmail;
            selectedEmail = selectedEmployee.data.email;
        }
        catch (error: any) {
            let errorMessage = error.message;
            displayError(errorMessage);
        }
    }

    async function modifyEmployeeDOB(): Promise<void> {
        try {
            // send a post request to update the employee date of birth
            await updateEmployeeDOB(selectedEmployee.data.employeeID, newDOB);

            success = true;
            selectedEmployee.data.dob = newDOB;
            selectedDOB = selectedEmployee.data.dob
                ? new Date(selectedEmployee.data.dob).toISOString().split('T')[0]
                : "No selection made";
        }
        catch (error: any) {
            let errorMessage = error.message;
            displayError(errorMessage);
        }
    }

    async function modifyEmployeeSex(): Promise<void> {
        try {
            // send a post request to update the employee sex
            await updateEmployeeSex(selectedEmployee.data.employeeID, getPersonSexFromString(newSex));

            success = true;
            selectedEmployee.data.sex = newSex;
        }
        catch (error: any) {
            let errorMessage = error.message;
            displayError(errorMessage);
        }
    }

    async function modifyEmploymentStatus(): Promise<void> {
        try {
            // send a post request to update the employment status
            await updateEmploymentStatus(selectedEmployee.data.employeeID, newActiveStatus === "Active" ? "" : newActiveStatus);

            success = true;
            selectedEmployee.data.activeStatus = newActiveStatus;
            selectedStatus = (newActiveStatus === "Active") ? "Active" : "Inactive";
            console.log(newActiveStatus);
        }
        catch (error: any) {
            let errorMessage = error.message;
            displayError(errorMessage);
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
                {#if yearItems.length === 0}
                    <li class="rounded p-2 text-gray-500 italic">No hearing data available for this employee</li>
                {:else}
                    {#each filteredYears as year}
                        <li class="rounded p-2 hover:bg-gray-100 dark:hover:bg-gray-600">
                            <button type="button" class="w-full text-left cursor-pointer" onclick={() => selectYear(year)}>
                                {year}
                            </button>
                        </li>
                    {/each}
                {/if}
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
            editname={() => showEditNameModal()}
            editemail={() => showEditEmailModal()}
            editdob={() => showEditDOBModal()}
            editsex={() => showEditSexModal()}
            editstatus={() => showEditStatusModal()}
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
        <Label for="first" class="mb-2">First name <span class="text-red-500">*</span></Label>
        <Input 
            type="text" 
            id="firstName" 
            placeholder={selectedEmployee.data.firstName} 
            bind:value={newFirstName} 
            color={newFirstName ? "green" : "red"}
            required 
        />
        
        <Label for="last" class="mb-2">Last name <span class="text-red-500">*</span></Label>
        <Input 
            type="text" 
            id="lastName" 
            placeholder={selectedEmployee.data.lastName} 
            bind:value={newLastName} 
            color={newLastName ? "green" : "red"}
            required 
        />
    </p>
    <svelte:fragment slot="footer">
    <Button 
        class="cursor-pointer" 
        color="primary" 
        on:click={() => {
            if (newFirstName && newLastName) {
                modifyEmployeeName();
            } else {
                displayError("First name and last name are required.");
            }
        }}
        disabled={!newFirstName || !newLastName}
    >
        Confirm
    </Button>
    <Button class="cursor-pointer" color="red" on:click={() => {
        nameModal = false;
    }}>Cancel</Button>
    </svelte:fragment>
</Modal>

<Modal title="Change Employee Email" bind:open={emailModal} autoclose>
    <div class="mb-4">
        <span>Please provide an updated email for {selectedEmployee.data.firstName} {selectedEmployee.data.lastName} ({selectedEmployee.data.email})</span>
    </div>
    
    <div class="mb-4">
        <Label for="newEmail" class="mb-2">New Email <span class="text-red-500">*</span></Label>
        <Input 
            type="email" 
            id="email" 
            placeholder={selectedEmployee.data.email} 
            bind:value={newEmail} 
            color={isValidEmail(newEmail) ? "green" : "red"}
            required 
        />
        {#if newEmail && !isValidEmail(newEmail)}
            <p class="text-red-500 text-sm mt-1">Please enter a valid email address (must include @ and .)</p>
        {/if}
    </div>
    
    <svelte:fragment slot="footer">
        <Button 
            class="cursor-pointer" 
            color="primary" 
            on:click={() => {
                if (isValidEmail(newEmail)) {
                    modifyEmployeeEmail();
                } else {
                    displayError("A valid email address is required.");
                }
            }}
            disabled={!isValidEmail(newEmail)}
        >
            Confirm
        </Button>
        <Button class="cursor-pointer" color="red" on:click={() => {
            emailModal = false;
        }}>Cancel</Button>
    </svelte:fragment>
</Modal>

<Modal title="Change Employee Date of Birth" bind:open={DOBmodal} autoclose>
    <p>
        <span>Please provide an updated DOB for {selectedEmployee.data.firstName} {selectedEmployee.data.lastName}</span>
        <br>
        <br>
        <Label for="newDOB" class="mb-2">New Date <span class="text-red-500">*</span></Label>
        <Input 
            type="date" 
            id="dob" 
            bind:value={newDOB} 
            color={newDOB ? "green" : "red"}
            required 
        />
    </p>
    <svelte:fragment slot="footer">
    <Button 
        class="cursor-pointer" 
        color="primary" 
        on:click={() => {
            if (newDOB) {
                modifyEmployeeDOB();
            } else {
                displayError("Date of birth is required.");
            }
        }}
        disabled={!newDOB}
    >
        Confirm
    </Button>
    <Button class="cursor-pointer" color="red" on:click={() => {
        DOBmodal = false;
    }}>Cancel</Button>
    </svelte:fragment>
</Modal>

<Modal title="Change Employee Sex" bind:open={sexModal} autoclose>
    <div class="mb-4">
        <span>Please provide the updated sex for {selectedEmployee.data.firstName} {selectedEmployee.data.lastName}</span>
    </div>
    
    <div class="mb-4">
        <Label for="newSex" class="mb-2">Sex <span class="text-red-500">*</span></Label>
        <div class="space-y-2">
            <Radio name="sex" bind:group={newSex} value="male">Male</Radio>
            <Radio name="sex" bind:group={newSex} value="female">Female</Radio>
            <Radio name="sex" bind:group={newSex} value="other">Other</Radio>
        </div>
        {#if !newSex}
            <p class="text-red-500 text-sm mt-1">Please select an option</p>
        {/if}
    </div>
    
    <svelte:fragment slot="footer">
        <Button 
            class="cursor-pointer" 
            color="primary" 
            on:click={() => {
                if (newSex) {
                    modifyEmployeeSex();
                } else {
                    displayError("Sex selection is required.");
                }
            }}
            disabled={!newSex}
        >
            Confirm
        </Button>
        <Button class="cursor-pointer" color="red" on:click={() => {
            sexModal = false;
        }}>Cancel</Button>
    </svelte:fragment>
</Modal>

<Modal title="Change Employee Active Status" bind:open={activeStatusModal} autoclose>
    <div class="mb-4">
        <span>Please provide an updated employment status for {selectedEmployee.data.firstName} {selectedEmployee.data.lastName}</span>
    </div>
    
    
    <div class="mb-4">
        <Label for="newActiveStatus" class="mb-2">Employment Status <span class="text-red-500">*</span></Label>
        <div class="space-y-2">
            <Radio name="employmentStatus" checked={!isInactive} on:change={() => {
                isInactive = false;
                newActiveStatus = "Active";
            }}>Active</Radio>
            <Radio name="employmentStatus" checked={isInactive} on:change={() => {
                isInactive = true;
                // Keep the existing date if available
                if (!newActiveStatus || newActiveStatus === "Active") {
                    newActiveStatus = "";
                }
            }}>Inactive</Radio>
        </div>
    </div>

    {#if isInactive}
        <div class="mb-4">
            <Label for="lastActive" class="block mb-2 mt-4">Last Active Date <span class="text-red-500">*</span></Label>
            <Input 
                id="lastActive" 
                type="date" 
                bind:value={newActiveStatus} 
                color={isInactive && !newActiveStatus ? "red" : "green"}
                required 
            />
            {#if isInactive && !newActiveStatus}
                <p class="text-red-500 text-sm mt-1">Last active date is required for inactive employees</p>
            {/if}
        </div>
    {/if}
    
    <svelte:fragment slot="footer">
        <Button 
            class="cursor-pointer" 
            color="primary" 
            on:click={() => {
                // For inactive employees, a date is required
                if (isInactive && !newActiveStatus) {
                    displayError("Last active date is required for inactive employees.");
                    return;
                }
                modifyEmploymentStatus();
            }}
            disabled={isInactive && !newActiveStatus}
        >
            Confirm
        </Button>
        <Button class="cursor-pointer" color="red" on:click={() => {
            activeStatusModal = false;
        }}>Cancel</Button>
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
