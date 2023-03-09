const mongoose = require('mongoose');
const {Service,Supply,Hospital} = require('../models/service');
const Disch = require('../models/discharged_data');
const Transaction = require('../models/transaction');
const Patient = require('../models/patient');
const { cloudinary } = require("../cloudinary");
const mongoosePaginate = require("mongoose-paginate-v2");
const puppeteer = require('puppeteer'); 
// const service = require('../models/services');

function getMexicoCityTime() {
    const now = new Date();
    const mexicoCityOffset = -6 * 60; // Mexico City is UTC-6
    const mexicoCityTime = new Date(now.getTime() + mexicoCityOffset * 60 * 1000);
    return mexicoCityTime;
  }

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
  }

module.exports.index = async (req, res) => {
    const resPerPage = 30;
    const page = parseInt(req.params.page) || 1;
    let {search,sorted} = req.query;
    const patients = await Patient.find({}).limit(resPerPage).sort({discharged: 1, admissionDate: 1}).populate("author");
    const count =  await Patient.countDocuments({});
    res.render('patients/index',{patients,"page":page, pages: Math.ceil(count / resPerPage),
    numOfResults: count,search:req.query.search,sorted:sorted})
}

//search for patients with keyword
module.exports.searchAllPatients = async (req, res) => {
    let {search,sorted,begin,end,page} = req.query;
    page = parseInt(page)||1;
    let resPerPage = 30;
    search = new RegExp(escapeRegExp(search), 'gi');
    let dbQueries =  [
            { name: search },
            { treatingDoctor: search },
            { diagnosis: search },
            { description: search },
        ];
    begin = new Date(begin+"T00:00:01.000Z")
    end = new Date(end+"T23:59:01.000Z")
    let patients = await Patient.find({$or:dbQueries,admissionDate:{$gte:begin,$lte:end}}).limit(resPerPage*3).sort({discharged: 1, admissionDate:1}).populate("author");
    let numPatients = patients.length;
    begin = req.query.begin;
    end = req.query.end;
    if(sorted == "name"||sorted == "Ordenar por:"){
        //sort in alphabetical order
        patients = patients.slice(((resPerPage * page) - resPerPage),((resPerPage * page) - resPerPage)+resPerPage).sort((a,b)=>a.name.localeCompare(b.name,"es",{sensitivity:'base'}));
    };
    if(sorted == "doctor"){
        //sort in alphabetical order
        patients = patients.slice(((resPerPage * page) - resPerPage),((resPerPage * page) - resPerPage)+resPerPage).sort((a,b)=>a.doctor.localeCompare(b.name,"es",{sensitivity:'base'}));
    };
    if(sorted == "diagnosis"){
        //sort in alphabetical order
        patients = patients.slice(((resPerPage * page) - resPerPage),((resPerPage * page) - resPerPage)+resPerPage).sort((a,b)=>a.class.localeCompare(b.diagnosis,"es",{sensitivity:'base'}));
    };
    if (!patients) {
        res.locals.error = 'Ningun servicio corresponde a la busqueda';
        res.json({})
    }
    console.log('the returnvalue')
    console.log(patients.length)
    res.json({'patients':patients,'begin':begin,'end':end,"page":page, 'pages': Math.ceil(numPatients / resPerPage),
    'numOfResults': numPatients,'search':req.query.search,'sorted':sorted})
}


module.exports.renderNewForm = (req, res) => {
    res.render("patients/new");
}

module.exports.createPatient = async (req, res, next) => {
    const patient = new Patient(req.body.patient);
    const nDate = getMexicoCityTime();
    patient.author = req.user._id;
    patient.admissionDate = nDate;
    await patient.save();
    req.flash('success', 'Paciente creado!');
    res.redirect("/patients")
}

module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const patient = await Patient.findById(id);
    if (!patient) {
        req.flash('error', 'Error al buscar paciente!');
        return res.redirect('/patients');
    }
    res.render("patients/edit", { patient });
}

module.exports.updatePatient = async (req, res) => {
    const { id } = req.params;
    req.body.patient.admissionDate = new Date(req.body.patient.admissionDate+':00.000Z');
    const patient = await Patient.findByIdAndUpdate(id, { ...req.body.patient });
    await patient.save();
    req.flash('success', 'Paciente actualizado correctamente!');
    res.redirect(`/patients`)
}

