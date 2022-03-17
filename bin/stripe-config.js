var stripe = require('stripe')('sk_test_51JaFWQAvRzpykLReGs8cEpc8SnEpWG9eH5zjuk8jSqoQehlQ2vgufTzRvj8yM7IMeU3L0p9RTRyZwNOTofFgz96t00NmSMLdrQ')

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