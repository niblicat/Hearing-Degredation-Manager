import type { Session } from "@auth/sveltekit";
import { redirect, type RequestEvent, type ServerLoadEvent } from "@sveltejs/kit"
import { sql, type QueryResultRow } from "@vercel/postgres";
import { PageCategory, type HearingHistory } from "./MyTypes";
import { UserHearingScreeningHistory, type HearingScreening, type EarAnomalyStatus, type HearingDataOneEarString } from './interpret';

export function isNumber(value?: string | number): boolean {
    return ((value != null) &&
            (value !== '') &&
            !isNaN(Number(value.toString())));
}

export function isDate(value: unknown): value is Date {
    return value instanceof Date && !isNaN(+value);
}

export enum AdminStatus {
    NotListed,
    NoPerms,
    HasPerms
}

export enum LoginStatus {
    None,
    NoPerms,
    HasPerms,
    NoSession,
    NoID,
    NoName,
    NoEmail
}

export const loginMessages: Record<LoginStatus, string> = {
    [LoginStatus.NoPerms]: "Please wait for an SLHC administrator to verify you.",
    [LoginStatus.None]: "Please wait for an SLHC administrator to verify you.",
    [LoginStatus.HasPerms]: "Welcome back!",
    [LoginStatus.NoSession]: "There was an issue with your session. Try logging out and logging back in.",
    [LoginStatus.NoID]: "There was an unusual issue with your session. Try logging out and logging back in.",
    [LoginStatus.NoName]: "Your Google Account does not have a name attached, so we could not create an SLHC account for you.",
    [LoginStatus.NoEmail]: "There is no email associated with your Google account, so we could not create an SLHC account for you.",
};

export function handleSearchRedirect(event: RequestEvent) {
    const redirectTo = event.url.pathname + event.url.search;
    return '/dashboard?redirectTo=${redirectTo}';
}

export async function addUserToAdminDatabase(userEmail: string, name: string): Promise<void> {
    try {
        await sql`
            INSERT INTO administrator (userstring, name, isop)
            VALUES (${userEmail}, ${name}, false)
        `;
        console.log(`User ${name} (${userEmail}) successfully added to the admin database with isOP set to false.`);
    } catch (error) {
        console.error("Error adding user to the admin database:", error);
    }
}

export async function obtainLoginStatus(event: ServerLoadEvent): Promise<LoginStatus> {
    const session = await event.locals.auth();

    if (session) {
        const adminStatus = await checkAdminStatus(session);
        switch (adminStatus) {
            case AdminStatus.HasPerms:
                return LoginStatus.HasPerms;

            case AdminStatus.NoPerms:
                return LoginStatus.NoPerms;

            case AdminStatus.NotListed:
                console.log("Not Listed");
                if (!session.user) return LoginStatus.NoSession;
                if (!session.user.email) return LoginStatus.NoEmail;
                if (!session.user.name) return LoginStatus.NoName;

                // all checks passed, let's make a new user
                const email = session.user.email;
                const name = session.user?.name;
                await addUserToAdminDatabase(email, name);
                
                return LoginStatus.NoPerms;
        }
    }

    return LoginStatus.None;
}

export async function checkAdminStatus(session: Session): Promise<AdminStatus> {
    console.log('Verifying if user is an administrator');

    try {
        if (!session) {
            throw new Error('No active session');
        }

        const userEmail = session.user?.email;

        const result = await sql`
            SELECT isop
            FROM administrator
            WHERE userstring = ${userEmail}
        `;

        if (result.rowCount == 0) {
            // They're not yet in the database, we need to add them
            return AdminStatus.NotListed;
        }

        const isAdmin = result.rows.length > 0 && result.rows[0].isop === true;
        console.log("Query result:", result.rows);
        console.log("Admin status:", isAdmin);

        if (isAdmin) {
            return AdminStatus.HasPerms;
        }
        else {
            return AdminStatus.NoPerms;
        }
    } 
    catch (error) {
        console.error("Error verifying administrator status", error);
        return AdminStatus.NotListed;
    }
}

export async function turnAwayNonAdmins(event: ServerLoadEvent) {
    const loginStatus = await obtainLoginStatus(event);
    
    if (loginStatus != LoginStatus.HasPerms) {
        console.log("User does not have sufficient permissions");
        redirect(303, '/');
    }
}

export async function getHearingDataFromDatabaseRow(row: QueryResultRow): Promise<HearingDataOneEarString> {
    const parsedHearingData: HearingDataOneEarString = {
        hz500: row["hz_500"] ?? "CNT",
        hz1000: row["hz_1000"] ?? "CNT",
        hz2000: row["hz_2000"] ?? "CNT",
        hz3000: row["hz_3000"] ?? "CNT",
        hz4000: row["hz_4000"] ?? "CNT",
        hz6000: row["hz_6000"] ?? "CNT",
        hz8000: row["hz_8000"] ?? "CNT"
    };

    return parsedHearingData;
}

export function extractFrequencies(earData: Record<string, any>): number[] {
    const { ear, ...frequencies } = earData; // Exclude the 'ear' property
    return Object.values(frequencies) as number[];  // Return all frequency values as an array of numbers
};

export function validateFrequencies(frequencies: Record<string, string | number>): boolean {
    return Object.values(frequencies).every(value => 
        value === null || 
        value === "CNT" || 
        (!isNaN(parseInt(value as string, 10)) && parseInt(value as string, 10) >= -10 && parseInt(value as string, 10) <= 90)
    );
}

export function validateFrequenciesLocally(frequenciesLeft: HearingDataOneEarString, frequenciesRight: HearingDataOneEarString): boolean {
    const validateFrequencies = (freqs: HearingDataOneEarString) =>
        Object.values(freqs).every(value => 
            value === "CNT" || 
            (!isNaN(parseInt(value as string, 10)) && parseInt(value as string, 10) >= -10 && parseInt(value as string, 10) <= 90)
        );
    return validateFrequencies(frequenciesLeft) && validateFrequencies(frequenciesRight);
}

export function getPageCategory(page: string): PageCategory {
    switch (page.toLowerCase()) {
        case 'home':
            return PageCategory.Home;
        case 'employee':
            return PageCategory.Employee;
        case 'admin':
            return PageCategory.Admin;
        case 'mailing':
            return PageCategory.Mailing;
        default:
            return PageCategory.Other;
    }
}

// respects proper baselines
export function calculateSTSClientSide(hearingData: HearingHistory): EarAnomalyStatus[] {
    if (!hearingData || !hearingData.screenings) {
        throw Error("Hearing data could not be interpreted-is null.");
    }

    let screenings: HearingScreening[] = hearingData.screenings;
    
    // Sort screenings by year
    screenings.sort((a, b) => a.year - b.year);
    
    if (screenings.length === 0) {
        return [];
    }
    
    // Calculate age based on date of birth and current year
    const dob = new Date(hearingData.employee.dob);
    const dobYear = dob.getFullYear();
    
    // Use the most recent year for current year in the history
    const currentYear = screenings[screenings.length - 1].year;
    const currentAge = currentYear - dobYear;
    
    // Create one history object with all screenings
    const history = new UserHearingScreeningHistory(
        currentAge,
        hearingData.employee.sex,
        currentYear,
        screenings
    );
    
    // Generate the hearing report for all years using the existing class
    return history.GenerateHearingReport();
}