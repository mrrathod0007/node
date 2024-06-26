const { AdminUserModel, AdminBranchesModel, UserModel, UserAddTable, Login, Menu, Invoice, KeepOrder, AddPdf, Profile } = require("../model/user_model");
const PDFDocument = require('pdfkit');
const ejs = require('ejs');
const pdf = require('html-pdf');
// const pdf = require('pdf-creator-node');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const jwt = require("jsonwebtoken");
const handlebars = require('handlebars');
const { Console } = require("console");
const { type } = require("os");

class UserServices {
    static async adminRegister(userName, mobile, password) {
        try {
            if (!userName || !mobile || !password) {
                throw new Error('Mobile, password and branches are required.');
            }
            const isAdmin = true;
            const branch = 3;
            const newUser = await AdminUserModel.create({ userName, mobile, password, isAdmin, branch });
            return newUser;
        }
        catch (err) {
            throw err;
        }
    }
    static async adminBranches(keyValue, branches) {
        try {
            const newUser = await AdminBranchesModel.create({ keyValue, branches });
            return newUser;
        }
        catch (err) {
            throw err;
        }
    }
    static async registerUser(userName, mobile, password) {
        try {
            if (!userName || !mobile || !password) {
                throw new Error('Email and password are required.');
            }

            const newUser = await UserModel.create({ userName, mobile, password });
            return newUser;
        }
        catch (err) {
            throw err;
        }
    }
    static async checkAdminUser(mobileOrPassword) {
        try {
            // Search for a user by either userName or mobile number
            return await AdminUserModel.findOne({
                $or: [{ userName: mobileOrPassword }, { mobile: mobileOrPassword }]
            });
        } catch (error) {
            throw error;
        }
    }
    static async checkuser(mobileOrPassword) {
        try {
            // Search for a user by either userName or mobile number
            const adminUser = await AdminUserModel.findOne({
                $or: [{ userName: mobileOrPassword }, { mobile: mobileOrPassword }]
            });
            const branchUser = await AdminBranchesModel.findOne({
                $or: [{ 'branches.userId': mobileOrPassword }, { mobile: mobileOrPassword }]
            });
            if (adminUser) {
                return adminUser;
            } else {
                return branchUser;
            }

        } catch (error) {
            throw error;
        }
    }
    static async tableCheck(keyValue) {
        try {

            // Search for a user by either userName or mobile number
            return await UserAddTable.findOne({ keyValue: keyValue });
        } catch (error) {
            throw error;
        }
    }
    static async generateAdmintoken(tokenData, secretKey, jwt_expiry, id) {
        try {

            const user = await Login.findOne({ keyValue: id });

            if (user) {
                if (user.token) {
                    const isValidToken = await UserServices.checkToken(user.token);
                    if (isValidToken) {
                        let newToken;
                        let decodedToken;
                        jwt.verify(user.token, secretKey, async (error, authData) => {
                            if (error !== null && error.name === "TokenExpiredError") {
                                if (user.nextExpiry > 0) {
                                    const expiry = (user.nextExpiry) * (24 * 60 * 60);
                                    newToken = jwt.sign(tokenData, secretKey, { expiresIn: expiry });
                                    user.token = newToken;
                                    user.lastExpiry = user.nextExpiry;
                                    user.nextExpiry = 0;
                                    const newUser = await user.save();
                                    decodedToken = jwt.verify(newToken, secretKey);
                                    return newToken;
                                    //  newToken = newToken;
                                }

                            } else {
                                decodedToken = jwt.verify(user.token, secretKey);

                            }
                        });

                        // const decodedToken = jwt.verify(user.token, secretKey);
                        if (decodedToken !== undefined) {
                            const logintime = user.created;
                            const currentTime = Math.floor(Date.now() / 1000);
                            const remainingTime = decodedToken.exp - currentTime;
                            const remainingDays = Math.floor(remainingTime / (24 * 60 * 60));
                            const remainingHours = Math.floor((remainingTime % (24 * 60 * 60)) / (60 * 60));
                            const remainingMinutes = Math.floor((remainingTime % (60 * 60)) / 60);

                            console.log(`Token expires in: ${remainingDays} days, ${remainingHours} hours, and ${remainingMinutes} minutes.`);
                            if (decodedToken.exp > currentTime) {
                                return user.token;
                            } else {
                                if (user.nextExpiry > 0) {
                                    const expiry = (user.nextExpiry) * (24 * 60 * 60);
                                    newToken = jwt.sign(tokenData, secretKey, { expiresIn: expiry });
                                    user.token = newToken;
                                    user.lastExpiry = user.nextExpiry;
                                    user.nextExpiry = 0;
                                    const newUser = await user.save();
                                    return newToken;
                                } else {
                                    throw new Error("Session expired");
                                }

                            }
                        } else {
                            throw new Error("Session expired");
                        }

                    }
                }
            } else {
                return jwt.sign(tokenData, secretKey, { expiresIn: jwt_expiry });
            }

        } catch (error) {
            throw error;
        }

        // try {
        //     return jwt.sign(tokenData, secretKey, { expiresIn: jwt_expiry });
        // } catch (error) {
        //     throw error;

        // }
    }
    static async generatetoken(tokenData, secretKey, jwt_expiry, id) {
        try {
            const user = await Login.findOne({ keyValue: id });

            if (user) {
                if (user.token) {
                    const isValidToken = await UserServices.checkToken(user.token);
                    if (isValidToken) {
                        let newToken;
                        let decodedToken;
                        jwt.verify(user.token, secretKey, async (error, authData) => {
                            if (error !== null && error.name === "TokenExpiredError") {
                                if (user.nextExpiry > 0) {
                                    const expiry = (user.nextExpiry) * (24 * 60 * 60);
                                    newToken = jwt.sign(tokenData, secretKey, { expiresIn: expiry });
                                    user.token = newToken;
                                    user.lastExpiry = user.nextExpiry;
                                    user.nextExpiry = 0;
                                    const newUser = await user.save();
                                    return newToken;
                                    //  newToken = newToken;
                                }

                            } else {
                                decodedToken = jwt.verify(user.token, secretKey);

                            }
                        });

                        // const decodedToken = jwt.verify(user.token, secretKey);
                        const logintime = user.created;
                        const currentTime = Math.floor(Date.now() / 1000);
                        const remainingTime = decodedToken.exp - currentTime;
                        const remainingDays = Math.floor(remainingTime / (24 * 60 * 60));
                        const remainingHours = Math.floor((remainingTime % (24 * 60 * 60)) / (60 * 60));
                        const remainingMinutes = Math.floor((remainingTime % (60 * 60)) / 60);

                        console.log(`Token expires in: ${remainingDays} days, ${remainingHours} hours, and ${remainingMinutes} minutes.`);
                        if (decodedToken.exp > currentTime) {
                            return user.token;
                        } else {
                            if (user.nextExpiry > 0) {
                                const expiry = (user.nextExpiry) * (24 * 60 * 60);
                                newToken = jwt.sign(tokenData, secretKey, { expiresIn: expiry });
                                user.token = newToken;
                                user.lastExpiry = user.nextExpiry;
                                user.nextExpiry = 0;
                                const newUser = await user.save();
                                return newToken;
                            } else {
                                throw new Error("Session expired");
                            }

                        }
                    }
                }
            } else {
                return jwt.sign(tokenData, secretKey, { expiresIn: jwt_expiry });
            }
        } catch (error) {
            throw error;
        }

        // try {
        //     return jwt.sign(tokenData, secretKey, { expiresIn: jwt_expiry });
        // } catch (error) {
        //     throw error;

        // }
    }
    static async adminUpdateToken(keyValue, token, mobileOrPassword, password) {
        try {
            const adminUser = await AdminUserModel.findOne({ _id: keyValue });
            const branchUser = await AdminBranchesModel.findOne({ 'branches.userId': mobileOrPassword });
            if (!adminUser && !branchUser) {
                throw new Error("User not found");
            } else {
                const loginUser = await Login.findOne({ keyValue: keyValue });
                if (!loginUser) {
                    const lastExpiry = 5;
                    const nextExpiry = 0;
                    const newLogin = await Login.create({ keyValue, mobileOrPassword, password, token, lastExpiry, nextExpiry });
                    return newLogin;
                }
            }
            if (adminUser) {
                return adminUser;
            } else {
                return branchUser;
            }

        } catch (error) {
            throw error;
        }
    };
    static async updateToken(keyValue, token, mobileOrPassword, password) {
        try {
            const user = await UserModel.findOne({ _id: keyValue });
            if (!user) {
                throw new Error("User not found");
            } else {
                const loginUser = await Login.findOne({ keyValue: keyValue });
                if (!loginUser) {
                    const lastExpiry = 5;
                    const nextExpiry = 0;
                    const newLogin = await Login.create({ keyValue, mobileOrPassword, password, token, lastExpiry, nextExpiry });
                }
            }
            return user;
        } catch (error) {
            throw error;
        }
    };
    static async checkToken(token) {
        try {
            const user = await Login.findOne({ token: token });
            if (!user) {
                return false;
            } else {
                return true;
            }
        } catch (error) {
            throw error;
        }
    };
    static async addTable(keyValue, tableId, name, mobile, member, isOccupied, keepOrder) {
        try {
            const newTable = await UserAddTable.create({ keyValue, tableId, name, mobile, member, isOccupied, keepOrder });
            return newTable;
        }
        catch (err) {
            throw err;
        }
    }
    static async addMenu(keyValue, menu) {
        try {
            const categoriesType = menu.categoriesType;
            const item = menu.item;
            const price = menu.price;
            const qty = menu.qty;

            const newMenu = await Menu.create({ keyValue, categoriesType, item, price, qty });
            return newMenu;
        }
        catch (err) {
            throw err;
        }
    }
    static async createInvoice(keyValue, no, date, table, item, price, qty, subTotal, gst, total) {
        try {
            const newInvoice = await Invoice.create({
                keyValue,
                no,
                date,
                table: table.map(tableItem => ({
                    billNumber: tableItem.billNumber, // Add billNumber field
                    tableId: tableItem.tableId,
                    customerName: tableItem.customerName,
                    customerMobile: tableItem.customerMobile,
                    tableMember: tableItem.tableMember,
                    items: tableItem.items,
                    price: tableItem.price,
                    qty: tableItem.qty,
                    subTotal: tableItem.subTotal,
                    gst: tableItem.gst,
                    total: tableItem.total
                })),
                item,
                price,
                qty,
                subTotal,
                gst,
                total
            });
            return newInvoice;
        }
        catch (err) {
            throw err;
        }
    }
    static async keepOder(keyValue, tableId, menuList) {
        try {
            const existingOrder = {
                keyValue: keyValue,
                tableId: tableId,
                menuList: menuList
            };
            const newKeepOrder = await KeepOrder.create(existingOrder);
            return newKeepOrder;
        }
        catch (err) {
            throw err;
        }
    }

