const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const db = require('../config/db');


const { Schema } = mongoose;
const adminUserSchema = new Schema({
    userName: {
        type: String,
        required: true,
        unique: true
    },
    mobile: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    isAdmin:{
        type:Boolean,
        require: true
    },
    branch:{
        type: Number,
        require: true
    },

});

const adminBranches = new Schema({
    keyValue:{
        type:String,
        require: true
    },
    branches:[{
        branchName:{
            type: String,
            require: true
        },
        userId:{
            type: String,
            require: true,
            unique: true
        },
        pass:{
            type: String,
            require: true
        }
    }]
});
const userSchema = new Schema({
    userName: {
        type: String,
        required: true,
        unique: true
    },
    mobile: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }

});
const loginSchema = new Schema({
    keyValue: {
        type: String,
        required: true
    },
    mobileOrPassword: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    lastExpiry: {
        type: Number,
        require: true
    },
    nextExpiry: {
        type: Number,
        require: true
    },
    created: {
        type: Date,
        default: Date.now
    },
    token: {
        type: String,
        require: true
    }


});


const tableSchema = new Schema({
    keyValue: {
        type: String,
        required: true
    },
    tableId: {
        type: String,
    },
    name: {
        type: String,
    },
    mobile: {
        type: String,
    },
    member: {
        type: String,
    },
    isOccupied: {
        type: Boolean,
    },
    keepOrder: {
        type: Boolean,
    },
});

const menuSchema = new Schema({
    keyValue: {
        type: String,
        required: true
    },
    categoriesType: {
        type: String,
        required: true
    },
    item: [
        {
            itemName:{
                type: String,
            },
            extraNote:{
                note :[{
                    type:String,
                }],
                exPrice:[{
                    type: Number,
                }]
            }

        }
    ],
    price: [{
        type: Number,
    }],
    qty: [{
        type: Number,
    }],
    
});

const invoiceSchema = new Schema({
    keyValue: {
        type: String,
        required: true
    },
    no: {
        type: String,
        required: true
    },
    date: {
        type: String,
        required: true,
    },
    table: [
        {
            billNumber: {
                type: String,
                required: true
            },
            tableId: {
                type: String,
                required: true
            },

            customerName: {
                type: String,
            },
            customerMobile: {
                type: String,
            },
            tableMember: {
                type: String,
            },
            items: [{
                type: String,
                required: true
            }],
            payModeCash: {
                type: Boolean,
                required: true
            },
            note: [
                {
                    itemName:{
                        type: String,
                        required: true
                    },
                    extraNote:{
                        note :[{
                            type:String,
                            require: true
                        }],
                        exPrice:[{
                            type: Number,
                            required: true
                        }]
                    }
        
                }
            ],
            price: [{
                type: Number,
                required: true
            }],
            qty: [{
                type: Number,
                required: true
            }],
            subTotal: [{
                type: Number,
                required: true
            }],
            gst: [{
                type: Number,
                required: true
            }],

            total: {
                type: Number,
                required: true
            },
        },
    ],

});
const keepOrderSchema = new Schema({
    keyValue: {
        type: String,
        required: true
    },
    tableId: {
        type: String,
        required: true
    },
    menuList: [{
        categoriesType: {
            type: String,
            required: true
        },
        item: [
            {
                itemName:{
                    type: String,
                    required: true
                },
                extraNote:{
                    note :[{
                        type:String,
                        require: true
                    }],
                    exPrice:[{
                        type: Number,
                        required: true
                    }]
                }
    
            }
        ],
        price: [{
            type: Number,
            required: true
        }],
        qty: [{
            type: Number,
            required: true
        }],
    }]



});

const pdfSchema = new Schema({
    keyValue: {
        type: String,
        required: true
    },
    invoiceNo: {
        type: String,
        required: true
    },
    pdfData: {
        type: String
    }

});
const profileSchema = new Schema({
    keyValue: {
        type: String,
        required: true
    },
    imageFolderPath: {
        type: String,
        required: true
    },
    imageName: {
        type: String,
        required: true
    },
    shopName: {
        type: String,
        required: true
    },
    gstNumber: {
        type: String,
        required: true
    },
    street: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    pinCode: {
        type: String,
        required: true
    },

});

