<script lang="ts">
    import { ButtonGroup, Button, Footer, Spinner } from 'flowbite-svelte';
    import type { Employee, HearingData, HearingDataSingle, HearingHistory } from './MyTypes';
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';
    import { AnomalyStatus, EarAnomalyStatus, PersonSex } from "./interpret";
    import PageTitle from './PageTitle.svelte';
    import ErrorMessage from './ErrorMessage.svelte';
    import { calculateSTSClientSide } from './utility';

    interface Props {
        employees: Array<Employee>;
    };

    let { employees }: Props = $props();

    let success = $state(true);
    let errorMessage = $state("");
    let loadingTemplate = $state(false);
    let loadingCSV = $state(false);

    let STSstatusRight = $state("No data selected");
    let STSstatusLeft = $state("No data selected");

    interface EarData { // just use HearingDataSingle instead?
        hz500: number;
        hz1000: number;
        hz2000: number;
        hz3000: number;
        hz4000: number;
        hz6000: number;
        hz8000: number;
    }

    interface HearingDataResult {
        id: string;
        year: number;
        ear: string;
        hz500: number | null;
        hz1000: number | null;
        hz2000: number | null;
        hz3000: number | null;
        hz4000: number | null;
        hz6000: number | null;
        hz8000: number | null;
    }

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

    // Function to create an array of employees
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

    // Get hearing data from server for a list of employee IDs
    async function fetchHearingData(employeeIDs: string[]): Promise<{
        success: boolean;
        hearingData: HearingDataResult[];
        error?: string;
    }> {
        const formData = new FormData();
        formData.append('employeeIDs', JSON.stringify(employeeIDs));
        
        const response = await fetch('/dashboard?/extractHearingData', { 
            method: 'POST',
            body: formData,
        });
        
        const serverResponse = await response.json();
        return JSON.parse(JSON.parse(serverResponse.data)[0]);
    }

    // Convert server hearing data to the format expected by calculateSTSClientSide
    function convertToHearingHistory(
        employeeData: HearingDataResult[], 
        dateOfBirth: string, 
        sex: string
    ): HearingHistory {
        // Group data by year
        const yearData = employeeData.reduce((acc, data) => {
            if (!acc[data.year]) {
                acc[data.year] = {
                    left: { 
                        hz500: null, hz1000: null, hz2000: null, 
                        hz3000: null, hz4000: null, hz6000: null, hz8000: null 
                    },
                    right: { 
                        hz500: null, hz1000: null, hz2000: null, 
                        hz3000: null, hz4000: null, hz6000: null, hz8000: null 
                    }
                };
            }
            
            // Populate the correct ear's data
            if (data.ear === 'left') {
                acc[data.year].left = {
                    hz500: data.hz500,
                    hz1000: data.hz1000,
                    hz2000: data.hz2000,
                    hz3000: data.hz3000,
                    hz4000: data.hz4000,
                    hz6000: data.hz6000,
                    hz8000: data.hz8000
                };
            } else if (data.ear === 'right') {
                acc[data.year].right = {
                    hz500: data.hz500,
                    hz1000: data.hz1000,
                    hz2000: data.hz2000,
                    hz3000: data.hz3000,
                    hz4000: data.hz4000,
                    hz6000: data.hz6000,
                    hz8000: data.hz8000
                };
            }
            
            return acc;
        }, {} as Record<string, any>);

        // Create the hearing history object
        return {
            dateOfBirth: dateOfBirth,
            sex: sex,
            screenings: yearData
        };
    }

    // Process employee data and generate CSV rows
    async function processEmployeeData(
        employeeList: EmployeeForCSV[], 
        hearingDataResults: HearingDataResult[]
    ): Promise<string[][]> {
        const rows: string[][] = [];
        
        for (const employee of employeeList) {
            // Filter hearing data for this employee
            const employeeHearingData = hearingDataResults.filter(
                data => data.id === employee.employeeID
            );
            
            if (employeeHearingData.length === 0) {
                console.log(`No hearing data found for employee ${employee.firstName} ${employee.lastName}`);
                continue;
            }
            
            // Get years for this employee
            const years = [...new Set(employeeHearingData.map(data => data.year))].sort((a, b) => a - b);
            if (years.length === 0) continue;
            
            // Convert to hearing history format
            const hearingHistory = convertToHearingHistory(
                employeeHearingData,
                employee.dob,
                employee.sex
            );
            
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
            const baselineData = hearingHistory.screenings[baselineYear.toString()];
            const currentData = hearingHistory.screenings[currentYear.toString()];
            
            if (!baselineData || !currentData) continue;
            
            // Create CSV row for this employee
            const row = [
                employee.employeeID,
                employee.firstName,
                employee.lastName,
                employee.email,
                employee.dob,
                employee.sex,
                baselineYear.toString(),
                String(baselineData.left.hz500 ?? ''), String(baselineData.left.hz1000 ?? ''), 
                String(baselineData.left.hz2000 ?? ''), String(baselineData.left.hz3000 ?? ''),
                String(baselineData.left.hz4000 ?? ''), String(baselineData.left.hz6000 ?? ''), 
                String(baselineData.left.hz8000 ?? ''),
                String(baselineData.right.hz500 ?? ''), String(baselineData.right.hz1000 ?? ''), 
                String(baselineData.right.hz2000 ?? ''), String(baselineData.right.hz3000 ?? ''),
                String(baselineData.right.hz4000 ?? ''), String(baselineData.right.hz6000 ?? ''), 
                String(baselineData.right.hz8000 ?? ''),
                currentYear.toString(),
                String(currentData.left.hz500 ?? ''), String(currentData.left.hz1000 ?? ''), 
                String(currentData.left.hz2000 ?? ''), String(currentData.left.hz3000 ?? ''),
                String(currentData.left.hz4000 ?? ''), String(currentData.left.hz6000 ?? ''), 
                String(currentData.left.hz8000 ?? ''),
                String(currentData.right.hz500 ?? ''), String(currentData.right.hz1000 ?? ''), 
                String(currentData.right.hz2000 ?? ''), String(currentData.right.hz3000 ?? ''),
                String(currentData.right.hz4000 ?? ''), String(currentData.right.hz6000 ?? ''), 
                String(currentData.right.hz8000 ?? ''),
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

        // Get employee IDs for the server request
        const employee_IDs = employeeList.map(employee => employee.employeeID);
        
        try {
            // Fetch hearing data from server (single server call)
            const result = await fetchHearingData(employee_IDs);

            if (!result.success) {
                throw new Error(result.error ?? "Failed to generate report");
            }

            // Process all employees
            const rows = await processEmployeeData(employeeList, result.hearingData);

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