<script lang="ts">
    import { ButtonGroup, Button, Footer, Spinner, Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';
    import type { Employee, HearingHistory } from '../MyTypes';
    import { AnomalyStatus } from "../interpret";
    import PageTitle from '../Miscellaneous/PageTitle.svelte';
    import ErrorMessage from '../Miscellaneous/ErrorMessage.svelte';
    import { calculateSTSClientSide } from '../utility';
	import { getAllEmployeeHearingHistories } from '../client/postrequests';

    interface Props {
        employees: Array<Employee>;
    };

    let { employees }: Props = $props();

    let success = $state(true);
    let errorMessage = $state("");
    let loadingTemplate = $state(false);
    let loadingCSV = $state(false);

    interface EmployeeForCSV {
        employeeID: string;
        firstName: string;
        lastName: string;
        email: string;
        dob: string;
        sex: string;
    }

    function displayError(message: string): void {
        errorMessage = message;
        success = false;
    }

    // Function to create an array of employees who are currently active
    function createEmployeeList(): EmployeeForCSV[] {
        return employees
            .filter(employee => employee.activeStatus === null)
            .map((employee) => ({
                employeeID: employee.employeeID,
                firstName: employee.firstName,
                lastName: employee.lastName,
                email: employee.email,
                dob: employee.dob,
                sex: employee.sex
            }));
    }

    const getAnomalyStatusText = (status: AnomalyStatus): string => {
        return AnomalyStatus[status].replace(/([a-z])([A-Z])/g, (match: string, lower: string, upper: string) => {
            return lower + " " + upper;
        }) ?? "Unknown";
    };

    // Process employee data and generate CSV rows
    async function processEmployeeData(
        employeeList: EmployeeForCSV[], 
        hearingHistories: HearingHistory[]
    ): Promise<string[][]> {
        const rows: string[][] = [];

        console.log("Employee list:", employeeList);
        console.log("Hearing histories:", hearingHistories);
        
        for (const employee of employeeList) {
            // Find the hearing history for this employee
            console.log(`Looking for hearing history for employee ID: ${employee.employeeID}`);
        
            const hearingHistory = hearingHistories.find(history => {
                // Convert both to strings for comparison to avoid type issues
                const historyID = history?.employee?.id?.toString();
                const employeeID = employee.employeeID.toString();
                
                console.log(`Comparing: ${historyID} === ${employeeID} (${typeof historyID} vs ${typeof employeeID})`);
                return historyID === employeeID;
            });
            
            if (!hearingHistory) {
                console.log(`No matching hearing history found for employee ${employee.firstName} ${employee.lastName} (ID: ${employee.employeeID})`);
                continue;
            }
            
            if (!hearingHistory.screenings || hearingHistory.screenings.length === 0) {
                console.log(`No screenings found for employee ${employee.firstName} ${employee.lastName}`);
                continue;
            }
            
            // Get years for this employee
            const years = hearingHistory.screenings.map(screening => screening.year).sort((a, b) => a - b);
            if (years.length === 0) continue;
            
            // Calculate STS using client-side function
            const stsReports = calculateSTSClientSide(hearingHistory);
            if (!stsReports || stsReports.length === 0) continue;
            
            // First year is baseline
            const baselineYear = years[0];
            const baselineReport = stsReports.find(report => report.reportYear === baselineYear);
            if (!baselineReport) continue;
            
            // Most recent year for current data
            const currentYear = years[years.length - 1];
            const currentReport = stsReports.find(report => report.reportYear === currentYear);
            if (!currentReport) continue;
            
            // Extract data for baseline and current years
            const baselineData = hearingHistory.screenings.find(screening => screening.year === baselineYear);
            const currentData = hearingHistory.screenings.find(screening => screening.year === currentYear);

            if (!baselineData || !currentData) continue;

            const formatHearingValue = (value: number | null): string => {
                return value === null ? "CNT" : String(value);
            };
            
            // Create CSV row for this employee
            const row = [
                employee.employeeID,
                employee.firstName,
                employee.lastName,
                employee.email,
                employee.dob,
                employee.sex,
                baselineYear.toString(),
                formatHearingValue(baselineData.leftEar.hz500), formatHearingValue(baselineData.leftEar.hz1000), 
                formatHearingValue(baselineData.leftEar.hz2000), formatHearingValue(baselineData.leftEar.hz3000),
                formatHearingValue(baselineData.leftEar.hz4000), formatHearingValue(baselineData.leftEar.hz6000), 
                formatHearingValue(baselineData.leftEar.hz8000),
                formatHearingValue(baselineData.rightEar.hz500), formatHearingValue(baselineData.rightEar.hz1000), 
                formatHearingValue(baselineData.rightEar.hz2000), formatHearingValue(baselineData.rightEar.hz3000),
                formatHearingValue(baselineData.rightEar.hz4000), formatHearingValue(baselineData.rightEar.hz6000), 
                formatHearingValue(baselineData.rightEar.hz8000),
                currentYear.toString(),
                formatHearingValue(currentData.leftEar.hz500), formatHearingValue(currentData.leftEar.hz1000), 
                formatHearingValue(currentData.leftEar.hz2000), formatHearingValue(currentData.leftEar.hz3000),
                formatHearingValue(currentData.leftEar.hz4000), formatHearingValue(currentData.leftEar.hz6000), 
                formatHearingValue(currentData.leftEar.hz8000),
                formatHearingValue(currentData.rightEar.hz500), formatHearingValue(currentData.rightEar.hz1000), 
                formatHearingValue(currentData.rightEar.hz2000), formatHearingValue(currentData.rightEar.hz3000),
                formatHearingValue(currentData.rightEar.hz4000), formatHearingValue(currentData.rightEar.hz6000), 
                formatHearingValue(currentData.rightEar.hz8000),
                getAnomalyStatusText(currentReport.leftStatus), 
                getAnomalyStatusText(currentReport.rightStatus)
            ];
            
            rows.push(row);
        }
        
        return rows;
    }

    // Create CSV content from employee data
    const createCSV = async (employeeList: EmployeeForCSV[]): Promise<string> => {
        const headers = [
            "Employee_ID", "First Name", "Last_Name", "Email", "Date of Birth", "Sex", 
            "BaseYear", "Base-L-500", "Base-L-1000", "Base-L-2000", "Base-L-3000", "Base-L-4000", "Base-L-6000", "Base-L-8000",
            "Base-R-500", "Base-R-1000", "Base-R-2000", "Base-R-3000", "Base-R-4000", "Base-R-6000", "Base-R-8000",
            "CurrentYear", "L-500", "L-1000", "L-2000", "L-3000", "L-4000", "L-6000", "L-8000",
            "R-500", "R-1000", "R-2000", "R-3000", "R-4000", "R-6000", "R-8000",
            "Left Status", "Right Status"
        ];

        let hearingHistories: HearingHistory[];
        
        try {
            // send a post request to obtain all employee hearing histories
            hearingHistories = await getAllEmployeeHearingHistories(false);

            // Process all employees
            const rows = await processEmployeeData(employeeList, hearingHistories);

            if (rows.length === 0) {
                console.log("No data found for any employee.");
                return "No data found that matches the criteria.";
            }
            
            // Convert rows to CSV strings
            const csvRows = rows.map(row => row.join(','));
            return [headers.join(','), ...csvRows].join('\n');
            
        } catch (error) {
            console.error("Error creating CSV:", error);
            throw new Error(error instanceof Error ? error.message : "Unknown error occurred");
        }
    };
    
    // Handle export functionality
    async function handleExport(): Promise<void> {
        const employeeList = createEmployeeList();
        
        if (employeeList.length === 0) {
            displayError("No employees to export.");
            return;
        }
        
        loadingCSV = true;
        document.body.style.cursor = 'wait';
        
        try {
            const csvContent = await createCSV(employeeList);
            downloadCSV(csvContent);
        } catch (error) {
            if (error instanceof Error) {
                displayError(error.message);
            } else {
                displayError("An unknown error occurred during export.");
            }
        } finally {
            document.body.style.cursor = 'auto';
            loadingCSV = false;
        }
    }

    // Function to trigger file download
    function downloadCSV(csvContent: string): void {
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'employees.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    async function downloadTemplate(): Promise<void> {
        loadingTemplate = true;
        const a = document.createElement('a');
        a.href = "/SLHC Email Template.docx";
        a.download = "SLHC Email Template.docx";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        loadingTemplate = false;
    }
</script>

<div class="relative w-full">
    <div class="flex flex-col items-center justify-center">
        <PageTitle >
            Mail Merge Management
            {#snippet caption()}
                Begin the process of mailing out status notifications.
            {/snippet}
        </PageTitle>
        <ErrorMessage class="mx-10 mb-4 w-full" {success} {errorMessage} />
    </div>
</div>

<div class="flex-column justify-center mx-4">
    <Table hoverable={true} class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 z-20">
        <TableHead>
            <TableHeadCell>Name</TableHeadCell>
            <TableHeadCell>Employment Status</TableHeadCell>
            <TableHeadCell>Email</TableHeadCell>
            <TableHeadCell>Date of Birth</TableHeadCell>
            <TableHeadCell>ID</TableHeadCell>
        </TableHead>
        <TableBody tableBodyClass="divide-y">
            {#each [...employees].sort((a, b) => a.firstName.localeCompare(b.firstName)) as employee (employee.employeeID)}
                <TableBodyRow>
                    <TableBodyCell>
                        {employee.firstName} {employee.lastName}
                    </TableBodyCell>
                    <TableBodyCell>
                        {employee.activeStatus !== null ? "Current" : "Former"}
                    </TableBodyCell>
                    <TableBodyCell>
                        {employee.email}
                    </TableBodyCell>
                    <TableBodyCell>
                        {new Date(employee.dob).toLocaleDateString('en-US')}
                    </TableBodyCell>
                    <TableBodyCell>
                        {employee.employeeID}
                    </TableBodyCell>
                </TableBodyRow>
            {/each}
        </TableBody>
    </Table>
</div>

<Footer class="sticky bottom-0 w-full bg-white dark:bg-gray-900">
    <hr class="my-6 border-gray-200 sm:mx-auto dark:border-gray-700 lg:my-8" />
    <div class="sm:flex sm:items-center sm:justify-between">
        <ButtonGroup class="*:!ring-primary-700" style="width:100%">
            <Button disabled={loadingCSV} color="primary" class="w-[50%] {loadingCSV ? "" : "cursor-pointer"}" on:click={handleExport}>
                {#if loadingCSV}<Spinner class="me-3" size="4" color="white" />{/if}Export to CSV
            </Button>
            <Button disabled={loadingTemplate} color="primary" class="w-[50%] {loadingTemplate ? "" : "cursor-pointer"}" on:click={downloadTemplate}>
                {#if loadingTemplate}<Spinner class="me-3" size="4" color="white" />{/if}Download Template
            </Button>
        </ButtonGroup>
    </div>
</Footer>