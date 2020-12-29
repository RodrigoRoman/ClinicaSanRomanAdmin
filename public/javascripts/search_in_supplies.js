
$(document).ready(function() {
});
  
// populate body with found elements
$('#search_val').keyup(function(event){
    const id = $('.custom-select').find("option:selected").attr("id");
    // alert(id)
    if(id == "byStock"){
        foundSupplies_existence(event);
    }else{
        foundSupplies(event);
    }
  });

  $("body").delegate(".individual", "click",function(event) {
    $("#search_val").val($(this).val())
    $(".custom-select").val("name")
    foundSupplies(event)
  })
//   $( "#individual" ).click(function(event) {
//     event.preventDefault()
//     alert( "Handler for .click() called." );
//   })

$('.custom-select').change(function(event){
    const id = $(this).find("option:selected").attr("id");
    if(id == "byStock"){
        foundSupplies_existence(event);
    }else{
        foundSupplies(event);
    }
  });



//======== Functions=====

//function for making day--month--year format
function makeDMY(date){
    const newDate = {d:date.getUTCDate(), m : date.getUTCMonth()+1,// JavaScript months are 0-11
    y : date.getUTCFullYear()};
    return  ((newDate.d.toString().length>1)?newDate.d:"0"+newDate.d)+ "/" + newDate.m+ "/" + newDate.y;
}
//difference in months between two dates
function diff_months(dt2, dt1) 
 {

  var diff =(dt2.getTime() - dt1.getTime()) / 1000;
   diff /= (60 * 60 * 24 * 7 * 4);
  return Math.abs(Math.round(diff));
 }

//function for selecting the border color based on existence and optimum parameters
function defineBorder(proportion){
    let border = "";
    if(proportion<=0.33){
        border = "danger";
    }else if(proportion>0.33 && proportion < 0.66){
        border = "warning"
    }else{
        border =  "success"
    }
    return border
}

