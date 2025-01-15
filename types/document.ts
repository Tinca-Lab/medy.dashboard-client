export type Document = {
    _id: string;
    serial: string;
    prefix?: string;
    givenBy?: {
        _id: string;
        name: string;
        lastname: string;
    };
    kind: 'CONTRACT' | 'RECEIPT';
    createdAt: Date;
    updatedAt: Date;
}
