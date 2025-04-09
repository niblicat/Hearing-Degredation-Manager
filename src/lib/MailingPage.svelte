<script lang="ts">
    import { ButtonGroup, Button, Footer, Spinner } from 'flowbite-svelte';
    import type { Employee, HearingData, HearingDataSingle } from './MyTypes';
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';
    import { AnomalyStatus } from "./interpret";
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

    interface EarData {
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

    interface HearingReportItem {
        reportYear: number;
        leftStatus: AnomalyStatus;
        rightStatus: AnomalyStatus;
    }

    interface STSCalculationResult {
        success: boolean;
        hearingReport: HearingReportItem[];
        error?: string;
    }

    interface HearingDataExtractResult {
        success: boolean;
        hearingData: HearingDataResult[];
        error?: string;
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

    // Helper function to get the readable status
    const getAnomalyStatusText = (status: AnomalyStatus): string => {
        return AnomalyStatus[status] || "Unknown";
    };

    // Get hearing data from server for a list of employee IDs
    async function fetchHearingData(employeeIDs: string[]): Promise<HearingDataExtractResult> {
        const formData = new FormData();
        formData.append('employeeIDs', JSON.stringify(employeeIDs));
        
        const response = await fetch('/dashboard?/extractHearingData', { 
            method: 'POST',
            body: formData,
        });
        
        const serverResponse = await response.json();
        return JSON.parse(JSON.parse(serverResponse.data)[0]);
    }

    // Get STS calculation for an employee for a specific year
    async function calculateSTS(employeeID: string, year: number | string, sex: string): Promise<STSCalculationResult> {
        const formData = new FormData();
        formData.append('employeeID', employeeID);
        formData.append('year', String(year));
        formData.append('sex', sex);

        const response = await fetch('/dashboard?/calculateSTS', { 
            method: 'POST',
            body: formData,
        });

        const serverResponse = await response.json();
        return JSON.parse(JSON.parse(serverResponse.data)[0]);
    }

    // Get ear data from hearing data
    function extractEarData(hearingData: HearingDataResult[], year: number, ear: string): EarData {
        const data = hearingData
            .filter(data => data.year === year && data.ear === ear)
            .reduce((acc, data) => {
                return {
                    hz500: data.hz500 ?? 0,
                    hz1000: data.hz1000 ?? 0,
                    hz2000: data.hz2000 ?? 0,
                    hz3000: data.hz3000 ?? 0,
                    hz4000: data.hz4000 ?? 0,
                    hz6000: data.hz6000 ?? 0,
                    hz8000: data.hz8000 ?? 0
                };
            }, {
                hz500: 0, hz1000: 0, hz2000: 0, hz3000: 0, hz4000: 0, hz6000: 0, hz8000: 0
            } as EarData);
        
        return data;
    }

    // Find baseline year for an employee
    async function findBaselineYear(
        employee: EmployeeForCSV, 
        hearingData: HearingDataResult[]
    ): Promise<{ year: number | null, leftEarData: EarData, rightEarData: EarData }> {
        // Initialize default return values
        const defaultEarData: EarData = { 
            hz500: 0, hz1000: 0, hz2000: 0, hz3000: 0, hz4000: 0, hz6000: 0, hz8000: 0 
        };
        
        // Get unique years for this employee, sorted chronologically
        const years = [...new Set(
            hearingData
                .filter(data => data.id === employee.employeeID)
                .map(data => data.year)
        )].sort();
        
        // Check each year to find baseline data
        for (const year of years) {
            const result = await calculateSTS(employee.employeeID, year, employee.sex);
            
            if (!result.success) continue;
            
            const selectedYearReport = result.hearingReport.find(report => 
                report.reportYear === Number(year)
            );

            if (!selectedYearReport) continue;
            
            const leftStatus = getAnomalyStatusText(selectedYearReport.leftStatus);
            const rightStatus = getAnomalyStatusText(selectedYearReport.rightStatus);
            
            // If this is baseline data, extract the ear data and return
            if (leftStatus === 'Base' && rightStatus === 'Base') {
                const employeeHearingData = hearingData.filter(data => data.id === employee.employeeID);
                const leftEarData = extractEarData(employeeHearingData, year, 'left');
                const rightEarData = extractEarData(employeeHearingData, year, 'right');
                
                return { year, leftEarData, rightEarData };
            }
        }
        
        // No baseline found
        return { year: null, leftEarData: defaultEarData, rightEarData: defaultEarData };
    }

    // Get current year data and status for an employee
    async function getCurrentYearData(
        employee: EmployeeForCSV, 
        hearingData: HearingDataResult[],
        mostRecentYear: number
    ): Promise<{ leftEarData: EarData, rightEarData: EarData, leftStatus: string, rightStatus: string }> {
        // Initialize default values
        const defaultEarData: EarData = { 
            hz500: 0, hz1000: 0, hz2000: 0, hz3000: 0, hz4000: 0, hz6000: 0, hz8000: 0 
        };
        let leftStatus = "No Data";
        let rightStatus = "No Data";
        
        // Get employee hearing data for the most recent year
        const employeeHearingData = hearingData.filter(data => data.id === employee.employeeID);
        const leftEarData = extractEarData(employeeHearingData, mostRecentYear, 'left');
        const rightEarData = extractEarData(employeeHearingData, mostRecentYear, 'right');
        
        // Get STS status for the most recent year
        const result = await calculateSTS(employee.employeeID, mostRecentYear, employee.sex);
        
        if (result.success) {
            const recentYearReport = result.hearingReport.find(report => 
                report.reportYear === mostRecentYear
            );

            if (recentYearReport) {
                leftStatus = getAnomalyStatusText(recentYearReport.leftStatus);
                rightStatus = getAnomalyStatusText(recentYearReport.rightStatus);
            }
        }
        
        return { leftEarData, rightEarData, leftStatus, rightStatus };
    }

    // Create CSV data for a single employee
    async function createEmployeeCSVRow(
        employee: EmployeeForCSV, 
        hearingData: HearingDataResult[]
    ): Promise<string[] | null> {
        // Filter data for this employee
        const csvHearingData = hearingData.filter(data => data.id === employee.employeeID);
        
        if (csvHearingData.length === 0) {
            console.log(`No hearing data found for employee ${employee.firstName} ${employee.lastName}`);
            return null;
        }

        // Find baseline data
        const { year: baselineYear, leftEarData: baselineLeftEarData, rightEarData: baselineRightEarData } = 
            await findBaselineYear(employee, hearingData);
        
        if (baselineYear === null) {
            console.log(`No baseline data found for employee ${employee.firstName} ${employee.lastName}`);
            return null;
        }
        
        // Get the most recent year's data
        const years = [...new Set(csvHearingData.map(data => data.year))].sort();
        const mostRecentYear = years[years.length - 1];
        
        const { 
            leftEarData: recentLeftEarData, 
            rightEarData: recentRightEarData,
            leftStatus: recentLeftStatus,
            rightStatus: recentRightStatus
        } = await getCurrentYearData(employee, hearingData, mostRecentYear);
        
        // Build the row with both baseline and most recent data
        return [
            employee.employeeID,
            employee.firstName,
            employee.lastName,
            employee.email,
            employee.dob,
            employee.sex,
            String(baselineYear),
            String(baselineLeftEarData.hz500), String(baselineLeftEarData.hz1000), 
            String(baselineLeftEarData.hz2000), String(baselineLeftEarData.hz3000),
            String(baselineLeftEarData.hz4000), String(baselineLeftEarData.hz6000), 
            String(baselineLeftEarData.hz8000),
            String(baselineRightEarData.hz500), String(baselineRightEarData.hz1000), 
            String(baselineRightEarData.hz2000), String(baselineRightEarData.hz3000),
            String(baselineRightEarData.hz4000), String(baselineRightEarData.hz6000), 
            String(baselineRightEarData.hz8000),
            String(mostRecentYear),
            String(recentLeftEarData.hz500), String(recentLeftEarData.hz1000), 
            String(recentLeftEarData.hz2000), String(recentLeftEarData.hz3000),
            String(recentLeftEarData.hz4000), String(recentLeftEarData.hz6000), 
            String(recentLeftEarData.hz8000),
            String(recentRightEarData.hz500), String(recentRightEarData.hz1000), 
            String(recentRightEarData.hz2000), String(recentRightEarData.hz3000),
            String(recentRightEarData.hz4000), String(recentRightEarData.hz6000), 
            String(recentRightEarData.hz8000),
            recentLeftStatus, recentRightStatus
        ];
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
        
        // Fetch hearing data from server (single server call)
        const result = await fetchHearingData(employee_IDs);

        if (!result.success) {
            throw new Error(result.error ?? "Failed to generate report");
        }

        // Process each employee
        const rows: string[] = [];
        
        for (const employee of employeeList) {
            const rowData = await createEmployeeCSVRow(employee, result.hearingData);
            if (rowData) {
                rows.push(rowData.join(','));
            }
        }

        if (rows.length === 0) {
            console.log("No baseline data found for any employee.");
            return "No data found that matches the criteria.";
        }
        
        return ([headers.join(','), ...rows].join('\n'));
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