const {Service,Supply,Hospital} = require('../models/service');
const Transaction = require('../models/transaction');
const Exit = require('../models/exit');
const Point = require('../models/refillPoint');
const Payment = require('../models/payment');
const { date } = require('joi');
const puppeteer = require('puppeteer'); 
function convertUTCDateToLocalDate(date) {

    date = new Date(date);
  
    var localOffset = date.getTimezoneOffset() * 60000;
  
    var localTime = date.getTime();
  
    date = localTime - localOffset;
  
    //date = new Date(date);
  
    return date;
  
    }

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
  }


//functions for calculating array of dates in range by leap of # days
Date.prototype.addDays = function(days) {
    let dat = new Date(this.valueOf())
    dat.setDate(dat.getDate() + days);
    return dat;
}

//Calculate Dates based on start, end Date and the amount of desired dates
function getDates(startDate, stopDate,terms) {
    let dateArray = [];
    let currentDate = startDate;
    startDate = new Date(startDate);
    stopDate = new Date(stopDate+"T23:59:01.000Z");
    //first payment starts after 5 days
    startDate = startDate.addDays(5);
    
    //If there is a single payment then we want the end date to be precisely the payment date
    if(terms == 1){
        return [stopDate];
    }
    currentDate  = startDate;
    // To calculate the time difference of two dates 
    const Difference_In_Time = stopDate.getTime() - startDate.getTime(); 
  
    // To calculate the no. of days between two dates 
    const Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24); 
    const leap = Math.ceil(Difference_In_Days/terms);
    while (currentDate <= stopDate) {
        dateArray.push(currentDate)
        currentDate = currentDate.addDays(leap);
    }
    return dateArray;
 }


//Exits are handled as payments (arrays of exits) for more flexibility while editing
module.exports.index = async (req, res) => {
    const payments = await Payment.find({});
    res.render('exits/index',{payments})
}

