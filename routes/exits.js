const express = require('express');
const router = express.Router();
const exits = require('../../controllers/exits');
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, isServAuthor,isDinamicDirectAdmin, validateService, validateSupply, validateHospital,validateExit,validatePayment} = require('../middleware');

const multer = require('multer');


const Exit = require('../../models/exit');
const Payment = require('../../models/payment');


router.route('/')
    .get(isLoggedIn, isDinamicDirectAdmin,catchAsync(exits.index))
    .post(isLoggedIn, isDinamicDirectAdmin,validatePayment, catchAsync(exits.createPayment))

router.get('/new', isLoggedIn, isDinamicDirectAdmin, exits.renderNewForm)

router.route('/refill')
    .get(exits.refillForm)
    .post(exits.refillFormPDF)
    .put(exits.editDatePoint)




router.route('/:id')
    .delete(isLoggedIn, isLoggedIn, isDinamicDirectAdmin, catchAsync(exits.deletePayment))

router.get('/payments', isLoggedIn,isDinamicDirectAdmin, catchAsync(exits.index_payments))

router.route('/hospital_account')
    .get(exits.hospital_account)
    .post(exits.accountReportPDF)

router.get('/searchSP', isLoggedIn, isDinamicDirectAdmin, catchAsync(exits.servicesPayments))



module.exports = router;