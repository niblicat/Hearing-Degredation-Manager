<script lang="ts">
    import { ButtonGroup, Button } from 'flowbite-svelte';
    import ScatterPlot from './ScatterPlot.svelte';
    import { InfoCircleSolid } from "flowbite-svelte-icons";

    // Props
    interface Props {
        rightBaselineHearingData: Array<number>,
        rightNewHearingData: Array<number>,
        leftBaselineHearingData: Array<number>,
        leftNewHearingData: Array<number>,
        selectedYear: string,
        onEarSelectionChange: (ear: string) => void // prop for callback so left/right/both button changes both chart and hearing history 
    }

    let {
        rightBaselineHearingData = [],
        rightNewHearingData = [],
        leftBaselineHearingData = [],
        leftNewHearingData = [],
        selectedYear = "No year selected",
        onEarSelectionChange = () => {}
    }: Props = $props();

    // Chart Selection
    let isRightEar = $state(false);
    let showBoth = $state(true);
    
    const toggleChart = (ear: string) => {
        if (ear === 'both') {
            showBoth = true;
        } else {
            isRightEar = ear === 'right';
            showBoth = false;
        }
        
        // Call the callback to notify parent component
        onEarSelectionChange(ear);
    };
</script>

<div class="chart-container w-full max-w-xl">
    {#if showBoth}
        <ScatterPlot 
            plotTitle={`Audiogram for ${selectedYear}`}
            baselineHearingData={rightBaselineHearingData.concat(leftBaselineHearingData)}
            newHearingData={rightNewHearingData.concat(leftNewHearingData)}
            labels={['Right Baseline', 'Right New', 'Left Baseline', 'Left New']}
        />
    {:else if isRightEar}
        <ScatterPlot 
            plotTitle={`Audiogram for ${selectedYear}`}
            baselineHearingData={rightBaselineHearingData} 
            newHearingData={rightNewHearingData} 
            labels={['Right Baseline', 'Right New']}
        />
    {:else}
        <ScatterPlot 
            plotTitle={`Audiogram for ${selectedYear}`}
            baselineHearingData={leftBaselineHearingData} 
            newHearingData={leftNewHearingData} 
            labels={['Left Baseline', 'Left New']}
        />
    {/if}
    <div class="mt-4 flex justify-center w-full">
        <ButtonGroup class="*:!ring-primary-700 w-full">
            <Button class="cursor-pointer flex-1" color="blue" on:click={() => toggleChart('left')}>Left</Button>
            <Button class="cursor-pointer flex-1" color="red" on:click={() => toggleChart('right')}>Right</Button> 
            <Button class="cursor-pointer flex-1" color="purple" on:click={() => toggleChart('both')}>Both</Button> 
        </ButtonGroup>
    </div>
</div>