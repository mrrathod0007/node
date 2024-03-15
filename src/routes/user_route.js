const router = require("express").Router();
const UserController = require("../controller/user_controller");
const jwt = require("jsonwebtoken");

router.post('/registration',UserController.register);
router.post('/login',UserController.login);
router.post('/forgot-password',UserController.forgotPassword);
router.post('/reset-password',verifyToken,UserController.resetPassword);
router.post('/addTable',verifyToken,UserController.addTable);
router.get('/getTable',verifyToken,UserController.getTable);
router.put('/addCustomer',verifyToken,UserController.addCustomer);
router.delete('/deleteTable',verifyToken,UserController.deleteTable);
router.post('/addMenu',verifyToken,UserController.addMenu);
router.get('/getMenu',verifyToken,UserController.getMenu);
router.put('/updateCategory',verifyToken,UserController.updateCategory);
router.delete('/deleteMenu',verifyToken,UserController.deleteMenu);
router.post('/addInvoice',verifyToken,UserController.addInvoice);
router.get('/getInvoice',verifyToken,UserController.getInvoice);
router.get('/pdf',UserController.getPdf);
router.post('/keepOrder',verifyToken,UserController.keepOrder);
router.get('/getKeepOrder',verifyToken,UserController.getKeepOrder);


function verifyToken(req,res,next){
    const bearerHeader = req.headers['authorization']

    if(typeof bearerHeader !== 'undefined'){
        const bearer = bearerHeader.split(" ");
        const token = bearer[1];
        req.token = token;
        next();

    }else{
        res.send({
            status:false,
            msg: "Token Invalid"
        })
    }
    
 }

module.exports = router;