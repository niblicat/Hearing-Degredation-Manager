// interpret.ts
// Used to interpret user data and detect if there has been STS

import { AGE_CORRECTION_TABLE_MALE, AGE_CORRECTION_TABLE_FEMALE } from './agetable'
import type { HertzCorrectionForAge } from './agetable'

export function getPersonSexFromString(val: string) {
    const lowered: string = val.toLowerCase();
    switch (lowered) {
        case "male": return PersonSex.Male;
        case "female": return PersonSex.Female;
        default: return PersonSex.Other;
    }
}

export enum PersonSex {
    Female,
    Male,
    Other
}

function findAverage(...args: number[]) {
    let sum = 0;
    for (var i = 0; i < args.length; ++i)
        sum += args[i]

    let average = sum / args.length
    return average;
}

// used to identify hearing anomalies for each ear
// Dr. Ott only wants possible sts, no sts, baseline, cnt, and new baseline. 
export enum AnomalyStatus {
    None = 0,
    Baseline = 1,
    NoSTS = 2,
    NewBaseline = 3,
    PossibleSTS = 4,
    CNT = 5
}

export type EarAnomalyStatus = {
    leftStatus: AnomalyStatus;
    rightStatus: AnomalyStatus;
    reportYear: number;
    leftBaselineYear: number;
    rightBaselineYear: number;
};

export type HearingDataOneEar = {
    hz500: number | null;
    hz1000: number | null;
    hz2000: number | null;
    hz3000: number | null;
    hz4000: number | null;
    hz6000: number | null;
    hz8000: number | null;
};

export type HearingDataOneEarString = {
    hz500: string;
    hz1000: string;
    hz2000: string;
    hz3000: string;
    hz4000: string;
    hz6000: string;
    hz8000: string;
};

export function convertHearingDataOneEarToStrings(data: HearingDataOneEar): HearingDataOneEarString {
    return {
        hz500: data.hz500?.toString() ?? "CNT",
        hz1000: data.hz1000?.toString() ?? "CNT",
        hz2000: data.hz2000?.toString() ?? "CNT",
        hz3000: data.hz3000?.toString() ?? "CNT",
        hz4000: data.hz4000?.toString() ?? "CNT",
        hz6000: data.hz6000?.toString() ?? "CNT",
        hz8000: data.hz8000?.toString() ?? "CNT"
    }
}

export function convertStringsToHearingDataOneEar(data: HearingDataOneEarString): HearingDataOneEar {
    return {
        hz500: data.hz500 === "CNT" ? null : parseInt(data.hz500),
        hz1000: data.hz1000 === "CNT" ? null : parseInt(data.hz1000),
        hz2000: data.hz2000 === "CNT" ? null : parseInt(data.hz2000),
        hz3000: data.hz3000 === "CNT" ? null : parseInt(data.hz3000),
        hz4000: data.hz4000 === "CNT" ? null : parseInt(data.hz4000),
        hz6000: data.hz6000 === "CNT" ? null : parseInt(data.hz6000),
        hz8000: data.hz8000 === "CNT" ? null : parseInt(data.hz8000)
    }
}

export type HearingScreening = {
    year: number;
    leftEar: HearingDataOneEar;
    rightEar: HearingDataOneEar;
};

export class UserHearingScreeningHistory {
    age: number;
    sex: PersonSex;
    currentYear: number;
    screenings: Array<HearingScreening>;

    constructor(age: number, personSex: PersonSex, currentYear: number, screenings: Array<HearingScreening>) {
        this.age = age;
        this.currentYear = currentYear;
        this.screenings = screenings;
        this.sex = personSex;
    }

    /**
     * GetStatusForEar
     * Returns the anomaly status for an ear given data for two years
     * A LARGER VALUE IS WORSE
     */
    private GetStatusForEar(baselineEarData: HearingDataOneEar, beforeEarData: HearingDataOneEar, afterEarData: HearingDataOneEar, correction: HertzCorrectionForAge): AnomalyStatus {
        // Get the status for one ear
        let baselineAverageChange = this.GetAverageDecibelChangeForOneEarForMainLevels(baselineEarData, afterEarData, correction); // compares current year and BASELINE (only main 3 points WITH AGE )
        let yearPriorAverageChange = this.GetAverageDecibelChangeForOneEarForMainLevels(beforeEarData, afterEarData, correction); // compares current year and YEAR PRIOR (only main 3 points WITH AGE )

        if (baselineAverageChange >= 10) {
            // Check for CNT specifically in current year or baseline, which are used for STS determination
            if (this.confirmCNT(baselineEarData) || this.confirmCNT(afterEarData)) {
                return AnomalyStatus.CNT;
            }
            return AnomalyStatus.PossibleSTS;
        }
        // Only check for CNT after handling the STS case
        if (this.confirmCNT(baselineEarData) || this.confirmCNT(afterEarData)) return AnomalyStatus.CNT; // if any 2000,3000,4000 value is a CNT, whole status is CNT
        //!! BASELINE REDEFINITION Needs to be adjusted per Dr. Ott 
        //else if (this.ShouldUpdateBaseline(this.GetAverageHertzForSTSRangeForOneEar(baselineEarData), this.GetAverageHertzForSTSRangeForOneEar(afterEarData))) return AnomalyStatus.NewBaseline;
        else return AnomalyStatus.NoSTS; // anything that is not CNT, new baseline, or possible STS, is just no STS (per Dr. Ott)
    }