module.exports.hospital_account = async (req, res) => {
    const nDate = new Date(convertUTCDateToLocalDate(new Date))
    let default_begin = new Date(convertUTCDateToLocalDate(new Date));
    default_begin.setDate( default_begin.getDate() - 6 );
    let begin = req.query.begin || default_begin;
    let end =req.query.end || nDate;
    let sorted =  req.query.sorted || 'name';
    let hospital = (req.query.entry == "honorarios")?"false":"true";
    let honorary = "true";
    let transactions = {};
    begin =new Date(convertUTCDateToLocalDate( new Date(begin)))
    end = new Date(convertUTCDateToLocalDate(new Date(end)))
    const exits = await Exit.aggregate( 
        //recreate supply element by compressing elements with same name. Now the fields are arrays
        [   
            //first we need to have access to the service fields. So we unwind all of them
            {$match: {clearDate:{$gte:begin,$lte:end}}},
            {$group: {
                //match the begining of the name field
                _id:"$name",
                name:{$last:"$name"},
                dueDate:{$last:"$clearDate"},
                price:{$last:"$moneyAmount"},
                moneyAmount:{$push:"$moneyAmount"},
            }},
            {$addFields:{totalAmount : { $size: "$moneyAmount" }}},
            {$addFields:{totalCost : { $trunc: [ { $sum: "$moneyAmount" },3]}}},
         ]
          //specify language-specific rules for string comparison
    ).collation({locale:"en", strength: 1});

    if((sorted == "name") || (sorted == "Ordenar por:")){
        //sort in alphabetical order
        transactions = await Transaction.aggregate( 
            //recreate supply element by compressing elements with same name. Now the fields are arrays
            [   
                // put in a single document both transaction and service fields
                {$match: {consumtionDate:{$gte:begin,$lte:end}}},
                {$match: {discharged_data:{$exists: true, $ne: null }}},
                {
                    $lookup: {
                        from: "disches",
                        localField: "discharged_data",    // field in the Trasaction collection
                        foreignField: "_id",  // field in the disch collection
                        as: "fromDischarged"
                        }
                 },
                 {
                    $replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$fromDischarged", 0 ] }, "$$ROOT" ] } }
                 },
                 { $project: { fromDischarged: 0 } },
                 {$match: {hospitalEntry:{$in:[hospital,honorary]}}},
                 {$group: {
                    _id:"$name",
                    name:{$last:"$name"},
                    class:{$last:"$class"},
                    // consumtionDate: {$last:"$consumtionDate"},
                    service_type:{$last:"$service_type"},
                    price: {$last:"$unitPrice"},
                    sell_price: {$last:"$unitPrice"},
                    buy_price: { $last:"$buyPrice"},
                    amount: { $sum:"$amount"}}},
                {$addFields:{totalBuy : { $multiply: ["$buy_price","$amount"] }}},
                {$addFields:{totalSell : { $multiply: ["$price","$amount"] }}},
                {$addFields:{totalPrice : { $multiply: ["$price","$amount"] }}},
                 
            ]);
            transactions.sort((a,b)=>a.class.localeCompare(b.class,"es",{sensitivity:'base'}))
    };
    if(sorted == "class"){
        //Case for storing based on stock need

        transactions = await Transaction.aggregate( 
            //recreate supply element by compressing elements with same name. Now the fields are arrays
            [   
                // put in a single document both transaction and service fields
                
                {$match: {consumtionDate:{$gte:begin,$lte:end}}},
                {$match: {discharged_data:{$exists: true, $ne: null }}},                {
                    $lookup: {
                        from: "disches",
                        localField: "discharged_data",    // field in the Trasaction collection
                        foreignField: "_id",  // field in the disch collection
                        as: "fromDischarged"
                        }
                 },
                 {
                    $replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$fromDischarged", 0 ] }, "$$ROOT" ] } }
                 },
                 { $project: { fromDischarged: 0 ,service:0} },
                {$match: {processDate:{$gte:begin,$lte:end},hospitalEntry:{$in:[hospital,honorary]}}},
                {$group: {
                    _id:"$class",
                    class:{$last:"$class"},
                    service_type : {$last:"$service_type"},
                    price: {$push:{$multiply: [ "$unitPrice","$amount"] }},
                    cost: {$push:0},
                    sell_price: { $push:{$multiply: [ "$unitPrice" ,"$amount"]}},
                    buy_price: { $push: {$multiply: [ "$buyPrice" ,"$amount"]}},
                    amount: { $sum:"$amount"}}},
                {$addFields:{totalSell : { $sum: "$sell_price" }}},
                {$addFields:{totalBuy : { $sum: "$buy_price" }}},
                {$addFields:{totalPrice : { $sum: "$price" }}},
                {$addFields:{totalCost : { $sum: "$cost" }}},
            ]).collation({locale:"en", strength: 1});
        //return supplies and the sorted argument for reincluding it
        transactions.sort((a,b)=>a.class.localeCompare(b.class,"es",{sensitivity:'base'}))

    }
    if(sorted == "patient"){
        //sort in alphabetical order
        transactions = await Transaction.aggregate( 
            //recreate supply element by compressing elements with same name. Now the fields are arrays
            [   
                {$match: {consumtionDate:{$gte:begin,$lte:end}}},
                {$match: {discharged_data:{$exists: true, $ne: null }}},                {
                    $lookup: {
                        from: "disches",
                        localField: "discharged_data",    // field in the Trasaction collection
                        foreignField: "_id",  // field in the disch collection
                        as: "fromDischarged"
                        }
                 },
                 {
                    $replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$fromDischarged", 0 ] }, "$$ROOT" ] } }
                 },
                 { $project: { fromDischarged: 0,name:0 } },
                 {$match: {processDate:{$gte:begin,$lte:end},hospitalEntry:{$in:[hospital,honorary]}}},
                 // put in a single document both transaction and service fields
                //  {$unwind:"$patient"},
                {
                    $lookup: {
                       from: "patients",
                       localField: "patient",    // field in the Trasaction collection
                       foreignField: "_id",  // field in the Service collection
                       as: "fromPatient"
                    }
                 },
                 {$unwind:"$patient"},

                 {
                    $replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$fromPatient", 0 ] }, "$$ROOT" ] } }
                 },
                 { $project: { fromPatient: 0 } },
                 {$group: {
                    _id:"$name",
                    patientId:{$last:"$patient"},
                    name:{$last:"$name"},
                    admissionDate: {$last:"$admissionDate"},
                    price: {$push:{$multiply: [ "$unitPrice","$amount"] }},
                    cost: {$push:0},
                    sell_price: { $push:{$multiply: [ "$unitPrice" ,"$amount"]}},
                    buy_price: { $push: {$multiply: [ "$buyPrice" ,"$amount"]}},
                    amount: { $sum:"$amount"}}},
                {$addFields:{totalSell : { $sum: "$sell_price" }}},
                {$addFields:{totalBuy : { $sum: "$buy_price" }}},
                {$addFields:{totalPrice : { $sum: "$price" }}},
                {$addFields:{totalCost : { $sum: "$cost" }}},
            ]).collation({locale:"en", strength: 1});
        //return supplies and the sorted argument for reincluding it
        transactions.sort((a,b)=>a.name.localeCompare(b.name,"es",{sensitivity:'base'}))
    };
    // transactions = await Transaction.find({consumtionDate:{$gte:begin,$lte:end},service:{hospitalEntry:$or[honorary,hospital]}}).populate('service')
    res.render('exits/hospital_account',{transactions,exits})
}

