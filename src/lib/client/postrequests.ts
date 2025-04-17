// postrequests.ts
// This will hold all the clientside server callers to avoid repetition.
// Make sure each function returns a type. Use try and catch when calling these to avoid unhandled errors.

import { PersonSex, type HearingScreening } from "$lib/interpret";
import type { HearingHistory } from "../MyTypes";

// GETTERS

export async function getEmployeeHearingHistory(employeeID: string): Promise<HearingHistory> {
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

    if (serverResponse["type"] == "error") throw new Error(serverResponse["error"]["message"] ?? "Failed to extract employee hearing history (missing message).");

    // parse the data in the response and return it
    const result: HearingHistory = JSON.parse(JSON.parse(serverResponse["data"]));
    return result;
}

export async function getAllEmployeeHearingHistories(omitInactive: boolean = true): Promise<HearingHistory[]> {
    // create form data and populate it with the necessary fields
    const formData = new FormData();
    formData.append('omitInactive', omitInactive.toString()); // extractEmployeeHearingHistory expects omitInactive

    const response = await fetch('/dashboard?/extractAllEmployeeHearingHistories', {
        method: 'POST',
        body: formData,
    });

    // intepret the response as JSON
    const serverResponse = await response.json();

    if (serverResponse["type"] == "error") throw new Error(serverResponse["error"]["message"] ?? "Failed to extract employee hearing histories (missing message).");

    // parse the data in the response and return it
    const result: HearingHistory[] = JSON.parse(JSON.parse(serverResponse["data"]));
    return result;
}

export async function getEmployeeHearingScreening(employeeID: string, year: string): Promise<HearingScreening> {
    // create form data and populate it with the necessary fields
    const formData = new FormData();
    formData.append('employeeID', employeeID);
    formData.append('year', year);

    const response = await fetch('/dashboard?/extractEmployeeHearingScreening', {
        method: 'POST',
        body: formData,
    });

    // intepret the response as JSON
    const serverResponse = await response.json();

    if (serverResponse["type"] == "error") throw new Error(serverResponse["error"]["message"] ?? "Failed to extract employee hearing screening (missing message).");

    // parse the data in the response and return it
    const result: HearingScreening = JSON.parse(JSON.parse(serverResponse["data"]));
    return result;
}

export async function checkEmployeeHearingScreening(employeeID: string, year: string): Promise<boolean> {
    // create form data and populate it with the necessary fields
    const formData = new FormData();
    formData.append('employeeID', employeeID);
    formData.append('year', year);

    const response = await fetch('/dashboard?/checkEmployeeHearingScreening', {
        method: 'POST',
        body: formData,
    });

    // intepret the response as JSON
    const serverResponse = await response.json();

    if (serverResponse["type"] == "error") throw new Error(serverResponse["error"]["message"] ?? "Failed to extract employee hearing screening (missing message).");

    // parse the data in the response and return it
    const result: boolean = JSON.parse(JSON.parse(serverResponse["data"]));
    return result;
}

// SETTERS

export async function updateEmployeeName(employeeID: string, newFirstName: string, newLastName: string): Promise<void> {
    const formData = new FormData();
    formData.append('employeeID', employeeID);
    formData.append('newFirstName', newFirstName);
    formData.append('newLastName', newLastName);

    const response = await fetch('/dashboard?/modifyEmployeeName', {
        method: 'POST',
        body: formData,
    });

    // intepret the response as JSON
    const serverResponse = await response.json();

    if (serverResponse["type"] == "error") throw new Error(serverResponse["error"]["message"] ?? "Failed to modify employee name (missing message).");
}

export async function updateEmployeeEmail(employeeID: string, newEmail: string): Promise<void> {
    const formData = new FormData();
    formData.append('employeeID', employeeID);
    formData.append('newEmail', newEmail); 

    const response = await fetch('/dashboard?/modifyEmployeeEmail', {
        method: 'POST',
        body: formData,
    });

    // intepret the response as JSON
    const serverResponse = await response.json();

    if (serverResponse["type"] == "error") throw new Error(serverResponse["error"]["message"] ?? "Failed to modify employee email (missing message).");
}

export async function updateEmployeeDOB(employeeID: string, newDOB: string): Promise<void> {
    const formData = new FormData();
    formData.append('employeeID', employeeID);
    formData.append('newDOB', newDOB); 

    const response = await fetch('/dashboard?/modifyEmployeeDOB', {
        method: 'POST',
        body: formData,
    });

    // intepret the response as JSON
    const serverResponse = await response.json();

    if (serverResponse["type"] == "error") throw new Error(serverResponse["error"]["message"] ?? "Failed to modify employee date of birth (missing message).");
}

