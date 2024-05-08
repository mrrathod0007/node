const UserServices = require("../services/user_services");
const { AdminUserModel, AdminBranchesModel, UserModel, UserAddTable, Login, Menu, Invoice, KeepOrder, AddPdf, Profile } = require("../model/user_model");
const jwt = require("jsonwebtoken");
const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const { table } = require("console");
const secretKey = "secretKey";
const path = require('path');
const hbs = require("hbs");
const { response } = require("express");
const moment = require('moment');

exports.adminRegister = async (req, res, next) => {
    try {
        const { userName, mobile, password, branches } = req.body;

        if (!userName) {
            return res.status(400).json({ status: false, msg: "UserName is required." });
        }
        else if (!mobile) {
            return res.status(400).json({ status: false, msg: "Mobile is required." });
        }
        else if (!password) {
            return res.status(400).json({ status: false, msg: "password is required." });
        }
        else if (!branches) {
            return res.status(400).json({ status: false, msg: "branches is required." });
        }
        if (branches.length > 3) {
            res.json({ status: true, msg: "Not able to add More then 3 Branches" });
        } else {
            let isExist = false;
            let branchuserIdFromLoop;
            let checkUserIdForBranch = [];
            for (var i = 0; i < branches.length; i++) {
                checkUserIdForBranch.push(branches[i].userId);

            }

            const allAdminMobile = await AdminUserModel.find({ mobile: mobile });
            const allAdminId = await AdminUserModel.find({ userName: userName });
            if (allAdminMobile.length > 0) {
                isExist = true;
                branchuserIdFromLoop = mobile;
            } else if (allAdminId.length > 0) {
                isExist = true;
                branchuserIdFromLoop = userName;
            }
            let abc = [];
            for (const value of branches) {

                if (abc.includes(value.userId)) {
                    isExist = true;
                    branchuserIdFromLoop = `${value.userId} Mobile Number can not use more then one`;
                } else {
                    abc.push(value.userId);
                }
            }
            for (const value of branches) {

                // if(checkUserIdForBranch.length >0){
                //     if(checkUserIdForBranch.includes(value.userId)){

                //         for (var i =0; i< branches.length; i++){




                //         }


                //     }
                // }
                const allbranches = await AdminBranchesModel.find({ 'branches.userId': value.userId });


                if (allAdminMobile.length > 0) {
                    isExist = true;
                    branchuserIdFromLoop = `${mobile} mobile number is Allready Register`;
                } else if (allAdminId.length > 0) {
                    isExist = true;
                    branchuserIdFromLoop = `${userName} userName is Allready Register`;
                }
                else if (allbranches.length > 0) {

                    isExist = true;
                    branchuserIdFromLoop = `${value.userId} mobile number is Allready Register`;
                }
            }
            if (isExist) {
                res.json({ status: false, msg: `${branchuserIdFromLoop}` });

            } else {
                const adminResponse = await UserServices.adminRegister(userName, mobile, password);
                const branchesRes = await UserServices.adminBranches(adminResponse._id, branches);
                res.json({ status: true, msg: "User Registration Successful" });
            }





        }

    } catch (error) {
        if (error.name === 'MongoServerError' && error.code === 11000) {
            // If the error is due to duplicate email (MongoError code 11000)
            return res.status(400).json({ status: false, msg: "This UserName or Mobile is already in use." });
        } else {
            // For other errors, return a generic error message
            return res.status(500).json({ status: false, msg: `Internal Server Error ${error.name}` });
        }
    }
}

exports.register = async (req, res, next) => {
    try {
        const { userName, mobile, password } = req.body;

        if (!userName) {
            return res.status(400).json({ status: false, msg: "UserName is required." });
        }
        else if (!mobile) {
            return res.status(400).json({ status: false, msg: "Mobile is required." });
        }
        else if (!password) {
            return res.status(400).json({ status: false, msg: "password is required." });
        }


        const successRes = await UserServices.registerUser(userName, mobile, password);

        res.json({ status: true, msg: "User Registration Successful" });
    } catch (error) {
        if (error.name === 'MongoServerError' && error.code === 11000) {
            // If the error is due to duplicate email (MongoError code 11000)
            return res.status(400).json({ status: false, msg: "This UserName or Mobile is already in use." });
        } else {
            // For other errors, return a generic error message
            return res.status(500).json({ status: false, msg: `Internal Server Error ${error.name}` });
        }
    }
}

