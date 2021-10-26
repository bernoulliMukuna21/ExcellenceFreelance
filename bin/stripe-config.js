var stripe = require('stripe')('sk_test_51JaFWQAvRzpykLRe6CLZtsn26IyM6hYgKhbkYPR2XxJoXKHN9Eyn7AFQk6yho9VhcsXCoFdT5OZ1PgMVHn1iY2Gn00bHqcUdHw')

const stripeFindCustomerByEmail = async (email) => {
    try {
        const customer = await stripe.customers.list( {
            email: email,
            limit: 1
        });
        if(customer.data.length !== 0){
            return customer.data[0];
        }
    } catch (e) {
        return (e);
    }
};

const stripeCustomerSubscription = async (customerId) => {
    try {
        let stripeSub = await stripe.subscriptions.list({customer: customerId});
        if(stripeSub.data.length !== 0){
            return stripeSub;
        }
    } catch (e) {
        return (e);
    }
};

module.exports = {stripe, stripeFindCustomerByEmail, stripeCustomerSubscription};