    private confirmCNT(hdata: HearingDataOneEar): boolean {
        console.log("Checking CNT for:", hdata);
        if (hdata.hz2000 === null || hdata.hz3000 === null || hdata.hz4000 === null) { 
            console.log("CNT detected!");
            return true; // Values were not tested
        }
        else {
            console.log("No CNT detected.");
            return false; // All values were tested 
        }
    }
    

    /**
     * GetAgeCorrectiveDecibelAdjustment
     * Returns the decibel adjustment given a baseline and current age
     */
    private GetAgeCorrectiveDecibelAdjustment(baselineAge: number): HertzCorrectionForAge {
        function GetRowValue(val: number): number {
            return Math.min(Math.max(val, 19), 60); 
        }
        let correctionTable: Array<HertzCorrectionForAge>;
        switch (this.sex) {
            case PersonSex.Female:
                correctionTable = AGE_CORRECTION_TABLE_FEMALE;
                break;
            case PersonSex.Male:
                correctionTable = AGE_CORRECTION_TABLE_MALE;
                break;
            default:
                correctionTable = AGE_CORRECTION_TABLE_MALE;
                break;
        }
        
        // Clamp ages to the range supported by the table (19-60)
        let baselineAgeRowValue = GetRowValue(baselineAge);
        let currentAgeRowValue = GetRowValue(this.age);

        // Look up the corrections using the clamped age values
        //let baselineCorrection: HertzCorrectionForAge | undefined = correctionTable.find((i) => i.age == baselineAgeRowValue);
        let currentCorrection: HertzCorrectionForAge | undefined = correctionTable.find((i) => i.age == currentAgeRowValue);
        
        //if (!baselineCorrection) throw new Error(`Age correction table does not have an adjustment for age ${baselineAgeRowValue}.`);
        if (!currentCorrection) throw new Error(`Age correction table does not have an adjustment for age ${currentAgeRowValue}.`);

        let difference: HertzCorrectionForAge = { 
            age: 0,
            hz1000: (currentCorrection.hz1000),
            hz2000: (currentCorrection.hz2000),
            hz3000: (currentCorrection.hz3000),
            hz4000: (currentCorrection.hz4000),
            hz6000: (currentCorrection.hz6000)
        }
        
        return difference;
    }