    static async findTableWithDate(tableId, existingInvoices) {
        try {
            for (const value of existingInvoices) {
                for (const table of value.table) {
                    if (tableId === table.tableId) {
                        return table;
                    }
                    return null;
                }
                return null;
            }
        }
        catch (err) {
            throw err;
        }
    }
    static async craetePDFforGetInvoice(keyValue, invoice, baseUrl, startDate, endDate) {
        return new Promise((resolve, reject) => {
            let doc = new PDFDocument({ size: "A4", margin: 50 });
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
            const documentsFolderPath = path.join(__dirname, '..', 'documents');
            const invoiceDateandTime = `${currentDateStr}${currentTimeStr}-${invoice[0].table[0].billNumber}`;
            const pdfPath = path.join(documentsFolderPath, `${invoiceDateandTime}.pdf`);
            if (!fs.existsSync(documentsFolderPath)) {
                try {
                    fs.mkdirSync(documentsFolderPath);
                } catch (err) {
                }
            }
            const stream = doc.pipe(fs.createWriteStream(pdfPath));
            this.generateHeader(doc);
            this.customerInfoforGetInvoice(doc, invoice, startDate, endDate);
            this.tableforGetInvoice(doc, invoice);
            this.generateFooter(doc);

            doc.end();
            doc.pipe(fs.createWriteStream(pdfPath));
            stream.on('finish', () => {
                const pdfUrl = `http://${baseUrl}/documents/${invoiceDateandTime}.pdf`;
                resolve(pdfUrl); // Resolve with the file path or name
            });
        });
    }

