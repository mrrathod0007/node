const {  UserModel, UserAddTable, Login, Menu, Invoice, KeepOrder,AddPdf  } = require("../model/user_model");
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const jwt = require("jsonwebtoken");
const handlebars = require('handlebars');

class UserServices {
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
    static async checkuser(mobileOrPassword) {
        try {
            // Search for a user by either userName or mobile number
            return await UserModel.findOne({
                $or: [{ userName: mobileOrPassword }, { mobile: mobileOrPassword }]
            });
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

    static async generatetoken(tokenData, secretKey, jwt_expiry, id) {
        try {
            const user = await Login.findOne({ keyValue: id });

            if (user) {
                if (user.token) {
                    const isValidToken = await UserServices.checkToken(user.token);
                    console.log('==user.token==', user.token);
                    if (isValidToken) {
                        let newToken;
                        let decodedToken;
                        jwt.verify(user.token, secretKey, async (error, authData) => {
                            console.log('==error==', error);
                            if (error !== null && error.name === "TokenExpiredError") {
                                console.log('==error==', error.name);
                                if (user.nextExpiry > 0) {
                                    const expiry = (user.nextExpiry) * (24 * 60 * 60);
                                    console.log('==next==', user.nextExpiry);
                                    newToken = jwt.sign(tokenData, secretKey, { expiresIn: expiry });
                                    user.token = newToken;
                                    user.lastExpiry = user.nextExpiry;
                                    user.nextExpiry = 0;
                                    const newUser = await user.save();
                                    //  newToken = newToken;
                                }

                            } else {
                                decodedToken = jwt.verify(user.token, secretKey);

                            }
                        });

                        // const decodedToken = jwt.verify(user.token, secretKey);
                        console.log('==decodedToken==', decodedToken);
                        const logintime = user.created;
                        console.log('==logintime==', logintime / 1000);
                        const currentTime = Math.floor(Date.now() / 1000);
                        console.log('==currentTime==', currentTime);
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
                                console.log('==next==', user.nextExpiry);
                                newToken = jwt.sign(tokenData, secretKey, { expiresIn: expiry });
                                user.token = newToken;
                                user.lastExpiry = user.nextExpiry;
                                user.nextExpiry = 0;
                                const newUser = await user.save();
                                return newToken;
                            } else {
                                console.log('==next==', user.nextExpiry);
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
    static async updateToken(keyValue, token, mobileOrPassword, password) {
        try {
            const user = await UserModel.findOne({ _id: keyValue });
            if (!user) {
                throw new Error("User not found");
            } else {
                const loginUser = await Login.findOne({ keyValue: keyValue });
                console.log('==Login==', loginUser);
                if (!loginUser) {
                    const lastExpiry = 1;
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
            console.log("==newMenu==", newMenu)
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
            console.log("==newInvoice==", newInvoice)
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
            console.log("==newInvoice==", newKeepOrder)
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
                        console.log('===tabelId true===', tableId, table.tableId);
                        console.log('==value==', table);
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


    static async craetePDF(keyValue,invoice,baseUrl) {
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
            const invoiceDateandTime= `${currentDateStr}${currentTimeStr}-${invoice.table.billNumber}`;
            const pdfPath = path.join(documentsFolderPath, `${invoiceDateandTime}.pdf`);
            if (!fs.existsSync(documentsFolderPath)) {
                try {
                    fs.mkdirSync(documentsFolderPath);
                } catch (err) {
                    console.error('Error creating documents folder:', err);
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
            .text("Total:", 50, customerInformationTop + 30)
            .font("Helvetica-Bold")
            .text((totalBill.toFixed(2)), 150, customerInformationTop + 30)

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

    static async generateInvoiceTable(doc, invoice) {
        let i;
        const invoiceTableTop = 330;

        doc.font("Helvetica-Bold");
        this.generateTableRow(
            doc,
            invoiceTableTop,
            "Sr.No",
            "Items",
            "Unit Cost",
            "Quantity",
            "Line Total"
        );
        this.generateHr(doc, invoiceTableTop + 20);
        doc.font("Helvetica");
        let totalInvoicePrice = 0;
        for (i = 0; i < invoice.table.items.length; i++) {
            const item = (i + 1);
            const description = invoice.table.items[i];
            const price = invoice.table.price[i];
            const qty = invoice.table.qty[i];
            const totalPrice = ((invoice.table.qty[i]) * (invoice.table.price[i]));
            totalInvoicePrice += totalPrice;
            
            const position = invoiceTableTop + (i + 1) * 30;
            this.generateTableRow(
                doc,
                position,
                item,
                description,
                price,
                qty,
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
        if(invoice.table.gst[0] > 0.00){
            gst = (totalInvoicePrice * 9 / 100)
            console.log("==invoice.table.gst==",invoice.table.gst);
        }
            else{
                gst = 0.00;
                console.log("==gst==",gst);
            }
            
        this.generateTableRow(
            doc,
            cgstPosition,
            "",
            "",
            "if applicable(CGST (9%))",
            "",
            ((gst))
        );
        const sgstPosition = cgstPosition + 20;
        this.generateTableRow(
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

}


module.exports = UserServices;