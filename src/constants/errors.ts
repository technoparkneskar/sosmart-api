export enum Errors {
    INVALID_TOKEN = "INVALID_TOKEN",
    ALREADY_LOGGED_IN = "ALREADY_LOGGED_IN",
    ACCOUNT_ALREADY_EXISTS = "ACCOUNT_ALREADY_EXISTS",
    BAD_REQUEST = "BAD_REQUEST",
    ACCOUNT_UNVERIFIED = "ACCOUNT_UNVERIFIED",
    ACCOUNT_ALREADY_VERIFIED = "ACCOUNT_ALREADY_VERIFIED",
    UNAUTHORIZED = "UNAUTHORIZED_REQUEST",
    INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
    INVALID_OTP_CODE = "INVALID_OTP_CODE",
    OTP_EXPIRED = "OTP_EXPIRED",

    // Product Error
    PRODUCT_ALREADY_REGISTERED = "PRODUCT_ALREADY_REGISTERED",
    UNKNOWN_PRODUCT = "UNKNOWN_PRODUCT_ID",
    PRODUCT_OWNED_BY_SOMEONE_ELSE = "PRODUCT_OWNED_BY_SOMEONE_ELSE"
}