const {Service,Supply,Hospital} = require('../models/service');
const { cloudinary } = require("../cloudinary");
const Transaction = require('../models/transaction');
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
  }


module.exports.index = async (req, res) => {
    const services = await Service.find({});
    res.render('services/index',{services})
}

module.exports.index_supplies = async (req, res) => {
    // classify by name (case and symbol insensitive, up to a space)
    let supplies = await Supply.find({deleted:false}).populate("author");
    res.render('services/index_supplies', { supplies})
}

module.exports.index_hospital = async (req, res) => {
    const services = await Hospital.find({deleted:false}).sort({ class: 'asc'});
    res.render('services/index_hospital', { services })
}

module.exports.renderNewForm = (req, res) => {
    const {service_type} = req.query
    res.render(`services/new_${service_type}`);
}
function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

module.exports.createSupply = async (req, res, next) => {
    let name = req.body.service.name;
    name = new RegExp(escapeRegExp(name), 'gi')
    let nameShared = await Supply.find({name:name});
    for (const el of nameShared) {
        el.buy_price = req.body.service.buy_price;
        el.sell_price = req.body.service.sell_price;
        el.optimum = req.body.service.optimum;
        el.outside = req.body.service.outside;
        await el.save();
    }
    for (let step = 0; step < 150; step++) {
        // Runs 5 times, with values of step 0 through 4.
        let supp  = {
            name: Math.random().toString(36).substring(7),
        service_type: "supply",
    principle: Math.random().toString(36).substring(7),
    buy_price: Math.floor(Math.random() * Math.floor(1000)),
    sell_price: Math.floor(Math.random() * Math.floor(1000)),
    expiration:  randomDate(new Date(2020, 0, 1), new Date(2024, 0, 1)),
    supplier : Math.random().toString(36).substring(7),
    optimum : Math.floor(Math.random() * Math.floor(1000)),
    outside : Math.floor(Math.random() * Math.floor(1000)),
    hospitalEntry : true,
    description: " ",
    claveSat: Math.floor(Math.random() * Math.floor(1000)),
    stock : Math.floor(Math.random() * Math.floor(1000))
        }
        let prov_sup = new Supply(supp);
        await prov_sup.save();
        console.log('Walking east one step');
      }
    const supply = new Supply(req.body.service);
    supply.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    supply.author = req.user._id;
    await supply.save();
    req.flash('success', 'Insumo médico creado!');
    res.redirect(`/services`)///services/${service._id} direction
}

module.exports.showSupply = async (req, res) => {
    let {name} = req.params;
    name = name.split(" ")[0]
    const supplies = await Supply.find({name:{$regex:name, $options:"mi"}}).populate('author');
    if (!supplies) {
        req.flash('error', 'No se encontro insumo!');
        return res.redirect('/services');
    }
    res.render('services/show_supply', { supplies });
}


module.exports.createHospital = async (req, res, next) => {
    const service = new Hospital(req.body.service);
    service.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
    service.author = req.user._id;
    await service.save();
    req.flash('success', 'Servicio hospitalario creado!');
    res.redirect(`/services`)
}

module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const service = await Service.findById(id);
    if (!service) {
        req.flash('error', 'Error al buscar servicio!');
        return res.redirect('/services');
    }
    res.render(`services/${service.service_type}_edit`, { service });
}

module.exports.updateService = async (req, res) => {
    const { id } = req.params;
    const found = await Service.findById({_id:id});

    console.log(found.service_type);
    if(found.service_type==="supply"){
        service = await Supply.findByIdAndUpdate(id,{ ...req.body.service});
        let name = new RegExp(escapeRegExp(service.name), 'gi');
        let nameShared = await Supply.find({name:name});
        for (const el of nameShared) {
            el.buy_price = req.body.service.buy_price;
            el.sell_price = req.body.service.sell_price;
            el.optimum = req.body.service.optimum;
            el.outside = req.body.service.outside;
            await el.save();
        }
    }else{
        service = await Hospital.findByIdAndUpdate(id,{ ...req.body.service});
    }
    const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
    service.images.push(...imgs);
    await service.save();
    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        await service.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } })
    }
    req.flash('success', 'Insumo actualizado!');
    res.redirect(`/services/${service.service_type}`)
}

