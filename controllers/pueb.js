 const transactions = await Transaction.aggregate( 
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
                consumtionDate: {$last:"$consumtionDate"},
                service_type:{$last:"$service_type"},
                price: {$last:"$unitPrice"},
                sell_price: {$last:"$unitPrice"},
                buy_price: { $last:"$buyPrice"},
                amount: { $sum:"$amount"}}},
            {$addFields:{totalBuy : { $multiply: ["$buy_price","$amount"] }}},
            {$addFields:{totalSell : { $multiply: ["$price","$amount"] }}},
            {$addFields:{totalPrice : { $multiply: ["$price","$amount"] }}},
             
        ]);