//get services and payments based on specified queries
module.exports.servicesPayments = async (req, res) => {
    let {entry,exit,hospital,honorary,sorted,begin,end} = req.query;
    entry = (entry == "entry")?true:false;
    exit = (exit == "exit")?true:false;
    // hospitalEntry == true then we just get entries to the hospital
    hospital = (hospital == "hospital")?"true":"false";
    honorary = (honorary == "honorary")?"false":"true";
    begin = new Date(begin+"T00:00:01.000Z");
    end = new Date(end+"T23:59:01.000Z");
    let transactions = {};
    let exits = {};
    if(exit){
        exits = await Exit.aggregate( 
            //recreate supply element by compressing elements with same name. Now the fields are arrays
            [   
                {$match: {clearDate:{$gte:begin,$lte:end}}},
                {$group: {
                    //match the begining of the name field
                    _id:"$name",
                    name:{$last:"$name"},
                    dueDate:{$last:"$clearDate"},
                    price:{$last:"$moneyAmount"},
                    moneyAmount:{$push:"$moneyAmount"},
                }},
                {$addFields:{totalAmount : { $size: "$moneyAmount" }}},
                {$addFields:{totalCost : { $trunc: [ { $sum: "$moneyAmount" },3]}}},
             ]
              //specify language-specific rules for string comparison
        ).collation({locale:"en", strength: 1});
    }
    if(entry){
    if((sorted == "name") || (sorted == "Ordenar por:")){
        //sort in alphabetical order
        transactions = await Transaction.aggregate( 
            //recreate supply element by compressing elements with same name. Now the fields are arrays
            [   
                // put in a single document both transaction and service fields
                {$match: {consumtionDate:{$gte:begin,$lte:end}}},
                {$match: {discharged_data:{$exists: true, $ne: null }}},
                {
                    $lookup: {
                        from: "disches",
                        localField: "discharged_data",    // field in the Trasaction collection
                        foreignField: "_id",  // field in the disch collection
                        as: "fromDischarged"
                        }
                 },
                 {
                    $replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$fromDischarged", 0 ] }, "$$ROOT" ] } }
                 },
                 { $project: { fromDischarged: 0 } },
                {$match: {processDate:{$gte:begin,$lte:end},hospitalEntry:{$in:[hospital,honorary]}}},
                {$group: {
                    _id:"$name",
                    name:{$last:"$name"},
                    class:{$last:"$class"},
                    consumtionDate: {$last:"$processDate"},
                    service_type:{$last:"$service_type"},
                    price: { $last:"$unitPrice"},
                    sell_price: { $last:"$unitPrice"},
                    buy_price: { $last:"$buyPrice"},
                    amount: { $sum:"$amount"}}},
                {$addFields:{totalSell : { $multiply: ["$sell_price","$amount"] }}},
                {$addFields:{totalBuy : { $multiply: ["$buy_price","$amount"] }}},
                {$addFields:{totalPrice : { $multiply: ["$price","$amount"] }}},
            ]).collation({locale:"en", strength: 1});
        // transactions = await Transaction.find({consumtionDate:{$gte:begin,$lte:end},service:{hospitalEntry:$or[honorary,hospital]}}).populate('service')
        transactions.sort((a,b)=>a.name.localeCompare(b.name,"es",{sensitivity:'base'}))
        
    };
    if(sorted == "class"){
        //Case for storing based on stock need

        transactions = await Transaction.aggregate( 
            //recreate supply element by compressing elements with same name. Now the fields are arrays
            [   
                // put in a single document both transaction and service fields
                {$match: {consumtionDate:{$gte:begin,$lte:end}}},
                {$match: {discharged_data:{$exists: true, $ne: null }}},                {
                    $lookup: {
                        from: "disches",
                        localField: "discharged_data",    // field in the Trasaction collection
                        foreignField: "_id",  // field in the disch collection
                        as: "fromDischarged"
                        }
                 },
                 {
                    $replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$fromDischarged", 0 ] }, "$$ROOT" ] } }
                 },
                 { $project: { fromDischarged: 0 ,service:0} },
                {$match: {processDate:{$gte:begin,$lte:end},hospitalEntry:{$in:[hospital,honorary]}}},
                {$group: {
                    _id:"$class",
                    class:{$last:"$class"},
                    service_type : {$last:"$service_type"},
                    price: {$push:{$multiply: [ "$unitPrice","$amount"] }},
                    cost: {$push:0},
                    sell_price: { $push:{$multiply: [ "$unitPrice" ,"$amount"]}},
                    buy_price: { $push: {$multiply: [ "$buyPrice" ,"$amount"]}},
                    amount: { $sum:"$amount"}}},
                {$addFields:{totalSell : { $sum: "$sell_price" }}},
                {$addFields:{totalBuy : { $sum: "$buy_price" }}},
                {$addFields:{totalPrice : { $sum: "$price" }}},
                {$addFields:{totalCost : { $sum: "$cost" }}},
            ]).collation({locale:"en", strength: 1});
        //return supplies and the sorted argument for reincluding it
        transactions.sort((a,b)=>a.class.localeCompare(b.class,"es",{sensitivity:'base'}))

    }
    if(sorted == "patient"){
        //sort in alphabetical order
        transactions = await Transaction.aggregate( 
            //recreate supply element by compressing elements with same name. Now the fields are arrays
            [   
                {$match: {consumtionDate:{$gte:begin,$lte:end}}},
                {$match: {discharged_data:{$exists: true, $ne: null }}},                {
                    $lookup: {
                        from: "disches",
                        localField: "discharged_data",    // field in the Trasaction collection
                        foreignField: "_id",  // field in the disch collection
                        as: "fromDischarged"
                        }
                 },
                 {
                    $replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$fromDischarged", 0 ] }, "$$ROOT" ] } }
                 },
                 { $project: { fromDischarged: 0,name:0 } },
                 {$match: {processDate:{$gte:begin,$lte:end},hospitalEntry:{$in:[hospital,honorary]}}},
                 // put in a single document both transaction and service fields
                //  {$unwind:"$patient"},
                {
                    $lookup: {
                       from: "patients",
                       localField: "patient",    // field in the Trasaction collection
                       foreignField: "_id",  // field in the Service collection
                       as: "fromPatient"
                    }
                 },
                 {$unwind:"$patient"},

                 {
                    $replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$fromPatient", 0 ] }, "$$ROOT" ] } }
                 },
                 { $project: { fromPatient: 0 } },
                 {$group: {
                    _id:"$name",
                    patientId:{$last:"$patient"},
                    name:{$last:"$name"},
                    admissionDate: {$last:"$admissionDate"},
                    price: {$push:{$multiply: [ "$unitPrice","$amount"] }},
                    cost: {$push:0},
                    sell_price: { $push:{$multiply: [ "$unitPrice" ,"$amount"]}},
                    buy_price: { $push: {$multiply: [ "$buyPrice" ,"$amount"]}},
                    amount: { $sum:"$amount"}}},
                {$addFields:{totalSell : { $sum: "$sell_price" }}},
                {$addFields:{totalBuy : { $sum: "$buy_price" }}},
                {$addFields:{totalPrice : { $sum: "$price" }}},
                {$addFields:{totalCost : { $sum: "$cost" }}},
            ]).collation({locale:"en", strength: 1});
        //return supplies and the sorted argument for reincluding it
        transactions.sort((a,b)=>a.name.localeCompare(b.name,"es",{sensitivity:'base'}))
    };
    // transactions = await Transaction.find({consumtionDate:{$gte:begin,$lte:end},service:{hospitalEntry:$or[honorary,hospital]}}).populate('service')
}
    let arguments= {...(req.query)};
    return res.json({"transactions":transactions,'exits':exits,'currentUser':req.user, ...arguments})
}