// Fill table with data
function foundSupplies(event) {
    event.preventDefault();
    const dat = {'search':$("#search_val").val(),'sorted':$(".custom-select").val()};
    let suppliesContent = '';
   $.ajax({
    type: 'GET',
    url: '/services/searchSupplies',
    data: dat,
    dataType: 'JSON',
    processData: true,
    cache: false
    }).done(function( response ){
        suppliesContent+=`<div class="row supplies">`
        $.each(response.supplies, function(){
            //create a unique id. Add "a" as prefix so that avery string is acceptable
            let id_name = "a"+Math.random().toString(36).substring(7);
            suppliesContent+=(`
                <div class="col-3">
                    <div class="card mb-3">
                        <div id="`+id_name+`" class="carousel slide" data-ride="carousel">
                            <div class="carousel-inner">`);
                 this.images.forEach((img, i) => {
                if(i==0){
                    suppliesContent+=(`<div class="carousel-item active">
                     <img class="card_img mt-4" src="`+img.url+`"  alt="">
                 </div>`
                 )
                }else{
                    suppliesContent+=(`<div class="carousel-item">
                        <img class="card_img mt-4" src="`+img.url+`"  alt="">
                    </div>`
                    )
                }
                 });
                 suppliesContent+=`</div>`;
                  if(this.images.length > 1) {
                      suppliesContent+=(`
                    <a class="carousel-control-prev " href="#`+id_name+`" role="button" data-slide="prev">
                    <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                    <span class="sr-only">Previous</span>
                    </a>
                    <a class="carousel-control-next" href="#`+id_name+`" role="button" data-slide="next">
                        <span class="carousel-control-next-icon" aria-hidden="true"></span>
                        <span class="sr-only">Next</span>
                    </a>`);
                  }
                 const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                 let dateColor = defineBorder(diff_months(new Date(this.expiration) , new Date())/12);
                  suppliesContent+=(`
                        </div>
                        <div class="card-body">
                            <div class = "d-inline"><h3 class="card-subtitle ">`+this.name+`/</h3><h6>`+this.principle+`</h6></div>
                            <h5 class="card-title text-muted">`+ this.class+`</h5>
                        </div>
                        <ul class="list-group list-group-flush">
                            <li class="list-group-item border border-`+dateColor+`">Caducidad: `+new Date(this.expiration).toLocaleDateString('es-ES', options)+`</li>
                            <li class="list-group-item">Existencias: `+this.stock+`</li>
                            <li class="list-group-item">Proveedor: `+this.supplier+`</li>
                            <div class="clearfix split-items">
                                <li class="list-group-item left-side">Compra: $`+ this.sell_price+` /cu</li>
                                <li class="list-group-item right-side ">Venta: $`+this.buy_price+` /cu</li>
                            </div>
                        </ul>`);
                    if(true){
                suppliesContent+= (`<div class="d-flex justify-content-around mx-1 my-1">
                            <a class="card-link btn btn-info" href="/services/`+this._id+`/edit?service_type=supply">Editar</a>
                            <form class="d-inline" action="/services/`+this._id+`?_method=DELETE" method="POST">
                                <button class="btn btn-danger">Borrar</button>
                            </form>
                        </div>`);
                         }
                suppliesContent+= (`</div>
                                        </div>`);
            
                 });
                 suppliesContent+=`</div>`
                // Inject the whole content string into our existing HTML table
                 $('.supplies').html( suppliesContent);
                 $("selector").find('option[value="'+response.sorted+'"]').attr('selected','selected')

     
   });
 };


 //give the existence format
 function foundSupplies_existence(event){
    event.preventDefault();
    const dat = {'search':$("#search_val").val(),'sorted':$(".custom-select").val()};
    let suppliesContent = "";
   $.ajax({
    type: 'GET',
    url: '/services/searchSupplies',
    data: dat,
    dataType: 'JSON',
    processData: true,
    }).done(function(response){    
        suppliesContent+=`<div class="row supplies">`
        $.each(response.supplies, function(){
            let array_len = this.expiration.length;
            //create a unique id. Add "a" as prefix so that avery string is acceptable
            let id_name = "a"+Math.random().toString(36).substring(7);
            suppliesContent+=(`
                <div class="col-4">
                    <div class="card mb-3">
                        <div id="`+id_name+`" class="carousel slide" data-ride="carousel">
                            <div class="carousel-inner">`);
                 this.images.forEach((img, i) => {
                if(i==0){
                    suppliesContent+=(`
                    <div class="carousel-item active">
                       <img class="card_img mt-4" src="`+img.url+`"  alt="">
                    </div>`
                 )
                }else{
                    suppliesContent+=(`
                    <div class="carousel-item">
                        <img class="card_img mt-4" src="`+img.url+`"  alt="">
                    </div>`
                    )
                }
                 });
                 suppliesContent+=`</div>`;
                  if(this.images.length > 1) {
                      suppliesContent+=(`
                    <a class="carousel-control-prev " href="#`+id_name+`" role="button" data-slide="prev">
                    <span class="carousel-control-prev-icon" aria-hidden="true"></span>
                    <span class="sr-only">Previous</span>
                    </a>
                    <a class="carousel-control-next" href="#`+id_name+`" role="button" data-slide="next">
                        <span class="carousel-control-next-icon" aria-hidden="true"></span>
                        <span class="sr-only">Next</span>
                    </a>`);
                  }
                 const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
                 let stockColor = defineBorder(this.totalStock/this.optimum);
                 suppliesContent+=(`
                            </div>
                            <div class="card-body">
                                <div class = "d-inline"><h3 class="card-subtitle ">`+this.name+`/</h3><h6>`+this.principle+`</h6></div>
                                <h5 class="card-title text-muted">`+ this.class+`</h5>
                            </div>
                            <ul class="list-group list-group-flush">
                                        <div class="clearfix split-items ">
                                        <li class="list-group-item left-side "><span class = "border border-`+stockColor+` rounded-circle px-3 py-2 d-inline-block ">Total <br>`+ this.totalStock+` </span></li>
                                        <li class="list-group-item right-side ">Optimo<br> `+Math.round(this.optimum)+` </li>
                                        </div>
                            </ul>
                            <table class="table mb-0">
                                <thead>
                                    <tr>
                                    <th class="table-dark" scope="col">Caducidad</th>
                                    <th class="table-dark" scope="col">Existencias</th>
                                    </tr>
                                </thead>
                                <tbody>
                            `);
                     (this.expiration).forEach((element,index) => {
                        let dateColor = defineBorder(diff_months(new Date(this.expiration) , new Date())/12)
                        suppliesContent+=(`
                        <tr>
                            <td class ="border border-`+dateColor+`">`+makeDMY(new Date(element))+`</td>
                            <td>`+this.stock[index]+`</td>
                        </tr>`);
                     });
                 suppliesContent+=(` 
                    </tbody>
                    </table>
                    <ul class="list-group list-group-flush">
                        <div class="clearfix split-items">
                            <li class="list-group-item left-side">Compra: $`+ this.sell_price+` /cu</li>
                            <li class="list-group-item right-side ">Venta: $`+this.buy_price+` /cu</li>
                        </div>
                    </ul>`)
                 if(array_len>1){

                    suppliesContent+=(`
                    <div class="d-flex justify-content-around mx-1 my-1">
                        <button class="card-link btn btn-info individual" value = "`+this.name+`">Ver individualmente</button>
                    </div>
                    `)
                 }else{
                        if(true){
                    suppliesContent+= (`
                            <div class="d-flex justify-content-around mx-1 my-1">
                                <a class="card-link btn btn-info" href="/services/`+this._id+`/edit?service_type=supply">Editar</a>
                                <form class="d-inline" action="/services/`+this._id+`?_method=DELETE" method="POST">
                                    <button class="btn btn-danger">Borrar</button>
                                </form>
                            </div>`);
                            }
                }
                suppliesContent+= (`</div>
                                 </div>`);
            
                 });
                 suppliesContent+=`</div>`
                 $('.supplies').html( suppliesContent);  
                 $("selector").find('option[value="'+response.sorted+'"]').attr('selected','selected')
                   
   });
 };



  