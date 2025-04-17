// actionshearingdata.ts
// Contains server functions pertaining to hearing data actions

import { sql } from '@vercel/postgres';
import { validateFrequencies } from '$lib/utility';
import { error } from '@sveltejs/kit';
import type { HearingScreening } from '$lib/interpret';
import type { EmployeeInfo } from '$lib/MyTypes';
import { addHearingScreeningModifiedToDatabase, addHearingScreeningToDatabase, extractEmployeeInfoFromDatabase } from './databasefunctions';

export async function addHearingScreening(request: Request) {
    const formData = await request.formData();
    const employeeID: string = formData.get('employeeID') as string;
    const screening: HearingScreening = JSON.parse(formData.get('screening') as string) as HearingScreening;
    const doModify: boolean = formData.get('doModify') === 'true';

    try {
        const employeeInfo: EmployeeInfo = await extractEmployeeInfoFromDatabase(employeeID);
        if (doModify) addHearingScreeningModifiedToDatabase(employeeInfo, screening);
        else await addHearingScreeningToDatabase(employeeInfo, screening);
    }
    catch (e: any) {
        const errorMessage = "Unable to add employee hearing screening: " 
            + (e.message ?? "no error message provided by server");
        console.error(errorMessage);
        error(404, { message: errorMessage });
    }
}