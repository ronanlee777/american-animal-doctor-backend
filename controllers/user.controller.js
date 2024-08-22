const bcrypt = require("bcryptjs");
const client = require("../config/db/db.js");
const getToken = require("../config/utils/getToken");
const { emailExists, firstUser } = require("../config/helper.js");
const jwt = require("jsonwebtoken");
const config = require("../config/config");
const crypto = require("crypto");
const emailjs = require('@emailjs/nodejs');

exports.register = async (req, res) => {
    try {
        const { first_name, last_name, email, password } = req.body;
        const userExists = await emailExists(email);
        const isFirstUser = await firstUser();
        const created_at = new Date();
        const formattedDate = created_at.toISOString();
        if (!userExists) {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            const manageRole = isFirstUser ? "admin" : "user";
            const data = await client.query(
                "INSERT INTO animal_doctors(email, password, first_name, last_name, created_at, manage_role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, password, first_name, last_name, created_at, manage_role",
                [email, hash, first_name, last_name, formattedDate, manageRole]
            );
            if (data.rowCount === 0) res.status(201).send("Insert Error!")
            else {
                res.status(200).send({
                    token: getToken(data.rows[0]),
                    user: data.rows[0]
                });
            }
        }
        else res.status(202).send("This user already exists!");
    }
    catch {
        res.status(501).send("Server error")
    }
}

exports.sendVerifyCode = async (req, res) => {
    try {
        const randomNumber = crypto.randomInt(100000, 1000000);
        const data = await client.query(
            `UPDATE animal_doctors SET verify_code = ${randomNumber} WHERE email = '${req.body.email}' RETURNING *`
        )
        if (data.rowCount === 0) res.status(201).send("You are not registered. Please sign up with your email.");
        else {
            const templateParams = {
                to_name: data.rows[0].first_name + " " + data.rows[0].last_name,
                from_name: "American Animal Doctor",
                recipient: req.body.email,
                message: randomNumber
            };
            const serviceID = "service_yan6r8n";
            const templateID = "template_3fv6ot6";
            const userID = {
                publicKey: 'mzBuss3nc55LTbHcx',
                privateKey: '8pkOEygaDp4eLFzFX457X'
            }
            const response = await emailjs.send(serviceID, templateID, templateParams, userID);
            console.log(req.body.email, 'verify code send success', response.status, response.text);
            res.status(200).send("success");
        }
    }
    catch (err) {
        console.log(req.body.email, 'verify code send failed', err);
        res.status(501).send("Server Error");
    }
}

exports.checkVerifyCode = async (req, res) => {
    try {
        const data = await client.query(
            `SELECT * FROM animal_doctors WHERE email = '${req.body.email}'`
        );
        if (data.rowCount === 0) res.status(201).send("Database Error");
        else {
            if (req.body.verifyCode === data.rows[0].verify_code) {
                res.status(200).send("ok");
            }
            else res.status(202).send("Verify Code Invalid");
        }
    }
    catch {
        res.status(501).send("Server Error");
    }
}

exports.changePassword = async (req, res) => {
    try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(req.body.password, salt);

        const data = await client.query(
            `UPDATE animal_doctors SET password = '${hash}'  WHERE email = '${req.body.email}'`
        );
        if (data.rowCount === 0) res.status(201).send("Database Error");
        else {
            res.status(200).send("ok");
        }
    }
    catch {
        res.status(501).send("Server Error");
    }
}

exports.tokenVerification = async (req, res) => {
    try {
        let { token } = req.body;
        await jwt.verify(token, config.secret, async (err, payload) => {
            if (err) return res.status(401).send("Unauthorized.");
            else {
                const data = await client.query(
                    `UPDATE animal_doctors SET verify = TRUE WHERE id = ${payload.id} RETURNING *`
                )
                if (data.rowCount === 0) res.status(201).send("Failed.");
                else {
                    res.status(200).send({
                        token: getToken(data.rows[0]),
                        user: data.rows[0]
                    })
                }
            }
        });
    }
    catch {
        res.send("Server error");
    }
}