    static async craetePDF(keyValue, invoice, baseUrl) {
        return new Promise((resolve, reject) => {
            let doc = new PDFDocument({ size: "A4", margin: 50 });
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
            const documentsFolderPath = path.join(__dirname, '..', 'documents');
            const invoiceDateandTime = `${currentDateStr}${currentTimeStr}-${invoice.table.billNumber}`;
            const pdfPath = path.join(documentsFolderPath, `${invoiceDateandTime}.pdf`);
            if (!fs.existsSync(documentsFolderPath)) {
                try {
                    fs.mkdirSync(documentsFolderPath);
                } catch (err) {
                }
            }
            const stream = doc.pipe(fs.createWriteStream(pdfPath));
            this.generateHeader(doc);
            this.generateCustomerInformation(doc, invoice);
            this.generateInvoiceTable(doc, invoice);
            this.generateFooter(doc);

            doc.end();
            doc.pipe(fs.createWriteStream(pdfPath));
            stream.on('finish', () => {
                const pdfUrl = `http://${baseUrl}/documents/${invoiceDateandTime}.pdf`;
                resolve(pdfUrl); // Resolve with the file path or name
            });
        });
    }

    static async profileUpdate(keyValue, imageFolderPath, imageName, shopName, gstNumber, street, city, state, pinCode) {
        try {
            if (!imageFolderPath || !shopName || !gstNumber || !street || !city || !state || !pinCode) {
                throw new Error('All Field are required.');
            }

            const updatedProfile = await Profile.create({ keyValue, imageFolderPath, imageName, shopName, gstNumber, street, city, state, pinCode });
            return updatedProfile;
        }
        catch (err) {
            throw err;
        }
    }

