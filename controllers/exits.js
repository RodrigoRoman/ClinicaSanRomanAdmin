const {Service,Supply,Hospital} = require('../models/service');
const Transaction = require('../models/transaction');
const Exit = require('../models/exit');
const Payment = require('../models/payment');
process.env.TZ = 'America/Mexico_City' // here is the magical line

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
    stopDate = new Date(stopDate);
    //first payment starts after 5 days
    startDate = startDate.addDays(5);
    if(terms == 1){
        return [startDate];
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

    const exits = await Exit.aggregate( 
        //recreate supply element by compressing elements with same name. Now the fields are arrays
        [   
            //first we need to have access to the service fields. So we unwind all of them

            {$match: {clearDate:{$lte:new Date}}},
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
    // const payments = await Payment.find({}).sort("-dueDate").populate('exits');

    const transactions = await Transaction.aggregate( 
        //recreate supply element by compressing elements with same name. Now the fields are arrays
        [   
            // put in a single document both transaction and service fields
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
                _id:"$name",
                name:{$last:"$name"},
                class:{$last:"$class"},
                consumtionDate: {$last:"$consumtionDate"},
                service_type:{$last:"$service_type"},
                price: {$last:"$price"},
                sell_price: { $last:"$sell_price"},
                buy_price: { $last:"$buy_price"},
                amount: { $sum:"$amount"}}},
            {$addFields:{totalSell : { $multiply: ["$sell_price","$amount"] }}},
            {$addFields:{totalPrice : { $multiply: ["$price","$amount"] }}},
             
        ]);
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
    begin = new Date(begin+"T07:00:01");
    end = new Date(end+"T08:00:01");
    let transactions = {};
    let exits = {};
    if(exit){
        exits = await Exit.aggregate( 
            //recreate supply element by compressing elements with same name. Now the fields are arrays
            [   
                //first we need to have access to the service fields. So we unwind all of them
                // {$match: {clearDate:{$gte:begin,$lte:end},hospitalEntry:{$in:[hospital,honorary]}}},
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
                {$match: {hospitalEntry:{$in:[hospital,honorary]}}},
                {$group: {
                    _id:"$name",
                    name:{$last:"$name"},
                    class:{$last:"$class"},
                    consumtionDate: {$last:"$consumtionDate"},
                    service_type:{$last:"$service_type"},
                    price: { $last:"$price"},
                    sell_price: { $last:"$sell_price"},
                    buy_price: { $last:"$buy_price"},
                    amount: { $sum:"$amount"}}},
                {$addFields:{totalSell : { $multiply: ["$sell_price","$amount"] }}},
                {$addFields:{totalBuy : { $multiply: ["$buy_price","$amount"] }}},
                {$addFields:{totalPrice : { $multiply: ["$price","$amount"] }}},
                {$match: {consumtionDate:{$gte:begin,$lte:end}}},

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
                {$match: {consumtionDate:{$gte:begin,$lte:end},hospitalEntry:{$in:[hospital,honorary]}}},
                {$group: {
                    _id:"$class",
                    class:{$last:"$class"},
                    service_type : {$last:"$service_type"},
                    price: {$push:{$multiply: [ "$price","$amount"] }},
                    cost: {$push:0},
                    sell_price: { $push:{$multiply: [ "$sell_price" ,"$amount"]}},
                    buy_price: { $push: {$multiply: [ "$buy_price" ,"$amount"]}},
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
                 { $project: { fromService: 0 ,name:0} },
                 {$match: {consumtionDate:{$gte:begin,$lte:end},hospitalEntry:{$in:[hospital,honorary]}}},
                 // put in a single document both transaction and service fields
                {
                    $lookup: {
                       from: "patients",
                       localField: "patient",    // field in the Trasaction collection
                       foreignField: "_id",  // field in the Service collection
                       as: "fromPatient"
                    }
                 },
                 {
                    $replaceRoot: { newRoot: { $mergeObjects: [ { $arrayElemAt: [ "$fromPatient", 0 ] }, "$$ROOT" ] } }
                 },
                 { $project: { fromPatient: 0 } },
                 {$group: {
                    _id:"$name",
                    patientId:{$last:"$patient"},
                    name:{$last:"$name"},
                    admissionDate: {$last:"$admissionDate"},
                    price: {$push:{$multiply: [ "$price","$amount"] }},
                    cost: {$push:0},
                    sell_price: { $push:{$multiply: [ "$sell_price" ,"$amount"]}},
                    buy_price: { $push: {$multiply: [ "$buy_price" ,"$amount"]}},
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



module.exports.renderNewForm = (req, res) => {
    res.render(`exits/new`);
}

module.exports.createPayment = async (req, res, next) => {
    let {name, dueDate, moneyAmount} = req.body.payment;
    let payment =  new Payment(req.body.payment);
    let terms = parseInt(req.body.payment.terms);
    let exitAmount = (moneyAmount/terms);
    let datesArray = getDates(new Date, dueDate,terms);
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
    let dateLimit = new Date;
    dateLimit.setDate(dateLimit.getDate()-1);
    const payments = await Payment.find({dueDate:{$gte:dateLimit}}).populate("exits");
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
    let curr_payment = await Payment.findById(id).populate('exits');
    let dateLimit = new Date;
    dateLimit.setDate(dateLimit.getDate()-1);
    let delete_exits = curr_payment.exits.filter(el => el.clearDate >= dateLimit);
    const patient = await Payment.findByIdAndUpdate(id,{$pull:{clearDate:{$gte:dateLimit}},dueDate:dateLimit}).populate('exits');
    let after = await Payment.findById(id).populate('exits');
    for(let t of delete_exits){
        await Exit.findByIdAndDelete({_id:t._id});
    }
    res.redirect(`payments`);
}




