// agetable.ts

type HertzCorrectionForAge = {
    age: number;
    hz1000: number;
    hz2000: number;
    hz3000: number;
    hz4000: number;
    hz6000: number;
};

const AGE_CORRECTION_TABLE_MALE: Array<HertzCorrectionForAge> = [
    { age: 20, hz1000: 5, hz2000: 3, hz3000: 4, hz4000: 5, hz6000: 8 },
    { age: 21, hz1000: 5, hz2000: 3, hz3000: 4, hz4000: 5, hz6000: 8 },
    { age: 22, hz1000: 5, hz2000: 3, hz3000: 4, hz4000: 5, hz6000: 8 },
    { age: 23, hz1000: 5, hz2000: 3, hz3000: 4, hz4000: 6, hz6000: 9 },
    { age: 24, hz1000: 5, hz2000: 3, hz3000: 5, hz4000: 6, hz6000: 9 },
    { age: 25, hz1000: 5, hz2000: 3, hz3000: 5, hz4000: 7, hz6000: 10 },
    { age: 26, hz1000: 5, hz2000: 4, hz3000: 5, hz4000: 7, hz6000: 10 },
    { age: 27, hz1000: 5, hz2000: 4, hz3000: 6, hz4000: 7, hz6000: 11 },
    { age: 28, hz1000: 6, hz2000: 4, hz3000: 6, hz4000: 8, hz6000: 11 },
    { age: 29, hz1000: 6, hz2000: 4, hz3000: 6, hz4000: 8, hz6000: 12 },
    { age: 30, hz1000: 6, hz2000: 4, hz3000: 6, hz4000: 9, hz6000: 12 },
    { age: 31, hz1000: 6, hz2000: 4, hz3000: 7, hz4000: 9, hz6000: 13 },
    { age: 32, hz1000: 6, hz2000: 5, hz3000: 7, hz4000: 10, hz6000: 14 },
    { age: 33, hz1000: 6, hz2000: 5, hz3000: 7, hz4000: 10, hz6000: 14 },
    { age: 34, hz1000: 6, hz2000: 5, hz3000: 8, hz4000: 11, hz6000: 15 },
    { age: 35, hz1000: 7, hz2000: 5, hz3000: 8, hz4000: 11, hz6000: 15 },
    { age: 36, hz1000: 7, hz2000: 5, hz3000: 9, hz4000: 12, hz6000: 16 },
    { age: 37, hz1000: 7, hz2000: 6, hz3000: 9, hz4000: 12, hz6000: 17 },
    { age: 38, hz1000: 7, hz2000: 6, hz3000: 9, hz4000: 13, hz6000: 17 },
    { age: 39, hz1000: 7, hz2000: 6, hz3000: 10, hz4000: 14, hz6000: 18 },
    { age: 40, hz1000: 7, hz2000: 6, hz3000: 10, hz4000: 14, hz6000: 19 },
    { age: 41, hz1000: 7, hz2000: 6, hz3000: 10, hz4000: 14, hz6000: 20 },
    { age: 42, hz1000: 8, hz2000: 7, hz3000: 11, hz4000: 16, hz6000: 20 },
    { age: 43, hz1000: 8, hz2000: 7, hz3000: 12, hz4000: 16, hz6000: 21 },
    { age: 44, hz1000: 8, hz2000: 7, hz3000: 12, hz4000: 17, hz6000: 22 },
    { age: 45, hz1000: 8, hz2000: 7, hz3000: 13, hz4000: 18, hz6000: 23 },
    { age: 46, hz1000: 8, hz2000: 8, hz3000: 13, hz4000: 19, hz6000: 24 },
    { age: 47, hz1000: 8, hz2000: 8, hz3000: 14, hz4000: 19, hz6000: 24 },
    { age: 48, hz1000: 9, hz2000: 8, hz3000: 14, hz4000: 20, hz6000: 25 },
    { age: 49, hz1000: 9, hz2000: 9, hz3000: 15, hz4000: 21, hz6000: 26 },
    { age: 50, hz1000: 9, hz2000: 9, hz3000: 16, hz4000: 22, hz6000: 27 },
    { age: 51, hz1000: 9, hz2000: 9, hz3000: 16, hz4000: 23, hz6000: 28 },
    { age: 52, hz1000: 9, hz2000: 10, hz3000: 17, hz4000: 24, hz6000: 29 },
    { age: 53, hz1000: 9, hz2000: 10, hz3000: 18, hz4000: 25, hz6000: 30 },
    { age: 54, hz1000: 10, hz2000: 10, hz3000: 18, hz4000: 26, hz6000: 31 },
    { age: 55, hz1000: 10, hz2000: 11, hz3000: 19, hz4000: 27, hz6000: 32 },
    { age: 56, hz1000: 10, hz2000: 11, hz3000: 20, hz4000: 28, hz6000: 34 },
    { age: 57, hz1000: 10, hz2000: 11, hz3000: 21, hz4000: 29, hz6000: 35 },
    { age: 58, hz1000: 10, hz2000: 12, hz3000: 22, hz4000: 31, hz6000: 36 },
    { age: 59, hz1000: 11, hz2000: 12, hz3000: 22, hz4000: 32, hz6000: 37 },
    { age: 60, hz1000: 11, hz2000: 13, hz3000: 23, hz4000: 33, hz6000: 38 }
]