    static async generateHeader(doc) {
        doc
            .image(("icon.png"), 50, 45, { width: 50 })
            .fillColor("#444444")
            .fontSize(20)
            .text("MY SHOP", 110, 57)
            .fontSize(10)
            .text("MY SHOP", 200, 50, { align: "right" })
            .text("123 Main Street", 200, 65, { align: "right" })
            .text("Ahmedabad, - 350001", 200, 80, { align: "right" })
            .moveDown();
    }

    static async generateCustomerInformation(doc, invoice) {
        doc
            .fillColor("#444444")
            .fontSize(20)
            .text("Invoice", 50, 160), { align: "center" };

        this.generateHr(doc, 185);

        const customerInformationTop = 200;
        let totalInvoice = 0;
        let payMode = invoice.table.payModeCash ? "Cash Payment" : "Online Payment";

        for (let i = 0; i < invoice.table.items.length; i++) {
            const totalPrice = ((invoice.table.qty[i]) * (invoice.table.price[i]));
            totalInvoice += totalPrice;
        }
        let totalBill = ((totalInvoice) + (totalInvoice * 9 / 100) + (totalInvoice * 9 / 100));

        doc
            .fontSize(10)
            .text("Invoice Number:", 50, customerInformationTop)
            .text(invoice.table.billNumber, 150, customerInformationTop)
            .font("Helvetica")
            .text("Invoice Date:", 50, customerInformationTop + 15)
            .text(invoice.date, 150, customerInformationTop + 15)
            .font("Helvetica-Bold")
            .text("Payment Mode:", 50, customerInformationTop + 30)
            .font("Helvetica-Bold")
            .text(`${payMode}`, 150, customerInformationTop + 30)

            .font("Helvetica-Bold")
            .text("Customer Name:", 300, customerInformationTop)
            .text(invoice.table.customerName, 400, customerInformationTop)
            .font("Helvetica")
            .text("Mobile:", 300, customerInformationTop + 15)
            .text(invoice.table.customerMobile, 400, customerInformationTop + 15)
            // .text(
            //     invoice[0].table[0].customerMobile +
            //     ", " +
            //     invoice[0].table[0].customerMobile +
            //     ", " +
            //     invoice[0].table[0].customerMobile,
            //     300,
            //     customerInformationTop + 30
            // )
            .moveDown();

        this.generateHr(doc, 252);
    }
    static async customerInfoforGetInvoice(doc, invoice, startDate, endDate) {
        doc
            .fillColor("#444444")
            .fontSize(20)
            .text("Invoice", 50, 160), { align: "center" };

        this.generateHr(doc, 185);

        const customerInformationTop = 200;
        let totalInvoice = 0;

        for (let i = 0; i < invoice.length; i++) {
            for (let u = 0; u < invoice[i].table.length; u++) {
                for (let y = 0; y < invoice[i].table[u].items.length; y++) {
                    let extraPrice = 0;
                    for (let p = 0; p < invoice[i].table[u].note[y].extraNote.exPrice.length; p++) {
                        extraPrice += invoice[i].table[u].note[y].extraNote.exPrice[p];
                    }
                    const totalPrice = (((invoice[i].table[u].qty[y]) * (invoice[i].table[u].price[y])) + extraPrice);
                    totalInvoice += totalPrice;
                }
            }
        }

        // for (let i = 0; i < invoice.table.items.length; i++) {
        //     const totalPrice = ((invoice.table.qty[i]) * (invoice.table.price[i]));
        //     totalInvoice += totalPrice;
        // }
        let totalBill = ((totalInvoice) + (totalInvoice * 9 / 100) + (totalInvoice * 9 / 100));

        doc
            .fontSize(10)
            // .text("Invoice Number:", 50, customerInformationTop)
            // .text(invoice[0].table[0].billNumber, 150, customerInformationTop)
            .font("Helvetica-Bold")
            .text("Invoice Date:", 50, customerInformationTop)
            .text(startDate, 150, customerInformationTop)
            .text("TO:", 250, customerInformationTop)
            .font("Helvetica-Bold")
            .text("Total Revenue:", 50, customerInformationTop + 30)
            .font("Helvetica-Bold")
            .text((totalInvoice.toFixed(2)), 150, customerInformationTop + 30)

            .font("Helvetica-Bold")
            .text("Invoice Date:", 300, customerInformationTop)
            .text(endDate, 400, customerInformationTop)
            // .font("Helvetica")
            // .text("Mobile:", 300, customerInformationTop + 15)
            // .text(invoice[0].table[0].customerMobile, 400, customerInformationTop + 15)
            // .text(
            //     invoice[0].table[0].customerMobile +
            //     ", " +
            //     invoice[0].table[0].customerMobile +
            //     ", " +
            //     invoice[0].table[0].customerMobile,
            //     300,
            //     customerInformationTop + 30
            // )
            .moveDown();

        this.generateHr(doc, 252);
    }
    static async generateInvoiceTable(doc, invoice) {
        let i;
        let u;
        const invoiceTableTop = 330;

        doc.font("Helvetica-Bold");
        this.extraNoteTableRow(
            doc,
            invoiceTableTop,
            "Sr.No",
            "Items",
            "Unit Cost",
            "Quantity",
            "Extra Cost",
            "Line Total"
        );
        this.generateHr(doc, invoiceTableTop + 20);
        doc.font("Helvetica");
        let totalInvoicePrice = 0;


        for (i = 0; i < invoice.table.items.length; i++) {
            let extraPrice = 0;
            let extraNote;
            for (u = 0; u < invoice.table.note[i].extraNote.note.length; u++) {
                if (extraNote !== undefined) {
                    extraNote = `${extraNote},` + `${invoice.table.note[i].extraNote.note[u]}`;
                } else {
                    extraNote = invoice.table.note[i].extraNote.note[u];
                }
                extraPrice += invoice.table.note[i].extraNote.exPrice[u];
            }

            const item = (i + 1);
            const description = invoice.table.items[i];
            const price = invoice.table.price[i];
            const qty = invoice.table.qty[i];
            const totalPrice = (((invoice.table.qty[i]) * (invoice.table.price[i])) + (extraPrice));
            totalInvoicePrice += totalPrice;

            const position = invoiceTableTop + (i + 1) * 30;
            this.extraNoteTableRow(
                doc,
                position,
                item,
                `${description}` + `( Extra : ${extraNote})`,
                price,
                qty,
                extraPrice,
                totalPrice
                // formatCurrency(item.amount)
            );

            this.generateHr(doc, position + 20);
        }
        const subtotalPosition = invoiceTableTop + (i + 1) * 30;
        this.generateTableRow(
            doc,
            subtotalPosition,
            "",
            "",
            "Subtotal",
            "",
            totalInvoicePrice
        );

        const cgstPosition = subtotalPosition + 20;


        let gst;
        if (invoice.table.gst[0] > 0.00) {
            gst = (totalInvoicePrice * 9 / 100)
        }
        else {
            gst = 0.00;
        }

        this.generateTableRowforgst(
            doc,
            cgstPosition,
            "",
            "",
            "if applicable(CGST (9%))",
            "",
            ((gst))
        );
        const sgstPosition = cgstPosition + 20;
        this.generateTableRowforgst(
            doc,
            sgstPosition,
            "",
            "",
            "if applicable(SGST (9%))",
            "",
            ((gst))
        );
        let totalBill = ((totalInvoicePrice) + (gst) + (gst));
        const duePosition = sgstPosition + 25;
        doc.font("Helvetica-Bold");
        this.generateTableRow(
            doc,
            duePosition,
            "",
            "",
            "Total Bill",
            "",
            totalBill.toFixed(2)
        );
        doc.font("Helvetica");
    }
    static async tableforGetInvoice(doc, invoice) {
        let i;
        let u;
        let y;
        let p;
        let x = 0;
        let position = 360;
        const invoiceTableTop = 330;

        doc.font("Helvetica-Bold");
        this.generateTableRowForGetInvoice(
            doc,
            invoiceTableTop,
            "Sr.No",
            "Date",
            "Table No.",
            "Items",
            "Unit Cost",
            "Quantity",
            "Extra Cost",
            "Line Total"
        );
        this.generateHr(doc, invoiceTableTop + 20);
        doc.font("Helvetica");
        let totalInvoicePrice = 0;
        for (i = 0; i < invoice.length; i++) {
            for (u = 0; u < invoice[i].table.length; u++) {
                for (y = 0; y < invoice[i].table[u].items.length; y++) {
                    let extraPrice = 0;
                    for (p = 0; p < invoice[i].table[u].note[y].extraNote.exPrice.length; p++) {
                        extraPrice += invoice[i].table[u].note[y].extraNote.exPrice[p];
                    }
                    const item = (x + 1);
                    const date = invoice[i].date;
                    const tableNo = invoice[i].table[u].tableId;
                    const description = invoice[i].table[u].items[y];
                    const price = invoice[i].table[u].price[y];
                    const qty = invoice[i].table[u].qty[y];
                    const totalPrice = ((invoice[i].table[u].qty[y]) * (invoice[i].table[u].price[y]) + extraPrice);
                    totalInvoicePrice += totalPrice;
                    // const position = invoiceTableTop + ( x + 1) * 30;
                    if (position > doc.page.height - 50) {
                        // If adding this item exceeds the page height, start a new page
                        doc.addPage();
                        position = 30; // Reset position for the new page
                    }
                    // x = x+1;
                    this.generateTableRowForGetInvoice(
                        doc,
                        position,
                        item,
                        date,
                        tableNo,
                        description,
                        price,
                        qty,
                        extraPrice,
                        totalPrice
                        // formatCurrency(item.amount)
                    );

                    this.generateHr(doc, position + 20);
                    position += 30; // Move to the next position
                    x++;
                }


            }
        }

        // for (i = 0; i < invoice.table.items.length; i++) {
        //     const item = (i + 1);
        //     const description = invoice.table.items[i];
        //     const price = invoice.table.price[i];
        //     const qty = invoice.table.qty[i];
        //     const totalPrice = ((invoice.table.qty[i]) * (invoice.table.price[i]));
        //     totalInvoicePrice += totalPrice;

        //     const position = invoiceTableTop + (i + 1) * 30;
        //     this.generateTableRow(
        //         doc,
        //         position,
        //         item,
        //         description,
        //         price,
        //         qty,
        //         totalPrice
        //         // formatCurrency(item.amount)
        //     );

        //     this.generateHr(doc, position + 20);
        // }

        let subtotalPosition = position;
        if (subtotalPosition > doc.page.height - 50) {
            doc.addPage();
            subtotalPosition = 30;
        }
        this.generateTableRow(
            doc,
            subtotalPosition,
            "",
            "",
            "Subtotal",
            "",
            totalInvoicePrice
        );

        let cgstPosition = subtotalPosition + 20;
        if (cgstPosition > doc.page.height - 50) {
            doc.addPage();
            cgstPosition = 30;
        }

        let gst;
        if (invoice[0].table[0].gst[0] > 0.00) {
            gst = (totalInvoicePrice * 9 / 100);
        }
        else {
            gst = 0.00;
        }

        this.generateTableRowforgst(
            doc,
            cgstPosition,
            "",
            "",
            "if applicable(CGST (9%))",
            "",
            ((gst))
        );
        let sgstPosition = cgstPosition + 30;
        if (sgstPosition > doc.page.height - 50) {
            doc.addPage();
            sgstPosition = 30;
        }

        this.generateTableRowforgst(
            doc,
            sgstPosition,
            "",
            "",
            "if applicable(SGST (9%))",
            "",
            ((gst))
        );
        let totalBill = ((totalInvoicePrice) + (gst) + (gst));
        let duePosition = sgstPosition + 25;
        if (duePosition > doc.page.height - 50) {
            doc.addPage();
            duePosition = 30;
        }
        doc.font("Helvetica-Bold");
        this.generateTableRow(
            doc,
            duePosition,
            "",
            "",
            "Total Bill",
            "",
            totalBill.toFixed(2)
        );
        doc.font("Helvetica");
    }

