<script lang="ts">
    import { Button, Card, ButtonGroup } from 'flowbite-svelte';
    import { EditOutline } from 'flowbite-svelte-icons';
    import type { Employee } from './MyTypes';
    import EmployeeChart from './EmployeeChart.svelte';

    // Props
    interface Props {
        selectedYear: string,
        selectedEmployee: { name: string, data: Employee },
        selectedEmail: string,
        selectedDOB: string,
        selectedStatus: string,
        STSstatusLeft: string,
        STSstatusRight: string,
        hearingHistory: Array<{year: string, leftStatus: string, rightStatus: string, leftBaseline: string,rightBaseline: string}>
        rightBaselineHearingData: Array<number>,
        rightNewHearingData: Array<number>,
        leftBaselineHearingData: Array<number>,
        leftNewHearingData: Array<number>,
        editname: (arg0: Employee) => void,
        editemail: (arg0: Employee) => void,
        editdob: (arg0: Employee) => void,
        editsex: (arg0: Employee) => void,
        editstatus: (arg0: Employee) => void,
        }

    let {
        selectedYear = "No year selected",
        selectedEmployee,
        selectedEmail = "No data selected",
        selectedDOB = "No data selected",
        selectedStatus = "No data selected",
        STSstatusLeft = "No data selected",
        STSstatusRight = "No data selected",
        hearingHistory = [],
        rightBaselineHearingData = [],
        rightNewHearingData = [],
        leftBaselineHearingData = [],
        leftNewHearingData = [],
        editname = () => {},
        editemail = () => {},
        editdob = () => {},
        editsex = () => {},
        editstatus = () => {}
    }: Props = $props();

    function showNameChangeModal() {
        editname(selectedEmployee.data);
    }
    
    function showEmailChangeModal() {
        editemail(selectedEmployee.data);
    }
    
    function showDOBChangeModal() {
        editdob(selectedEmployee.data);
    }
    
    function showSexChangeModal() {
        editsex(selectedEmployee.data);
    }
    
    function showActiveStatusChangeModal() {
        editstatus(selectedEmployee.data);
    }

    // Shared ear selection state between chart and history
    let isRightEar = $state(false);
    let showBoth = $state(true);

    // Handler for ear selection changes from the chart
    const handleEarSelectionChange = (ear: string) => {
        if (ear === 'both') {
            showBoth = true;
        } else {
            isRightEar = ear === 'right';
            showBoth = false;
        }
    };
</script>

