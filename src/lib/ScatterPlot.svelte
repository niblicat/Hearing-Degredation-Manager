<script lang="ts">
    import { onMount } from "svelte";
    import { Chart, registerables } from 'chart.js';
    import { InfoCircleSolid } from "flowbite-svelte-icons";
    import { Tooltip } from 'flowbite-svelte';

    
    interface Props {
        rightBaselineData: Array<number | string>;
        rightNewData: Array<number | string>;
        leftBaselineData: Array<number | string>;
        leftNewData: Array<number | string>;
        plotTitle: string;
        showRight?: boolean;
        showLeft?: boolean;
    }

    let {
        rightBaselineData = [],
        rightNewData = [],
        leftBaselineData = [],
        leftNewData = [],
        plotTitle = "Audiogram",
        showRight = true,
        showLeft = true
    }: Props = $props();

    let chart: any;

    // Custom tick values
    const customTicksX = [500, 1000, 2000, 3000, 4000, 6000, 8000];
    const customTicksY = [100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0, -10];

    function getPointStyle(label: string) {
        if (label.includes("Right Baseline")) return "rect";
        if (label.includes("Left Baseline")) return "rect";
        if (label.includes("Right New")) return "circle";
        if (label.includes("Left New")) return "crossRot";
    }

    function getPointRadius(label: string) {
        if (label.includes("Right Baseline")) return 6;
        if (label.includes("Left Baseline")) return 6;
        if (label.includes("Right New")) return 5;
        if (label.includes("Left New")) return 9;
    }

    function getColor(label: string) {
        if (label.includes("Right Baseline")) return 'rgba(166, 5, 39, 1)';
        if (label.includes("Left Baseline")) return 'rgba(10, 81, 128, 1)';
        if (label.includes("Right New")) return 'rgba(255, 99, 132, 1)';
        if (label.includes("Left New")) return 'rgba(54, 162, 235, 1)';
    }

    // Helper function to convert "CNT" to null but preserve array structure
    function cleanHearingData(data: Array<any>): Array<number | null> {
        // Ensure we have exactly 7 elements (for each frequency)
        const result = new Array(7).fill(null);
        
        for (let i = 0; i < 7; i++) {
            const val = i < data.length ? data[i] : null;
            if (val === "CNT" || val === null || val === undefined || val === "") {
                result[i] = null;
            } else {
                // Make sure we're returning a number
                const numVal = Number(val);
                result[i] = isNaN(numVal) ? null : numVal;
            }
        }
        
        return result;
    }

    // Create data points maintaining positions even for null values
    function createDataPoints(data: Array<number | null>): Array<{x: number, y: number | null}> {
        return customTicksX.map((freq, i) => ({
            x: i,
            y: i < data.length ? data[i] : null
        }));
    }

    // Function to build datasets based on which ears to show
    function buildDatasets() {
        const datasets = [];
        
        if (showRight) {
            // Process Right Baseline data
            const cleanedRightBaseline = cleanHearingData(rightBaselineData);
            console.log("Cleaned Right Baseline:", cleanedRightBaseline);
            
            // Right Baseline dataset
            datasets.push({
                label: 'Right Baseline',
                data: createDataPoints(cleanedRightBaseline),
                pointStyle: getPointStyle('Right Baseline'),
                pointRadius: getPointRadius('Right Baseline'),
                pointHoverRadius: getPointRadius('Right Baseline'),
                backgroundColor: getColor('Right Baseline'),
                borderColor: getColor('Right Baseline'),
                borderWidth: 2,
                showLine: true,
                fill: false,
                lineTension: 0,
                spanGaps: true, // Connect points even with gaps
            });
            
            // Process Right New data
            const cleanedRightNew = cleanHearingData(rightNewData);
            console.log("Cleaned Right New:", cleanedRightNew);
            
            // Right New dataset
            datasets.push({
                label: 'Right New',
                data: createDataPoints(cleanedRightNew),
                pointStyle: getPointStyle('Right New'),
                pointRadius: getPointRadius('Right New'),
                pointHoverRadius: getPointRadius('Right New'),
                backgroundColor: getColor('Right New'),
                borderColor: getColor('Right New'),
                borderWidth: 2,
                showLine: true,
                fill: false,
                lineTension: 0,
                spanGaps: true, // Connect points even with gaps
            });
        }
        
        if (showLeft) {
            // Process Left Baseline data
            const cleanedLeftBaseline = cleanHearingData(leftBaselineData);
            console.log("Cleaned Left Baseline:", cleanedLeftBaseline);
            
            // Left Baseline dataset
            datasets.push({
                label: 'Left Baseline',
                data: createDataPoints(cleanedLeftBaseline),
                pointStyle: getPointStyle('Left Baseline'),
                pointRadius: getPointRadius('Left Baseline'),
                pointHoverRadius: getPointRadius('Left Baseline'),
                backgroundColor: getColor('Left Baseline'),
                borderColor: getColor('Left Baseline'),
                borderWidth: 2,
                showLine: true,
                fill: false,
                lineTension: 0,
                spanGaps: true, // Connect points even with gaps
            });
            
            // Process Left New data
            const cleanedLeftNew = cleanHearingData(leftNewData);
            console.log("Cleaned Left New:", cleanedLeftNew);
            
            // Left New dataset
            datasets.push({
                label: 'Left New',
                data: createDataPoints(cleanedLeftNew),
                pointStyle: getPointStyle('Left New'),
                pointRadius: getPointRadius('Left New'),
                pointHoverRadius: getPointRadius('Left New'),
                backgroundColor: getColor('Left New'),
                borderColor: getColor('Left New'),
                borderWidth: 2,
                showLine: true,
                fill: false,
                lineTension: 0,
                spanGaps: true, // Connect points even with gaps
            });
        }
        
        return datasets;
    }

    onMount(() => {
        Chart.register(...registerables);

        const ctx = document.getElementById("scatterPlot") as HTMLCanvasElement;
        
        // Log the data being used to create the chart
        console.log("Chart data:", {
            rightBaselineData,
            rightNewData,
            leftBaselineData,
            leftNewData
        });
        
        chart = new Chart(ctx, {
            type: "scatter",
            data: {
                datasets: buildDatasets()
            },
            options: {
                responsive: true,
                hover: {
                    mode: 'nearest',
                    intersect: false,
                },
                scales: {
                    x: {
                        type: 'category',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: 'Frequency (Hz)',
                            font: {
                                size: 16
                            }
                        },
                        labels: customTicksX.map(x => x.toString()),
                    
                        // Add padding on left and right sides
                        afterFit: function(scaleInstance) {
                            scaleInstance.paddingLeft = 15;
                            scaleInstance.paddingRight = 15;
                        },
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Hearing Level (dB)',
                            font: {
                                size: 16
                            }
                        },
                        min: Math.min(...customTicksY),
                        max: Math.max(...customTicksY),
                        ticks: {
                            callback: (value) => (customTicksY.includes(value as number) ? value : null),
                            autoSkip: false,
                        },
                        reverse: true
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: plotTitle,
                        font: {
                            size: 20
                        },
                        padding: {
                            top: 20,
                            bottom: 0
                        }
                    },
                    legend: {
                        labels: {
                            font: {
                                size: 14
                            }
                        },
                        // Only show legend items for displayed data
                        labels: {
                            filter: function(item, chart) {
                                if (!showRight && (item.text === 'Right Baseline' || item.text === 'Right New')) {
                                    return false;
                                }
                                if (!showLeft && (item.text === 'Left Baseline' || item.text === 'Left New')) {
                                    return false;
                                }
                                return true;
                            }
                        }
                    }
                }
            }
        });
    });

    // Reactive block to update chart data dynamically
    $effect(() => {
        if (chart) {
            // Update chart title
            chart.options.plugins.title.text = plotTitle;

            // Dynamically update datasets
            chart.data.datasets = buildDatasets();

            // Log updated chart data
            console.log("Updated chart datasets:", chart.data.datasets);

            chart.update(); // Ensure the chart reflects the updated data
        }
    });

</script>

<canvas id="scatterPlot" width="700" height="700"></canvas>
<InfoCircleSolid />
<Tooltip placement="bottom">Data points shown are the original dB values recorded; They are NOT corrected for age.</Tooltip>