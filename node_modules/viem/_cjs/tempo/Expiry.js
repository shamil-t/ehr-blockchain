"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.days = days;
exports.hours = hours;
exports.minutes = minutes;
exports.months = months;
exports.seconds = seconds;
exports.weeks = weeks;
exports.years = years;
function days(n) {
    return Math.floor(Date.now() / 1000) + n * 24 * 60 * 60;
}
function hours(n) {
    return Math.floor(Date.now() / 1000) + n * 60 * 60;
}
function minutes(n) {
    return Math.floor(Date.now() / 1000) + n * 60;
}
function months(n) {
    return Math.floor(Date.now() / 1000) + n * 30 * 24 * 60 * 60;
}
function seconds(n) {
    return Math.floor(Date.now() / 1000) + n;
}
function weeks(n) {
    return Math.floor(Date.now() / 1000) + n * 7 * 24 * 60 * 60;
}
function years(n) {
    return Math.floor(Date.now() / 1000) + n * 365 * 24 * 60 * 60;
}
//# sourceMappingURL=Expiry.js.map