module.exports.dischargePatient = async (req, res) => {
    const { id } = req.params;
    const patient = await Patient.findById(id).populate({
        path: 'servicesCar',
        populate: {
          path: 'service',
        },
      });
    //variable for local time 
    const nDate = getMexicoCityTime();
    patient.discharged = true
    patient.dischargedDate = nDate;
    //create discharged data
    for(let trans of patient.servicesCar){
        let dischargedData = {
            patient:trans.patient,
            class: trans.service.class,
            amount: trans.amount,
            name: trans.service.name,
            service_type: trans.service.service_type,
            processDate: nDate,
            hospitalEntry:trans.service.hospitalEntry,
            unitPrice: trans.service.sell_price||trans.service.price,
            buyPrice: trans.service.buy_price||0

        }
        let dischargedField = new Disch(dischargedData);
        trans.discharged_data = dischargedField;
        await trans.save();
        await dischargedField.save();
    }
    await patient.save();
    req.flash('success', 'Paciente dado de alta!');
    res.redirect(`/patients`)
}

module.exports.deletePatient = async (req, res) => {
    const { id } = req.params;
    await Patient.findByIdAndDelete(id);
    //aqui se regresarian los productos incluidos?
    req.flash('success', 'Paciente eliminado correctamente')
    res.redirect('/patients');
}


module.exports.showPatient = async (req, res) => {
    let {begin,bH,end,eH} = req.query;
    let pat = await Patient.findById(req.params.id);
    //variable for local time 
    const nDate = getMexicoCityTime();
    console.log('current datetime');
    console.log(nDate);
    if(!begin){
        begin = pat.admissionDate;
    }else{
        begin = new Date(begin+"T"+bH+"Z");
    };
    if(!end){
        end= nDate;
    }else{
        end = new Date(end+"T"+eH+"Z");
    };
    const patient = await Patient.findById(req.params.id).populate({
        path: 'servicesCar',
        populate: {
          path: 'service addedBy',
        },
      })
    let new_car = patient.servicesCar.map((el)=>{
        if(["Dia","Hora"].includes(el.service.unit) && el.toggle){
            el.terminalDate = nDate;
            let start = new Date(el.consumtionDate);
            end = nDate;
            //calculate the unit time in miliseconds
            let miliUnit = (el.service.unit == "Dia")?(86400*1000):(3600*1000);
        //divide the difference between start and end batween the miliseconds unit
            let new_amount = (end.getTime() - start.getTime())/miliUnit;
            new_amount = Math.round(new_amount * 100) / 100;
            el.amount = new_amount;
            el.save()
            return el;
        }else{
            return el
            }
    })
    patient.servicesCar=new_car;
    await patient.save();
    const str_id = JSON.stringify(patient._id); 
    if (!patient) {
        req.flash('error', 'No se encontro paciente!');
        return res.redirect('/patients');
    }
    res.render(`patients/show`, { patient, str_id,begin,end,eH,bH});
}


module.exports.showDischargedPatient= async (req, res) => {
    const patient = await Patient.aggregate([  
        {$match: {_id:  mongoose.Types.ObjectId(req.params.id)}}, 
        {$group: {
            _id:"$name",
            patientName:{$last:"$name"},
            treatingDoctor:{$last:"$treatingDoctor"},
            servicesCar:{$last:"$servicesCar"},
            diagnosis: {$last:"$diagnosis"},
            admissionDate: { $last:"$admissionDate"}}},
        {$unwind:"$servicesCar"},
        {
            $lookup: {
            from: "transactions",
            localField: "servicesCar",    
            foreignField: "_id",  
            as: "fromTransaction"
            }
        },
        {
            $replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$fromTransaction", 0 ] }, "$$ROOT" ] } }
        },
        {$match: {discharged_data:{$exists: true, $ne: null }}},
        {
            $lookup: {
            from: "disches",
            localField: "discharged_data",    // field in current collection
            foreignField: "_id",  // field foreign
            as: "fromDischarged"
            }
        },
        {
            $replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$fromDischarged", 0 ] }, "$$ROOT" ] } }
        },
        {$group: {
            _id:"$name",
            patientName:{$last:"$patientName"},
            class:{$last:"$class"},
            name: {$last:"$name"},
            treatingDoctor:{$last:"$treatingDoctor"},
            diagnosis : {$last:"$diagnosis"},
            admissionDate : {$last:"$admissionDate"},
            price: {$last:"$unitPrice"},
            amount: { $sum:"$amount"}}},
        {$group: {
            _id:"$class",
            patientName:{$last:"$patientName"},
            class:{$last:"$class"},
            serviceName: {$push:"$name"},
            treatingDoctor:{$last:"$treatingDoctor"},
            diagnosis : {$last:"$diagnosis"},
            admissionDate : {$last:"$admissionDate"},
            price: {$push:"$price"},
            amount: { $push:"$amount"}}},
        {$addFields:{totalPrice : { $sum: "$price" }}},
        {$addFields:{totalCost : { $sum: "$cost" }}},
    ]).collation({locale:"en", strength: 1});
    res.render(`patients/dischargedPatient`, {patient});
}


