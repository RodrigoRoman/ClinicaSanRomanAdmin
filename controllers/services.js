const {Service,Supply,Hospital} = require('../models/service');
const { cloudinary } = require("../cloudinary");
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

module.exports.createSupply = async (req, res, next) => {
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
    let service = await Service.findById(id);
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
                    principle:{$last:"$principle"},
                    name: { $last: "$name" },
                    expiration:{ $push: "$expiration" },
                    sell_price: { $last: "$sell_price" },
                    buy_price: { $last: "$buy_price" },
                    stock:{ $push: "$stock" },                
                    optimum:{$avg: "$optimum"},
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


