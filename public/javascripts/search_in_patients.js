
$(document).ready(function() {

});
// populate body with found elements
$('#search_val').keyup(foundPatients);

$('.custom-select').change(foundPatients);

$('#beginDay').click(foundPatients)
$('#endDay').click(foundPatients)
$(".apply_dates").on("click",foundPatients);

//======== Functions=====

//function for truncating string to n characters
function truncate(str, n){
    return (str.length > n) ? str.substr(0, n-1) + '...' : str;
  };

function makeYMD(date){
const newDate = {d:date.getUTCDate(), m : date.getUTCMonth()+1,// JavaScript months are 0-11
y : date.getUTCFullYear()};
return  newDate.y+ "-" + ((newDate.m.toString().length>1)?newDate.m:"0"+newDate.m)+ "-" + ((newDate.d.toString().length>1)?newDate.d:"0"+newDate.d);
}
// Fill table with data
function foundPatients(event) {
    
    // let currentRequest = null;
    // event.preventDefault();
    const dat = {'search':$("#search_val").val(),'sorted':$(".custom-select").val(),'begin':$("#beginDate").val(),'end':$("#endDate").val(),page:$(event).attr("alt")};
    let patientsContent = '';
   $.ajax({
    type: 'GET',
    url: '/patients/searchPatients',
    data: dat,
    dataType: 'JSON',
    processData: true,
    // beforeSend : function()    {          
    //     if(currentRequest != null) {
    //         currentRequest.abort();
    //     }
    // },
    cache: false,
    }).done(function( response ){
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        patientsContent+=`<div class="patients row scrollDiv mt-4">`
        $.each(response.patients, function(){
            console.log('search in patients!!!')
            patientsContent+= '<div class="col-md-6">'
            let borderColor = (this.discharged)?"secondary":"primary";
            patientsContent+=`
            <div class="card index_card_p mb-4 border border-`+borderColor+`">
                <div class="row">
                    <div class="container">
                        <div class="col-md-16">
                            <div class="card-body">
                              <div class="row justify-content-between">
                                <div class="col-7">

                                <h3 class="card-title">`+this.name+` </h3>
                                </div>
                                <div class="col-1"></div>
                                <div class="col-2">`
                                    if(this.cuarto){
                                        patientsContent+=` <h3 class="card-title border border-`+borderColor+` rounded-circle p-3 float-right">`+this.cuarto+`</h3>`
                                    }
                                    patientsContent+=` </div>
                                    </div>
                                <h4 class="card-title text-muted">Fecha de ingreso:`+ new Date(this.admissionDate).toLocaleDateString('es-ES', options)+`</h4>`
                                if(this.discharged){
                                    patientsContent+=`<h4 class="card-title text-muted">Fecha de egreso:`+ new Date(this.dischargedDate).toLocaleDateString('es-ES', options)+`</h4>`
                                }
                                patientsContent+=`<ul class="list-group list-group-flush mb-4">
                                    <li class="list-group-item">Email: `+this.email+`</li>
                                    <li class="list-group-item">Telefono: `+this.phone+`</li>
                                    <li class="list-group-item">RFC: `+this.rfc+`</li>
                                    <li class="list-group-item">Dirección: `+this.address+`</li>
                                    <li class="list-group-item">Agregado por:  `+this.author.username+`</li>
                                    <li class="list-group-item">Medico tratante:  `+this.treatingDoctor+`</li>
                                    <li class="list-group-item text-muted">Diagnostico: `+this.diagnosis+`</li>
                                </ul>`
                                if(!this.discharged){
                                    patientsContent+=`<a class="btn btn-primary" href="/patients/`+this._id+`">Ver cuenta</a>
                                    <form class="d-inline" action="/patients/`+this._id+`?_method=DELETE" method="POST">
                                        <button class="float-right btn btn-outline-danger mx-1 my-1 btn-sm"><i class="fas fa-trash"></i></button>
                                    </form>
                                    <a class="float-right btn btn-outline-secondary mx-1 my-1 btn-sm" href="/patients/`+this._id+`/edit"><i class="fas fa-edit"></i></a>`
                                }else{
                                    
                                    const b = new Date(this.admissionDate).toISOString().substr(0,10);
                                    const e = new Date(this.dischargedDate).toISOString().substr(0,10);
                    
                                    patientsContent+=` <a href = "/patients/`+this._id+`/dischargedPDF">
                                        <button type="button" class="btn btn-outline-secondary">Ver cuenta</button>
                                    </a>`
                                }
                                patientsContent+=`
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`
            
                 });
                 patientsContent+=`</div>`
                 let pagination = `<div class="row my-3 pagination customClass">
                 <div class="btn-group float-right" role="group" aria-label="First group">`;
                    if(response.page >1){
                        pagination += `<a onclick="foundPatients(this)" alt="${response.page-1}" class="btn btn-light " role="button" aria-pressed="true"><i class="fas fa-arrow-circle-left"></i></a>`
                    }
                    for(let step = 1; step < response.pages+1; step++) {
                        let act = (step == response.page)?"active":"";
                        pagination += `<a onclick="foundPatients(this)" alt="${step}" class="btn btn-light ${act}" role="button" aria-pressed="true">${step}</a>`
                    }
                    if(response.page+1 <= response.pages){
                        pagination += `<a onclick="foundPatients(this)" alt="${response.page+1}" class="btn btn-light " role="button" aria-pressed="true"><i class="fas fa-arrow-circle-right"></i></a>`
                    }
                     pagination += `</div>
                     </div>`
                // Inject the whole content string into our existing HTML table
                 $('.patients').html( patientsContent);
                 $('.pagination').replaceWith( pagination); 
                 $('#beginDate').val(makeYMD(response.begin));
                 $('#endDate').val(makeYMD(response.end));
                 $("selector").find('option[value="'+response.sorted+'"]').attr('selected','selected')
   });
 };



  