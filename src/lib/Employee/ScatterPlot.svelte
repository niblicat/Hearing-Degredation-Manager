<script lang="ts">
    import { onMount } from "svelte";
    import { Chart, registerables } from 'chart.js';
    import { InfoCircleSolid } from "flowbite-svelte-icons";
    import { Tooltip } from 'flowbite-svelte';
	import { isDark } from "$lib/globals.svelte";

    interface Props {
        // Export properties if needed
        baselineHearingData: (number | null)[];
        newHearingData: (number | null)[];
        plotTitle: string;
        labels: string[];
    }

    let {
        baselineHearingData,
        newHearingData,
        plotTitle,
        labels
    }: Props = $props();

    let chart: any;

    // Custom tick values
    const customTicksX = [500, 1000, 2000, 3000, 4000, 6000, 8000];
    const customTicksY = [120, 110, 100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 0, -10];

    // Add padding for x-axis to ensure points are fully visible
    const xAxisPadding = {
        min: 450,  // Padding before 500 Hz
        max: 8500  // Padding after 8000 Hz
    };

    function getPointStyle(label: string) {
        if (label.includes("Right Baseline")) return "triangle";
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
        if (label.includes("Right Baseline")) return 'rgba(166, 5, 39, 0)';
        if (label.includes("Left Baseline")) return 'rgba(10, 81, 128, 0)';
        if (label.includes("Right New")) return 'rgba(255, 99, 132, 0)';
        if (label.includes("Left New")) return 'rgba(54, 162, 235, 0)';
        return 'rgba(255, 0, 255, 1)'; // return strong magenta
    }

    function getBorderColor(label: string) {
        if (label.includes("Right Baseline")) return 'rgba(166, 5, 39, 1)';
        if (label.includes("Left Baseline")) return 'rgba(10, 81, 128, 1)';
        if (label.includes("Right New")) return 'rgba(255, 99, 132, 1)';
        if (label.includes("Left New")) return 'rgba(54, 162, 235, 1)';
        return 'rgba(255, 0, 255, 1)'; // return strong magenta
    }

    function getTextColor() {
        if ($isDark) return '#fff';
        else return '#666';
    }

    function getGridColor() {
        if ($isDark) return '#444';
        else return '#ddd';
    }

    onMount(() => {
        Chart.register(...registerables); // Register all necessary components

        const ctx = document.getElementById("scatterPlot") as HTMLCanvasElement;
        chart = new Chart(ctx, {
            type: "scatter",
            data: {
                datasets: [{
                        label: labels[0],
                        data: customTicksX.map((p, i) => ({ x: p, y: baselineHearingData[i] })),
                        pointStyle: getPointStyle(labels[0]),
                        pointRadius: getPointRadius(labels[0]),
                        pointHoverRadius: getPointRadius(labels[0]),  // Match hover radius with normal radius
                        backgroundColor: getColor(labels[0]),
                        borderColor: getBorderColor(labels[0]),
                        borderWidth: 2,
                        showLine: true,
                        fill: false,
                        lineTension: 0
                    },
                    {
                        label: labels[1],
                        data: customTicksX.map((p, i) => ({ x: p, y: newHearingData[i] })),
                        pointStyle: getPointStyle(labels[1]),
                        pointRadius: getPointRadius(labels[1]),
                        pointHoverRadius: getPointRadius(labels[1]),  // Match hover radius with normal radius
                        backgroundColor: getColor(labels[1]),
                        borderColor: getBorderColor(labels[1]),
                        borderWidth: 2,
                        showLine: true,
                        fill: false,
                        lineTension: 0
                    },
                    labels.length > 2 && {
                        label: labels[2],
                        data: customTicksX.map((p, i) => ({ x: p, y: baselineHearingData[baselineHearingData.length / 2 + i] })),
                        pointStyle: getPointStyle(labels[2]),
                        pointRadius: getPointRadius(labels[2]),
                        pointHoverRadius: getPointRadius(labels[2]),  // Match hover radius with normal radius
                        backgroundColor: getColor(labels[2]),
                        borderColor: getBorderColor(labels[2]),
                        borderWidth: 2,
                        showLine: true,
                        fill: false,
                        lineTension: 0
                    },
                    labels.length > 2 && {
                        label: labels[3],
                        data: customTicksX.map((p, i) => ({ x: p, y: newHearingData[newHearingData.length / 2 + i] })),
                        pointStyle: getPointStyle(labels[3]),
                        pointRadius: getPointRadius(labels[3]),
                        pointHoverRadius: getPointRadius(labels[3]),  // Match hover radius with normal radius
                        backgroundColor: getColor(labels[3]),
                        borderColor: getBorderColor(labels[3]),
                        borderWidth: 2,
                        showLine: true,
                        fill: false,
                        lineTension: 0
                    }].filter(dataset => dataset !== false)
            },
            options: {
                responsive: true,
                hover: {
                    mode: 'nearest',
                    intersect: false,
                },
                scales: {
                    x: {
                        type: 'logarithmic',
                        position: 'bottom',
                        title: {
                            display: true,
                            text: 'Frequency (Hz)',
                            font: {
                                size: 16
                            },
                            color: getTextColor()
                        },
                        grid: {
                            color: getGridColor()
                        },
                        min: xAxisPadding.min,  // Use padding to ensure points at 500 Hz are fully visible
                        max: xAxisPadding.max,  // Use padding to ensure points at 8000 Hz are fully visible
                        ticks: {
                            // Explicitly provide the values we want displayed
                            callback: function(value) {
                                // Only show tick labels for our specific frequencies
                                if (customTicksX.includes(value as number)) {
                                    return value;
                                }
                                return null;
                            },
                            color: getTextColor(),
                            // Explicitly set ticks to our custom values
                            autoSkip: false,  // Ensure no ticks are skipped
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Hearing Level (dB)',
                            font: {
                                size: 16
                            },
                            color: getTextColor()
                        },
                        grid: {
                            color: getGridColor()
                        },
                        min: Math.min(...customTicksY),
                        max: Math.max(...customTicksY),
                        ticks: {
                            callback: (value) => (customTicksY.includes(value as number) ? value : null),
                            autoSkip: false,
                            color: getTextColor(),
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
                        },
                        color: getTextColor()
                    },
                    legend: {
                        labels: {
                            font: {
                                size: 14
                            },
                            color: getTextColor(),
                            usePointStyle: true
                        }
                    }
                }
            }
        });
    });

    // Reactive block to update chart data dynamically
    $effect(() => {
        if (!chart) return;

        //update chart title
        chart.options.plugins.title.text = plotTitle;

        // Dynamically update datasets
        chart.data.datasets = [
            {
                label: labels[0],
                data: customTicksX.map((p, i) => ({ x: p, y: baselineHearingData[i] })),
                pointStyle: getPointStyle(labels[0]),
                pointRadius: getPointRadius(labels[0]),
                pointHoverRadius: getPointRadius(labels[0]),
                backgroundColor: getColor(labels[0]),
                borderColor: getBorderColor(labels[0]),
                borderWidth: 2,
                showLine: true,
                fill: false,
                lineTension: 0
            },
            {
                label: labels[1],
                data: customTicksX.map((p, i) => ({ x: p, y: newHearingData[i] })),
                pointStyle: getPointStyle(labels[1]),
                pointRadius: getPointRadius(labels[1]),
                pointHoverRadius: getPointRadius(labels[1]),
                backgroundColor: getColor(labels[1]),
                borderColor: getBorderColor(labels[1]),
                borderWidth: 2,
                showLine: true,
                fill: false,
                lineTension: 0
            },
            labels.length > 2 && {
                label: labels[2],
                data: customTicksX.map((p, i) => ({ x: p, y: baselineHearingData[baselineHearingData.length / 2 + i] })),
                pointStyle: getPointStyle(labels[2]),
                pointRadius: getPointRadius(labels[2]),
                pointHoverRadius: getPointRadius(labels[2]),
                backgroundColor: getColor(labels[2]),
                borderColor: getBorderColor(labels[2]),
                borderWidth: 2,
                showLine: true,
                fill: false,
                lineTension: 0
            },
            labels.length > 2 && {
                label: labels[3],
                data: customTicksX.map((p, i) => ({ x: p, y: newHearingData[newHearingData.length / 2 + i] })),
                pointStyle: getPointStyle(labels[3]),
                pointRadius: getPointRadius(labels[3]),
                pointHoverRadius: getPointRadius(labels[3]),
                backgroundColor: getColor(labels[3]),
                borderColor: getBorderColor(labels[3]),
                borderWidth: 2,
                showLine: true,
                fill: false,
                lineTension: 0
            },
        ].filter(Boolean);

        chart.update(); // Ensure the chart reflects the updated data
    });

    // separate effect so datapoints don't animate with theme change
    $effect(() => {
        const textColor = getTextColor();
        const gridColor = getGridColor();
        chart.options.scales.x.title.color = textColor;
        chart.options.scales.y.title.color = textColor;
        chart.options.scales.x.ticks.color = textColor;
        chart.options.scales.y.ticks.color = textColor;
        chart.options.scales.x.grid.color = gridColor;
        chart.options.scales.y.grid.color = gridColor;
        chart.options.plugins.title.color = textColor;
        chart.options.plugins.legend.labels.color = textColor;

        chart.update(); // Ensure the chart reflects the updated data
    });

</script>

<canvas id="scatterPlot" width="700" height="700"></canvas>
<InfoCircleSolid />
<Tooltip placement="bottom">Data points shown are the original dB values recorded; They are NOT corrected for age.</Tooltip>