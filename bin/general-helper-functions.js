module.exports = {
    numberOfDaysSince: function (InitialDate, nowDate) {
        let numberOfDays = nowDate.getTime() - InitialDate.getTime()// Number of days since passed date
        return Math.floor(numberOfDays/(1000 * 60 * 60 * 24));
    },
    convertTimeTo24Hours: time => {
        var matches = time.toLowerCase().match(/(\d{1,2}):(\d{2}) ([ap]m)/),
        output  = (parseInt(matches[1]) + (matches[3] == 'pm' ? 12 : 0)) + ':' + matches[2] + ':00';
        output = parseInt(output.split(':')[0])>=10 ? output : '0'+output;

        return output;
    },
    bookingUpdate: async (id, Model, fieldsValues) => {
        let bookingToUpdate =  await Model.findOne({bookingID: id});
        for (const [key, value] of Object.entries(fieldsValues)) {
            bookingToUpdate[key] = value;
        }

        return bookingToUpdate;
    }
};