    /**
     * GenerateHearingReport
     * Returns an array of EarAnomalyStatus for each year
     * Calculated STS for every year through one report because of how the baselines are redefined and not stored 
     */
    public GenerateHearingReport(): EarAnomalyStatus[] {
        let arrayLength = this.screenings.length;
        if (arrayLength == 0) {
            console.error("No screenings available");
            return [];
        }
        if (arrayLength == 1) {
            // Only one screening, so it's the baseline with no comparison
            return [{
                leftStatus: AnomalyStatus.Baseline,
                rightStatus: AnomalyStatus.Baseline,
                reportYear: this.screenings[0].year,
                leftBaselineYear: this.screenings[0].year,
                rightBaselineYear: this.screenings[0].year,
            } as EarAnomalyStatus];
        }

        let reportArray: EarAnomalyStatus[] = [];
        // Record the average for each each and move the index when the average is Better
        let bestLeftEarIndex = 0;
        let bestLeftEarYear = this.screenings[0].year;
        let bestLeftEarAverage = Infinity;
        let bestRightEarIndex = 0;
        let bestRightEarYear = this.screenings[0].year;
        let bestRightEarAverage = Infinity;

        bestLeftEarAverage = this.GetAverageHertzForSTSRangeForOneEar(this.screenings[0].leftEar);
        bestRightEarAverage = this.GetAverageHertzForSTSRangeForOneEar(this.screenings[0].rightEar);

        // push base status for the first hearing screening
        reportArray.push({
            leftStatus: AnomalyStatus.Baseline,
            rightStatus: AnomalyStatus.Baseline,
            reportYear: this.screenings[0].year,
            leftBaselineYear: this.screenings[0].year,
            rightBaselineYear: this.screenings[0].year,
        } as EarAnomalyStatus);

        for (var i = 1; i < arrayLength; i++) {
            let previousScreening: HearingScreening = this.screenings[i - 1];
            let afterScreening: HearingScreening = this.screenings[i];

            let newLeftEarAverage = this.GetAverageHertzForSTSRangeForOneEar(this.screenings[i].leftEar);
            let newRightEarAverage = this.GetAverageHertzForSTSRangeForOneEar(this.screenings[i].rightEar);

            let baselineLeftScreening = this.screenings[bestLeftEarIndex];
            let baselineRightScreening = this.screenings[bestRightEarIndex];

            // get the age that the user was at during baseline
            let baselineLeftAge = baselineLeftScreening.year - this.currentYear + this.age;
            let baselineRightAge = baselineRightScreening.year - this.currentYear + this.age;

            console.log("==================================================");
            console.log("current year of report: ", this.screenings[i].year);
            console.log("current age of report: ", this.age);
            console.log("left baseline year: ", baselineLeftScreening.year, "left baseline age: ", baselineLeftAge, "right baseline year: ", baselineRightScreening.year, " right baseline age: ", baselineRightAge);

            let ageCorrectionLeft = this.GetAgeCorrectiveDecibelAdjustment(baselineLeftAge);
            let ageCorrectionRight = this.GetAgeCorrectiveDecibelAdjustment(baselineRightAge);

            // console.log("left age correction: ", ageCorrectionLeft, " right age correction: ", ageCorrectionRight);

            let leftAnomalyStatus = this.GetStatusForEar(baselineLeftScreening.leftEar, previousScreening.leftEar, afterScreening.leftEar, ageCorrectionLeft);
            let rightAnomalyStatus = this.GetStatusForEar(baselineRightScreening.rightEar, previousScreening.rightEar, afterScreening.rightEar, ageCorrectionRight);

            let currentAnomalyStatuses = {
                leftStatus: leftAnomalyStatus,
                rightStatus: rightAnomalyStatus,
                reportYear: afterScreening.year,
                leftBaselineYear: bestLeftEarYear,
                rightBaselineYear: bestRightEarYear,
            } as EarAnomalyStatus;
            reportArray.push(currentAnomalyStatuses);

            //!! Needs to be adjusted per Dr. Ott
            // update baselines after report has confirmed improvement (otherwise the new baseline will compare to itself for redefinition year) 
            // if (this.ShouldUpdateBaseline(bestLeftEarAverage, newLeftEarAverage)) {
            //     bestLeftEarIndex = i;
            //     bestLeftEarAverage = newLeftEarAverage;
            //     bestLeftEarYear = this.screenings[i].year;
            // }
            // if (this.ShouldUpdateBaseline(bestRightEarAverage, newRightEarAverage)) {
            //     bestRightEarIndex = i;
            //     bestRightEarAverage = newRightEarAverage;
            //     bestRightEarYear = this.screenings[i].year;
            // }
        }
        return reportArray;
    }

    /** //!! NEEDS TO BE UPDATED PER DR. OTT
     * UpdateBaselineForOneEar
     * OSHA does not specify a definition of significant
        improvement. However, an example in Appendix F of the Hearing Conservation
        Amendment illustrates revision of the baseline after an improvement of 5 dB in
        the average of hearing thresholds at 2, 3, and 4 kHz.
     */
    private ShouldUpdateBaseline(currentAverage: number, newAverage: number): boolean {
        if (newAverage <= currentAverage - 5) return true;
        else return false;
    }

    /**
     * GetAverageHertzForSTSRangeForOneEar
     * Used to find the average hertz in a specific ear
     * Useful for changing baseline if average improves
     */
    private GetAverageHertzForSTSRangeForOneEar(hdata: HearingDataOneEar): number {
        // IF NULL, USE THE WORST VALUE POSSIBLE (90)
        let hz2000 = hdata.hz2000 ?? 90;
        let hz3000 = hdata.hz3000 ?? 90;
        let hz4000 = hdata.hz4000 ?? 90;
        
        let average = findAverage(hz2000, hz3000, hz4000);
        
        return average;
    }

