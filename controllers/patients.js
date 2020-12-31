const mongoose = require('mongoose');
const {Service,Supply,Hospital} = require('../models/service');
const Transaction = require('../models/transaction');
const Patient = require('../models/patient');
const { cloudinary } = require("../cloudinary");
const mongoosePaginate = require("mongoose-paginate-v2");
const puppeteer = require('puppeteer'); 

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
  }

module.exports.index = async (req, res) => {
    const patients = await Patient.find({}).sort("-admissionDate").populate("author");
    res.render('patients/index',{patients})
}


module.exports.renderNewForm = (req, res) => {
    res.render("patients/new");
}

module.exports.createPatient = async (req, res, next) => {
    const patient = new Patient(req.body.patient);
    patient.author = req.user._id;
    await patient.save();
    req.flash('success', 'Paciente creado!');
    res.redirect("/patients")
}


module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const patient = await Patient.findById(id);
    console.log(patient);
    if (!patient) {
        req.flash('error', 'Error al buscar paciente!');
        return res.redirect('/patients');
    }
    res.render("patients/edit", { patient });
}

module.exports.updatePatient = async (req, res) => {
    const { id } = req.params;
    const patient = await Patient.findByIdAndUpdate(id, { ...req.body.patient });
    await patient.save();
    req.flash('success', 'Paciente actualizado correctamente!');
    res.redirect(`/patients`)
}

module.exports.dischargePatient = async (req, res) => {
    const { id } = req.params;
    const patient = await Patient.findById(id);
    patient.discharged = true
    patient.dischargedDate =new Date;
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
    let {begin,end} = req.query;
    if(!begin){begin = new Date(2020, 10, 17) }else{begin = new Date(begin)};
    if(!end){end = new Date}else{end = new Date(end+"T23:59:59")};
    const patient = await Patient.findById(req.params.id).populate({
        path: 'servicesCar',
        populate: {
          path: 'service addedBy',
        },
      })
    const str_id = JSON.stringify(patient._id); 
    if (!patient) {
        req.flash('error', 'No se encontro paciente!');
        return res.redirect('/patients');
    }
    res.render(`patients/show`, { patient, str_id,begin,end});
}

module.exports.patientAccount = async (req, res) => {
    let {begin,end} = req.query;
    if(!begin){begin = new Date(-8640000000000000)}else{begin = new Date(begin+"T00:00:01")};
    if(!end){end = new Date}else{end = new Date(end+"T23:59:59")};
    console.log(req.params.id);
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
    const browser = await puppeteer.launch(chromeOptions);
    const page = await browser.newPage();           // open new tab
    await page.goto(`https://warm-forest-49475.herokuapp.com/patients/${req.params.id}/showAccount?begin=${begin}&end=${end}`,{
        waitUntil: 'networkidle0'});          // go to site
    const dom = await page.$eval('.toPDF', (element) => {
        return element.innerHTML
    }) // Get DOM HTML
    await page.setContent(dom)   // HTML markup to assign to the page for generate pdf
    await page.addStyleTag({url: "https://stackpath.bootstrapcdn.com/bootstrap/5.0.0-alpha1/css/bootstrap.min.css"});
    const pdf = await page.pdf({landscape: true})
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
            { description: search },
            { doctor: search}
        ];
        
        let supplies = await Service.find({$or:dbQueries,deleted:false}).limit(3);
		if (!supplies) {
			res.locals.error = 'No results match that query.';
        }
        res.json(supplies);
}


//search for hospital services
module.exports.searchAllPatients = async (req, res) => {
    let {search,sorted,begin,end} = req.query;
    console.log(req.query)
    search = new RegExp(escapeRegExp(search), 'gi');
    let dbQueries =  [
            { name: search },
            { treatingDoctor: search },
            { description: search },
        ];
    begin = new Date(begin+"T00:00:01")
    end = new Date(end+"T23:59:59")
    let patients = await Patient.find({$or:dbQueries,admissionDate:{$gte:begin,$lte:end}}).sort("-admissionDate").populate("author");
    begin = req.query.begin;
    end = req.query.end;
    if(sorted == "name"){
    //sort in alphabetical order
        patients.sort((a,b)=>a.name.localeCompare(b.name,"es",{sensitivity:'base'}))
    };
    if(sorted == "doctor"){
        //sort in alphabetical order
        patients.sort((a,b)=>a.treatingDoctor.localeCompare(b.treatingDoctor,"es",{sensitivity:'base'}))
    };
    if(sorted == "diagnosis"){
        //sort in alphabetical order
        patients.sort((a,b)=>a.diagnosis.localeCompare(b.diagnosis,"es",{sensitivity:'base'}))
    };
    if (!patients) {
        res.locals.error = 'Ningun servicio corresponde a la busqueda';
        res.json({})
    }
    res.json({'patients':patients,'begin':begin,'end':end})
}


module.exports.searchAll = async (req, res) => {
    let {search} = req.query;
        search = new RegExp(escapeRegExp(search), 'gi');
        const dbQueries =  [
            { name: search },
            { class: search },
            { description: search },
            { doctor: search}
        ];
        let supplies = await Service.find({$or:dbQueries,deleted:false});
		if (!supplies) {
			res.locals.error = 'Ningun producto corresponde a la busqueda';
        }
		res.json(supplies);
}

module.exports.addToCart = async (req, res) => {
    const patient = await Patient.findById(req.params.id);
    const service = await Service.findById(req.body.service);
    const transaction = new Transaction({patient: patient,service:service._id,amount:req.body.addAmount,consumtionDate:new Date,addedBy:req.user});
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
    const begin = req.body.begin+"T00:00:01";
    const end = req.body.end+"T23:59:59";
    console.log(begin,end)
    const patient = await Patient.findByIdAndUpdate(req.params.id,{$pull:{services:service,consumtionDate:{$gte:begin,$lte:end}}}).populate({
        path: 'servicesCar',
        populate: {
          path: 'service',
        },
      });
    let trans = await Transaction.find({patient: patient,service:service,consumtionDate:{$gte:begin,$lte:end}});
    for(let t of trans){
        await Transaction.findByIdAndDelete({_id:t._id});
    }
    if(service.service_type=="supply"){service.stock += parseInt(req.body.amount)};
    await service.save()
    return res.send({msg:"True"});
}

module.exports.updateServiceFromAccount = async (req, res) => {
    const service = await Service.findById(req.body.serviceID);
    const patient = await Patient.findByIdAndUpdate(req.params.id,{$pull:{service:service}}).populate({
        path: 'servicesCar',
        populate: {
          path: 'service',
        },
      });
    const req_amount = req.body.amount;
    let new_car = patient.servicesCar.filter(el => el.service.name == service.name);
    let total_amount = new_car.reduce((total,curr)=> total += curr.amount,0);
    const difference = total_amount - req_amount;
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
    await Transaction.deleteMany({patient:patient,service:service});
    const new_trans = new Transaction({patient: patient,service:service,amount:req_amount,consumtionDate:new Date,addedBy:req.user});
    patient.servicesCar.push(new_trans);
    await new_trans.save();
    //Remove supply from the inventory
    await service.save();
    await patient.save();
    //update transactions (delete all transactions with that service and create a new one with new amount)
    return res.send({ msg: "True",serviceName:`${service.name}`,patientName:`${patient.name}`});
}