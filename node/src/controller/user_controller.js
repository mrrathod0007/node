const UserServices = require("../services/user_services");
const { UserModel, UserAddTable, Login, Menu, Invoice, KeepOrder,AddPdf } = require("../model/user_model");
const jwt = require("jsonwebtoken");
const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const { table } = require("console");
const secretKey = "secretKey";
const path = require('path');
const hbs = require("hbs")


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

exports.login = async (req, res, next) => {
    try {
        const { mobileOrPassword, password } = req.body;
        console.log("=====log======", req.body);

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

                res.json({
                    status: false,
                    msg: "Token Invalid"
                });

            } else {
                const keyValue = await authData._id;
                const name = "";
                const mobile = "";
                const member = "";
                const isOccupied = false;
                const keepOrder = false;
                const { tableId } = await req.body;
                if (keyValue !== null) {
                    console.log('======body======', req.body.tableId);

                    let table = await UserServices.tableCheck(keyValue);
                    console.log('jlasjd', table);
                    if (table === null) {
                        console.log('======table======', table);
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
                            console.log('======isMatch true======', isMatch);
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
                                console.log('======isMatch not======', !isMatch);
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

                    res.json({
                        status: false,
                        msg: "Token Invalid"
                    });

                } else {
                    const keyValue = await authData._id;
                    const { tableId } = await req.body;
                    if (keyValue !== null) {
                        // console.log('======body======', keyValue);
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
            console.log('===user===', user);
            if (!user) {
                return res.status(404).json({ status: false, msg: "'User not found'", response: null });
            } else {
                let tokenData = { _id: user._id, mobile: user.mobile };
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
                    const user = await UserModel.findOne({ _id: authData._id });
                    console.log('===user===', user);
                    if (!user) {
                        return res.status(400).json({ error: 'Invalid or expired token' });
                    }
                    user.password = newPassword;
                    await user.save();
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

                res.json({
                    status: false,
                    msg: "Token Invalid"
                });

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
                res.json({
                    status: false,
                    msg: "Token Invalid"
                });
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
                    console.error(error);
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

                    res.json({
                        status: false,
                        msg: "Token Invalid"
                    });

                } else {

                    try {

                        const keyValue = await authData._id;
                        const menu = new Menu(req.body);
                        const list = await Menu.find({ keyValue: `${keyValue}`, categoriesType: menu.categoriesType });
                        console.log("=====list====", menu.categoriesType.toLowerCase);
                        if (list.length !== 0) {
                            res.json({ status: false, msg: "This Menu is already Exist", response: null });
                        } else {
                            const successRes = await UserServices.addMenu(`${keyValue}`, menu);
                            console.log("=====menu====", successRes);
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

                    res.json({
                        status: false,
                        msg: "Token Invalid"
                    });

                } else {

                    try {

                        const keyValue = await authData._id;
                        const list = await Menu.find({ keyValue: `${keyValue}` });

                        if (list.length === 0) {
                            res.json({ status: false, msg: "Menu List Not Found", response: null });
                        } else {
                            const menuList = list.map(menu => ({
                                id: menu._id,
                                categoriesType: menu.categoriesType,
                                item: menu.item,
                                price: menu.price,
                                qty: menu.qty
                            }));
                            // const tableId = menu.id;
                            // const successRes = await UserServices.addMenu(`${keyValue}`, menu);
                            // const newMenu = await Menu.findOne({ keyValue: keyValue });
                            // console.log("=====menuList====", list);
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

                    res.json({
                        status: false,
                        msg: "Token Invalid"
                    });

                } else {

                    try {

                        const keyValue = await authData._id;
                        const data = req.body;
                        const { id, categoriesType, item, price, qty } = req.body;
                        const list = await Menu.findOne({ keyValue: `${keyValue}`, _id: data.id });
                        console.log("=====menuList====", data.item);
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
                            const newList = await list.save();
                            const menuList = {
                                id: newList._id,
                                categoriesType: newList.categoriesType,
                                item: newList.item,
                                price: newList.price,
                                qty: newList.qty
                            };
                            console.log("=====menuList====", menuList);
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
                    console.error(error);
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
                res.json({
                    status: false,
                    msg: "Token Invalid"
                });
            } else {
                const keyValue = authData._id;
                const currentDate = new Date();
                const day = String(currentDate.getDate()).padStart(2, '0');
                const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                const year = currentDate.getFullYear();
                const formattedDate = `${day}/${month}/${year}`;
                const { tableId, customerName, customerMobile, tableMember, items, price, qty, subTotal, gst, total } = req.body;
                const date = `${currentDate.getDate()}/${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`;
                const table = [{
                    billNumber: "ABC123",
                    tableId: tableId,
                    customerName: customerName,
                    customerMobile: customerMobile,
                    tableMember: tableMember,
                    items: items,
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
                    const responseTable = existingInvoice.table.map(({ billNumber, tableId, customerName, customerMobile, tableMember, items, price, qty, subTotal, gst, total }) => ({
                        billNumber,
                        tableId,
                        customerName,
                        customerMobile,
                        tableMember,
                        items,
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
                    // console.log('===abc===',abc[(index-1)]);
                    const forPdfInvoice = {
                        no: existingInvoice.no,
                        date: existingInvoice.date,
                        table: abc[(index-1)]
                    }
                    // const invoicePdf = await UserServices.craetePDF(keyValue,forPdfInvoice,req.headers.host);
                    const deletedOrder = await KeepOrder.findOneAndDelete({ keyValue: keyValue, tableId: tableId });
                    // console.log('===invoicePdf===',invoicePdf);
                    if (deletedOrder) {
                        console.log("==tableOrder Deleted==");
                    } else {
                        console.log("==tableOrder not found==");
                    }
                   
                    res.status(200).json({ status: true, msg: "New table added to existing invoice", response: responseInvoice });
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
                        const responseTable = savedInvoice.table.map(({ billNumber, tableId, customerName, customerMobile, tableMember, items, price, qty, subTotal, gst, total }) => ({
                            billNumber,
                            tableId,
                            customerName,
                            customerMobile,
                            tableMember,
                            items,
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
                        // const invoicePdf = await UserServices.craetePDF(responseInvoice);
                        const deletedOrder = await KeepOrder.findOneAndDelete({ keyValue: keyValue, tableId: tableId });
                        if (deletedOrder) {
                            console.log("==tableOrder Deleted==");
                        } else {
                            console.log("==tableOrder not found==");
                        }
                        res.status(200).json({ status: true, msg: "Invoice added", response: responseInvoice });
                    } catch (error) {
                        console.error("Error adding invoice:", error);
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
                res.json({
                    status: false,
                    msg: "Token Invalid"
                });
            } else {
                const keyValue = authData._id;
                const { startDate, endDate, tableId } = req.body;
                console.log("==keyValue==", startDate, endDate);
                console.log("==startDate==", startDate, endDate); // Assuming startDate and endDate are provided

                const formattedStartDate = new Date(startDate);
                const formattedEndDate = new Date(endDate);
                formattedEndDate.setDate(formattedEndDate.getDate() + 1);

                console.log("==tableId==", tableId);
                let existingInvoices;
                if (tableId !== undefined) {
                    existingInvoices = await Invoice.find({
                        keyValue: keyValue,
                        date: { $gte: startDate, $lte: endDate }
                    });
                    const filteredInvoices = existingInvoices.map(invoice => ({
                        id: invoice.id,
                        date: invoice.date,
                        table: invoice.table.filter(item => item.tableId === tableId)
                    }));

                    const responseInvoices = filteredInvoices.filter(invoice => invoice.table.length > 0);

                    const invoice = responseInvoices.map(invoice => ({
                        id: invoice.id,
                        date: invoice.date,
                        table: invoice.table.map(({ billNumber, tableId, customerName, customerMobile, tableMember, items, price, qty, subTotal, gst, total }) => ({
                            billNumber,
                            tableId,
                            customerName,
                            customerMobile,
                            tableMember,
                            items,
                            price,
                            qty,
                            subTotal,
                            gst,
                            total
                        }))
                    }));

                    if (invoice.length > 0) {
                        const date = invoice[0].date;
                        // const invoicePdf = await UserServices.craetePDF(invoice);

                        // console.log("pdf",invoicePdf);
                        const pdfPath = path.join(__dirname, '..', 'documents', '01.pdf');
                        //  const pdf = await this.getPdf(invoicePdf);
                        const pdfUrl = `http://192.168.1.7:3000/pdf`;

                        res.status(200).json({ status: true, msg: "Invoices Retrieve Successful", response: { invoice } });
                    } else {
                        res.status(200).json({ status: true, msg: "Invoices not Found in this Date Range", response: null });
                    }

                } else {
                    existingInvoices = await Invoice.find({
                        keyValue: keyValue,
                        date: { $gte: startDate, $lte: endDate }
                    });
                    console.log("==existingInvoices==", existingInvoices, keyValue);
                    const invoice = existingInvoices.map(invoice => ({
                        id: invoice.id,
                        date: invoice.date,
                        table: invoice.table.map(({ tableId, customerName, customerMobile, tableMember, items, price, qty, subTotal, gst, total }) => ({
                            tableId,
                            customerName,
                            customerMobile,
                            tableMember,
                            items,
                            price,
                            qty,
                            subTotal,
                            gst,
                            total
                        }))
                    }));
                    res.status(200).json({ status: true, msg: "Invoices Retrieve Successful for this Date Range", response: { invoice } });
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
exports.getPdf = async (invoicePdf,req, res, next) => {
    const documentsFolderPath = path.join(__dirname, '..', 'documents');
    console.log("==", documentsFolderPath)
    const pdfPath = path.join(__dirname, '..', 'documents', '01.pdf');
    console.log("==", pdfPath)
    res.sendFile(invoicePdf);

};
exports.keepOrder = async (req, res, next) => {
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
                res.json({
                    status: false,
                    msg: "Token Invalid"
                });
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
                            item: value.item,
                            price: value.price,
                            qty: value.qty
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