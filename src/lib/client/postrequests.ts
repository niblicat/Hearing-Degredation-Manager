// postrequests.ts
// This will hold all the clientside server callers to avoid repetition.
// Make sure each function returns a type. Use try and catch when calling these to avoid unhandled errors.

import type { HearingHistory } from "../MyTypes";

// GETTERS

export async function getEmployeeHearingHistory(employeeID: string): Promise<HearingHistory | undefined> {
    if (employeeID.length == 0) {
        throw new Error("Input is empty.");
    }
    // don't continue if input is not an integer
    // employee ids are integers
    if (!Number.isInteger(Number(employeeID))) {
        throw new Error("Input is not an integer.");
    }

    // create form data and populate it with the necessary fields
    const formData = new FormData();
    formData.append('employeeID', employeeID); // extractEmployeeHearingHistory expects employeeID

    const response = await fetch('/dashboard?/extractEmployeeHearingHistory', {
        method: 'POST',
        body: formData,
    });

    // intepret the response as JSON
    const serverResponse = await response.json();
    
    const result = JSON.parse(JSON.parse(serverResponse.data)[0]);
    
    // extractEmployeeHearingHistory() on the server will return both a success: boolean = true and history: HearingHistory if it works
    // otherwise, it will return success: boolean = false and message: string
    
    if (!result["success"]) throw Error(result["message"] ?? "Failed to extract employee hearing history (missing message).");

    return result["history"];
}

export async function getAllEmployeeHearingHistories(omitInactive: boolean): Promise<HearingHistory[]> {
    // create form data and populate it with the necessary fields
    const formData = new FormData();
    formData.append('omitInactive', omitInactive.toString()); // extractEmployeeHearingHistory expects employeeID

    const response = await fetch('/dashboard?/extractAllEmployeeHearingHistories', {
        method: 'POST',
        body: formData,
    });

    // intepret the response as JSON
    const serverResponse = await response.json();
    
    const result = JSON.parse(JSON.parse(serverResponse.data)[0]);
    
    // extractEmployeeHearingHistory() on the server will return both a success: boolean = true and history: HearingHistory if it works
    // otherwise, it will return success: boolean = false and message: string
    
    if (!result["success"]) throw Error(result["message"] ?? "Failed to extract all employee hearing histories (missing message).");

    return result["histories"];
}

// SETTERS

export async function updateAdminPermissions(adminID: string, isOperator: boolean): Promise<void> {
    const formData = new FormData();
    formData.append('adminID', adminID);
    formData.append('isOp', (isOperator).toString());

    const response = await fetch('/dashboard?/modifyAdminPermissions', {
        method: 'POST',
        body: formData,
    });

    const serverResponse = await response.json();

    const result = JSON.parse(JSON.parse(serverResponse.data)[0]);

    if (!result["success"]) throw Error(result["message"] ?? "Failed to modify admin permissions (missing message).");
}

export async function updateAdminName(adminID: string, newName: string): Promise<void> {
    const formData = new FormData();
    formData.append('adminID', adminID);
    formData.append('newName', newName);

    const response = await fetch('/dashboard?/modifyAdminName', {
        method: 'POST',
        body: formData,
    });

    const serverResponse = await response.json();

    const result = JSON.parse(JSON.parse(serverResponse.data)[0]);

    if (!result["success"]) throw Error(result["message"] ?? "Failed to modify admin permissions (missing message).");
}

export async function removeAdmins(adminIDs: string[]): Promise<void> {
    // create form data and populate it with the necessary fields
    const formData = new FormData();
    formData.append('adminIDs', JSON.stringify(adminIDs));

    const response = await fetch('/dashboard?/deleteAdmins', {
        method: 'POST',
        body: formData,
    });

    const serverResponse = await response.json();

    const result = JSON.parse(JSON.parse(serverResponse.data)[0]);

    if (!result["success"]) throw Error(result["message"] ?? "Failed to remove admins (missing message).");
}