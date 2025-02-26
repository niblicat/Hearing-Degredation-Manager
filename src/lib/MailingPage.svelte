<script lang="ts">
    import { ButtonGroup, Button, Footer, Spinner } from 'flowbite-svelte';
    import type { Employee } from './MyTypes';
    import { Table, TableBody, TableBodyCell, TableBodyRow, TableHead, TableHeadCell, Checkbox, Modal, Tooltip } from 'flowbite-svelte';
    import { AnomalyStatus } from "./interpret";

    interface Props {
        employees: Array<Employee>;
    };

    let { employees }: Props = $props();

    // No need for employeesMap anymore; we directly work with the employees array
    let success = $state(true);
    let errorMessage = $state("");
    let loadingTemplate = $state(false);
    let loadingCSV = $state(false);

    let STSstatusRight = $state("No data selected");
    let STSstatusLeft = $state("No data selected");

    function displayError(message: string) {
        errorMessage = message;
        success = false;
    }

    // Function to create an array of employees (no filtering needed)
    function createEmployeeList() {
        return employees.map((employee) => ({
            employeeID: employee.employeeID,
            firstName: employee.firstName,
            lastName: employee.lastName,
            email: employee.email,
            dob: employee.dob,
            sex: employee.sex
        }));
    }

    const createCSV = async (employeeList: Array<any>) => {
        const headers = [
            "Employee_ID", "First Name", "Last_Name", "Email", "Date of Birth", "Sex", 
            "BaseYear", "Base-L-500", "Base-L-1000", "Base-L-2000", "Base-L-3000", "Base-L-4000", "Base-L-6000", "Base-L-8000",
            "Base-R-500", "Base-R-1000", "Base-R-2000", "Base-R-3000", "Base-R-4000", "Base-R-6000", "Base-R-8000",
            "CurrentYear", "L-500", "L-1000", "L-2000", "L-3000", "L-4000", "L-6000", "L-8000",
            "R-500", "R-1000", "R-2000", "R-3000", "R-4000", "R-6000", "R-8000",
            "Left Status", "Right Status"
        ];

        // for set up and such
        const employee_IDs = employeeList.map(employee => employee.employeeID);
        const formData = new FormData();
        formData.append('employeeIDs', JSON.stringify(employee_IDs));
        const response = await fetch('/dashboard?/extractHearingData', { 
            method: 'POST',
            body: formData,
        });
        const serverResponse = await response.json();
        const result = JSON.parse(JSON.parse(serverResponse.data)[0]);

        // getting into the creation of the csv
        if (result["success"]) {
            // Map rows for each employee
            const rows = [];

            // Loop over each employee to process their data
            for (const employee of employeeList) {
                // Find all hearing data corresponding to this employee
                // TODO: Add the type for data (hopefully, HearingData from MyTypes.ts)
                const csvHearingData = result.hearingData.filter(data => data.id === employee.employeeID);
                if (csvHearingData.length === 0) {
                    console.log(`No hearing data found for employee ${employee.firstName} ${employee.lastName}`);
                    continue;
                }

                // Find the baseline data
                let baselineData = null;
                let baselineYear = null;
                let baselineLeftEarData = { hz500: 0, hz1000: 0, hz2000: 0, hz3000: 0, hz4000: 0, hz6000: 0, hz8000: 0 };
                let baselineRightEarData = { hz500: 0, hz1000: 0, hz2000: 0, hz3000: 0, hz4000: 0, hz6000: 0, hz8000: 0 };
                
                // Group hearing data by year
                const years = [...new Set(csvHearingData.map(data => data.year))].sort();
                
                // Check each year to find baseline data (where both ears have 'Base' status)
                for (const year of years) {
                    const yearData = csvHearingData.filter(data => data.year === year);
                    
                    // Get STS status for this year
                    const formData = new FormData();
                    formData.append('employeeID', employee.employeeID);
                    formData.append('year', String(year));
                    formData.append('sex', employee.sex);

                    const response = await fetch('/dashboard?/calculateSTS', { 
                        method: 'POST',
                        body: formData,
                    });

                    const serverResponse = await response.json();
                    const result = JSON.parse(JSON.parse(serverResponse.data)[0]);
                    
                    if (result["success"]) {
                        const selectedYearReport = result.hearingReport.find((report: any) => 
                            report.reportYear === parseInt(String(year), 10)
                        );

                        if (selectedYearReport) {
                            const leftStatus = GetAnomalyStatusText(selectedYearReport.leftStatus);
                            const rightStatus = GetAnomalyStatusText(selectedYearReport.rightStatus);
                            
                            // If this is baseline data, save it
                            if (leftStatus === 'Base' && rightStatus === 'Base') {
                                baselineYear = year;
                                
                                // Extract left and right ear data for baseline
                                yearData.forEach(data => {
                                    if (data.ear === 'left') {
                                        baselineLeftEarData = { 
                                            hz500: data.hz500 ?? 0, hz1000: data.hz1000 ?? 0, hz2000: data.hz2000 ?? 0, 
                                            hz3000: data.hz3000 ?? 0, hz4000: data.hz4000 ?? 0, hz6000: data.hz6000 ?? 0, hz8000: data.hz8000 ?? 0 
                                        };
                                    } else if (data.ear === 'right') {
                                        baselineRightEarData = { 
                                            hz500: data.hz500 ?? 0, hz1000: data.hz1000 ?? 0, hz2000: data.hz2000 ?? 0, 
                                            hz3000: data.hz3000 ?? 0, hz4000: data.hz4000 ?? 0, hz6000: data.hz6000 ?? 0, hz8000: data.hz8000 ?? 0 
                                        };
                                    }
                                });
                                
                                // We found baseline data, break out of loop
                                break;
                            }
                        }
                    }
                }
                
                // If we couldn't find baseline data, skip this employee
                if (baselineYear === null) {
                    console.log(`No baseline data found for employee ${employee.firstName} ${employee.lastName}`);
                    continue;
                }
                
                // Now get the most recent year's data
                const mostRecentYear = years[years.length - 1];
                const recentData = csvHearingData.filter(data => data.year === mostRecentYear);
                
                // Initialize variables to store the most recent hearing data for both ears
                let recentLeftEarData = { hz500: 0, hz1000: 0, hz2000: 0, hz3000: 0, hz4000: 0, hz6000: 0, hz8000: 0 };
                let recentRightEarData = { hz500: 0, hz1000: 0, hz2000: 0, hz3000: 0, hz4000: 0, hz6000: 0, hz8000: 0 };
                let recentLeftStatus = "No Data";
                let recentRightStatus = "No Data";
                
                // Extract left and right ear data for the most recent year
                recentData.forEach(data => {
                    if (data.ear === 'left') {
                        recentLeftEarData = { 
                            hz500: data.hz500 ?? 0, hz1000: data.hz1000 ?? 0, hz2000: data.hz2000 ?? 0, 
                            hz3000: data.hz3000 ?? 0, hz4000: data.hz4000 ?? 0, hz6000: data.hz6000 ?? 0, hz8000: data.hz8000 ?? 0 
                        };
                    } else if (data.ear === 'right') {
                        recentRightEarData = { 
                            hz500: data.hz500 ?? 0, hz1000: data.hz1000 ?? 0, hz2000: data.hz2000 ?? 0, 
                            hz3000: data.hz3000 ?? 0, hz4000: data.hz4000 ?? 0, hz6000: data.hz6000 ?? 0, hz8000: data.hz8000 ?? 0 
                        };
                    }
                });
                
                // Get STS status for the most recent year
                const recentFormData = new FormData();
                recentFormData.append('employeeID', employee.employeeID);
                recentFormData.append('year', String(mostRecentYear));
                recentFormData.append('sex', employee.sex);

                const recentResponse = await fetch('/dashboard?/calculateSTS', { 
                    method: 'POST',
                    body: recentFormData,
                });

                const recentServerResponse = await recentResponse.json();
                const recentResult = JSON.parse(JSON.parse(recentServerResponse.data)[0]);
                
                if (recentResult["success"]) {
                    const recentYearReport = recentResult.hearingReport.find((report: any) => 
                        report.reportYear === parseInt(String(mostRecentYear), 10)
                    );

                    if (recentYearReport) {
                        recentLeftStatus = GetAnomalyStatusText(recentYearReport.leftStatus);
                        recentRightStatus = GetAnomalyStatusText(recentYearReport.rightStatus);
                    }
                }
                
                // Build the row with both baseline and most recent data
                let rowData = [
                    employee.employeeID,
                    employee.firstName,
                    employee.lastName,
                    employee.email,
                    employee.dob,
                    employee.sex,
                    baselineYear,
                    baselineLeftEarData.hz500, baselineLeftEarData.hz1000, baselineLeftEarData.hz2000, baselineLeftEarData.hz3000,
                    baselineLeftEarData.hz4000, baselineLeftEarData.hz6000, baselineLeftEarData.hz8000,
                    baselineRightEarData.hz500, baselineRightEarData.hz1000, baselineRightEarData.hz2000, baselineRightEarData.hz3000,
                    baselineRightEarData.hz4000, baselineRightEarData.hz6000, baselineRightEarData.hz8000,
                    mostRecentYear,
                    recentLeftEarData.hz500, recentLeftEarData.hz1000, recentLeftEarData.hz2000, recentLeftEarData.hz3000,
                    recentLeftEarData.hz4000, recentLeftEarData.hz6000, recentLeftEarData.hz8000,
                    recentRightEarData.hz500, recentRightEarData.hz1000, recentRightEarData.hz2000, recentRightEarData.hz3000,
                    recentRightEarData.hz4000, recentRightEarData.hz6000, recentRightEarData.hz8000,
                    recentLeftStatus, recentRightStatus
                ];
                
                rows.push(rowData.join(','));
            }

            if (rows.length === 0) {
                console.log("No baseline data found for any employee.");
                return "No data found that matches the criteria.";
            }
            
            return ([headers.join(','), ...rows].join('\n'));
        } 
        else {
            throw new Error(serverResponse.error ?? "Failed to generate report");
        }
    };
    
    // Helper function to get the readable status
    const GetAnomalyStatusText = (status: AnomalyStatus): string => {
        return AnomalyStatus[status] || "Unknown";
    };
    
    // Handle export functionality
    async function handleExport() {
        const employeeList = createEmployeeList(); // Get the list of all employees
        loadingCSV = true;
        document.body.style.cursor='wait';
        const csvContent = await createCSV(employeeList); // Generate CSV content
        if (employeeList.length > 0) {
            downloadCSV(csvContent); // Call the function to download the CSV
        } else {
            displayError("No employees to export.");
        }
        document.body.style.cursor='auto';
        loadingCSV = false;
    }

    // Function to trigger file download
    async function downloadCSV(csvContent: string) {
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'employees.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    async function downloadTemplate() {
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

<div class="flex-column justify-center mx-4">
    <Table hoverable={true} class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
        <caption class="p-5 text-lg font-semibold text-left text-gray-900 bg-white dark:text-white dark:bg-gray-800">
            Mail Merge Page
            <p class="mt-1 text-sm font-normal text-gray-500 dark:text-gray-400">Select "Export to CSV" to begin the mail merge.</p>
            {#if !success}
            <p class="mt-1 text-sm font-normal text-red-600 dark:text-red-300">{errorMessage}</p>
            {/if}
        </caption>
        <TableHead>
            <TableHeadCell>Name</TableHeadCell>
            <TableHeadCell>Email</TableHeadCell>
            <TableHeadCell>ID</TableHeadCell>
            <TableHeadCell>Date of Birth</TableHeadCell>
        </TableHead>
        <TableBody tableBodyClass="divide-y">
            {#each employees as employee (employee.employeeID)}
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
            <Button disabled={loadingTemplate} color="primary" class="w-[50%] {loadingTemplate ? "" : "cursor-pointer"}" on:click={downloadTemplate}>
                {#if loadingTemplate}<Spinner class="me-3" size="4" color="white" />{/if}Download Template
            </Button>
            <Button disabled={loadingCSV} color="primary" class="w-[50%] {loadingCSV ? "" : "cursor-pointer"}" on:click={handleExport}>
                {#if loadingCSV}<Spinner class="me-3" size="4" color="white" />{/if}Export to CSV
            </Button>
        </ButtonGroup>
    </div>
</Footer>