//reset time point for resupply
module.exports.editDatePoint = async (req, res) => {
    let timePoint = await Point.findOne({name:"datePoint"});
    const nDate = new Date(convertUTCDateToLocalDate(new Date))
    timePoint.setPoint = nDate
    await timePoint.save()
    res.render(`exits`);
}



//render create payment form
module.exports.renderNewForm = (req, res) => {
    res.render(`exits/new`);
}

// render list of products to be refilled.
module.exports.refillForm = async (req, res) => {
    let entrega = req.query.entrega;
    let recibe = req.query.recibe;
    let timePoint = await Point.findOne({name:"datePoint"});
    let transactions =  await Transaction.find({consumtionDate:{$gte:timePoint.setPoint}}).populate("service").populate("addedBy");
    res.render(`exits/refill_form`,{transactions,entrega,recibe});
}


module.exports.refillFormPDF = async (req,res) =>{ 
    // let {begin,end,name} = req.query;               
    // const browser = await puppeteer.launch();       // run browser
    let entrega = req.body.refill.entrega;
    let recibe = req.body.refill.recibe;
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
    const page = await browser.newPage();           // open new tab yes
    
    // await page.goto(`https://pure-brushlands-42473.herokuapp.com/patients/${req.params.id}/showAccount?begin=${begin}&end=${end}`,{
    //     waitUntil: 'networkidle0'}); 
    // await page.goto(`https://warm-forest-49475.herokuapp.com/exits/refill`,{
    //     waitUntil: 'networkidle0'});          // go to site
    // await page.goto(
    //     `http://localhost:3000/patients/${req.params.id}/showAccount?begin=${begin}&end=${end}`,{
    //       waitUntil: 'networkidle0'});
    await page.goto(`https://warm-forest-49475.herokuapp.com/exits/refill?entrega=${entrega}&recibe=${recibe}`,{
                waitUntil: 'networkidle0'});
    // await page.goto(`http://localhost:3000/exits/refill?entrega=${entrega}&recibe=${recibe}`,{
    //             waitUntil: 'networkidle0'});
    const dom = await page.$eval('.toPDF', (element) => {
        return element.innerHTML
    }) // Get DOM HTML
    await page.setContent(dom)   // HTML markup to assign to the page for generate pdf
    await page.addStyleTag({url: "https://stackpath.bootstrapcdn.com/bootstrap/5.0.0-alpha1/css/bootstrap.min.css"});
    await page.addStyleTag({content: `.image_print{
        position:absolute;
        top:50px;
        left:20px;
        width:250px;
        height: 120px;
      }`})
    const pdf = await page.pdf({landscape: false})
    await browser.close(); 
    res.contentType("application/pdf");
    res.send(pdf);
}