module.exports.patientAccount = async (req, res) => {
    let {begin,end} = req.query;
    let pat = await Patient.findById(req.params.id);
    //variable for local time 
    const nDate = getMexicoCityTime();
    if(!begin){
        begin = pat.admissionDate
    }else{
        begin = new Date(begin+"T00:00:01.000Z");
    };
    if(!end){
        end= nDate;
    }else{end = new Date(end+"T23:59:01.000Z")};
    const patient = await Patient.aggregate([   
        // put in a single document both transaction and service fields
        {$match: {_id:  mongoose.Types.ObjectId(req.params.id)}},
        {$group: {
            _id:"$name",
            patientName:{$last:"$name"},
            treatingDoctor:{$last:"$treatingDoctor"},
            servicesCar:{$last:"$servicesCar"},
            rfc : {$last:"$rfc"},
            diagnosis: {$last:"$diagnosis"},
            admissionDate: { $last:"$admissionDate"}}},
        {$unwind:"$servicesCar"},
        {
            $lookup: {
               from: "transactions",
               localField: "servicesCar",    
               foreignField: "_id",  
               as: "fromTransaction"
            }
         },
         {
            $replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$fromTransaction", 0 ] }, "$$ROOT" ] } }
         },
         { $project: { fromTransaction: 0, servicesCar:0 } },
        {$match: {consumtionDate:{$gte:begin,$lte:end}}},
        {
            $lookup: {
               from: "services",
               localField: "service",    // field in the Trasaction collection
               foreignField: "_id",  // field in the Service collection
               as: "fromService"
            }
         },
         {
            $replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$fromService", 0 ] }, "$$ROOT" ] } }
         },
         { $project: { fromService: 0 } },
         {$group: {
            _id:{name: "$name", sell_price: "$price"},
            patientName:{$last:"$patientName"},
            class:{$last:"$class"},
            name: {$last:"$name"},
            treatingDoctor:{$last:"$treatingDoctor"},
            service_type : {$last:"$service_type"},
            rfc : {$last:"$rfc"},
            diagnosis : {$last:"$diagnosis"},
            admissionDate : {$last:"$admissionDate"},
            price: {$last:"$price"},
            cost: {$last:0},
            expiration: { $push:"$expiration"},
            sell_price: { $last:"$sell_price"},
            buy_price: { $last: "$buy_price"},
            amount: { $sum:"$amount"}}},
         {
            $lookup: {
               from: "services",
               localField: "service",    // field in the Trasaction collection
               foreignField: "_id",  // field in the Service collection
               as: "fromService"
            }
         },
         {
            $replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$fromService", 0 ] }, "$$ROOT" ] } }
         },
         { $project: { fromService: 0 } },
        {$group: {
            _id:"$class",
            patientName:{$last:"$patientName"},
            class:{$last:"$class"},
            serviceName: {$push:"$name"},
            treatingDoctor:{$last:"$treatingDoctor"},
            service_type : {$last:"$service_type"},
            rfc : {$last:"$rfc"},
            diagnosis : {$last:"$diagnosis"},
            admissionDate : {$last:"$admissionDate"},
            price: {$push:"$price"},
            cost: {$push:0},
            expiration: { $push:"$expiration"},
            sell_price: { $push:"$sell_price"},
            buy_price: { $push: "$buy_price"},
            amount: { $push:"$amount"}}},
        {$addFields:{totalSell : { $sum: "$sell_price" }}},
        {$addFields:{totalBuy : { $sum: "$buy_price" }}},
        {$addFields:{totalPrice : { $sum: "$price" }}},
        {$addFields:{totalCost : { $sum: "$cost" }}},
    ]).collation({locale:"en", strength: 1});
    if (!patient) {
        req.flash('error', 'No se encontro paciente!');
        return res.redirect('/patients');
    }
    begin = req.query.begin;
    end = req.query.end;
    patient.sort((a,b)=>a.class.localeCompare(b.class,"es",{sensitivity:'base'}))
    res.render(`patients/showAccount`, { patient,begin,end});
}



