export type Employee = {
    employeeID: string;
    firstName: string;
    lastName: string;
    email: string;
    activeStatus: string,
    dob: string;
    sex: string;
};

export type EmployeeSearchable = {
    name: string, // full name
    data: Employee
}

export type Admin = {
    name: string,
    email: string,
    id: string,
    isOP: boolean
};

export type AdminSelectable = {
    name: string,
    email: string,
    id: string,
    isOP: boolean
    selected: boolean
};

export type UserSimple = {
    loggedIn: boolean,
    name: string,
    email: string,
    avatar: string
}

export type HearingDataSingle = {
    hz500: string,
    hz1000: string,
    hz2000: string,
    hz3000: string,
    hz4000: string,
    hz6000: string,
    hz8000: string
}

export type HearingData = {
    year: number;
    ear: string;
    leftData: HearingDataSingle,
    rightData: HearingDataSingle
}

export class DatabaseError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'DatabaseError';
      Object.setPrototypeOf(this, DatabaseError.prototype);
    }
  }