module.exports.createPayment = async (req, res, next) => {
    let {name, dueDate, moneyAmount} = req.body.payment;
    let payment =  new Payment(req.body.payment);
    let terms = parseInt(req.body.payment.terms);
    let exitAmount = (moneyAmount/terms);
    const nDate = new Date(convertUTCDateToLocalDate(new Date))
    let datesArray = getDates(nDate, dueDate,terms);
    exitAmount = +(exitAmount).toFixed(3);
    //create exits from range of Dates and then push them to the pyments array
    datesArray.forEach(async (element) => {
        let exit_args = {name: name,clearDate: element,moneyAmount: exitAmount};
        let exit = new Exit(exit_args);
        payment.exits.push(exit);
        await exit.save();
    });
    await payment.save()
    req.flash('success', 'Pago creado');
    res.redirect(`/exits`)
}


module.exports.index_payments = async (req, res) => {
    const nDate = new Date(convertUTCDateToLocalDate(new Date))
    let dateLimit = nDate;
    dateLimit.setDate(dateLimit.getDate()-1);
    const payments = await Payment.find({}).populate("exits").sort("-dueDate");
    res.render('exits/index_exits',{payments})
}


module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const payment = await Payment.findById(id);
    if (!payment) {
        req.flash('error', 'Error al buscar pago!');
        return res.redirect('/payments');
    }
    res.render(`payments/edit`, { payment });
}