module.exports.deleteService = async (req, res) => {
    const { id } = req.params;
    const nDate = new Date;
    nDate.setHours(nDate.getHours() - 6);
    let service = await Service.findById(id);
    let toDelete = await Service.find({$or: [ {stock:0}, {expiration:{$lte:nDate}}]});
    for(let el of toDelete){
        el.deleted = true;
        await el.save();
    }
    service.deleted = true;
    service.save()
    req.flash('success', 'Servicio eliminado')
    res.redirect('/services');
}


//Search bar route functions

//return all elements that match search
module.exports.searchAllSupplies = async (req, res) => {
    let {search,sorted} = req.query;
    search = new RegExp(escapeRegExp(search), 'gi');
    let dbQueries =  [
            { name: search },
            { class: search },
            { description: search },
            { principle: search },
            { doctor: search}
        ];
    if(sorted == "stock"){
        //Case for storing based on stock need
        let supplies = await Supply.aggregate( 
            //recreate supply element by compressing elements with same name. Now the fields are arrays
            [   
                {$match: {$or:dbQueries,deleted:false}},
                {$group: {
                    _id:"$name",
                    class:{$last:"$class"},
                    suppID:{$last:"$_id"},
                    principle:{$last:"$principle"},
                    name: { $last: "$name" },
                    expiration:{ $push: "$expiration" },
                    sell_price: { $last: "$sell_price" },
                    buy_price: { $last: "$buy_price" },
                    stock:{ $push: "$stock" },                
                    optimum:{$avg: "$optimum"},
                    outside:{$last: "$outside"},
                    images:{$last:"$images"} }},
                {$addFields:{totalStock : { $sum: "$stock" }}},
                //porportion of total stock and optimum
                {$addFields:{proportion :  { $divide: [ "$totalStock", "$optimum" ] }}},
                {$sort: { proportion: 1 } } ]
        ).collation({locale:"en", strength: 1});
        //return supplies and the sorted argument for reincluding it
        return res.json({"supplies":supplies,"sorted":sorted});
    }else{
        //other cases for the select element (other sorting options)
        let supplies = await Supply.find({$or:dbQueries,deleted:false});
        if(sorted == "name"){
        //sort in alphabetical order
        supplies.sort((a,b)=>a.name.localeCompare(b.name,"es",{sensitivity:'base'}))
        };
        if(sorted == "class"){
            //sort in alphabetical order
            supplies.sort((a,b)=>a.class.localeCompare(b.class,"es",{sensitivity:'base'}))
    
        };
        if(sorted == "expiration"){
            //sort in increasing order based on the expiration of the product 
            supplies.sort((a, b) =>a.expiration-b.expiration);
        };
        if (!supplies) {
            res.locals.error = 'Ningun producto corresponde a la busqueda';
            res.json({})
        }
        //return supplies and the sorted argument for reincluding it
        return res.json({"supplies":supplies,"sorted":sorted});
    };
}

//search for hospital services
module.exports.searchAllServices = async (req, res) => {
    let {search,sorted} = req.query;
    search = new RegExp(escapeRegExp(search), 'gi');
    let dbQueries =  [
            { name: search },
            { class: search },
            { description: search },
            { doctor: search}
        ];
    let services = await Hospital.find({$or:dbQueries,deleted:false});
    if(sorted == "name"){
    //sort in alphabetical order
        services.sort((a,b)=>a.name.localeCompare(b.name,"es",{sensitivity:'base'}))
    };
    if(sorted == "class"){
        //sort in alphabetical order
        services.sort((a,b)=>a.class.localeCompare(b.class,"es",{sensitivity:'base'}))

    };
    if(sorted == "doctor"){
        //sort in alphabetical order
        services.sort((a,b)=>a.doctor.localeCompare(b.doctor,"es",{sensitivity:'base'}))
    };
    if (!services) {
        res.locals.error = 'Ningun servicio corresponde a la busqueda';
        res.json({})
    }
    res.json(services)
}



