export enum UserType {
    DOCTOR = 'DOCTOR',
    MANAGER = 'MANAGER',
    USER = 'USER',
    ADMIN = 'ADMIN',
    ASSISTANT = 'ASSISTANT',
    CUSTOMER_SERVICE = 'CUSTOMER_SERVICE',
}

export type User = {
    _id: string;
    name: string;
    lastname: string;
    kind: UserType;
}