module.exports.deletePayment = async (req, res) => {
    const { id } = req.params;
    await Payment.remove({_id:id})
    res.redirect(`payments`);
}

module.exports.accountReportPDF = async (req,res) =>{ 
    let {begin,end} = req.body;
    let honorarios = req.body.honorarios || "";
    let sorted = req.body.sorted;
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
    
    // await page.goto(`https://pure-brushlands-42473.herokuapp.com/patients/${req.params.id}/showAccount?begin=${begin}&end=${end}`,{
    //     waitUntil: 'networkidle0'}); 
    // await page.goto(`https://warm-forest-49475.herokuapp.com/exits/refill`,{
    //     waitUntil: 'networkidle0'});          // go to site
    // await page.goto(`https://warm-forest-49475.herokuapp.com/exits/hospital_account?begin=${begin}&end=${end}&entry=${honorarios}&sorted=${sorted}`,{
    //     waitUntil: 'networkidle0'});
    // await page.goto(`https://warm-forest-49475.herokuapp.com/hospital_account`,{
    //             waitUntil: 'networkidle0'});
    await page.goto(`http://localhost:3000/exits/hospital_account?begin=${begin}&end=${end}&entry=${honorarios}&sorted=${sorted}`,{
                waitUntil: 'networkidle0'});
    // await page.waitForSelector('tbody> .toPDF');
    const dom = await page.$eval('.toPDF', (element) => {
        return element.innerHTML
    }) // Get DOM HTML
    await page.setContent(dom)   // HTML markup to assign to the page for generate pdf
    await page.addStyleTag({url: "https://stackpath.bootstrapcdn.com/bootstrap/5.0.0-alpha1/css/bootstrap.min.css"});
    await page.addStyleTag({content: `.image_print{
        position:absolute;
        top:50px;
        left:20px;
        width:250px;
        height: 120px;
      }`})
    const pdf = await page.pdf({landscape: false})
    await browser.close(); 
    res.contentType("application/pdf");
    res.send(pdf);
}
