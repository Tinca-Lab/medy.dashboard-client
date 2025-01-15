export type Patient = {
    _id: string;
    name: string;
    lastname: string;
    email?: string;
    phone?: string;
    document: string;
    typeDocument: string;
    createdAt: Date;
    updatedAt: Date;
}