module.exports.accountToPDF = async (req,res) =>{ 
    let {begin,end,name} = req.query; 
                  
    // const browser = await puppeteer.launch();       // run browse
    const chromeOptions = {
        headless: true,
        defaultViewport: null,
        args: [
            "--incognito",
            "--no-sandbox",
            "--single-process",
            "--no-zygote"
        ],
    };
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'], ignoreDefaultArgs: ['--disable-extensions']});


    const page = await browser.newPage();           // open new tab
    
    // await page.goto(`https://pure-brushlands-42473.herokuapp.com/patients/${req.params.id}/showAccount?begin=${begin}&end=${end}`,{
    //     waitUntil: 'networkidle0'}); 
    // await page.goto(`https://warm-forest-49475.herokuapp.com/patients/${req.params.id}/showAccount?begin=${begin}&end=${end}`,{
    //     waitUntil: 'networkidle0'});          // go to site
    await page.goto(
        `https://clinicasanromanadmin-production.up.railway.app/patients/${req.params.id}/showAccount?begin=${begin}&end=${end}`,{
          waitUntil: 'networkidle0'});
    // await page.goto(
    // `http://localhost:3000/patients/${req.params.id}/showAccount?begin=${begin}&end=${end}`,{
    //     waitUntil: 'networkidle0'});

    const dom = await page.$eval('.toPDF', (element) => {
        return element.innerHTML
    }) // Get DOM HTML
    await page.setContent(dom)   // HTML markup to assign to the page for generate pdf
    await page.addStyleTag({url: "https://stackpath.bootstrapcdn.com/bootstrap/5.0.0-alpha1/css/bootstrap.min.css"});
    await page.addStyleTag({content: `.image_print{
            position:absolute;
            top:10px;
            left:200px;
            width:200px;
            height: 100px;
        }
        .subRed {
            font-size: 70% !important;
            line-height: 1 !important;
          }
            .reduced {
                font-size: 60% !important;
                line-height: 1 !important;
              }`})
    const pdf = await page.pdf({landscape: false})
    await browser.close(); 
    res.contentType("application/pdf");
    res.send(pdf);
}


module.exports.dischAccountPDF = async (req,res) =>{ 
    let {begin,end,name} = req.query;               
    // const browser = await puppeteer.launch();       // run browser
    const chromeOptions = {
        headless: true,
        defaultViewport: null,
        args: [
            "--incognito",
            "--no-sandbox",
            "--single-process",
            "--no-zygote"
        ],
    };
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'], ignoreDefaultArgs: ['--disable-extensions']});





    const page = await browser.newPage();           // open new tab
    
    // await page.goto(`https://pure-brushlands-42473.herokuapp.com/patients/${req.params.id}/showAccount?begin=${begin}&end=${end}`,{
    //     waitUntil: 'networkidle0'}); 
    await page.goto(`https://clinicasanromanadmin-production.up.railway.app/patients/${req.params.id}/showDischarged`,{
        waitUntil: 'networkidle0'});          // go to site
    // await page.goto(
    //     `http://localhost:3000/patients/${req.params.id}/showDischarged`,{
    //       waitUntil: 'networkidle0'});

    const dom = await page.$eval('.toPDF', (element) => {
        return element.innerHTML
    }) // Get DOM HTML
    await page.setContent(dom)   // HTML markup to assign to the page for generate pdf
    await page.addStyleTag({url: "https://stackpath.bootstrapcdn.com/bootstrap/5.0.0-alpha1/css/bootstrap.min.css"});
    await page.addStyleTag({content: `.image_print{
            position:absolute;
            top:10px;
            left:200px;
            width:200px;
            height: 100px;
        }
        .subRed {
            font-size: 70% !important;
            line-height: 1 !important;
          }
            .reduced {
                font-size: 60% !important;
                line-height: 1 !important;
              }`})
    const pdf = await page.pdf({landscape: false})
    await browser.close(); 
    res.contentType("application/pdf");
    res.send(pdf);
}


