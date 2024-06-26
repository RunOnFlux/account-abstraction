import { ErrorObject } from "ajv";

export class ValidationError extends Error {
    public errors: ErrorObject[];

    constructor(message: string, errors: ErrorObject[]) {
        super(message);
        this.errors = errors;
        this.name = 'ValidationError';
    }
}
