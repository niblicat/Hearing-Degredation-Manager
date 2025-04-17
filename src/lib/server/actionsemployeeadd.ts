// actionsemployeeadd.ts
// Contains server functions pertaining to adding employees

import { insertEmployeeIntoDatabase } from '$lib/server/databasefunctions';
import { error } from '@sveltejs/kit';

export async function addEmployee(request: Request) {
    const formData = await request.formData();
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;
    const dateOfBirth = formData.get('dateOfBirth') as string;
    const sex = formData.get('sex') as string;
    const isInactive = formData.get('isInactive') === 'true';
    const lastActive = isInactive ? formData.get('lastActive') as string : null;

    try {
        // Insert new employee into the database
        await insertEmployeeIntoDatabase(firstName, lastName, email, dateOfBirth, sex, lastActive);
    } 
    catch (e: any) {
        const errorMessage = "Error in database when adding employee: " 
            + (e.message ?? "no error message provided by server");
        console.error(errorMessage);
        error(404, { message: errorMessage });
    }
}