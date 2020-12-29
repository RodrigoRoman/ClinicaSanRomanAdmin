const express = require('express');
const router = express.Router();
const patients = require('../controllers/patients');
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, isServAuthor,isDinamicDirectAdmin, validateService, validateSupply, validateHospital,validatePatient} = require('../middleware');
const multer = require('multer');

const Patient = require('../models/patient');


router.route('/')
    .get(isLoggedIn,catchAsync(patients.index))
    .post(isLoggedIn, validatePatient, catchAsync(patients.createPatient))

//retrieve patients
router.get('/searchPatients',isLoggedIn,catchAsync(patients.searchAllPatients))


router.get('/new', isLoggedIn,isDinamicDirectAdmin, patients.renderNewForm)

//SHOW ROUTE FOR PRODUCTS

router.route('/:id/discharge')
    .put(isLoggedIn,isDinamicDirectAdmin, catchAsync(patients.dischargePatient))


router.route('/:id')
    .get(isLoggedIn,catchAsync(patients.showPatient))
    .put(isLoggedIn, validatePatient, catchAsync(patients.updatePatient))
    .delete(isLoggedIn, catchAsync(patients.deletePatient))


router.get('/:id/edit', isLoggedIn,isDinamicDirectAdmin, catchAsync(patients.renderEditForm))

//retrieve product data for patient account
router.get('/:id/search3',isLoggedIn,catchAsync(patients.search_3))

router.get('/:id/search',isLoggedIn,catchAsync(patients.searchAll))


//patient cart
router.route('/:id/accountCart')
      .post(isLoggedIn,catchAsync(patients.addToCart))
      .put(isLoggedIn,catchAsync(patients.updateServiceFromAccount))
      .delete(isLoggedIn,catchAsync(patients.deleteServiceFromAccount))

router.route('/:id/showAccount')
        .get(catchAsync(patients.patientAccount))

router.route('/:id/makePDF')
        .get(catchAsync(patients.accountToPDF))


module.exports = router;