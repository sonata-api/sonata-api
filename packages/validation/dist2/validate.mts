function _instanceof(left, right) {
    if (right != null && typeof Symbol !== "undefined" && right[Symbol.hasInstance]) {
        return !!right[Symbol.hasInstance](left);
    } else {
        return left instanceof right;
    }
}
function _type_of(obj) {
    "@swc/helpers - typeof";
    return obj && typeof Symbol !== "undefined" && obj.constructor === Symbol ? "symbol" : typeof obj;
}
import { ObjectId } from "@sonata-api/types";
import { isLeft, left, right, unwrapEither, getMissingProperties } from "@sonata-api/common";
import { ValidationErrorCodes } from "@sonata-api/types";
var getValueType = function(value) {
    return Array.isArray(value) ? "array" : typeof value === "undefined" ? "undefined" : _type_of(value);
};
var getPropertyType = function(property) {
    if ("$ref" in property || "properties" in property || "additionalProperties" in property) {
        return "object";
    }
    if ("enum" in property) {
        return _type_of(property.enum[0]);
    }
    if ("format" in property && property.format) {
        if ([
            "date",
            "date-time"
        ].includes(property.format)) {
            return "datetime";
        }
    }
    if ("type" in property) {
        return property.type;
    }
};
var makePropertyError = function(type, details) {
    return {
        type: type,
        details: details
    };
};
export var makeValidationError = function(error) {
    return error;
};
export var validateProperty = function(propName, what, property) {
    var options = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : {};
    var extraneous = options.extraneous;
    if (what === undefined) {
        return;
    }
    if (!property) {
        if (extraneous || Array.isArray(extraneous) && extraneous.includes(propName)) {
            return;
        }
        return makePropertyError("extraneous", {
            expected: "undefined",
            got: getValueType(what)
        });
    }
    if ("properties" in property) {
        var resultEither = validate(what, property, options);
        return isLeft(resultEither) ? unwrapEither(resultEither) : undefined;
    }
    if ("literal" in property) {
        if (what !== property.literal) {
            return makePropertyError("unmatching", {
                expected: property.literal,
                got: what
            });
        }
        return;
    }
    var expectedType = getPropertyType(property);
    var actualType = getValueType(what);
    if ("enum" in property && property.enum.length === 0) {
        return;
    }
    if (actualType !== expectedType && !("items" in property && actualType === "array") && !(actualType === "number" && expectedType === "integer")) {
        if (expectedType === "datetime" && _instanceof(what, Date)) {
            return;
        }
        if (expectedType === "boolean" && !what) {
            return;
        }
        if ("$ref" in property && actualType === "string") {
            if (ObjectId.isValid(what)) {
                return;
            }
        }
        return makePropertyError("unmatching", {
            expected: expectedType,
            got: actualType
        });
    }
    if ("items" in property) {
        var i = 0;
        var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
        try {
            for(var _iterator = what[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
                var elem = _step.value;
                var result = validateProperty(propName, elem, property.items, options);
                if (result) {
                    result.index = i;
                    return result;
                }
                i++;
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally{
            try {
                if (!_iteratorNormalCompletion && _iterator.return != null) {
                    _iterator.return();
                }
            } finally{
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }
    } else if ("type" in property) {
        if (property.type === "integer") {
            if (!Number.isInteger(what)) {
                return makePropertyError("numeric_constraint", {
                    expected: "integer",
                    got: "invalid_number"
                });
            }
        }
        if (property.type === "integer" || property.type === "number") {
            if (property.maximum && property.maximum < what || property.minimum && property.minimum > what || property.exclusiveMaximum && property.exclusiveMaximum <= what || property.exclusiveMinimum && property.exclusiveMinimum >= what) {
                return makePropertyError("numeric_constraint", {
                    expected: "number",
                    got: "invalid_number"
                });
            }
        }
    } else if ("enum" in property) {
        if (!property.enum.includes(what)) {
            return makePropertyError("extraneous_element", {
                expected: property.enum,
                got: what
            });
        }
    } else if ("getter" in property) {
        return makePropertyError("unmatching", {
            expected: "getters are read-only",
            got: actualType
        });
    }
};
export var validateWholeness = function(what, schema) {
    var required = schema.required ? schema.required : Object.keys(schema.properties);
    var missingProps = getMissingProperties(what, schema, required);
    if (missingProps.length > 0) {
        return makeValidationError({
            code: ValidationErrorCodes.MissingProperties,
            errors: Object.fromEntries(missingProps.map(function(error) {
                return [
                    error,
                    {
                        type: "missing"
                    }
                ];
            }))
        });
    }
};
export var validate = function(what, schema) {
    var options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
    if (!what) {
        return left(makeValidationError({
            code: ValidationErrorCodes.EmptyTarget,
            errors: {}
        }));
    }
    if (!("properties" in schema)) {
        var result = validateProperty("", what, schema);
        return result ? left(result) : right(what);
    }
    var wholenessError = validateWholeness(what, schema);
    if (wholenessError) {
        return left(wholenessError);
    }
    var errors = {};
    for(var propName in what){
        var result1 = validateProperty(propName, what[propName], schema.properties[propName], options);
        if (result1) {
            errors[propName] = result1;
        }
    }
    if (Object.keys(errors).length > 0) {
        if (options.throwOnError) {
            var error = new TypeError(ValidationErrorCodes.InvalidProperties);
            Object.assign(error, {
                errors: errors
            });
            throw error;
        }
        return left(makeValidationError({
            code: ValidationErrorCodes.InvalidProperties,
            errors: errors
        }));
    }
    return right(what);
};
export var validateSilently = function(what, schema) {
    var options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
    var result = validate(what, schema, options);
    return isLeft(result) ? null : result.value;
};
export var validator = function(schema) {
    var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    return [
        {},
        function(what) {
            return validate(what, schema, options);
        }
    ];
};
export var silentValidator = function(schema) {
    var options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
    return [
        {},
        function(what) {
            return validateSilently(what, schema, options);
        }
    ];
};