export async function updateEmployeeSex(employeeID: string, newSex: PersonSex): Promise<void> {
    const formData = new FormData();
    formData.append('employeeID', employeeID);
    formData.append('newSex', PersonSex[newSex].toLowerCase());

    const response = await fetch('/dashboard?/modifyEmployeeSex', {
        method: 'POST',
        body: formData,
    });

    // intepret the response as JSON
    const serverResponse = await response.json();

    if (serverResponse["type"] == "error") throw new Error(serverResponse["error"]["message"] ?? "Failed to modify employee sex (missing message).");
}

export async function updateEmploymentStatus(employeeID: string, lastActiveDate: string = ""): Promise<void> {
    const formData = new FormData();
    formData.append('employeeID', employeeID);
    formData.append('newActiveStatus', lastActiveDate); // Ensures the form key matches what backend expects

    const response = await fetch('/dashboard?/modifyEmployeeStatus', {
        method: 'POST',
        body: formData,
    });

    // intepret the response as JSON
    const serverResponse = await response.json();

    if (serverResponse["type"] == "error") throw new Error(serverResponse["error"]["message"] ?? "Failed to modify employee status (missing message).");
}

export async function addHearingScreening(employeeID: string, screening: HearingScreening, doModify: boolean): Promise<void> {
    const formData = new FormData();
    formData.append('employeeID', employeeID);
    formData.append('screening', JSON.stringify(screening));
    formData.append('doModify', doModify.toString());

    const response = await fetch('/dashboard?/addHearingScreening', {
        method: 'POST',
        body: formData,
    });

    // intepret the response as JSON
    const serverResponse = await response.json();

    if (serverResponse["type"] == "error") throw new Error(serverResponse["error"]["message"] ?? "Failed to add hearing screening data (missing message).");
}

export async function updateAdminPermissions(adminID: string, isOperator: boolean): Promise<void> {
    const formData = new FormData();
    formData.append('adminID', adminID);
    formData.append('isOp', isOperator.toString());

    const response = await fetch('/dashboard?/modifyAdminPermissions', {
        method: 'POST',
        body: formData,
    });

    // intepret the response as JSON
    const serverResponse = await response.json();

    if (serverResponse["type"] == "error") throw new Error(serverResponse["error"]["message"] ?? "Failed to modify admin permissions (missing message).");
}

export async function updateAdminName(adminID: string, newName: string): Promise<void> {
    const formData = new FormData();
    formData.append('adminID', adminID);
    formData.append('newName', newName);

    const response = await fetch('/dashboard?/modifyAdminName', {
        method: 'POST',
        body: formData,
    });

    // intepret the response as JSON
    const serverResponse = await response.json();

    if (serverResponse["type"] == "error") throw new Error(serverResponse["error"]["message"] ?? "Failed to modify admin name (missing message).");
}

export async function removeAdmins(adminIDs: string[]): Promise<void> {
    // create form data and populate it with the necessary fields
    const formData = new FormData();
    formData.append('adminIDs', JSON.stringify(adminIDs));

    const response = await fetch('/dashboard?/deleteAdmins', {
        method: 'POST',
        body: formData,
    });

    // intepret the response as JSON
    const serverResponse = await response.json();

    if (serverResponse["type"] == "error") throw new Error(serverResponse["error"]["message"] ?? "Failed to remove admins (missing message).");
}

export async function createEmployee(firstName: string, lastName: string, email: string, dateOfBirth: string, sex: PersonSex, lastActive: string = ""): Promise<void> {
    const validDate = /^\d{4}-\d{2}-\d{2}$/;
    if (!lastActive.match(validDate) && lastActive !== "") {
        // only throw error if lastActive is not empty and invalid
        throw new Error("The date of last activity is invalid!");
    }

    if (!dateOfBirth.match(validDate)) {
        throw new Error("The date of birth is invalid");
    }

    // create form data and populate it with the necessary fields
    const formData = new FormData();
    formData.append('firstName', firstName);
    formData.append('lastName', lastName);
    formData.append('email', email);
    formData.append('dateOfBirth', dateOfBirth);
    formData.append('sex', PersonSex[sex].toLowerCase());
    formData.append('isInactive', (lastActive === "").toString());

    if (lastActive != "") {
        formData.append('lastActive', lastActive);
    }

    const response = await fetch('/dashboard?/addEmployee', {
        method: 'POST',
        body: formData,
    });

    // intepret the response as JSON
    const serverResponse = await response.json();

    if (serverResponse["type"] == "error") throw new Error(serverResponse["error"]["message"] ?? "Failed to add employee (missing message).");
}