    static async generateFooter(doc) {
        doc
            .fontSize(10)
            .text(
                "We are always here to serve you, Thank You!",
                50,
                780,
                { align: "center", width: 500 }
            );
    }

    static async generateTableRow(
        doc,
        y,
        item,
        description,
        unitCost,
        quantity,
        lineTotal
    ) {
        doc
            .fontSize(10)
            .text(item, 50, y)
            .text(description, 150, y)
            .text(unitCost, 280, y, { width: 90, align: "right" })
            .text(quantity, 370, y, { width: 90, align: "right" })
            .text(lineTotal, 0, y, { align: "right" });
    }

    static async extraNoteTableRow(
        doc,
        y,
        item,
        description,
        unitCost,
        quantity,
        extraPrice,
        lineTotal
    ) {
        doc
            .fontSize(10)
            .text(item, 50, y)
            .text(description, 100, y)
            .text(unitCost, 150, y, { width: 90, align: "right" })
            .text(quantity, 240, y, { width: 90, align: "right" })
            .text(extraPrice, 370, y, { width: 90, align: "right" })
            .text(lineTotal, 0, y, { align: "right" });
    }
    static async generateTableRowforgst(
        doc,
        y,
        item,
        description,
        unitCost,
        quantity,
        lineTotal
    ) {
        doc
            .fontSize(10)
            .text(item, 50, y)
            .text(description, 150, y)
            .text(unitCost, 250, y, { width: 120, align: "right" })
            .text(quantity, 370, y, { width: 90, align: "right" })
            .text(lineTotal, 0, y, { align: "right" });
    }