//search supplies from patient account
module.exports.search_3 = async (req, res) => {
        let {search} = req.query;
        search = new RegExp(escapeRegExp(search), 'gi');
        const dbQueries =  [
            { name: search },
            { class: search },
            { principle: search },
            { description: search },
            { doctor: search}
        ];
        
        let supplies = await Service.find({$or:dbQueries,deleted:false}).limit(3);
		if (!supplies) {
			res.locals.error = 'No results match that query.';
        }
        res.json(supplies);
}



function getDaysInMonthUTC(month, year) {
    var date = new Date(Date.UTC(year, month, 1));
    var days = [];
    while (date.getUTCMonth() === month) {
      days.push(new Date(date));
      date.setUTCDate(date.getUTCDate() + 1);
    }
    return days;
  }
  
module.exports.searchAll = async (req, res) => {
    let {search,exp} = req.query;
        search = new RegExp(escapeRegExp(search), 'gi');
        const dbQueries =  [
            { name: search },
            { class: search },
            { principle: search },
            { description: search },
            { doctor: search}
        ];
        let supplies = [];
        if(exp){
            expirations = [];
            exp = new Date(exp);
            expirations = getDaysInMonthUTC(exp.getUTCMonth(),exp.getUTCFullYear());
            supplies = await Service.find({$or:dbQueries,deleted:false,expiration:{$in:expirations}});
        }else{
            supplies = await Service.find({$or:dbQueries,deleted:false});
        }
		if (!supplies) {
			res.locals.error = 'Ningun producto corresponde a la busqueda';
        }
		res.json(supplies);
}

module.exports.addToCart = async (req, res) => {
    const patient = await Patient.findById(req.params.id);
    const service = await Service.findById(req.body.service);
    const timeUnits =  ["Hora", "Dia"];
    //variable for local time 
    const nDate = getMexicoCityTime();
    console.log('datetime now');
    console.log(nDate);
    let termDate = nDate;
    let amnt = 0;
    if(!timeUnits.includes(service.unit)){
        amnt = req.body.addAmount;
    }
    const transaction = new Transaction({
        patient: patient,
        service:service,
        amount:amnt,
        consumtionDate:nDate,
        addedBy:req.user,
        location:req.body.location,
        terminalDate:termDate
    });
    if(service.service_type == "supply"){
        if((service.stock - req.body.addAmount) < 0 ){
            return res.send({ msg: "False",serviceName:`${service.name}`});
        }else{
            service.stock = service.stock-req.body.addAmount;
        }
    }
    patient.servicesCar.push(transaction);
    await transaction.save();
    await patient.save();
    //Remove supply from the inventory
    await service.save();
    return res.send({ msg: "True",serviceName:`${service.name}`,patientName:`${patient.name}`});
}

module.exports.deleteServiceFromAccount = async (req, res) => {
    const service = await Service.findById(req.body.serviceID);
    const begin = new Date(req.body.begin+"T00:00:01.000Z");
    const end = new Date(req.body.end+"T23:59:01.000Z");
    const patient = await Patient.findByIdAndUpdate(req.params.id,{$pull:{servicesCar:{_id:req.body.trans_id}}}).populate({
        path: 'servicesCar',
        populate: {
          path: 'service',
        },
      });
    let trans =  await Transaction.findByIdAndDelete(req.body.trans_id);
    if(service.service_type=="supply"){service.stock += parseInt(req.body.amount)};
    await service.save()
    await patient.save();
    return res.send({msg:"True"});
}