    /**
     * GetAverageDecibelChangeSTS
     * Used to find the average decibel change in a specific ear to detect STS
     * STS is detected if there was an average of 10+ dB change
     */
    private GetAverageDecibelChangeForOneEarForMainLevels(hdata1: HearingDataOneEar, hdata2: HearingDataOneEar, ageCorrection: HertzCorrectionForAge, doAgeCorrection: boolean = true): number {
        // ONLY CHECK 2k, 3k, 4k

        // console.log("DATA BASELINE/PRIOR: ", hdata1);
        // console.log("DATA NEW: ", hdata2);

        // IF NULL, USE THE WORST VALUE POSSIBLE (90)
        const h1_2000 = hdata1.hz2000 ?? 90;
        const h1_3000 = hdata1.hz3000 ?? 90;
        const h1_4000 = hdata1.hz4000 ?? 90;
        
        const h2_2000 = hdata2.hz2000 ?? 90;
        const h2_3000 = hdata2.hz3000 ?? 90;
        const h2_4000 = hdata2.hz4000 ?? 90;

        let diff2000 = h2_2000 - h1_2000;
        let diff3000 = h2_3000 - h1_3000;
        let diff4000 = h2_4000 - h1_4000;

        if (doAgeCorrection) {
            diff2000 -= ageCorrection.hz2000;
            diff3000 -= ageCorrection.hz3000;
            diff4000 -= ageCorrection.hz4000;

            // console.log("2000 data2-data1-correction:", diff2000, " = ", hdata2.hz2000, " - ", hdata1.hz2000, " - ", ageCorrection.hz2000);
            // console.log("3000 data2-data1-correction:", diff3000, " = ", hdata2.hz3000, " - ", hdata1.hz3000, " - ", ageCorrection.hz3000);
            // console.log("4000 data2-data1-correction:", diff4000, " = ", hdata2.hz4000, " - ", hdata1.hz4000, " - ", ageCorrection.hz4000);
        }
        else {
            // console.log("2000 data2-data1:", diff2000, " = ", hdata2.hz2000, " - ", hdata1.hz2000);
            // console.log("3000 data2-data1:", diff3000, " = ", hdata2.hz3000, " - ", hdata1.hz3000);
            // console.log("4000 data2-data1:", diff4000, " = ", hdata2.hz4000, " - ", hdata1.hz4000);
        }

        let average = findAverage(diff2000, diff3000, diff4000);
        // console.log("weighted average:", average);

        return average;
    }

    /**
     * GetAverageDecibelChangeSTS
     * Used to find the average decibel change in a specific ear to detect overall hearing changes
     */
    private GetAverageDecibelChangeForOneEar(hdata1: HearingDataOneEar, hdata2: HearingDataOneEar): number {
        // TODO: use age table?

        // IF NULL, USE THE WORST VALUE POSSIBLE (90)
        const h1_500 = hdata1.hz500 ?? 90;
        const h1_1000 = hdata1.hz1000 ?? 90;
        const h1_2000 = hdata1.hz2000 ?? 90;
        const h1_3000 = hdata1.hz3000 ?? 90;
        const h1_4000 = hdata1.hz4000 ?? 90;
        const h1_6000 = hdata1.hz6000 ?? 90;
        const h1_8000 = hdata1.hz8000 ?? 90;
        
        const h2_500 = hdata2.hz500 ?? 90;
        const h2_1000 = hdata2.hz1000 ?? 90;
        const h2_2000 = hdata2.hz2000 ?? 90;
        const h2_3000 = hdata2.hz3000 ?? 90;
        const h2_4000 = hdata2.hz4000 ?? 90;
        const h2_6000 = hdata2.hz6000 ?? 90;
        const h2_8000 = hdata2.hz8000 ?? 90;

        let diff500 = h2_500 - h1_500;
        let diff1000 = h2_1000 - h1_1000;
        let diff2000 = h2_2000 - h1_2000;
        let diff3000 = h2_3000 - h1_3000;
        let diff4000 = h2_4000 - h1_4000;
        let diff6000 = h2_6000 - h1_6000;
        let diff8000 = h2_8000 - h1_8000;

        let average = findAverage(diff500, diff1000, diff2000, diff3000, diff4000, diff6000, diff8000);
        //let average = findAverage(diff2000, diff3000, diff4000);


        // console.log("DATA YEAR BEFORE: ", hdata1);
        // console.log("DATA NEW: ", hdata2);
        // console.log("2000 data2-data1:", diff2000, " = ", hdata2.hz2000, " - ", hdata1.hz2000);
        // console.log("3000 data2-data1:", diff3000, " = ", hdata2.hz3000, " - ", hdata1.hz4000);
        // console.log("4000 data2-data1:", diff4000, " = ", hdata2.hz4000, " - ", hdata1.hz4000);
        // console.log("unweighted average: ", average);

        return average;
    }
};