exports.adminLogin = async (req, res, next) => {
    try {
        const { mobileOrPassword, password } = req.body;
        console.log("=====Adminlog======", req.body);

        if (!mobileOrPassword) {
            return res.status(400).json({ status: false, msg: "Username or Mobile is required." });
        }
        else if (!password) {
            return res.status(400).json({ status: false, msg: "Password is required." });
        }

        let user = await UserServices.checkAdminUser(mobileOrPassword);

        if (!user) {
            const branchLogin = await AdminBranchesModel.findOne({ 'branches.userId': mobileOrPassword });
            let branches;
            if (branchLogin && branchLogin.branches && branchLogin.branches.length > 0) {
                branches = branchLogin.branches;
            }
            if (!branches) {
                throw new Error("User does not exist");
            } else {
                let userName;
                let userPassword;
                let branchId;
                for (const value of branches) {
                    if (value.userId === mobileOrPassword) {
                        userName = value.userId;
                        userPassword = value.pass;
                        branchId = value._id;
                    }
                }

                if (userName) {
                    if (userPassword === password) {
                        let tokenData = { _id: branchId, userId: userName };
                        const tokenExpire = 365 * 24 * 60 * 60;
                        const token = await UserServices.generateAdmintoken(tokenData, "secretKey", "5d", branchId);
                        const keyValue = branchId;
                        const responseLog = await UserServices.adminUpdateToken(keyValue, token, mobileOrPassword, password);

                        res.status(200).json({ status: true, msg: "User Login Successful", response: { token: token, isAdmin: false } });
                    }
                    else {
                        res.status(400).json({ status: false, msg: "Password Does not Match", response: null });
                    }
                }

            }
        } else {

            const isMatch = await user.compareAdminPassword(password);
            if (isMatch === false) {
                throw new Error("Password is Invalid");
            }

            let tokenData = { _id: user._id, mobile: user.mobile };
            const tokenExpire = 365 * 24 * 60 * 60;
            const token = await UserServices.generateAdmintoken(tokenData, "secretKey", "5d", user._id);
            const keyValue = user._id;
            const responseLog = await UserServices.adminUpdateToken(keyValue, token, mobileOrPassword, password);

            res.status(200).json({ status: true, msg: "User Login Successful", response: { token: token, isAdmin: user.isAdmin } });
        }
    } catch (error) {
        if (error.message === 'User does not exist' || error.message === 'Password is Invalid') {
            return res.status(400).json({ status: false, msg: error.message });
        } else {
            return res.status(400).json({ status: false, msg: `Session expired`, response: null });
        }
    }
}
exports.addBranch = async (req, res, next) => {

    const isValidToken = await UserServices.checkToken(req.token);
    if (isValidToken) {
        try {
            jwt.verify(req.token, secretKey, async (error, authData) => {
                if (error) {

                    if (error.message === "jwt expired") {
                        res.status(200).json({
                            status: false,
                            msg: "Your Subscription Expire Please Contect Admin",
                            response: null
                        });
                    } else {
                        res.json({
                            status: false,
                            msg: "Token Invalid"
                        });
                    }

                } else {

                    const keyValue = await authData._id;
                    const { branches } = req.body;
                    let branchesRes = await AdminBranchesModel.findOne({ keyValue: keyValue });
                    let resBranch;
                    let resLength = 0;
                    let reqLength = 0;
                    if (branchesRes) {
                        resBranch = branchesRes.branches;
                        resLength = resBranch.length;
                    }
                    if (branches) {
                        reqLength = branches.length;
                    }

                    const newLength = resLength + reqLength;

                    if (newLength > 3) {
                        return res.status(400).json({ status: false, msg: `You Have already ${resLength} You Can not more then 3 Branches`, response: null });
                    } else {
                        let isExist = false;
                        let branchuserIdFromLoop;
                        for (const value of branches) {
                            const allbranches = await AdminBranchesModel.find({ 'branches.userId': value.userId });
                            if (allbranches.length > 0) {
                                isExist = true;
                                branchuserIdFromLoop = value.userId;
                            }
                        }
                        if (isExist) {
                            return res.json({ status: false, msg: `${branchuserIdFromLoop} UserId is Allready Register` });

                        } else {
                            if (branchesRes) {
                                for (const value of branches) {
                                    branchesRes.branches.push({
                                        branchName: value.branchName,
                                        userId: value.userId,
                                        pass: value.pass
                                    });
                                }

                            } else {
                                branchesRes = await UserServices.adminBranches(authData._id, branches);
                            }

                        }

                    }
                    const response = await branchesRes.save();
                    const getAllBranches = await AdminBranchesModel.find({ keyValue: `${keyValue}` });
                    if (getAllBranches.length !== 0) {
                        let abc;
                        for (const value of getAllBranches) {
                            abc = value.branches;
                        }
                        const filteredBranches = abc.map(obj => ({
                            branchName: obj.branchName,
                            userId: obj.userId,
                            id: obj._id
                        }))
                        return res.status(200).json({ status: true, msg: "Branch added", response: { branches: filteredBranches } });
                    }


                }
            });
        } catch (error) {
            if (error.message) {
                return res.status(400).json({ status: false, msg: `Session Expire Please contect admin ${error.message}` });
            } else {
                return res.status(500).json({ status: false, msg: `Internal Server Error ${error.message}` });
            }
        }
    } else {
        res.status(200).json({
            status: false,
            msg: "Your Subscription Expire Please Contect Admin",
            response: null
        });
    }

}
exports.getBranch = async (req, res, next) => {
    const isValidToken = await UserServices.checkToken(req.token);
    if (isValidToken) {
        try {
            jwt.verify(req.token, secretKey, async (error, authData) => {
                if (error) {

                    if (error.message === "jwt expired") {
                        res.status(200).json({
                            status: false,
                            msg: "Your Subscription Expire Please Contect Admin",
                            response: null
                        });
                    } else {
                        res.json({
                            status: false,
                            msg: "Token Invalid"
                        });
                    }

                } else {
                    const keyValue = await authData._id;

                    if (keyValue !== null) {
                        const getAllBranches = await AdminBranchesModel.find({ keyValue: `${keyValue}` });

                        if (getAllBranches.length !== 0) {
                            let abc;
                            for (const value of getAllBranches) {
                                abc = value.branches;
                            }
                            const filteredBranches = abc.map(obj => ({
                                branchName: obj.branchName,
                                userId: obj.userId,
                                id: obj._id
                            }))
                            res.json({ status: true, msg: "All Branches Retrieve Successful", response: { branches: filteredBranches } });
                        } else {
                            res.json({ status: false, msg: "No Branches Found", response: null });
                        }
                    }
                }
            });
        } catch (error) {
            if (error.message) {
                return res.status(400).json({ status: false, msg: "Session Expire Please contect admin" });
            } else {
                return res.status(500).json({ status: false, msg: `Internal Server Error ${error.message}` });
            }
        }
    } else {
        res.status(200).json({
            status: false,
            msg: "Your Subscription Expire Please Contect Admin",
            response: null
        });
    }

}
exports.editBranch = async (req, res, next) => {
    const isValidToken = await UserServices.checkToken(req.token);
    if (isValidToken) {
        try {
            jwt.verify(req.token, secretKey, async (error, authData) => {
                if (error) {

                    if (error.message === "jwt expired") {
                        res.status(200).json({
                            status: false,
                            msg: "Your Subscription Expire Please Contect Admin",
                            response: null
                        });
                    } else {
                        res.json({
                            status: false,
                            msg: "Token Invalid"
                        });
                    }

                } else {

                    try {

                        const keyValue = await authData._id;
                        const data = req.body;
                        const { id, branchName } = req.body;
                        const getAllBranches = await AdminBranchesModel.findOne({ keyValue: `${keyValue}`, 'branches._id': id });
                        const branches = getAllBranches.branches;
                        let updateBranch;
                        for (let i = 0; i < branches.length;) {

                            if (branches[i]._id == `${id}`) {
                                branches[i].branchName = branchName;
                                // const newList = await getAllBranches.save();
                            }
                            i++;
                        }
                        if (getAllBranches === null) {
                            res.json({ status: false, msg: "Menu List Not Found", response: null });
                        } else {


                            const newList = await getAllBranches.save();
                            res.json({ status: true, msg: "Branch Update Successful", response: null });
                        }



                    } catch (err) {
                        res.status(400).json({ message: err.message });
                    }
                }

            });

        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    } else {
        res.status(200).json({
            status: false,
            msg: "Your Subscription Expire Please Contect Admin",
            response: null
        });
    }


}

exports.deleteBranch = async (req, res, next) => {
    const isValidToken = await UserServices.checkToken(req.token);
    if (isValidToken) {
        jwt.verify(req.token, secretKey, async (error, authData) => {
            if (error) {
                if (error.message === "jwt expired") {
                    res.status(200).json({
                        status: false,
                        msg: "Your Subscription Expire Please Contect Admin",
                        response: null
                    });
                } else {
                    res.json({
                        status: false,
                        msg: "Token Invalid"
                    });
                }
            } else {
                const keyValue = authData._id;
                const { id } = req.body;

                try {

                    const deletedBranch = await AdminBranchesModel.updateOne(
                        { keyValue: keyValue },
                        { $pull: { branches: { _id: id } } }
                    );



                    // .findOneAndDelete({ 'branches._id': id, keyValue: keyValue });

                    if (deletedBranch) {
                        res.status(200).json({ status: true, msg: "Branch deleted successfully", response: null });
                    } else {
                        res.status(404).json({ status: false, msg: "Branch not found", response: null });
                    }
                } catch (error) {
                    res.status(500).json({ status: false, msg: "Internal Server Error" });
                }
            }
        });
    } else {
        res.status(200).json({
            status: false,
            msg: "Your Subscription Expire Please Contect Admin",
            response: null
        });
    }
};
exports.login = async (req, res, next) => {
    try {
        const { mobileOrPassword, password } = req.body;

        if (!mobileOrPassword) {
            return res.status(400).json({ status: false, msg: "Username or Mobile is required." });
        }
        else if (!password) {
            return res.status(400).json({ status: false, msg: "Password is required." });
        }

        let user = await UserServices.checkuser(mobileOrPassword);

        if (!user) {
            throw new Error("User does not exist");
        }

        const isMatch = await user.comparePassword(password);

        if (isMatch === false) {
            throw new Error("Password is Invalid");
        }

        let tokenData = { _id: user._id, mobile: user.mobile };
        const tokenExpire = 365 * 24 * 60 * 60;
        const token = await UserServices.generatetoken(tokenData, "secretKey", "1d", user._id);
        const keyValue = user._id;
        await UserServices.updateToken(keyValue, token, mobileOrPassword, password);

        res.status(200).json({ status: true, msg: "User Login Successful", response: { token: token } });
    } catch (error) {
        if (error.message === 'User does not exist' || error.message === 'Password is Invalid') {
            return res.status(400).json({ status: false, msg: error.message });
        } else {
            return res.status(400).json({ status: false, msg: `Session expired`, response: null });
        }
    }
}

exports.addTable = async (req, res, next) => {
    const isValidToken = await UserServices.checkToken(req.token);
    if (isValidToken) {
        jwt.verify(req.token, secretKey, async (error, authData) => {
            if (error) {

                if (error.message === "jwt expired") {
                    res.status(200).json({
                        status: false,
                        msg: "Your Subscription Expire Please Contect Admin",
                        response: null
                    });
                } else {
                    res.json({
                        status: false,
                        msg: "Token Invalid"
                    });
                }

            } else {
                const keyValue = await authData._id;
                const name = "";
                const mobile = "";
                const member = "";
                const isOccupied = false;
                const keepOrder = false;
                const { tableId } = await req.body;
                if (keyValue !== null) {

                    let table = await UserServices.tableCheck(keyValue);
                    if (table === null) {
                        try {
                            const { tableId } = await req.body;
                            if (!tableId) {
                                return res.status(400).json({ status: false, msg: "Table Number is required." });
                            }
                            else {
                                const successRes = await UserServices.addTable(`${keyValue}`, tableId, name, mobile, member, isOccupied, keepOrder);
                                const getTable = await UserAddTable.find({ keyValue: `${keyValue}` });
                                const filteredTable = getTable.map(table => ({
                                    tableId: table.tableId,
                                    name: table.name,
                                    mobile: table.mobile,
                                    member: table.member,
                                    isOccupied: table.isOccupied,
                                    keepOrder: table.keepOrder
                                }));
                                res.json({ status: true, msg: "table is created", response: { table: filteredTable } });
                            }

                        } catch (error) {
                            if (error.name === 'MongoServerError' && error.code === 11000) {
                                // If the error is due to duplicate email (MongoError code 11000)
                                return res.status(400).json({ status: false, msg: "This UserName or Mobile is already in use." });
                            } else {
                                // For other errors, return a generic error message
                                return res.status(500).json({ status: false, msg: `Internal Server Error ${error.name}` });
                            }
                        }
                    }
                    else {
                        const isMatch = await table.compareTable(keyValue, req.body.tableId);

                        if (isMatch) {
                            const getTable = await UserAddTable.find();
                            const filteredTable = getTable.map(table => ({
                                tableId: table.tableId,
                                name: table.name,
                                mobile: table.mobile,
                                member: table.member,
                                isOccupied: table.isOccupied,
                                keepOrder: table.keepOrder
                            }));
                            res.json({
                                status: false,
                                msg: "Table is Already exist",
                                response: null
                            });
                        }
                        else {

                            try {
                                const { tableId } = await req.body;
                                if (!tableId) {
                                    return res.status(400).json({ status: false, msg: "Table Number is required." });
                                }
                                else {
                                    const successRes = await UserServices.addTable(`${keyValue}`, tableId, name, mobile, member, isOccupied, keepOrder);
                                    const getTable = await UserAddTable.find({ keyValue: `${keyValue}` });
                                    const filteredTable = getTable.map(table => ({
                                        tableId: table.tableId,
                                        name: table.name,
                                        mobile: table.mobile,
                                        member: table.member,
                                        isOccupied: table.isOccupied,
                                        keepOrder: table.keepOrder
                                    }));

                                    res.json({ status: true, msg: "table is created", response: { table: filteredTable } });
                                }

                            } catch (error) {
                                if (error.name === 'MongoServerError' && error.code === 11000) {
                                    // If the error is due to duplicate email (MongoError code 11000)
                                    return res.status(400).json({ status: false, msg: "This UserName or Mobile is already in use." });
                                } else {
                                    // For other errors, return a generic error message
                                    return res.status(500).json({ status: false, msg: `Internal Server Error ${error.name}` });
                                }
                            }
                        }
                    }

                }



            }

        });
    } else {

        res.status(200).json({
            status: false,
            msg: "Your Subscription Expire Please Contect Admin",
            response: null
        });
    }

}

exports.getTable = async (req, res, next) => {
    const isValidToken = await UserServices.checkToken(req.token);
    if (isValidToken) {
        try {
            jwt.verify(req.token, secretKey, async (error, authData) => {
                if (error) {

                    if (error.message === "jwt expired") {
                        res.status(200).json({
                            status: false,
                            msg: "Your Subscription Expire Please Contect Admin",
                            response: null
                        });
                    } else {
                        res.json({
                            status: false,
                            msg: "Token Invalid"
                        });
                    }

                } else {
                    const keyValue = await authData._id;
                    const { branchName } = await req.body;
                    if (branchName && keyValue !== null) {
                        let branchKeyValue;
                        const branchUser = await AdminBranchesModel.findOne({ keyValue: keyValue, 'branches.branchName': branchName });
                        let branches;
                        if (branchUser && branchUser.branches && branchUser.branches.length > 0) {
                            branches = branchUser.branches;
                        }
                        if (!branches) {
                            throw new Error("User does not exist");
                        } else {
                            let userName;
                            let userPassword;
                            let branchId;
                            for (const value of branches) {
                                if (value.branchName === branchName) {
                                    userName = value.branchName;
                                    userPassword = value.pass;
                                    branchId = value._id;
                                }
                            }

                            if (userName) {
                                if (branchName === userName) {
                                    branchKeyValue = branchId;

                                    // res.status(200).json({ status: true, msg: "User Login Successful", response: { token: token, isAdmin: false } });
                                }
                                else {
                                    res.status(400).json({ status: false, msg: "Branch did not Match", response: null });
                                }
                            }

                        }


                        const getTable = await UserAddTable.find({ keyValue: `${branchKeyValue}` });

                        if (getTable.length !== 0) {
                            const filteredTable = getTable.map(table => ({
                                tableId: table.tableId,
                                name: table.name,
                                mobile: table.mobile,
                                member: table.member,
                                isOccupied: table.isOccupied,
                                keepOrder: table.keepOrder
                            }));
                            res.json({ status: true, msg: "All Table Retrieve Successful", response: { table: filteredTable } });
                        } else {
                            res.json({ status: false, msg: "No Table Found", response: null });
                        }
                    } else {
                        if (keyValue !== null) {
                            const getTable = await UserAddTable.find({ keyValue: `${keyValue}` });

                            if (getTable.length !== 0) {
                                const filteredTable = getTable.map(table => ({
                                    tableId: table.tableId,
                                    name: table.name,
                                    mobile: table.mobile,
                                    member: table.member,
                                    isOccupied: table.isOccupied,
                                    keepOrder: table.keepOrder
                                }));
                                res.json({ status: true, msg: "All Table Retrieve Successful", response: { table: filteredTable } });
                            } else {
                                res.json({ status: false, msg: "No Table Found", response: null });
                            }


                        }
                    }




                }

            });
        } catch (error) {
            if (error.message === 'No Table Found' || error.message === 'No Table Found') {
                return res.status(400).json({ status: false, msg: error.message });
            } else {
                return res.status(500).json({ status: false, msg: `Internal Server Error ${error.message}` });
            }
        }
    } else {
        res.status(200).json({
            status: false,
            msg: "Your Subscription Expire Please Contect Admin",
            response: null
        });
    }

}

exports.forgotPassword = async (req, res, next) => {
    try {
        const { mobileOrPassword } = req.body;
        if (!mobileOrPassword) {
            return res.status(400).json({ status: false, msg: "Username or Mobile is required." });
        }
        else {

            let user = await UserServices.checkuser(mobileOrPassword);
            if (!user) {
                return res.status(404).json({ status: false, msg: "'User not found'", response: null });
            } else {

                let id;
                let tokenData;
                if (user.branches !== undefined) {
                    if (user.branches.length > 0) {
                        for (const value of user.branches) {
                            if (value.userId === mobileOrPassword) {
                                id = value._id;
                            }
                        }
                        tokenData = { _id: id, mobile: user.mobile };
                    }
                } else {
                    tokenData = { _id: user._id, mobile: user.mobile };
                }


                const token = await UserServices.generatetoken(tokenData, "secretKey", "1h");

                res.json({ status: true, msg: "Password reset successfully Please Add New Password", response: { token: token } });

            }
        }

    } catch (error) {

    }
}

exports.resetPassword = async (req, res, next) => {

    try {
        jwt.verify(req.token, secretKey, async (error, authData) => {
            if (error) {

                res.json({
                    status: false,
                    msg: "Token Invalid"
                });

            } else {
                const { newPassword } = req.body;
                const user = await AdminUserModel.findOne({ _id: authData._id });
                const branchUser = await AdminBranchesModel.findOne({ 'branches._id': authData._id });
                if (user) {
                    user.password = newPassword;
                    await user.save();
                } else {
                    let branches;
                    for (const value of branchUser.branches) {
                        if (value._id == `${authData._id}`) {

                            branches = value;
                        }

                    }
                    branches.pass = newPassword;
                    await branchUser.save();


                }
                // if (!user) {
                //     return res.status(400).json({ error: 'Invalid or expired token' });
                // }

                res.status(200).json({ status: true, message: 'Password reset successfully, Now Login with New Password', response: null });
            }

        });
    } catch (error) {

    }
}
exports.addCustomer = async (req, res, next) => {
    const isValidToken = await UserServices.checkToken(req.token);
    if (isValidToken) {
        jwt.verify(req.token, secretKey, async (error, authData) => {
            if (error) {

                if (error.message === "jwt expired") {
                    res.status(200).json({
                        status: false,
                        msg: "Your Subscription Expire Please Contect Admin",
                        response: null
                    });
                } else {
                    res.json({
                        status: false,
                        msg: "Token Invalid"
                    });
                }

            } else {
                const keyValue = await authData._id;
                const { tableId, name, mobile, member, isOccupied, keepOrder } = await req.body;

                if (keyValue !== null) {
                    let table = await UserServices.tableCheck(keyValue);
                    const tableUpdate = await table.customerUpdate(keyValue, req.body.tableId);



                    if (tableUpdate !== null) {

                        tableUpdate.name = name;
                        tableUpdate.mobile = mobile;
                        tableUpdate.member = member;
                        tableUpdate.isOccupied = isOccupied;
                        tableUpdate.keepOrder = keepOrder;
                        const updatedTable = await tableUpdate.save();
                        const filteredTable = {
                            tableId: updatedTable.tableId,
                            name: updatedTable.name,
                            mobile: updatedTable.mobile,
                            member: updatedTable.member,
                            isOccupied: updatedTable.isOccupied,
                            keepOrder: updatedTable.keepOrder
                        };

                        res.status(200).json({ status: true, msg: 'Table updated successfully', response: filteredTable });
                    }
                    else {
                        res.status(400).json({ status: false, msg: 'Table not Found', response: null });
                    }


                }



            }

        });
    } else {
        res.status(200).json({
            status: false,
            msg: "Your Subscription Expire Please Contect Admin",
            response: null
        });
    }
}

exports.deleteTable = async (req, res, next) => {
    const isValidToken = await UserServices.checkToken(req.token);
    if (isValidToken) {
        jwt.verify(req.token, secretKey, async (error, authData) => {
            if (error) {
                if (error.message === "jwt expired") {
                    res.status(200).json({
                        status: false,
                        msg: "Your Subscription Expire Please Contect Admin",
                        response: null
                    });
                } else {
                    res.json({
                        status: false,
                        msg: "Token Invalid"
                    });
                }
            } else {
                const keyValue = authData._id;
                const { tableId } = req.body;

                try {

                    const deletedTable = await UserAddTable.findOneAndDelete({ tableId: tableId, keyValue: keyValue });

                    if (deletedTable) {
                        res.status(200).json({ status: true, msg: "Table deleted successfully", response: null });
                    } else {
                        res.status(404).json({ status: false, msg: "Table not found", response: null });
                    }
                } catch (error) {
                    res.status(500).json({ status: false, msg: "Internal Server Error" });
                }
            }
        });
    } else {
        res.status(200).json({
            status: false,
            msg: "Your Subscription Expire Please Contect Admin",
            response: null
        });
    }
};

exports.addMenu = async (req, res, next) => {
    const isValidToken = await UserServices.checkToken(req.token);
    if (isValidToken) {
        try {
            jwt.verify(req.token, secretKey, async (error, authData) => {
                if (error) {

                    if (error.message === "jwt expired") {
                        res.status(200).json({
                            status: false,
                            msg: "Your Subscription Expire Please Contect Admin",
                            response: null
                        });
                    } else {
                        res.json({
                            status: false,
                            msg: "Token Invalid"
                        });
                    }

                } else {

                    try {

                        const keyValue = await authData._id;
                        const menu = new Menu(req.body);
                        const list = await Menu.find({ keyValue: `${keyValue}`, categoriesType: menu.categoriesType });
                        if (list.length !== 0) {
                            res.json({ status: false, msg: "This Menu is already Exist", response: null });
                        } else {
                            const successRes = await UserServices.addMenu(`${keyValue}`, menu);
                            // const menuList = {
                            //     id:menu._id,
                            //     categoriesType: menu.categoriesType,
                            //     item: menu.item,
                            //     price: menu.price,
                            //     qty: menu.qty
                            // };
                            res.json({ status: true, msg: "Menu is created", response: null });

                        }


                    } catch (err) {
                        res.status(400).json({ message: err.message });
                    }
                }

            });

        } catch (error) {

        }
    } else {
        res.status(200).json({
            status: false,
            msg: "Your Subscription Expire Please Contect Admin",
            response: null
        });
    }


}
exports.getMenu = async (req, res, next) => {
    const isValidToken = await UserServices.checkToken(req.token);
    if (isValidToken) {
        try {
            jwt.verify(req.token, secretKey, async (error, authData) => {
                if (error) {

                    if (error.message === "jwt expired") {
                        res.status(200).json({
                            status: false,
                            msg: "Your Subscription Expire Please Contect Admin",
                            response: null
                        });
                    } else {
                        res.json({
                            status: false,
                            msg: "Token Invalid"
                        });
                    }

                } else {

                    try {

                        const keyValue = await authData._id;
                        const branchUser = await AdminBranchesModel.findOne({ 'branches._id': keyValue });
                        let list;
                        if (branchUser !== null) {
                            list = await Menu.find({ keyValue: `${branchUser.keyValue}` });
                        } else {
                            list = await Menu.find({ keyValue: `${keyValue}` });
                        }

                        if (list.length === 0) {
                            res.json({ status: false, msg: "Menu List Not Found", response: null });
                        } else {
                            const menuList = list.map(menu => ({
                                id: menu._id,
                                categoriesType: menu.categoriesType,
                                item: menu.item.map(items => ({
                                    itemName: items.itemName,
                                    extraNote: items.extraNote
                                })),
                                price: menu.price,
                                qty: menu.qty,

                            }));

                            res.json({ status: true, msg: "Menu Retrieve Successful", response: { menuList } });
                        }



                    } catch (err) {
                        res.status(400).json({ message: err.message });
                    }
                }

            });

        } catch (error) {

        }
    } else {
        res.status(200).json({
            status: false,
            msg: "Your Subscription Expire Please Contect Admin",
            response: null
        });
    }


}
exports.updateCategory = async (req, res, next) => {
    const isValidToken = await UserServices.checkToken(req.token);
    if (isValidToken) {
        try {
            jwt.verify(req.token, secretKey, async (error, authData) => {
                if (error) {

                    if (error.message === "jwt expired") {
                        res.status(200).json({
                            status: false,
                            msg: "Your Subscription Expire Please Contect Admin",
                            response: null
                        });
                    } else {
                        res.json({
                            status: false,
                            msg: "Token Invalid"
                        });
                    }

                } else {

                    try {

                        const keyValue = await authData._id;
                        const data = req.body;
                        const { id, categoriesType, item, price, qty, extraNote } = req.body;
                        const list = await Menu.findOne({ keyValue: `${keyValue}`, _id: data.id });
                        if (list === null) {
                            res.json({ status: false, msg: "Menu List Not Found", response: null });
                        } else {
                            if (data.categoriesType !== undefined) {
                                list.categoriesType = categoriesType;
                            } else {
                                list.categoriesType = list.categoriesType;
                            }
                            if (data.item !== undefined) {
                                list.item = item;

                            } else {
                                list.item = list.item;
                            }
                            if (data.price !== undefined) {
                                list.price = price;
                            } else {
                                list.price = list.price;
                            }
                            if (data.qty !== undefined) {
                                list.qty = qty;
                            } else {
                                list.qty = list.qty;
                            }
                            if (data.extraNote !== undefined) {
                                list.extraNote = extraNote;
                            } else {
                                list.extraNote = list.extraNote;
                            }
                            const newList = await list.save();
                            const menuList = {
                                id: newList._id,
                                categoriesType: newList.categoriesType,
                                item: newList.item,
                                price: newList.price,
                                qty: newList.qty,
                            };
                            res.json({ status: true, msg: "Menu Update Successful", response: null });
                        }



                    } catch (err) {
                        res.status(400).json({ message: err.message });
                    }
                }

            });

        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    } else {
        res.status(200).json({
            status: false,
            msg: "Your Subscription Expire Please Contect Admin",
            response: null
        });
    }


}
exports.deleteMenu = async (req, res, next) => {
    const isValidToken = await UserServices.checkToken(req.token);
    if (isValidToken) {
        jwt.verify(req.token, secretKey, async (error, authData) => {
            if (error) {
                res.json({
                    status: false,
                    msg: "Token Invalid"
                });
            } else {
                const keyValue = authData._id;
                const { id } = req.body;

                try {

                    const deletedMenu = await Menu.findOneAndDelete({ keyValue: keyValue, _id: id });

                    if (deletedMenu) {
                        res.status(200).json({ status: true, msg: "Menu deleted successfully", response: null });
                    } else {
                        res.status(404).json({ status: false, msg: "Menu not found", response: null });
                    }
                } catch (error) {
                    res.status(500).json({ status: false, msg: "Internal Server Error" });
                }
            }
        });
    } else {
        res.status(200).json({
            status: false,
            msg: "Your Subscription Expire Please Contect Admin",
            response: null
        });
    }
};

exports.addInvoice = async (req, res, next) => {
    const isValidToken = await UserServices.checkToken(req.token);
    if (isValidToken) {
        jwt.verify(req.token, secretKey, async (error, authData) => {
            if (error) {
                if (error.message === "jwt expired") {
                    res.status(200).json({
                        status: false,
                        msg: "Your Subscription Expire Please Contect Admin",
                        response: null
                    });
                } else {
                    res.json({
                        status: false,
                        msg: "Token Invalid"
                    });
                }
            } else {
                const baseUrl = req.headers.host;
                const keyValue = authData._id;
                const currentDate = new Date();
                const day = String(currentDate.getDate()).padStart(2, '0');
                const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                const year = currentDate.getFullYear();
                const formattedDate = `${month}/${day}/${year}`;
                const { tableId, customerName, customerMobile, tableMember, payModeCash, items, note, price, qty, subTotal, gst, total } = req.body;
                const date = `${currentDate.getDate()}/${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`;
                const table = [{
                    billNumber: "ABC123",
                    tableId: tableId,
                    customerName: customerName,
                    customerMobile: customerMobile,
                    tableMember: tableMember,
                    items: items,
                    payModeCash: payModeCash,
                    note: note,
                    price: price,
                    qty: qty,
                    subTotal: subTotal,
                    gst: gst,
                    total: total
                }
                ];

                let existingInvoice = await Invoice.findOne({ keyValue: keyValue, date: formattedDate });

                if (existingInvoice) {

                    const abc = await existingInvoice.addItemsToInvoice(table);
                    const responseTable = existingInvoice.table.map(({ billNumber, tableId, customerName, customerMobile, tableMember, items, payModeCash, note, price, qty, subTotal, gst, total }) => ({
                        billNumber,
                        tableId,
                        customerName,
                        customerMobile,
                        tableMember,
                        items,
                        payModeCash,
                        note,
                        price,
                        qty,
                        subTotal,
                        gst,
                        total
                    }));
                    const responseInvoice = {
                        no: existingInvoice.no,
                        date: existingInvoice.date,
                        table: responseTable

                    };


                    const index = abc.length;
                    const userForLogo = await AdminBranchesModel.findOne({ 'branches._id': keyValue });
                    const savedProfile = await Profile.findOne({ keyValue: `${userForLogo.keyValue}` });
                    const logoPath = `http://${baseUrl}/profileLogo/${savedProfile.imageName}`;
                    const shopName = `${savedProfile.shopName}`;
                    const address = `${savedProfile.street},${savedProfile.city},${savedProfile.state},${savedProfile.pinCode}`;
                    const gstNumber = `${savedProfile.gstNumber}`;



                    const forPdfInvoice = {
                        logoPath: logoPath,
                        shopName: shopName,
                        address: address,
                        id: existingInvoice.id,
                        no: existingInvoice.no,
                        gstNumber: gstNumber,
                        date: moment(existingInvoice.date, 'MM/DD/YYYY').format('DD/MM/YYYY'),
                        table: abc[(index - 1)]
                    }

                    const invoicePdf = await UserServices.customerInvoice(keyValue, forPdfInvoice, req.headers.host);
                    // const invoicePdf = await UserServices.craetePDF(keyValue, forPdfInvoice, req.headers.host);
                    const deletedOrder = await KeepOrder.findOneAndDelete({ keyValue: keyValue, tableId: tableId });
                   

                    res.status(200).json({ status: true, msg: "New table added to existing invoice", response: { invoicePdf } });
                } else {
                    try {

                        const latestInvoice = await Invoice.findOne().sort({ no: -1 });
                        let no = "01";
                        if (latestInvoice) {
                            const latestNo = parseInt(latestInvoice.no);
                            no = (latestNo + 1).toString().padStart(2, '0');
                        }


                        const newInvoice = new Invoice({
                            keyValue: keyValue,
                            no: no,
                            date: formattedDate,
                            table: table
                        });

                        const savedInvoice = await newInvoice.save();
                        const responseTable = savedInvoice.table.map(({ billNumber, tableId, customerName, customerMobile, tableMember, items, payModeCash, note, price, qty, subTotal, gst, total }) => ({
                            billNumber,
                            tableId,
                            customerName,
                            customerMobile,
                            tableMember,
                            items,
                            payModeCash,
                            note,
                            price,
                            qty,
                            subTotal,
                            gst,
                            total
                        }));

                        const responseInvoice = {
                            no: savedInvoice.no,
                            date: savedInvoice.date,
                            table: responseTable

                        };
                        const index = table.length;
                        const userForLogo = await AdminBranchesModel.findOne({ 'branches._id': keyValue });
                        const savedProfile = await Profile.findOne({ keyValue: `${userForLogo.keyValue}` });
                        const logoPath = `http://${baseUrl}/profileLogo/${savedProfile.imageName}`;
                        const shopName = `${savedProfile.shopName}`;
                        const address = `${savedProfile.street},${savedProfile.city},${savedProfile.state},${savedProfile.pinCode}`;
                        const gstNumber = `${savedProfile.gstNumber}`;


                        const forPdfInvoice = {
                            logoPath: logoPath,
                            shopName: shopName,
                            address: address,
                            id: responseInvoice.id,
                            no: responseInvoice.no,
                            gstNumber: gstNumber,
                            date: moment(responseInvoice.date, 'MM/DD/YYYY').format('DD/MM/YYYY'),
                            table: responseTable[0]
                        }
                        const invoicePdf = await UserServices.customerInvoice(keyValue, forPdfInvoice, req.headers.host);
                        // const invoicePdf = await UserServices.craetePDF(keyValue, forPdfInvoice, req.headers.host);
                        const deletedOrder = await KeepOrder.findOneAndDelete({ keyValue: keyValue, tableId: tableId });
                      
                        res.status(200).json({ status: true, msg: "Invoice added", response: { invoicePdf } });
                    } catch (error) {
                        res.status(500).json({ status: false, msg: "Internal server error" });
                    }
                }


            }
        });
    } else {
        res.status(200).json({
            status: false,
            msg: "Your Subscription Expire Please Contect Admin",
            response: null
        });
    }
};

exports.getInvoice = async (req, res, next) => {
    const isValidToken = await UserServices.checkToken(req.token);
    if (isValidToken) {
        jwt.verify(req.token, secretKey, async (error, authData) => {
            if (error) {
                if (error.message === "jwt expired") {
                    res.status(200).json({
                        status: false,
                        msg: "Your Subscription Expire Please Contect Admin",
                        response: null
                    });
                } else {
                    res.json({
                        status: false,
                        msg: "Token Invalid"
                    });
                }


            } else {
                const baseUrl = req.headers.host;
                const keyValue = authData._id;
                const { branchName, startDate, endDate, tableId } = req.body;


                const startDateParts = startDate.split('/');
                const formattedStartDate = `${startDateParts[1]}/${startDateParts[0]}/${startDateParts[2]}`;

                const endDateParts = endDate.split('/');
                const formattedEndDate = `${endDateParts[1]}/${endDateParts[0]}/${endDateParts[2]}`;

                // const formattedStartDate = new Date(startDate);
                // const formattedEndDate = new Date(endDate);
                // formattedEndDate.setDate(formattedEndDate.getDate() + 1);
                let existingInvoices;
                const branchUser = await AdminBranchesModel.findOne({ keyValue: keyValue, 'branches.branchName': branchName });
                let branchKeyValue;
                let branches;
                let keyForLogo
                if (branchUser !== null) {
                    branches = branchUser.branches;
                    for (const value of branches) {
                        if (value.branchName === branchName) {
                            branchKeyValue = `${value._id}`;
                            keyForLogo = `${value.keyValue}`
                        }
                    }
                } else {
                    branchKeyValue = null;
                }
                if (tableId !== undefined) {
                    existingInvoices = await Invoice.find({
                        keyValue: branchKeyValue !== null ? branchKeyValue : keyValue,
                        date: { $gte: formattedStartDate, $lte: formattedEndDate }
                    });
                    const filteredInvoices = existingInvoices.map(invoice => ({
                        id: invoice.id,
                        date: moment(invoice.date, 'MM/DD/YYYY').format('DD/MM/YYYY'),
                        table: invoice.table.filter(item => item.tableId === tableId)
                    }));

                    const responseInvoices = filteredInvoices.filter(invoice => invoice.table.length > 0);

                    const userForLogo = await AdminBranchesModel.findOne({ 'branches._id': branchKeyValue !== null ? branchKeyValue : keyValue });
              
                    const savedProfile = await Profile.findOne({ keyValue: `${userForLogo.keyValue}` });
                    const logoPath = `http://${baseUrl}/profileLogo/${savedProfile.imageName}`;
                    const shopName = `${savedProfile.shopName}`;
                    const address = `${savedProfile.street},${savedProfile.city},${savedProfile.state},${savedProfile.pinCode}`;
                    const gstNumber = `${savedProfile.gstNumber}`;
                    const invoice = responseInvoices.map(invoice => ({
                        logoPath: logoPath,
                        shopName: shopName,
                        address: address,
                        startDate: startDate,
                        endDate: endDate,
                        gstNumber: gstNumber,
                        id: invoice.id,
                        no: invoice.no,
                        date: invoice.date,
                        table: invoice.table.map(({ billNumber, tableId, customerName, customerMobile, tableMember, items, payModeCash, note, price, qty, subTotal, gst, total }) => ({
                            billNumber,
                            tableId,
                            customerName,
                            customerMobile,
                            tableMember,
                            items,
                            payModeCash,
                            note,
                            price,
                            qty,
                            subTotal,
                            gst,
                            total
                        }))
                    }));

                    if (invoice.length > 0) {

                        const invoicePdf = await UserServices.htmlPdf(keyValue, invoice, req.headers.host, startDate, endDate);
                        // const invoicePdf = await UserServices.craetePDFforGetInvoice(keyValue, invoice, req.headers.host, startDate, endDate);

                        // const pdfPath = path.join(__dirname, '..', 'documents', '01.pdf');
                        //  const pdf = await this.getPdf(invoicePdf);
                        // const pdfUrl = `http://192.168.1.7:3000/pdf`;

                        res.status(200).json({ status: true, msg: "Invoices Retrieve Successful", response: { invoicePdf } });
                    } else {
                        res.status(200).json({ status: false, msg: "Invoices not Found in this Date Range", response: null });
                    }

                } else {
                    existingInvoices = await Invoice.find({
                        keyValue: branchKeyValue !== null ? branchKeyValue : keyValue,
                        date: { $gte: formattedStartDate, $lte: formattedEndDate }
                    });
                    const userForLogo = await AdminBranchesModel.findOne({ 'branches._id': branchKeyValue !== null ? branchKeyValue : keyValue });
              
                    const savedProfile = await Profile.findOne({ keyValue: `${userForLogo.keyValue}` });
                    const logoPath = `http://${baseUrl}/profileLogo/${savedProfile.imageName}`;
                    const shopName = `${savedProfile.shopName}`;
                    const address = `${savedProfile.street},${savedProfile.city},${savedProfile.state},${savedProfile.pinCode}`;
                    const gstNumber = `${savedProfile.gstNumber}`;
                    if (existingInvoices.length > 0) {

                        const invoice = existingInvoices.map(invoice => ({

                            logoPath: logoPath,
                            shopName: shopName,
                            address: address,
                            startDate: startDate,
                            endDate: endDate,
                            gstNumber: gstNumber,
                            id: invoice.id,
                            no: invoice.no,
                            date: moment(invoice.date, 'MM/DD/YYYY').format('DD/MM/YYYY'),
                            table: invoice.table.map(({ tableId, customerName, customerMobile, tableMember, items, payModeCash, note, price, qty, subTotal, gst, total }) => ({
                                tableId,
                                customerName,
                                customerMobile,
                                tableMember,
                                items,
                                payModeCash,
                                note,
                                price,
                                qty,
                                subTotal,
                                gst,
                                total
                            }))
                        }));
                        const invoicePdf = await UserServices.htmlPdf(keyValue, invoice, req.headers.host, startDate, endDate);
                        // const invoicePdf = await UserServices.craetePDFforGetInvoice(keyValue, invoice, req.headers.host, startDate, endDate);

                        res.status(200).json({ status: true, msg: "Invoices Retrieve Successful for this Date Range", response: { invoicePdf } });

                    } else {
                        res.status(200).json({
                            status: false,
                            msg: "Invoice Not FOund for this Date Range",
                            response: null
                        });
                    }
                }
            }
        });
    } else {
        res.status(200).json({
            status: false,
            msg: "Token Invalid",
            response: null
        });
    }
};
exports.getPdf = async (invoicePdf, req, res, next) => {
    const documentsFolderPath = path.join(__dirname, '..', 'documents');
    const pdfPath = path.join(__dirname, '..', 'documents', '01.pdf');
    res.sendFile(invoicePdf);

};
exports.keepOrder = async (req, res, next) => {
    const isValidToken = await UserServices.checkToken(req.token);
    if (isValidToken) {
        jwt.verify(req.token, secretKey, async (error, authData) => {
            if (error) {
                if (error.message === "jwt expired") {
                    res.status(200).json({
                        status: false,
                        msg: "Your Subscription Expire Please Contect Admin",
                        response: null
                    });
                } else {
                    res.json({
                        status: false,
                        msg: "Token Invalid"
                    });
                }
            } else {
                const keyValue = authData._id;

                const { tableId, menuList } = req.body;
                const newMenuList = {
                    keyValue: keyValue,
                    tableId: tableId,
                    menuList: menuList
                };
                let existingOrder = await KeepOrder.findOne({ keyValue: keyValue, tableId: tableId });

                try {
                    if (existingOrder) {
                        existingOrder.keyValue = newMenuList.keyValue,
                            existingOrder.tableId = newMenuList.tableId,
                            existingOrder.menuList = newMenuList.menuList

                        const saveOrder = await existingOrder.save();
                        res.status(200).json({ status: true, msg: "Update your Order", response: null });
                    }
                    else {
                        const newOrder = await UserServices.keepOder(keyValue, tableId, menuList);
                        res.status(200).json({ status: true, msg: "save your Order", response: null });
                    }
                } catch (error) {
                    res.status(400).json({ message: error.message });
                }


            }
        });
    } else {
        res.status(200).json({
            status: false,
            msg: "Your Subscription Expire Please Contect Admin",
            response: null
        });
    }
};
exports.getKeepOrder = async (req, res, next) => {
    const isValidToken = await UserServices.checkToken(req.token);
    if (isValidToken) {
        jwt.verify(req.token, secretKey, async (error, authData) => {
            if (error) {
                if (error.message === "jwt expired") {
                    res.status(200).json({
                        status: false,
                        msg: "Your Subscription Expire Please Contect Admin",
                        response: null
                    });
                } else {
                    res.json({
                        status: false,
                        msg: "Token Invalid"
                    });
                }
            } else {
                const keyValue = authData._id;
                const { tableId } = req.body;
                const responseTable = await KeepOrder.find({ keyValue: keyValue, tableId: tableId });
                let menuList;
                let getOrder;
                if (responseTable.length > 0) {

                    for (const value of responseTable) {
                        getOrder = value.menuList;
                    }
                    menuList = getOrder.map(value => {
                        return {
                            id: value._id,
                            categoriesType: value.categoriesType,
                            item: value.item.map(items => ({
                                itemName: items.itemName,
                                extraNote: items.extraNote
                            })),
                            price: value.price,
                            qty: value.qty,
                        };
                    });
                    res.status(200).json({ status: true, msg: "Menu get successful", response: { menuList } });
                } else {
                    res.status(200).json({ status: false, msg: "not found", response: null });
                }


            }
        });
    } else {
        res.status(200).json({
            status: false,
            msg: "Your Subscription Expire Please Contect Admin",
            response: null
        });
    }
};
exports.profileUpdate = async (req, res, next) => {
    try {
        const isValidToken = await UserServices.checkToken(req.token);
        if (isValidToken) {
            jwt.verify(req.token, secretKey, async (error, authData) => {
                if (error) {
                    if (error.message === "jwt expired") {
                        res.status(200).json({
                            status: false,
                            msg: "Your Subscription Expire Please Contect Admin",
                            response: null
                        });
                    } else {
                        res.json({
                            status: false,
                            msg: "Token Invalid"
                        });
                    }
                } else {
                    const keyValue = authData._id;
                    const savedProfile = await Profile.findOne({ keyValue: keyValue });
                    if (savedProfile) {

                        const currentDate = new Date();
                        const year = currentDate.getFullYear();
                        const month = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // Month is zero-based, so add 1
                        const day = currentDate.getDate().toString().padStart(2, '0');
                        const hours = currentDate.getHours().toString().padStart(2, '0');
                        const minutes = currentDate.getMinutes().toString().padStart(2, '0');
                        const seconds = currentDate.getSeconds().toString().padStart(2, '0');

                        // Construct the date and time strings
                        const currentDateStr = `${day}${month}${year}`;
                        const currentTimeStr = `${hours}${minutes}${seconds}`;
                        const invoiceDateandTime = `${currentDateStr}${currentTimeStr}`;

                        const { profileLogo, shopName, gstNumber, street, city, state, pinCode } = req.body;
                        const baseUrl = req.headers.host;
                        let imageUrl = '';
                        let imageFolderPath;
                        let base64Image;
                        const getAdminUser = await AdminUserModel.find({ keyValue: keyValue });
                        if (getAdminUser) {


                            if (profileLogo !== undefined) {
                                let imageBase64 = profileLogo;
                                base64Image = imageBase64.replace(/^data:image\/\w+;base64,/, '');
                                const imageName = `${invoiceDateandTime}` + '.png';
                                imageFolderPath = path.join(__dirname, '..', 'profileLogo');
                                savedProfile.imageFolderPath = imageFolderPath;

                            } else {
                                savedProfile.imageFolderPath = savedProfile.imageFolderPath;
                            }
                            if (shopName !== undefined) {
                                savedProfile.shopName = shopName;
                            } else {
                                savedProfile.shopName = savedProfile.shopName;
                            }
                            if (gstNumber !== undefined) {
                                savedProfile.gstNumber = gstNumber;
                            } else {
                                savedProfile.gstNumber = savedProfile.gstNumber;
                            }
                            if (street !== undefined) {
                                savedProfile.street = street;
                            } else {
                                savedProfile.street = savedProfile.street;
                            }
                            if (city !== undefined) {
                                savedProfile.city = city;
                            } else {
                                savedProfile.city = savedProfile.city;
                            }
                            if (state !== undefined) {
                                savedProfile.state = state;
                            } else {
                                savedProfile.state = savedProfile.state;
                            }
                            if (pinCode !== undefined) {
                                savedProfile.pinCode = pinCode;
                            } else {
                                savedProfile.pinCode = savedProfile.pinCode;
                            }

                            const updatedProfile = await savedProfile.save();
                            if (!fs.existsSync(imageFolderPath)) {
                                fs.mkdirSync(imageFolderPath);
                            }
                            const imagePath = path.join(`${updatedProfile.imageFolderPath}`, `${updatedProfile.imageName}`);
                            const buffer = Buffer.from(base64Image, 'base64');

                            fs.writeFile(imagePath, buffer, (err) => {

                                if (err) {
                                    res.status(500).json('Error uploading image');
                                } else {
                                    // Construct the URL for the image

                                    imageUrl = `http://${baseUrl}/profileLogo/${updatedProfile.imageName}`;

                                    const profile = {
                                        shopName: updatedProfile.shopName,
                                        profileLogo: imageUrl,
                                        gstNumber: updatedProfile.gstNumber,
                                        street: updatedProfile.street,
                                        city: updatedProfile.city,
                                        state: updatedProfile.state,
                                        pinCode: updatedProfile.pinCode

                                    };
                                    res.status(200).json({
                                        status: true, msg: "Your Profile Update Successfuly", response: { profile }
                                    });
                                    // resolve(imageUrl);
                                }
                            });

                        } else {
                            res.json({
                                status: false,
                                msg: "User Not Found",
                                response: null
                            });
                        }
                    } else {
                        const currentDate = new Date();
                        const year = currentDate.getFullYear();
                        const month = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // Month is zero-based, so add 1
                        const day = currentDate.getDate().toString().padStart(2, '0');
                        const hours = currentDate.getHours().toString().padStart(2, '0');
                        const minutes = currentDate.getMinutes().toString().padStart(2, '0');
                        const seconds = currentDate.getSeconds().toString().padStart(2, '0');

                        // Construct the date and time strings
                        const currentDateStr = `${day}${month}${year}`;
                        const currentTimeStr = `${hours}${minutes}${seconds}`;
                        const invoiceDateandTime = `${currentDateStr}${currentTimeStr}`;

                        const { profileLogo, shopName, gstNumber, street, city, state, pinCode } = req.body;


                        const baseUrl = req.headers.host;
                        let imageUrl = '';
                        const getAdminUser = await AdminUserModel.find({ keyValue: keyValue });
                        if (getAdminUser) {
                            let imageBase64 = await profileLogo;
                            const base64Image = imageBase64.replace(/^data:image\/\w+;base64,/, '');
                            const imageName = `${invoiceDateandTime}` + '.png';
                            const imageFolderPath = path.join(__dirname, '..', 'profileLogo');
                            const updatedProfile = await UserServices.profileUpdate(keyValue, imageFolderPath, imageName, shopName, gstNumber, street, city, state, pinCode);
                            if (!fs.existsSync(imageFolderPath)) {
                                fs.mkdirSync(imageFolderPath);
                            }
                            const imagePath = path.join(`${updatedProfile.imageFolderPath}`, `${updatedProfile.imageName}`);
                            const buffer = Buffer.from(base64Image, 'base64');

                            fs.writeFile(imagePath, buffer, (err) => {

                                if (err) {
                                    res.status(500).json('Error uploading image');
                                } else {
                                    // Construct the URL for the image

                                    imageUrl = `http://${baseUrl}/profileLogo/${updatedProfile.imageName}`;

                                    const profile = {
                                        shopName: updatedProfile.shopName,
                                        profileLogo: imageUrl,
                                        gstNumber: updatedProfile.gstNumber,
                                        street: updatedProfile.street,
                                        city: updatedProfile.city,
                                        state: updatedProfile.state,
                                        pinCode: updatedProfile.pinCode

                                    };
                                    res.status(200).json({
                                        status: true, msg: "Your Profile Update Successfuly", response: { profile }
                                    });
                                    // resolve(imageUrl);
                                }
                            });

                        } else {
                            res.json({
                                status: false,
                                msg: "User Not Found",
                                response: null
                            });
                        }

                    }

                }
            });
        } else {
            res.status(200).json({
                status: false,
                msg: "Your Subscription Expire Please Contect Admin",
                response: null
            });
        }
    } catch (error) {
        res.status(200).json({
            status: false,
            msg: error,
            response: null
        });
    }

};

exports.getProfile = async (req, res, next) => {
    try {
        const isValidToken = await UserServices.checkToken(req.token);
        if (isValidToken) {
            jwt.verify(req.token, secretKey, async (error, authData) => {
                if (error) {
                    if (error.message === "jwt expired") {
                        res.status(200).json({
                            status: false,
                            msg: "Your Subscription Expire Please Contect Admin",
                            response: null
                        });
                    } else {
                        res.json({
                            status: false,
                            msg: "Token Invalid"
                        });
                    }
                } else {
                    const keyValue = authData._id;
                    const baseUrl = req.headers.host;
                    let imageUrl = '';
                    const savedProfile = await Profile.findOne({ keyValue: keyValue });
                    if (savedProfile) {
                        const imagePath = path.join(`${savedProfile.imageFolderPath}`, `${savedProfile.imageName}`);
                        imageUrl = `http://${baseUrl}/profileLogo/${savedProfile.imageName}`;
                        const profile = {
                            shopName: savedProfile.shopName,
                            profileLogo: imageUrl,
                            gstNumber: savedProfile.gstNumber,
                            street: savedProfile.street,
                            city: savedProfile.city,
                            state: savedProfile.state,
                            pinCode: savedProfile.pinCode

                        };
                        res.status(200).json({
                            status: true, msg: "Your Profile Retrieve Successful", response: { profile }
                        });
                    } else {
                        res.status(200).json({
                            status: false, msg: "Profile Not Found Please update Your Profile", response: null
                        });
                    }

                }
            });
        } else {
            res.status(200).json({
                status: false,
                msg: "Your Subscription Expire Please Contect Admin",
                response: null
            });
        }
    } catch (error) {
        res.status(200).json({
            status: false,
            msg: error,
            response: null
        });
    }

};