exports.login = async (req, res) => {
    try {
        const data = await client.query(
            `SELECT * FROM animal_doctors WHERE id = ${req.user.id}`
        );
        if (data.rows[0].verify) {
            await res.status(200).send({
                token: getToken(data.rows[0]),
                user: data.rows[0]
            });
        }
        else {
            await res.status(201).send({
                token: getToken(data.rows[0]),
                user: data.rows[0]
            });
        }
    }
    catch {
        res.send("Server error")
    }
}

exports.loginWithToken = async (req, res) => {
    try {
        let { token } = req.body;
        await jwt.verify(token, config.secret, async (err, payload) => {
            if (err) return res.status(401).send("Unauthorized.");
            else {
                const data = await client.query(
                    `SELECT * FROM animal_doctors WHERE id = ${payload.id}`
                );
                if (data.rowCount === 0) res.status(201).send("No User Exist");
                else res.status(200).send({
                    token: getToken(data.rows[0]),
                    user: data.rows[0]
                })
            }
        });
    }
    catch {
        res.send("Server error")
    }
}

exports.paymentSet = async (req, res) => {
    const plan = req.body.plan;
    let value;
    const myDate = new Date();
    const formattedDate = myDate.toISOString();
    if (plan === 2 && req.user.payment) {
        value = {
            "plan": plan,
            "purchased_at": req.user.payment.purchased_at
        }
    }
    else {
        value = {
            "plan": plan,
            "purchased_at": formattedDate
        }
    }
    const jsonValue = JSON.stringify(value);
    const data = await client.query(
        `UPDATE animal_doctors SET payment = '${jsonValue}' 
         WHERE id = ${req.user.id} RETURNING *`
    )
    if (data.rowCount === 0) res.status(201).send("update error!");
    else {
        res.status(200).send(data.rows[0]);
    }
}

exports.setupProfileStep1 = async (req, res) => {

    try {
        const data = await client.query(
            `UPDATE animal_doctors SET first_name = $1,
            last_name = $2,
            profile_name = $3,
            apt_suite = $4,
            certification = $5,
            city_name = $6,
            business_email = $7,
            office_fax = $8,
            office_number = $9,
            role = $10,
            state = $11,
            street_address = $12,
            website_url = $13,
            zipcode = $14
            WHERE id = ${req.user.id} RETURNING *`,
            [req.body.first_name, req.body.last_name, req.body.profile_name, req.body.apt_suite, JSON.stringify(req.body.certification),
            req.body.city_name, req.body.business_email, req.body.office_fax, req.body.office_number, req.body.role, req.body.state,
            req.body.street_address, req.body.website_url, req.body.zipcode]
        )
        if (data.rowCount === 0) res.status(201).send("Failed");
        else {
            res.status(200).send(data.rows[0]);
        }
    }
    catch {
        res.status(501).send("Server Error")
    }
}

exports.setupProfileStep2 = async (req, res) => {
    try {
        const data = await client.query(
            `UPDATE animal_doctors SET facebook = $1,  
            instagram = $2,
            twitter = $3,
            summary = $4,
            avatar = $5,
            working_time = $6,
            education = $7
            WHERE id = ${req.user.id} RETURNING *`,
            [req.body.facebook, req.body.instagram, req.body.twitter, req.body.summary, req.body.avatar, req.body.working_time, JSON.stringify(req.body.education)]
        )
        if (data.rowCount === 0) res.status(201).send("Filed");
        else {
            res.status(200).send(data.rows[0]);
        }
    }
    catch {
        res.send("Server Error")
    }
}

exports.profileSubmit = async (req, res) => {
    try {
        const user = await client.query(
            `SELECT * FROM animal_doctors WHERE id = ${req.user.id}`
        );
        const myDate = new Date();
        const formattedDate = myDate.toISOString();
        const data = await client.query(
            `UPDATE animal_doctors SET submit_at = '${user.submit_at && user.submit_at !== "null" ? user.submit_at : formattedDate}'       
            WHERE id = ${req.user.id} RETURNING *`
        )
        if (data.rowCount === 0) res.status(201).send("Filed");
        else {
            res.status(200).send(data.rows[0]);
        }
    }
    catch {
        res.send("Server Error")
    }
}

