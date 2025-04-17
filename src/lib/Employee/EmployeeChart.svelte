<script lang="ts">
    import { ButtonGroup, Button } from 'flowbite-svelte';
    import ScatterPlot from './ScatterPlot.svelte';
    import { InfoCircleSolid } from "flowbite-svelte-icons";

    // Props
    interface Props {
        rightBaselineHearingData: Array<number | string>,
        rightNewHearingData: Array<number | string>,
        leftBaselineHearingData: Array<number | string>,
        leftNewHearingData: Array<number | string>,
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
            rightBaselineData={rightBaselineHearingData}
            rightNewData={rightNewHearingData}
            leftBaselineData={leftBaselineHearingData}
            leftNewData={leftNewHearingData}
            showRight={true}
            showLeft={true}
        />
    {:else if isRightEar}
        <ScatterPlot 
            plotTitle={`Audiogram for ${selectedYear}`}
            rightBaselineData={rightBaselineHearingData}
            rightNewData={rightNewHearingData}
            leftBaselineData={[]}
            leftNewData={[]}
            showRight={true}
            showLeft={false}
        />
    {:else}
        <ScatterPlot 
            plotTitle={`Audiogram for ${selectedYear}`}
            rightBaselineData={[]}
            rightNewData={[]}
            leftBaselineData={leftBaselineHearingData}
            leftNewData={leftNewHearingData}
            showRight={false}
            showLeft={true}
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