<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <!-- Employee Details Card (Left Column) -->
    <div>
        <div class="flex justify-center">
            <Card padding="sm" class="w-full max-w-xl">
                <div class="bg-primary-700 text-white py-2 px-3 text-center">
                    <div class="text-lg font-bold">Employee Details</div>
                </div>
                
                <table class="w-full border-collapse">
                    <tbody>
                        <tr class="border-b hover:bg-gray-100">
                            <td class="p-3 font-semibold">Name:</td>
                            <td class="p-3 flex items-center">
                                <span>{selectedEmployee.name}</span>
                                {#if selectedEmployee.data.employeeID !== "-1"} 
                                    <Button color="light" size="xs" class="ml-2 cursor-pointer" on:click={showNameChangeModal}>
                                        <EditOutline class="w-3 h-3" />
                                    </Button>
                                {/if}
                            </td>
                        </tr>
                        <tr class="border-b hover:bg-gray-100">
                            <td class="p-3 font-semibold">Email:</td>
                            <td class="p-3 flex items-center">
                                <span class="break-words overflow-hidden">{selectedEmail}</span>
                                {#if selectedEmployee.data.email !== "Undefined"} 
                                    <Button color="light" size="xs" class="ml-2 cursor-pointer" on:click={showEmailChangeModal}>
                                        <EditOutline class="w-3 h-3" />
                                    </Button>
                                {/if}
                            </td>
                        </tr>
                        <tr class="border-b hover:bg-gray-100">
                            <td class="p-3 font-semibold">Date of Birth:</td>
                            <td class="p-3 flex items-center">
                                <span class="break-words overflow-hidden">{selectedDOB}</span>
                                {#if selectedEmployee.data.dob !== "Undefined"} 
                                    <Button color="light" size="xs" class="ml-2 cursor-pointer" on:click={showDOBChangeModal}>
                                        <EditOutline class="w-3 h-3" />
                                    </Button>
                                {/if}
                            </td>
                        </tr>
                        <tr class="border-b hover:bg-gray-100">
                            <td class="p-3 font-semibold">Sex:</td>
                            <td class="p-3 flex items-center">
                                <span class="break-words overflow-hidden">{selectedEmployee.data.sex}</span>
                                {#if selectedEmployee.data.sex !== "Undefined"} 
                                    <Button color="light" size="xs" class="ml-2 cursor-pointer" on:click={showSexChangeModal}>
                                        <EditOutline class="w-3 h-3" />
                                    </Button>
                                {/if}
                            </td>
                        </tr>
                        <tr class="hover:bg-gray-100">
                            <td class="p-3 font-semibold">Employment Status:</td>
                            <td class="p-3 flex items-center">
                                <span class="break-words overflow-hidden">{selectedStatus}</span>
                                {#if selectedEmployee.data.employeeID !== "-1"} 
                                    <Button color="light" size="xs" class="ml-2 cursor-pointer" on:click={showActiveStatusChangeModal}>
                                        <EditOutline class="w-3 h-3" />
                                    </Button>
                                {/if}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </Card>
        </div>
    </div>

    <!-- Right Column (Audiogram Section and Chart) -->
    <div class="flex flex-col gap-4">
        <!-- Audiogram Card -->
        <div class="flex justify-center">
            <Card padding="sm" class="w-full max-w-xl">
                <div class="bg-primary-700 text-white py-2 px-3 text-center">
                    <div class="text-lg font-bold">Audiogram for {selectedYear}</div>
                </div>
                
                <table class="w-full border-collapse">
                    <tbody>
                        <tr class="border-b hover:bg-gray-100">
                            <td class="p-3 font-semibold">Left Ear Status:</td>
                            <td class="p-3">{STSstatusLeft}</td>
                        </tr>
                        <tr class="hover:bg-gray-100">
                            <td class="p-3 font-semibold">Right Ear Status:</td>
                            <td class="p-3">{STSstatusRight}</td>
                        </tr>
                    </tbody>
                </table>
            </Card>
        </div>
        
        <!-- Chart below the audiogram table -->
        <div class="flex justify-center">
            <Card padding="sm" class="w-full max-w-xl">
                <EmployeeChart 
                    {rightBaselineHearingData}
                    {rightNewHearingData}
                    {leftBaselineHearingData}
                    {leftNewHearingData}
                    {selectedYear}
                    onEarSelectionChange={handleEarSelectionChange}
                />
            </Card>
        </div>

        <!-- Hearing history below the chart -->
        <div class="flex justify-center">
            <Card padding="sm" class="w-full max-w-xl">
                <div class="bg-primary-700 text-white py-2 px-3 text-center">
                    <div class="text-lg font-bold">Hearing History</div>
                </div>
                <table class="w-full border-collapse">
                    <tbody>
                        <tr class="border-b hover:bg-gray-100">
                            <td class="p-3 font-semibold">Year:</td>
                            {#if showBoth}
                                <td class="p-3 font-semibold">Left Ear Status:</td>
                                <td class="p-3 font-semibold">Right Ear Status:</td>
                                <td class="p-3 font-semibold">Left Ear Baseline:</td>
                                <td class="p-3 font-semibold">Right Ear Baseline:</td>
                            {:else if isRightEar}
                                <td class="p-3 font-semibold">Right Ear Status:</td>
                                <td class="p-3 font-semibold">Right Ear Baseline:</td>
                            {:else}
                                <td class="p-3 font-semibold">Left Ear Status:</td>
                                <td class="p-3 font-semibold">Left Ear Baseline:</td>
                            {/if}
                        </tr>
                        
                        {#if hearingHistory.length === 0}
                            <tr class="border-b hover:bg-gray-100">
                                <td colspan="3" class="p-3 text-center">No hearing history available</td>
                            </tr>
                        {:else}
                            {#each hearingHistory as record}
                                <tr class="border-b hover:bg-gray-100" class:font-bold={record.year === selectedYear}>
                                    <td class="p-3">{record.year}</td>
                                    {#if showBoth}
                                        <td class="p-3">{record.leftStatus}</td>
                                        <td class="p-3">{record.rightStatus}</td>
                                        <td class="p-3">{record.leftBaseline}</td>
                                        <td class="p-3">{record.rightBaseline}</td>
                                    {:else if isRightEar}
                                        <td class="p-3">{record.rightStatus}</td>
                                        <td class="p-3">{record.rightBaseline}</td>
                                    {:else}
                                        <td class="p-3">{record.leftStatus}</td>
                                        <td class="p-3">{record.leftBaseline}</td>
                                    {/if}
                                </tr>
                            {/each}
                        {/if}
                    </tbody>
                </table>
            </Card>
        </div>
    </div>
</div>