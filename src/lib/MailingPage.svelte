<script lang="ts">
    import { ButtonGroup, Button, Footer, Spinner } from 'flowbite-svelte';
    import type { Employee, HearingData, HearingDataSingle, HearingHistory, EmployeeInfo, ExtendedHearingHistory } from './MyTypes';
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell } from 'flowbite-svelte';
    import { AnomalyStatus, type EarAnomalyStatus, PersonSex } from "./interpret";
    import PageTitle from './PageTitle.svelte';
    import ErrorMessage from './ErrorMessage.svelte';
    import { calculateSTSClientSide } from './utility';
	import { DatasetController } from 'chart.js';

    interface Props {
        employees: Array<Employee>;
    };

    let { employees }: Props = $props();

    let success = $state(true);
    let errorMessage = $state("");
    let loadingTemplate = $state(false);
    let loadingCSV = $state(false);

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
        hearingHistories: HearingHistory[];
        error?: string;
    }> {
        try {
            const hearingHistories: HearingHistory[] = [];
            
            // Process each employee ID one at a time
            for (const employeeID of employeeIDs) {
                const formData = new FormData();
                formData.append('employeeID', employeeID); // Note: single ID, not an array
                
                const response = await fetch('/dashboard?/extractEmployeeHearingHistory', {
                    method: 'POST',
                    body: formData,
                });
                
                const serverResponse = await response.json();
                const parsedResponse = JSON.parse(JSON.parse(serverResponse.data)[0]);

                // console.log(serverResponse)
                // console.log(parsedResponse)
                
                if (parsedResponse["success"]) {
                    hearingHistories.push(parsedResponse.history);
                } else {
                    console.warn(`Could not fetch hearing history for employee ${employeeID}`);
                }

                // console.log("HEARING HISTORIES:\n", (JSON.stringify(hearingHistories)))
            }
            
            return {
                success: true,
                hearingHistories
            };
            
        } catch (error) {
            console.error("Error fetching hearing histories:", error);
            return {
                success: false,
                hearingHistories: [],
                error: error instanceof Error ? error.message : "Unknown error occurred"
            };
        }
    }

    // Convert server hearing data to the format expected by calculateSTSClientSide
    function convertToHearingHistory(employeeData: HearingDataResult[], dateOfBirth: Date,  sex: PersonSex): ExtendedHearingHistory {
        // Group data by year first to organize the data
        const yearGroups = employeeData.reduce((groups, data) => {
            if (!groups[data.year]) {
                groups[data.year] = {
                    year: data.year,
                    leftData: [],
                    rightData: []
                };
            }
            
            // Populate the correct ear's data
            if (data.ear === 'left') {
                groups[data.year].leftData = data;
            } else if (data.ear === 'right') {
                groups[data.year].rightData = data;
            }
            
            return groups;
        }, {} as Record<number, any>);
        
        // Convert directly to an array of HearingScreening objects
        const screeningsArray = Object.values(yearGroups).map(group => ({
            year: group.year,
            leftEar: {
                hz500: group.leftData.hz500 ?? null,
                hz1000: group.leftData.hz1000 ?? null,
                hz2000: group.leftData.hz2000 ?? null,
                hz3000: group.leftData.hz3000 ?? null,
                hz4000: group.leftData.hz4000 ?? null,
                hz6000: group.leftData.hz6000 ?? null,
                hz8000: group.leftData.hz8000 ?? null
            },
            rightEar: {
                hz500: group.rightData.hz500 ?? null,
                hz1000: group.rightData.hz1000 ?? null,
                hz2000: group.rightData.hz2000 ?? null,
                hz3000: group.rightData.hz3000 ?? null,
                hz4000: group.rightData.hz4000 ?? null,
                hz6000: group.rightData.hz6000 ?? null,
                hz8000: group.rightData.hz8000 ?? null
            }
        }));

        // Create an employee info object with the provided data
        const employeeInfo: EmployeeInfo = {
            id: -1, // Placeholder ID since it's not provided in the parameters
            firstName: "", // Placeholder first name
            lastName: "", // Placeholder last name
            email: "", // Placeholder email
            dob: dateOfBirth,
            lastActive: null,
            sex: sex
        };
        
        // Return with the additional properties that calculateSTSClientSide expects
        return {
            employee: employeeInfo,
            screenings: screeningsArray,
            dateOfBirth: dateOfBirth, 
            sex: sex 
        };
    }

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
            
            // Create ExtendedHearingHistory with added dateOfBirth and sex properties
            const extendedHistory: ExtendedHearingHistory = {
                ...hearingHistory,
                dateOfBirth: new Date(employee.dob),
                sex: hearingHistory.employee.sex
            };
            
            // Calculate STS using client-side function
            const stsReports = calculateSTSClientSide(extendedHistory);
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

        // Get employee IDs for the server request
        const employee_IDs = employeeList.map(employee => employee.employeeID);
        
        try {
            // Fetch hearing data from server (single server call)
            const result = await fetchHearingData(employee_IDs);

            if (!result.success) {
                throw new Error(result.error ?? "Failed to generate report");
            }

            // Process all employees
            const rows = await processEmployeeData(employeeList, result.hearingHistories);

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