module.exports.updateServiceFromAccount = async (req, res) => {
    const service = await Service.findById(req.body.serviceID);
    const nDate = getMexicoCityTime()
    const patient = await Patient.findByIdAndUpdate(req.params.id,{$pull:{servicesCar:{_id:req.body.trans_id}}}).populate({
        path: 'servicesCar',
        populate: {
          path: 'service',
        },
      });
    const req_amount = req.body.amount;
    let transact = await Transaction.findById(req.body.trans_id);
    let location = transact.location;
    const difference = transact.amount - req_amount;
    if(difference<0){
        if(service.service_type == "supply"){
            if((service.stock - Math.abs(difference)) < 0 ){
                return res.send({ msg: "False",serviceName:`${service.name}`});
            }else{
                service.stock = service.stock - Math.abs(difference);
            }
        }
    }else{
        service.stock = service.stock + Math.abs(difference);
    }
    await Transaction.deleteMany({_id:req.body.trans_id});
    const new_trans = new Transaction({patient: patient,service:service,amount:req_amount,location:location,consumtionDate:nDate,addedBy:req.user});
    patient.servicesCar.push(new_trans);
    await new_trans.save();
    //Remove supply from the inventory
    await service.save();
    await patient.save();
    //update transactions (delete all transactions with that service and create a new one with new amount)
    return res.send({ msg: "True",serviceName:`${service.name}`,patientName:`${patient.name}`});
}



module.exports.updateTimeService = async (req, res) => {
    const service = await Service.findById(req.body.serviceID);
    const patient = await Patient.findById(req.params.id);
    const nDate = getMexicoCityTime();
    // let transact = await Transaction.findById(req.body.trans_id);
    let toggle = req.body.toggle == "true";
    let start = new Date(req.body.start+":01.000Z"),
        end = (toggle)?nDate:new Date(req.body.until+":01.000Z");
    //calculate the unit time in miliseconds
    let miliUnit = (service.unit == "Dia")?(86400*1000):(3600*1000);
    //divide the difference between start and end batween the miliseconds unit
    let new_amount = (end.getTime() - start.getTime())/miliUnit;
    new_amount = Math.round(new_amount * 100) / 100;
    await Transaction.deleteMany({_id:req.body.trans_id});
    const transaction = new Transaction({
        patient: patient,
        service:service,
        amount:new_amount,
        consumtionDate:start,
        addedBy:req.user,
        terminalDate:end,
        toggle:toggle
    });
    patient.servicesCar.push(transaction);
    await transaction.save()
    //Remove supply from the inventory
    await patient.save();
    //update transactions (delete all transactions with that service and create a new one with new amount)
    return res.send({ msg: "True",serviceName:`${service.name}`,patientName:`${patient.name}`});
}

// module.exports.updateTimeService = async (req, res) => {
//     const service = await Service.findById(req.body.serviceID);
//     const patient = await Patient.findById(req.params.id);
//     const nDate = getMexicoCityTime()
//     console.log()
//     // let transact = await Transaction.findById(req.body.trans_id);
//     let toggle = req.body.toggle == "true";
//     let start = new Date(convertUTCDateToLocalDate(new Date(req.body.start))),
//         end = (toggle)?nDate:new Date(convertUTCDateToLocalDate(new Date(req.body.until)));
//     //calculate the unit time in miliseconds
//     let miliUnit = (service.unit == "Dia")?(86400*1000):(3600*1000);
//     //divide the difference between start and end batween the miliseconds unit
//     let new_amount = (end.getTime() - start.getTime())/miliUnit;
//     new_amount = Math.round(new_amount * 100) / 100;
//     await Transaction.deleteMany({_id:req.body.trans_id});
//     const transaction = new Transaction({
//         patient: patient,
//         service:service,
//         amount:new_amount,
//         consumtionDate:start,
//         addedBy:req.user,
//         terminalDate:end,
//         toggle:toggle
//     });
//     patient.servicesCar.push(transaction);
//     await transaction.save()
//     //Remove supply from the inventory
//     await patient.save();
//     //update transactions (delete all transactions with that service and create a new one with new amount)
//     return res.send({ msg: "True",serviceName:`${service.name}`,patientName:`${patient.name}`});
// }