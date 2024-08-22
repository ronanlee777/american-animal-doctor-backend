const client = require('../config/db/db');
const stripe = require("stripe")(
    "sk_test_51P0DHID120CoAE1Cwaux80RxRb5VzTAzr7W9z6B9MNXyBJ3EXCNChbYQ6DE0Os94TgCtO62P198RsmkFP9XfwV6600EkFdwW66" //test
);

exports.createProducts = async (req, res) => {
    const plan = req.body.plan;
    const product = await stripe.products.create({
        name: plan,
    });
    const data = await client.query(
        `INSERT INTO product_list(id, product_id) VALUES ($1, $2)`,
        [req.body.id, product.id]
    )
    if(data.rowCount > 0)console.log("product details", product);
    res.send(product);
}

exports.createPrices = async (req, res) => {
    const { product_id, priceAmount } = req.body;
    const price = await stripe.prices.create({
        product: product_id,
        unit_amount: priceAmount,
        currency: "usd",
        recurring: {
            interval: "day",
            interval_count: 1,
        },
    });
    const data = await client.query(
        `UPDATE product_list SET price_id = '${price.id}' WHERE product_id = '${product_id}'`,
        [req.body.id, product.id]
    )
    res.send(price);
}

exports.checkCustomer = async (req, res) => {
    try {
        const email = req.body.email;
        const data = await client.query(
            `SELECT * FROM animal_doctors WHERE email = '${email}'`
        )
        if (data.rowCount === 0) {
            res.status(201).send("no_user");
        }
        else {
            const customerId = data.rows[0].customer_id;
            if (customerId === null) res.status(202).send("no_customer");
            else {
                const customer = await stripe.customers.retrieve(customerId);

                // Access the customer status from the retrieved subscription object
                // const subscriptionStatus = subscription.status;
                if (customer) res.status(200).send(customer);
                // res.status(200).send({ status: subscriptionStatus });
            }
        }

    } catch (error) {
        // console.error("Error checking subscription status:", error);
        res.status(501).send({ error: "Failed to check subscription status" });
    }
}

exports.createCustomer = async (req, res) => {
    try {
        const { email, full_name } = req.body;
        const name = full_name;
        if (!email && !name) res.status(202).send("no_email");
        else await stripe.customers
            .create({
                email: email,
                name: name,
            })
            .then(async (response) => {
                if (response && response.email === email) {
                    const data = await client.query(
                        `UPDATE animal_doctors SET customer_id = '${response.id}' WHERE email = '${response.email}' RETURNING *`
                    )
                    if (data.rowCount > 0) res.status(200).send(data.rows[0]);
                }
                else res.status(202).send("no_email")
            })
            .catch((err) => {
                res.status(201).send(err);
            });
    } catch (err) {
        res.status(500).send("server");
    }
}

exports.createSubscription = async (req, res) => {
    try {
        const { email, customerId, plan } = req.body;
        const product_data = await client.query(
            `SELECT * FROM product_list WHERE id = ${plan}`
        )
        const product = product_data.rows[0];
        console.log("product id ------>>>>>>>", product.product_id);
        console.log("price id -------->>>>>>>", product.price_id)

        // Create the subscription. Note we're expanding the Subscription's
        // latest invoice and that invoice's payment_intent
        // so we can pass it to the front end to confirm the payment

        const subscription = await stripe.subscriptions.create({
            customer: customerId,
            items: [
                {
                    price: product.price_id,
                },
            ],
            payment_behavior: "default_incomplete",
            payment_settings: { save_default_payment_method: "on_subscription" },
            expand: ["latest_invoice.payment_intent"],
        });
        const data = await client.query(
            `UPDATE animal_doctors SET subscription_id = '${subscription.id}' WHERE email = '${email}'`
        );
        if (data.rowCount > 0) {
            res.send({
                subscriptionId: subscription.id,
                clientSecret: subscription.latest_invoice.payment_intent.client_secret,
                hosted_invoice_url: subscription.latest_invoice.hosted_invoice_url,
            });
        }
        else {
            res.send("no");
        }

    } catch (error) {
        return res.status(400).send({ error: { message: error.message } });
    }
}