const AGE_CORRECTION_TABLE_FEMALE: Array<HertzCorrectionForAge> = [
    { age: 20, hz1000: 7, hz2000: 4, hz3000: 3, hz4000: 3, hz6000: 6 },
    { age: 21, hz1000: 7, hz2000: 4, hz3000: 4, hz4000: 3, hz6000: 6 },
    { age: 22, hz1000: 7, hz2000: 4, hz3000: 4, hz4000: 4, hz6000: 6 },
    { age: 23, hz1000: 7, hz2000: 5, hz3000: 4, hz4000: 4, hz6000: 7 },
    { age: 24, hz1000: 7, hz2000: 5, hz3000: 4, hz4000: 4, hz6000: 7 },
    { age: 25, hz1000: 8, hz2000: 5, hz3000: 4, hz4000: 4, hz6000: 7 },
    { age: 26, hz1000: 8, hz2000: 5, hz3000: 5, hz4000: 4, hz6000: 8 },
    { age: 27, hz1000: 8, hz2000: 5, hz3000: 5, hz4000: 5, hz6000: 8 },
    { age: 28, hz1000: 8, hz2000: 5, hz3000: 5, hz4000: 5, hz6000: 8 },
    { age: 29, hz1000: 8, hz2000: 5, hz3000: 5, hz4000: 5, hz6000: 9 },
    { age: 30, hz1000: 8, hz2000: 6, hz3000: 5, hz4000: 5, hz6000: 9 },
    { age: 31, hz1000: 8, hz2000: 6, hz3000: 6, hz4000: 5, hz6000: 9 },
    { age: 32, hz1000: 9, hz2000: 6, hz3000: 6, hz4000: 6, hz6000: 10 },
    { age: 33, hz1000: 9, hz2000: 6, hz3000: 6, hz4000: 6, hz6000: 10 },
    { age: 34, hz1000: 9, hz2000: 6, hz3000: 6, hz4000: 6, hz6000: 10 },
    { age: 35, hz1000: 9, hz2000: 6, hz3000: 7, hz4000: 7, hz6000: 11 },
    { age: 36, hz1000: 9, hz2000: 7, hz3000: 7, hz4000: 7, hz6000: 11 },
    { age: 37, hz1000: 9, hz2000: 7, hz3000: 7, hz4000: 7, hz6000: 12 },
    { age: 38, hz1000: 10, hz2000: 7, hz3000: 7, hz4000: 7, hz6000: 12 },
    { age: 39, hz1000: 10, hz2000: 7, hz3000: 8, hz4000: 8, hz6000: 12 },
    { age: 40, hz1000: 10, hz2000: 7, hz3000: 8, hz4000: 8, hz6000: 13 },
    { age: 41, hz1000: 10, hz2000: 8, hz3000: 8, hz4000: 8, hz6000: 13 },
    { age: 42, hz1000: 10, hz2000: 8, hz3000: 9, hz4000: 9, hz6000: 13 },
    { age: 43, hz1000: 11, hz2000: 8, hz3000: 9, hz4000: 9, hz6000: 14 },
    { age: 44, hz1000: 11, hz2000: 8, hz3000: 9, hz4000: 9, hz6000: 14 },
    { age: 45, hz1000: 11, hz2000: 8, hz3000: 10, hz4000: 10, hz6000: 15 },
    { age: 46, hz1000: 11, hz2000: 9, hz3000: 10, hz4000: 10, hz6000: 15 },
    { age: 47, hz1000: 11, hz2000: 9, hz3000: 10, hz4000: 11, hz6000: 16 },
    { age: 48, hz1000: 12, hz2000: 9, hz3000: 11, hz4000: 11, hz6000: 16 },
    { age: 49, hz1000: 12, hz2000: 9, hz3000: 11, hz4000: 11, hz6000: 16 },
    { age: 50, hz1000: 12, hz2000: 10, hz3000: 11, hz4000: 12, hz6000: 17 },
    { age: 51, hz1000: 12, hz2000: 10, hz3000: 12, hz4000: 12, hz6000: 17 },
    { age: 52, hz1000: 12, hz2000: 10, hz3000: 12, hz4000: 13, hz6000: 18 },
    { age: 53, hz1000: 13, hz2000: 10, hz3000: 13, hz4000: 13, hz6000: 18 },
    { age: 54, hz1000: 13, hz2000: 11, hz3000: 13, hz4000: 14, hz6000: 19 },
    { age: 55, hz1000: 13, hz2000: 11, hz3000: 14, hz4000: 14, hz6000: 19 },
    { age: 56, hz1000: 13, hz2000: 11, hz3000: 14, hz4000: 15, hz6000: 20 },
    { age: 57, hz1000: 13, hz2000: 11, hz3000: 15, hz4000: 15, hz6000: 20 },
    { age: 58, hz1000: 14, hz2000: 12, hz3000: 15, hz4000: 16, hz6000: 21 },
    { age: 59, hz1000: 14, hz2000: 12, hz3000: 16, hz4000: 16, hz6000: 21 },
    { age: 60, hz1000: 14, hz2000: 12, hz3000: 16, hz4000: 17, hz6000: 22 }
]