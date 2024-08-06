const client = require("../config/db/db.js");
const moment = require('moment');

exports.getRequestUser = async(req, res) => {
    try {
        const data = await client.query(
            `SELECT * FROM animal_doctors WHERE (profile_permission = false OR profile_permission is NULL) 
             AND submit_at IS NOT NULL 
             AND manage_role = 'user'
             AND (before_profile_post = false OR before_profile_post IS NULL)`
        )
        let temp = [];
        if(data.rowCount > 0){
            await data.rows.map((item) => {
                const col = {
                    key:item.id,
                    name:item.first_name + " " + item.last_name,
                    email:item.email,
                    plan:item.payment.plan === 2 ? "Premium" : (item.payment.plan === 1 ? "Basic" : ""),
                    services:item.services === null ? ["N/A"] : item.services,
                    request_time:moment(item.submit_at).format("YYYY/MM/DD HH:mm"),
                }
                temp.push(col);
            })
            res.send(temp);
        }
        else res.send([]);
    }
    catch {
        res.send("Error")
    }
}

exports.getActiveUser = async(req, res) => {
    try {
        const data = await client.query(
            `SELECT * FROM animal_doctors WHERE 
            manage_role = 'user' 
            AND before_profile_post = true`
        )
        if(data.rowCount > 0){
            const temp = data.rows.map((item) => {
                const col = {
                    key:item.id,
                    name:item.first_name + " " + item.last_name,
                    email:item.email,
                    plan:item.payment.plan === 2 ? "Premium" : (item.payment.plan === 1 ? "Basic" : ""),
                    services:item.services === null ? ["N/A"] : item.services,
                    created_at:moment(item.created_at).format("YYYY/MM/DD HH:mm"),
                    profile_permission:item.profile_permission,
                    pay_at:moment(item.payment).format("YYYY/MM/DD HH:mm"),
                    customer_id:item.customer_id,
                    subscription_id:item.subscription_id
                }
                return col;
            })
            res.send(temp);
        }
        else res.send([]);
    }
    catch {
        res.send("Error")
    }
}

exports.deletePermission = async(req, res) => {
    try{
        const data = await client.query(
            `UPDATE animal_doctors SET profile_permission = false WHERE email = '${req.body.email}'`
        );
        if(data.rowCount > 0)res.status(200).send("ok");
        else res.status(201).send("no");
    }
    catch {
        res.send("error")
    }
}

exports.allowPermission = async(req, res) => {
    try{
        const data = await client.query(
            `UPDATE animal_doctors SET profile_permission = true WHERE email = '${req.body.email}'`
        );
        if(data.rowCount > 0)res.status(200).send("ok");
        else res.status(201).send("no");
    }
    catch {
        res.send("error")
    }
}

exports.requestAccept = async(req, res) => {
    try{
        const data = await client.query(
            `UPDATE animal_doctors SET profile_permission = true,
            before_profile_post = true
            WHERE email = '${req.body.email}'`
        );
        if(data.rowCount > 0)res.status(200).send("ok");
        else res.status(201).send("no");
    }
    catch {
        res.send("error")
    }
}

exports.removeUser = async(req, res) => {
    try{
        const data = await client.query(
            `DELETE FROM animal_doctors WHERE email = $1`, [req.body.email]
        );
        if(data.rowCount > 0)res.status(200).send("removed");
        else res.status(201).send("no");
    }
    catch {
        res.send("error")
    }
}