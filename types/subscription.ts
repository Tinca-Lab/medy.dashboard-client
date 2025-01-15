export enum SubscriptionExpiration {
    MONTHLY = 'monthly',
    TRIMESTER = 'trimester',
    SEMESTER = 'semester',
    ANNUALLY = 'annually',
}

export type Subscription = {
    _id: string;
    name: string;
    description: string;
    price: number;
    expiration: SubscriptionExpiration;
}

