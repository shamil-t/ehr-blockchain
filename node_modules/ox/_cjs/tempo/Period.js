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
    return n * 24 * 60 * 60;
}
function hours(n) {
    return n * 60 * 60;
}
function minutes(n) {
    return n * 60;
}
function months(n) {
    return n * 30 * 24 * 60 * 60;
}
function seconds(n) {
    return n;
}
function weeks(n) {
    return n * 7 * 24 * 60 * 60;
}
function years(n) {
    return n * 365 * 24 * 60 * 60;
}
//# sourceMappingURL=Period.js.map