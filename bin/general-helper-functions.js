module.exports = {
    numberOfDaysSince: function (InitialDate, nowDate) {
        let numberOfDays = nowDate.getTime() - InitialDate.getTime()// Number of days since passed date
        return Math.floor(numberOfDays/(1000 * 60 * 60 * 24));
    }
};