    static async generateTableRowForGetInvoice(
        doc,
        y,
        item,
        date,
        tableNo,
        description,
        unitCost,
        quantity,
        extraCost,
        lineTotal
    ) {
        doc
            .fontSize(10)
            .text(item, 30, y)
            .text(date, 80, y)
            .text(tableNo, 130, y, { width: 50, align: "center" })
            .text(description, 180, y, { width: 90, align: "center" })
            .text(unitCost, 270, y, { width: 50, align: "center" })
            .text(quantity, 320, y, { width: 50, align: "center" })
            .text(extraCost, 370, y, { width: 90, align: "center" })
            .text(lineTotal, 480, y, { align: "center" });
    }

    static async generateHr(doc, y) {
        doc
            .strokeColor("#aaaaaa")
            .lineWidth(1)
            .moveTo(50, y)
            .lineTo(550, y)
            .stroke();
    }

    static async formatCurrency(cents) {
        return "$" + (cents / 100).toFixed(2);
    }

    static async formatDate(date) {
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();

        return year + "/" + month + "/" + day;
    }
    //   newHtml pdf

    static async htmlPdf(keyValue, invoice, baseUrl, startDate, endDate) {
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
                const documentsFolderPath = path.join(__dirname, '..', 'documents');
                const invoiceDateandTime = `${currentDateStr}${currentTimeStr}-${invoice[0].table[0].billNumber}`;
        const data = {
            jsonData: invoice
        };
        const filePath = path.resolve(__dirname, '..', '..', 'bill.ejs');
        const htmlString = fs.readFileSync(filePath).toString();
        let option = {
            format: 'A4',
            printBackground: true
        }
        const ejsData = ejs.render(htmlString, data);
        const savePath = path.join(documentsFolderPath, `${invoiceDateandTime}.pdf`);
        pdf.create(ejsData, option).toFile(`${savePath}`, (err, response) => {
            if (err) {
            }else{
               
            }
            
        });
        const pdfUrl = `http://${baseUrl}/documents/${invoiceDateandTime}.pdf`;
            return pdfUrl;


    }
    // static async htmlPdf(keyValue, invoice, baseUrl, startDate, endDate) {
    //     const currentDate = new Date();
    //         const year = currentDate.getFullYear();
    //         const month = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // Month is zero-based, so add 1
    //         const day = currentDate.getDate().toString().padStart(2, '0');
    //         const hours = currentDate.getHours().toString().padStart(2, '0');
    //         const minutes = currentDate.getMinutes().toString().padStart(2, '0');
    //         const seconds = currentDate.getSeconds().toString().padStart(2, '0');