adminUserSchema.pre('save', async function () {
    try {
        var user = this;
        const salt = await (bcrypt.genSalt(10));
        const hashpass = await bcrypt.hash(user.password, salt);

        user.password = hashpass;
    } catch (error) {

    }
});
userSchema.pre('save', async function () {
    try {
        var user = this;
        const salt = await (bcrypt.genSalt(10));
        const hashpass = await bcrypt.hash(user.password, salt);

        user.password = hashpass;
    } catch (error) {

    }
});
loginSchema.pre('save', async function () {
    try {
        var user = this;
        const salt = await (bcrypt.genSalt(10));
        const hashpass = await bcrypt.hash(user.password, salt);

        user.password = hashpass;
    } catch (error) {

    }
});
invoiceSchema.pre('save', async function (next) {
    try {
        if (!this.isNew || this.table.length === 0) {
            return next();
        }

        const lastInvoice = await this.constructor.findOne({}, {}, { sort: { 'billNumber': -1 } });
        let nextBillNumber = '01';

        if (lastInvoice && lastInvoice.table.billNumber) {
            const lastNumber = parseInt(lastInvoice.table.billNumber, 10);
            if (!isNaN(lastNumber)) {
                nextBillNumber = (lastNumber + 1).toString().padStart(2, '0');
            }
        }

        for (let i = 0; i < this.table.length; i++) {
            this.table[i].billNumber = nextBillNumber;
            nextBillNumber = (parseInt(nextBillNumber, 10) + 1).toString().padStart(2, '0'); // Increment billNumber for the next item
        }

        return next();
    } catch (error) {
        return next(error);
    }
});

// invoiceSchema.pre('save', function (next) {
//     const currentDate = new Date();
//     console.log("====currentDate====", currentDate);
//     const formattedDate = `${currentDate.getDate()}/${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`;
//     this.date = formattedDate;
//     next();
// });

adminUserSchema.methods.compareAdminPassword = async function (userPassword) {
    try {
        const isMatch = await bcrypt.compare(userPassword, this.password);
        return isMatch;
    } catch (error) {
        throw error;

    }
};
userSchema.methods.comparePassword = async function (userPassword) {
    try {
        const isMatch = await bcrypt.compare(userPassword, this.password);
        return isMatch;
    } catch (error) {
        throw error;

    }
};


tableSchema.methods.compareTable = async function (keyValue, tableId) {
    const tables = await UserAddTable.find();


    try {
        for (const value of tables) {
            if (keyValue !== null && keyValue === value.keyValue && tableId === value.tableId) {
                console.log('===keyValue true===', keyValue, value.keyValue);
                console.log('===tabelId true===', tableId, value.tableId);
                return true;
            }
        }
        return false;
    } catch (error) {
        throw error;

    }
};
tableSchema.methods.customerUpdate = async function (keyValue, tableId) {
    const tables = await UserAddTable.find();


    try {
        for (const value of tables) {
            if (keyValue !== null && keyValue === value.keyValue && tableId === value.tableId) {
                console.log('===keyValue true===', keyValue, value.keyValue);
                console.log('===tabelId true===', tableId, value.tableId);
                return value;
            }
        }
        return null;
    } catch (error) {
        throw error;

    }
};
menuSchema.methods.addMenuAndUpdate = async function (keyValue, menu) {
    const categories = await Menu.find();
    console.log('===categories===', menu, categories);


    try {
        for (const value of categories) {
            if (keyValue !== null && keyValue === value.keyValue && tableId === value.tableId) {
                console.log('===keyValue true===', keyValue, value.keyValue);
                console.log('===tabelId true===', tableId, value.tableId);
                return value;
            }
        }
        return null;
    } catch (error) {
        throw error;

    }
};
invoiceSchema.methods.addItemsToInvoice = async function (newItems) {
    try {
        // Naye items ko existing invoice ke table array mein push karein
        newItems.forEach((newItem, index) => {
            if (!this.isNew || this.table.length === 0) {

            }
            const lastInvoice = this.constructor.findOne({}, {}, { sort: { 'billNumber': -1 } });
            let nextBillNumber = '01';

            if (lastInvoice && lastInvoice.no) {
                const lastNumber = parseInt(lastInvoice.no, 10);
                if (!isNaN(lastNumber)) {
                    nextBillNumber = (lastNumber + 1).toString().padStart(2, '0');
                }
            }
            for (let i = 0; i < this.table.length; i++) {
                this.table[i].billNumber = nextBillNumber;
                nextBillNumber = (parseInt(nextBillNumber, 10) + 1).toString().padStart(2, '0');
            }

            newItem.billNumber = nextBillNumber;
            this.table.push(newItem);

        });
        await this.save();
        return this.table;
    } catch (error) {
        throw error;
    }
};

const AdminUserModel= new mongoose.model("AdminUserModel", adminUserSchema);
const AdminBranchesModel= new mongoose.model("AdminBranchesModel", adminBranches);
const UserModel = new mongoose.model("UserSinup", userSchema);
const UserAddTable = new mongoose.model("addTable", tableSchema);
const Login = mongoose.model('Login', loginSchema);
const Menu = mongoose.model('Menu', menuSchema);
const Invoice = mongoose.model('Invoice', invoiceSchema);
const KeepOrder = mongoose.model('KeepOrder', keepOrderSchema);
const AddPdf = mongoose.model('AddPdf', pdfSchema);
const Profile = mongoose.model('Profile', profileSchema);


module.exports = { AdminUserModel,AdminBranchesModel, UserModel, UserAddTable, Login, Menu, Invoice, KeepOrder,AddPdf,Profile };