exports.updateSubscription = async (req, res) => {
    try {
        const { subscriptionId, subItemId } = req.body;
        const product_data = await client.query(
            `SELECT * FROM product_list WHERE id = 2`
        )
        const product = product_data.rows[0];
        const subscription = await stripe.subscriptions.update(
            subscriptionId,
            {
                items: [
                    {
                        id: subItemId,
                        price: product.price_id,
                    },
                ],
                proration_behavior: 'always_invoice',
                payment_behavior: 'default_incomplete',
            }
        );
        const invoice = await stripe.invoices.retrieve(subscription.latest_invoice);
        res.status(200).send(invoice.hosted_invoice_url);
    }
    catch {
        res.status(501).send("error")
    }
}

exports.webhook = async (req, res) => {
    const body = req.body;
    console.log("webhook ---------------->>>>>>>>>>>>", body.type);
    const event = body;
    switch (event.type) {
        case "customer.created":
            console.log("customer created");
            break;
        case "customer.deleted":
            console.log("customer deleted");
            break;
        case "customer.subscription.created":
            console.log("subscription created");
            break;
        case "invoice.finalized":
            console.log("invoice finalized");
            break;
        case "invoice.payment_succeeded":
            const myDate = new Date();
            const formattedDate = myDate.toISOString();
            let value;
            let plan;
            if (event.data.object.amount_due === 9000) {
                value = {
                    "plan": 1,
                    "purchased_at": formattedDate
                }
                plan = 1;
            }
            else {
                value = {
                    "plan": 2,
                    "purchased_at": formattedDate
                }
                plan=2;
            }
            const jsonValue = JSON.stringify(value);
            const updated_data = await client.query(
                `UPDATE animal_doctors SET payment= $1, plan = $2 WHERE email = '${event.data.object.customer_email}' RETURNING *`,
                [jsonValue, plan]
            )
            break;
        case "invoice.payment_failed":
            console.log("invoice.payment_failed")
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }
}

exports.checkSubscription = async (req, res) => {
    try {
        const email = req.body.email;
        const data = await client.query(
            `SELECT * FROM animal_doctors WHERE email = '${email}'`
        )
        if (data.rowCount === 0) {
            res.status(201).send("no_user");
        }
        else {
            const subscriptionId = data.rows[0].subscription_id;
            if (subscriptionId === null) res.status(202).send("no_subscription");
            else {
                const subscription = await stripe.subscriptions.retrieve(subscriptionId);

                // Access the subscription status from the retrieved subscription object
                const subscriptionStatus = subscription.status;
                res.status(200).send({ status: subscriptionStatus, subscription_id: subscription.id, sub_item_id: subscription.items.data[0].id });
            }
        }

    } catch (error) {
        // console.error("Error checking subscription status:", error);
        res.status(501).send({ error: "Failed to check subscription status" });
    }
}

exports.cancelSubscription = async (req, res) => {
    try {
        const subscriptionId = req.body.subscription_id;
        const subscription = await stripe.subscriptions.cancel(subscriptionId);

        if (subscription) res.status(200).send("ok");

    } catch (error) {
        // console.error("Error checking subscription status:", error);
        res.status(501).send({ error: "Failed to delete subscription status" });
    }
}

exports.checkPayment = async (req, res) => {
    try {
        const { email, plan } = req.body;
        const data = await client.query(
            `SELECT * FROM animal_doctors WHERE email = '${email}'`
        )
        if (data.rowCount > 0) {
            if (data.rows[0].payment && data.rows[0].payment.plan === plan) res.status(200).send(data.rows[0])
            else res.status(201).send("Insufficient Funds");
        }
        else res.status(202).send("no_email");
    }
    catch {
        res.status(501).send("Server Error.")
    }
}