exports.uploadAvatar = async (req, res) => {
    res.send("ok");
}

exports.subscribe = async (req, res) => {
    try {
        const data = await client.query("SELECT * FROM subscribers WHERE email=$1", [
            req.body.email,
        ]);
        if (data.rowCount > 0) res.status(201).send("Exist");
        else {
            const insertData = await client.query(
                `INSERT INTO subscribers(email) VALUES ($1)`,
                [req.body.email]
            )
            if (insertData.rowCount > 0) res.status(200).send("ok");
            else res.status(501).send("Failed");
        }
    }
    catch {
        res.status(501).send("Failed");
    }
}

exports.changeContactInfo = async (req, res) => {
    try {
        const data = await client.query(
            `UPDATE animal_doctors SET 
            city_name = $1,
            business_email = $2,
            office_fax = $3,
            office_number = $4,
            state = $5
            WHERE id = ${req.user.id} RETURNING *`,
            [req.body.city_name, req.body.business_email, req.body.office_fax, req.body.office_number, req.body.state]
        )
        if (data.rowCount === 0) res.status(201).send("Failed");
        else {
            res.status(200).send(data.rows[0]);
        }
    }
    catch {
        res.status(501).send("Server Error")
    }
}

exports.changeWorkingTime = async (req, res) => {
    try {
        const data = await client.query(
            `UPDATE animal_doctors SET 
            working_time = $1
            WHERE id = ${req.user.id} RETURNING *`,
            [req.body.working_time]
        )
        if (data.rowCount === 0) res.status(201).send("Failed");
        else {
            res.status(200).send(data.rows[0]);
        }
    }
    catch {
        res.status(501).send("Server Error")
    }
}

exports.changeAvatar = async (req, res) => {
    try {
        const data = await client.query(
            `UPDATE animal_doctors SET facebook = $1,  
            instagram = $2,
            twitter = $3,
            avatar = $4
            WHERE id = ${req.user.id} RETURNING *`,
            [req.body.facebook, req.body.instagram, req.body.twitter, req.body.avatar]
        )
        if (data.rowCount === 0) res.status(201).send("Failed");
        else {
            res.status(200).send(data.rows[0]);
        }
    }
    catch {
        res.status(501).send("Server Error")
    }
}

exports.changeTitleWebsite = async (req, res) => {
    try {
        const data = await client.query(
            `UPDATE animal_doctors SET   
            role = $1,
            profile_name = $2,
            website_url = $3
            WHERE id = ${req.user.id} RETURNING *`,
            [req.body.role, req.body.profile_name, req.body.website_url]
        )
        if (data.rowCount === 0) res.status(201).send("Failed");
        else {
            res.status(200).send(data.rows[0]);
        }
    }
    catch {
        res.status(501).send("Server Error")
    }
}

exports.changeSummary = async (req, res) => {
    try {
        const data = await client.query(
            `UPDATE animal_doctors SET   
            summary = $1
            WHERE id = ${req.user.id} RETURNING *`,
            [req.body.summary]
        )
        if (data.rowCount === 0) res.status(201).send("Failed");
        else {
            res.status(200).send(data.rows[0]);
        }
    }
    catch {
        res.status(501).send("Server Error")
    }
}

exports.changeEducation = async (req, res) => {
    try {
        const data = await client.query(
            `UPDATE animal_doctors SET   
            education = $1
            WHERE id = ${req.user.id} RETURNING *`,
            [JSON.stringify(req.body.education)]
        )
        if (data.rowCount === 0) res.status(201).send("Failed");
        else {
            res.status(200).send(data.rows[0]);
        }
    }
    catch {
        res.status(501).send("Server Error")
    }
}