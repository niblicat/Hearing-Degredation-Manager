// clientaccessors.ts
// This will hold all the clientside server callers to avoid repetition.
// Make sure each function returns a type. Use try and catch when calling these to avoid unhandled errors.

import type { HearingHistory } from "./MyTypes";

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

    const serverResponse = await response.json();
    console.log(response);
    
    const result = JSON.parse(JSON.parse(serverResponse.data)[0]);
    
    // extractEmployeeHearingHistory() on the server will return both a success: boolean = true and history: HearingHistory if it works
    // otherwise, it will return success: boolean = false and message: string
    
    if (!result["success"]) throw Error(result["message"] ?? "Failed to modify admin permissions.");

    return result["history"];
}