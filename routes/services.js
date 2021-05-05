const express = require('express');
const router = express.Router();
const services = require('../controllers/services');
const catchAsync = require('../utils/catchAsync');
const { isLoggedIn, isServAuthor,isDinamicDirectAdmin, validateService, validateSupply, validateHospital} = require('../middleware');
const multer = require('multer');
const { storage } = require('../cloudinary');
const upload = multer({ storage });

const {Service, Supply,Hospital} = require('../models/service');


router.route('/')
    .get(isLoggedIn,isDinamicDirectAdmin,catchAsync(services.index))
    .post(isLoggedIn,isDinamicDirectAdmin, upload.array('image'), validateService, catchAsync(services.createService))

router.get('/searchSupplies/:page?',isLoggedIn,isDinamicDirectAdmin,catchAsync(services.searchAllSupplies))
router.get('/searchServices',isLoggedIn,isDinamicDirectAdmin,catchAsync(services.searchAllServices))


router.route('/supply/:page?')
    .get(catchAsync(services.index_supplies))
    .post(isLoggedIn,isDinamicDirectAdmin, upload.array('image'), validateSupply, catchAsync(services.createSupply))
  

router.route('/hospital')
    .get(catchAsync(services.index_hospital))
    .post(isLoggedIn, isDinamicDirectAdmin,upload.array('image'), validateHospital, catchAsync(services.createHospital))

router.get('/new', isLoggedIn,isDinamicDirectAdmin, services.renderNewForm)

//SHOW ROUTE FOR PRODUCTS
router.route('/supply/:name')
    .get(catchAsync(services.showSupply))

//EDIT ROUTES

router.route('/:id')
    .get(isLoggedIn,isDinamicDirectAdmin,catchAsync(services.showService))
    .delete(isLoggedIn,isDinamicDirectAdmin, catchAsync(services.deleteService))


router.route('/:id/supply')
    .get(isLoggedIn,isDinamicDirectAdmin, upload.array('image'), catchAsync(services.renderNewFrom))
    .put(isLoggedIn,isDinamicDirectAdmin, upload.array('image'), validateSupply, catchAsync(services.updateService))

router.route('/:id/hospital')
    .put(isLoggedIn,isDinamicDirectAdmin, upload.array('image'), validateHospital, catchAsync(services.updateService))


router.get('/:id/edit',isLoggedIn,isDinamicDirectAdmin, catchAsync(services.renderEditForm))


module.exports = router;