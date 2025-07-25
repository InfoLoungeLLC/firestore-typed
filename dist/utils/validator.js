"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateData = validateData;
const validation_error_1 = require("../errors/validation.error");
/**
 * Validates data using a provided validator function and wraps errors in FirestoreTypedValidationError
 */
function validateData(data, path, validator) {
    try {
        return validator(data);
    }
    catch (error) {
        throw new validation_error_1.FirestoreTypedValidationError(`Validation failed`, path, error);
    }
}
//# sourceMappingURL=validator.js.map