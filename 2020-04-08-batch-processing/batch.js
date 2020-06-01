/*

 Warning: this file is a very simple starting point for batching many of the same stripe calls together.
 This is not a complete solution, but rather an introductory sample for you to build upon.
 Your business logic needs and specific scenario will dictate how robust your solution will need to be.
 Pro tip: ALWAYS perform a "dry run" before you do anything live.
 https://en.wikipedia.org/wiki/Dry_run_(testing)

*/

require('dotenv').config();

const fs = require('fs');
const readline = require('readline');
const { RateLimit } = require('async-sema');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// setting maximum requests per second to 20 (due to test mode limits)
// please refer to https://stripe.com/docs/rate-limits for more.
// note: take your own live traffic to Stripe into account when calculating a reasonable limit.
const limit = RateLimit(20);

const processLine = async (charge_id) => {
  try {
    // ensure we are able to operate within set limit first
    await limit();
    console.log(`processing ${charge_id}`);

    // make the refund
    await stripe.refunds.create({
      charge: charge_id,
      refund_application_fee: true,
      reverse_transfer: true 
    })

    // stripe call here
  } catch (error) {
    writeFailureToFile(charge_id, error);
    // we recommend also checking the error.code for `rate_limit` value -
    // this allows you to add additional logic to handle retrying
    // see https://stripe.com/docs/error-handling and also https://stripe.com/docs/error-codes
  }
}

// log which operations failed and why
// note: using our webhooks is also a great way to track operation failures.
// see https://stripe.com/docs/webhooks for more
const writeFailureToFile = (charge_id, error) => {
  try {
    fs.appendFileSync('processing_failures.txt', `${charge_id} ${error.code}\n`);
  } catch (error) {
    throw error;
  }
};


// update file name here
const reader = readline.createInterface({
  input: fs.createReadStream('Tiny_Ninjas__Heroes_6-1-20-2020-06-01-20-38-10-charges.csv')
  // input: fs.createReadStream('refund_test.csv')

});

reader.on('line', processLine);