    //         // Construct the date and time strings
    //         const currentDateStr = `${day}${month}${year}`;
    //         const currentTimeStr = `${hours}${minutes}${seconds}`;
    //         const documentsFolderPath = path.join(__dirname, '..', 'documents');
    //         const invoiceDateandTime = `${currentDateStr}${currentTimeStr}-${invoice[0].table[0].billNumber}`;
    //         // const pdfPath = path.join(documentsFolderPath, `${invoiceDateandTime}.pdf`);

    //     const data = {
    //         jsonData: invoice
    //     };
    //     const filePath = path.resolve(__dirname, '..', '..', 'bill.ejs');
    //     const htmlString = fs.readFileSync(filePath).toString();
    //     const ejsData = ejs.render(htmlString, data);
    //     const savePath = path.join(documentsFolderPath, `${invoiceDateandTime}.pdf`);

    //     // Puppeteer ka use karke PDF generate karna
    //     const browser = await puppeteer.launch();
    //     const page = await browser.newPage();
    //     await page.setContent(ejsData);
    //     await page.pdf({ path: savePath, format: 'A4',printBackground: true });
    //     await browser.close();
    //     const pdfUrl = `http://${baseUrl}/documents/${invoiceDateandTime}.pdf`;
    //     return pdfUrl;

