"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const common_1 = require("@sonata-api/common");
const dist_1 = require("../dist");
const description = {
    properties: {
        name: {
            type: 'string'
        },
        age: {
            type: 'number'
        }
    }
};
describe('Validate', () => {
    it('validates with no errors', async () => {
        const candidate = {
            name: 'Terry',
            age: 50
        };
        const validationEither = await (0, dist_1.validateFromDescription)(description, candidate);
        (0, assert_1.default)((0, common_1.isRight)(validationEither));
        (0, assert_1.default)(JSON.stringify(candidate) === JSON.stringify((0, common_1.unwrapEither)(validationEither)));
    });
    it('returns error on invalid type', async () => {
        const candidate = {
            name: 'Terry',
            age: '50'
        };
        const validationEither = await (0, dist_1.validateFromDescription)(description, candidate);
        (0, assert_1.default)((0, common_1.isLeft)(validationEither));
        const error = (0, common_1.unwrapEither)(validationEither);
        (0, assert_1.default)(error.code === 'INVALID_PROPERTIES');
        (0, assert_1.default)(error.errors?.age?.type === 'unmatching');
        (0, assert_1.default)(error.errors?.age?.details.expected === 'number');
        (0, assert_1.default)(error.errors?.age?.details.got === 'string');
    });
});
