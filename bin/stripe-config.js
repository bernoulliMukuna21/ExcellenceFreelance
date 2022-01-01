var stripe = require('stripe')(process.env.stripe_secretLiveKey)
console.log('Stripe Secret Key: ', process.env.stripe_secretLiveKey)
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