    // }
    // static async htmlPdf(keyValue, invoice, baseUrl, startDate, endDate) {

    //     const data = {
    //         jsonData: invoice
    //     };
    //     const savePath = path.resolve(__dirname, '..', '..', 'abc.pdf');
    //     let pdfDocument = {
    //         html: '',
    //         data: data,
    //         path: savePath,
    //         type: "",
    //     };
    //      let options = {
    //         format: "A4",
    //     orientation: "portrait",
    //     border: "10mm"
    // }
    //     const filePath = path.resolve(__dirname, '..', '..', 'bills.html');
    //     const htmlString = fs.readFileSync(filePath, "utf8");
    //     let document = {...pdfDocument};
    //     document.html = htmlString;
    //     document.data = data;
    //     // document.path = path.resolve(__dirname, '..', '..', 'abc.pdf');
    //     pdf.create(document, options)
    //     .then(res => {
    //     })
    //     .catch(error => {
    //     });

    //     // const ejsData = ejs.render(htmlString, data);
    //     // const savePath = path.resolve(__dirname, '..', '..', 'user.pdf');

    //     // // Puppeteer ka use karke PDF generate karna
    //     // const browser = await puppeteer.launch();
    //     // const page = await browser.newPage();
    //     // await page.setContent(ejsData);
    //     // await page.pdf({ path: savePath, format: 'A4' });
    //     // await browser.close();

    // }

    static async customerInvoice(keyValue, invoice, baseUrl, startDate, endDate) {
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
        const documentsFolderPath = path.join(__dirname, '..', 'documents');
        const invoiceDateandTime = `${currentDateStr}${currentTimeStr}-${invoice.table.billNumber}`;
        // const pdfPath = path.join(documentsFolderPath, `${invoiceDateandTime}.pdf`);

        const data = {
            jsonData: invoice
        };
        const filePath = path.resolve(__dirname, '..', '..', 'customerInvoice.ejs');
        const htmlString = fs.readFileSync(filePath).toString();
        const ejsData = ejs.render(htmlString, data);
        const savePath = path.join(documentsFolderPath, `${invoiceDateandTime}.pdf`);

        // Puppeteer ka use karke PDF generate karna
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.setContent(ejsData);
        await page.pdf({ path: savePath, format: 'A4', printBackground: true });
        await browser.close();
        const pdfUrl = `http://${baseUrl}/documents/${invoiceDateandTime}.pdf`;
        return pdfUrl;

    }
}


module.exports = UserServices;